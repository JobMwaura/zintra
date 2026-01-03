'use client';

import { useState, useEffect } from 'react';
import { X, FileUp, Send, AlertCircle, Lock, CheckCircle, Clock, MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { CountySelect } from '@/components/LocationSelector';
import { ALL_CATEGORIES_FLAT } from '@/lib/constructionCategories';
import { getUserProfile } from '@/app/actions/getUserProfile';

/** 🎨 Brand palette */
const BRAND = {
  primary: '#ea8f1e',
  primaryHover: '#d88013',
  slate900: 'rgb(15 23 42)',
  slate700: 'rgb(51 65 85)',
  slate500: 'rgb(100 116 139)',
  slate200: 'rgb(226 232 240)',
  slate100: 'rgb(241 245 249)',
  white: '#ffffff',
};

const RFQ_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_RFQ_BUCKET || 'rfq_attachments';

export default function DirectRFQPopup({ isOpen, onClose, vendor, user }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: '',
    attachment: null,
    confirmed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  /** 🧩 Fetch user profile to check phone_verified status */
  useEffect(() => {
    if (!isOpen || !user?.id) {
      setUserProfile(null);
      setProfileLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      setProfileLoading(true);
      try {
        // Use server action to bypass RLS restrictions
        // Server-side service role can always read user data
        const result = await getUserProfile(user.id);
        
        if (!result.success) {
          console.error('❌ Error fetching user profile:', result.error);
          setUserProfile(null);
          setProfileLoading(false);
          return;
        }

        const profile = result.data;
        console.log('✅ User profile fetched from server:', {
          id: user.id,
          phone_verified: profile?.phone_verified,
          email_verified: profile?.email_verified,
          phone: profile?.phone,
          phone_number: profile?.phone_number,
        });

        setUserProfile(profile);
        setProfileLoading(false);
      } catch (err) {
        console.error('❌ Error in fetchUserProfile:', err);
        setUserProfile(null);
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [isOpen, user?.id]);

  /** 🧩 Determine user badge based on phone_verified */
  const userBadge =
    userProfile?.phone_verified ? 'Verified Buyer' : 'Unverified Buyer';

  /** 📊 Check quota when user and modal open */
  useEffect(() => {
    if (!isOpen || !user?.id) {
      setQuotaInfo(null);
      return;
    }

    const checkQuota = async () => {
      setQuotaLoading(true);
      try {
        const response = await fetch(`/api/rfq-rate-limit?userId=${user.id}`);
        const data = await response.json();
        setQuotaInfo(data);
      } catch (err) {
        console.error('Error checking quota:', err);
        setQuotaInfo({ error: 'Could not check quota' });
      }
      setQuotaLoading(false);
    };

    checkQuota();
  }, [isOpen, user?.id]);

  /** 📨 Handle submit (with Supabase insert + optional upload) */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Check authentication
    if (!user || !user.id) {
      setStatus('❌ Please sign in to post RFQs');
      return;
    }

    // ✅ Check suspension status
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('is_suspended, suspension_reason, suspension_until')
        .eq('id', user.id)
        .single();

      if (userData?.is_suspended) {
        const untilDate = userData.suspension_until 
          ? new Date(userData.suspension_until).toLocaleString()
          : 'indefinitely';
        setStatus(`🔒 Your account is suspended until ${untilDate}. Reason: ${userData.suspension_reason || 'Not specified'}`);
        return;
      }
    } catch (err) {
      console.error('Error checking suspension:', err);
    }

    // ✅ Check quota from server
    if (quotaInfo?.isLimited) {
      const resetTime = new Date(quotaInfo.resetTime).toLocaleTimeString();
      setStatus(`⚠️ Daily limit reached (2 RFQs per day). Resets at ${resetTime}.`);
      return;
    }

    if (!form.title || !form.description || !form.confirmed) {
      setStatus('❌ Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      setStatus('');
      
      /** Upload file if exists */
      let attachmentUrl = null;
      if (form.attachment) {
        const fileName = `${Date.now()}_${form.attachment.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(RFQ_BUCKET)
          .upload(fileName, form.attachment);

        if (uploadError) {
          if (uploadError.message?.toLowerCase().includes('bucket')) {
            setStatus('⚠️ Attachment bucket missing; request sent without file.');
          } else {
            throw uploadError;
          }
        } else {
          const { data: publicUrl } = supabase.storage
            .from(RFQ_BUCKET)
            .getPublicUrl(uploadData.path);
          attachmentUrl = publicUrl?.publicUrl || null;
        }
      }

      /** Save RFQ in main table */
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .insert([{
          title: form.title,
          description: form.description,
          category: form.category,
          budget_range: form.budget,
          location: form.location,
          buyer_id: user?.id || null,
          user_id: user?.id || null,
          status: 'submitted',
        }])
        .select()
        .maybeSingle();

      if (rfqError) throw rfqError;

      /** Send direct request to vendor */
      const vendorRecipientId = vendor?.user_id || vendor?.id || null;
      if (vendorRecipientId) {
        const { error: requestError } = await supabase.from('rfq_requests').insert([{
          rfq_id: rfqData.id,
          vendor_id: vendorRecipientId,
          user_id: user?.id || null,
          project_title: form.title || 'Untitled Project',
          project_description: form.description || '',
          status: 'pending',
          created_at: new Date().toISOString(),
        }]);

        if (requestError) {
          console.error('❌ Error sending RFQ request to vendor:', {
            error: requestError.message,
            code: requestError.code,
            details: requestError.details,
          });
          throw requestError;
        }
      }

      // ✅ Store success data to show confirmation modal
      setSuccessData({
        title: form.title,
        vendorName: vendor?.company_name || 'Vendor',
        submittedAt: new Date(),
      });
      
      setStatus('✅ Request sent successfully!');
      setSubmitting(false);
      
      // Reset form
      setForm({
        title: '',
        description: '',
        category: '',
        budget: '',
        location: '',
        attachment: null,
        confirmed: false,
      });
    } catch (err) {
      console.error('RFQ submission error:', err);
      setStatus(`⚠️ Failed to send request: ${err.message}`);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ✅ Show success confirmation if submission was successful
  if (successData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
          {/* Success Header Background */}
          <div className="h-32 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-30"></div>
              <CheckCircle className="relative h-16 w-16 text-green-600 animate-bounce" />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-6">
            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Quote Request Sent!</h2>
              <p className="text-slate-600">Your request has been successfully submitted to {successData.vendorName}</p>
            </div>

            {/* Request Details */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Project</p>
                <p className="text-sm font-semibold text-slate-900">{successData.title}</p>
              </div>
              <div className="h-px bg-slate-200"></div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Recipient</p>
                <p className="text-sm font-semibold text-slate-900">{successData.vendorName}</p>
              </div>
              <div className="h-px bg-slate-200"></div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase">Sent</p>
                <p className="text-sm font-semibold text-slate-900">{successData.submittedAt.toLocaleString()}</p>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">What Happens Next</h3>
              
              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 border border-orange-300">
                      <span className="text-xs font-bold text-orange-600">1</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Vendor Notification</p>
                    <p className="text-xs text-slate-600 mt-0.5">{successData.vendorName} will receive your request immediately and appear in their inbox</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 border border-blue-300">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Quote Preparation</p>
                    <p className="text-xs text-slate-600 mt-0.5">The vendor has up to <span className="font-semibold">7 days</span> to review your requirements and submit a detailed quote</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 border border-purple-300">
                      <span className="text-xs font-bold text-purple-600">3</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">You'll Be Notified</p>
                    <p className="text-xs text-slate-600 mt-0.5">Once the vendor submits their quote, you'll receive a notification and can review it in your RFQ dashboard</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Tips */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-2">
              <div className="flex gap-2">
                <Clock className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-semibold mb-1">Quick Tips</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Check your email for confirmation and vendor updates</li>
                    <li>You can view all your RFQs in your dashboard</li>
                    <li>Compare quotes from multiple vendors before deciding</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 space-x-3">
              <button
                onClick={() => {
                  setSuccessData(null);
                  onClose();
                }}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSuccessData(null);
                  onClose();
                  window.location.href = '/my-rfqs';
                }}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white shadow-md transition hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: BRAND.primary }}
              >
                View My RFQs <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ NEW: Show login prompt if not authenticated
  if (!user || !user.id) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-slate-900">Sign In Required</h2>
            </div>
            <button onClick={onClose}>
              <X className="h-5 w-5 text-slate-500 hover:text-slate-700" />
            </button>
          </div>
          <div className="px-6 py-6 space-y-4">
            <p className="text-slate-700">
              You need to sign in to post RFQs and request quotes from vendors.
            </p>
            <div className="space-y-2">
              <Link 
                href="/user-registration"
                className="block w-full text-center rounded-lg py-2.5 text-sm font-medium text-white shadow-md transition hover:opacity-90"
                style={{ backgroundColor: BRAND.primary }}
              >
                Create Account
              </Link>
              <Link 
                href="/login"
                className="block w-full text-center rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Request Quote from {vendor?.company_name || 'Vendor'}
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-slate-500 hover:text-slate-700" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-5 space-y-5">
          {status && (
            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
              status.includes('❌') || status.includes('⚠️') || status.includes('🔒')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {status.includes('❌') || status.includes('⚠️') || status.includes('🔒') ? (
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              ) : null}
              <span>{status}</span>
            </div>
          )}

          {/* User Info & Quota */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  profileLoading
                    ? 'bg-gray-100 text-gray-500'
                    : userBadge === 'Verified Buyer'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {profileLoading ? 'Checking status...' : userBadge}
              </span>
              <span className="text-slate-400">•</span>
              <span>{user?.email}</span>
            </div>

            {/* Quota Status */}
            {quotaLoading ? (
              <p className="text-xs text-slate-500">Checking quota...</p>
            ) : quotaInfo?.isLimited ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-xs text-red-700">
                  Daily limit reached (2 RFQs per day). Resets at {new Date(quotaInfo.resetTime).toLocaleTimeString()}
                </p>
              </div>
            ) : quotaInfo && !quotaInfo.error ? (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-medium">{quotaInfo.remaining}/{quotaInfo.dailyLimit}</span>
                <span>RFQs remaining today</span>
              </div>
            ) : null}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">
              Project Title<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Office renovation"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">
              Project Description<span className="text-red-500">*</span>
            </label>
            <textarea
              rows="3"
              placeholder="Briefly describe what you need..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              required
            />
          </div>

          {/* Category + Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              >
                <option value="">Select category</option>
                {ALL_CATEGORIES_FLAT.map((cat) => (
                  <option key={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Budget Range (KSh)</label>
              <select
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              >
                <option value="">Select budget</option>
                <option>Below 100,000</option>
                <option>100,000 – 500,000</option>
                <option>500,000 – 1,000,000</option>
                <option>Above 1,000,000</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <CountySelect
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required={true}
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Attachments (Optional)</label>
            <div className="flex items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <input
                type="file"
                accept=".pdf,.jpg,.png,.docx"
                onChange={(e) => setForm({ ...form, attachment: e.target.files[0] })}
              />
              <FileUp className="h-4 w-4 text-slate-500" />
            </div>
            {form.attachment && (
              <p className="mt-1 text-xs text-slate-500">Uploaded: {form.attachment.name}</p>
            )}
          </div>

          {/* Confirmation */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="confirm"
              checked={form.confirmed}
              onChange={(e) => setForm({ ...form, confirmed: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
            />
            <label htmlFor="confirm" className="text-sm text-slate-700">
              I confirm this is a genuine quote request intended for professional follow-up.
            </label>
          </div>

          {/* Notice */}
          <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-slate-700">
            To maintain platform quality, each user can submit up to <b>2 RFQs per day.</b>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || quotaInfo?.isLimited}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-white shadow-md transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: BRAND.primary }}
          >
            {submitting ? 'Sending...' : (
              <>
                <Send className="inline h-4 w-4 mr-1" /> Send Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
