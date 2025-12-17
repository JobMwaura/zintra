'use client';

import { useState, useEffect } from 'react';
import { X, FileUp, Send } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { CountySelect } from '@/components/LocationSelector';
import { ALL_CATEGORIES_FLAT } from '@/lib/constructionCategories';

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
  const [rfqCount, setRfqCount] = useState(0);
  const [status, setStatus] = useState('');

  /** 🧩 Determine user badge */
  const userBadge =
    user?.email && user?.phone ? 'Verified Buyer' : 'Unverified Buyer';

  /** 🗓️ Track daily RFQ count (local only for now) */
  useEffect(() => {
    const todayCount = parseInt(localStorage.getItem('rfq_count_today') || '0', 10);
    setRfqCount(todayCount);
  }, []);

  /** 📨 Handle submit (with Supabase insert + optional upload) */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rfqCount >= 2) {
      alert('You’ve reached your daily RFQ limit (2 per day). Please try again tomorrow.');
      return;
    }
    if (!form.title || !form.description || !form.confirmed) {
      alert('Please fill in required fields and confirm authenticity.');
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
          status: 'open',
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
          status: 'pending',
          created_at: new Date().toISOString(),
        }]);

        if (requestError) throw requestError;
      }

      /** Update daily count and notify */
      const todayCount = parseInt(localStorage.getItem('rfq_count_today') || '0', 10);
      localStorage.setItem('rfq_count_today', todayCount + 1);
      setStatus('✅ Request sent successfully! Redirecting...');
      setSubmitting(false);
      setTimeout(() => {
        onClose();
        window.location.href = '/my-rfqs';
      }, 800);
    } catch (err) {
      console.error('RFQ submission error:', err);
      setStatus(`⚠️ Failed to send request: ${err.message}`);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
            <div className={`p-3 rounded-lg text-sm ${status.startsWith('⚠️') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {status}
            </div>
          )}
          {/* User Info */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                userBadge === 'Verified Buyer'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {userBadge}
            </span>
            <span className="text-slate-400">•</span>
            <span>RFQs today: {rfqCount}/2</span>
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
              county={form.location}
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
              checked={form.confirmed}
              onChange={(e) => setForm({ ...form, confirmed: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
            />
            <label className="text-sm text-slate-700">
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
            disabled={submitting}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-white shadow-md transition hover:opacity-90"
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
