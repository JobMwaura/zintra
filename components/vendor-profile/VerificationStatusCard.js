'use client';

import { Shield, ShieldCheck, Clock, AlertCircle, FileText, RefreshCw, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function VerificationStatusCard({ vendor, canEdit }) {
  const router = useRouter();
  const supabase = createClient();
  const [verificationDoc, setVerificationDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendor?.id) {
      fetchVerificationStatus();
    }
  }, [vendor?.id]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch current approved document or pending update
      const { data, error } = await supabase
        .from('vendor_verification_documents')
        .select('*')
        .eq('vendor_id', vendor.id)
        .in('status', ['approved', 'pending_update'])
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setVerificationDoc(data);
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      </section>
    );
  }

  // If vendor is verified and document is approved
  if (vendor?.verified_at && verificationDoc?.status === 'approved') {
    const expiryDate = verificationDoc.expiry_date ? new Date(verificationDoc.expiry_date) : null;
    const today = new Date();
    const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24)) : null;
    
    // Check if expiry is approaching or passed
    const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
    const isExpiringUrgent = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

    return (
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-green-600" />
          <h4 className="text-base font-semibold text-slate-900">Verification Status</h4>
        </div>

        <div className="space-y-3">
          {/* Verified Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-900">Verified Business</span>
            </div>
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>

          {/* Document Type */}
          <div className="text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>{verificationDoc.document_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </div>
          </div>

          {/* Expiry Warning */}
          {expiryDate && (
            <div className={`p-3 rounded-lg border ${
              isExpired 
                ? 'bg-red-50 border-red-200' 
                : isExpiringUrgent
                ? 'bg-orange-50 border-orange-200'
                : isExpiringSoon
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {isExpired || isExpiringUrgent ? (
                  <AlertCircle className={`w-4 h-4 ${isExpired ? 'text-red-600' : 'text-orange-600'}`} />
                ) : (
                  <Calendar className="w-4 h-4 text-slate-600" />
                )}
                <span className={`text-xs font-semibold ${
                  isExpired 
                    ? 'text-red-900' 
                    : isExpiringUrgent
                    ? 'text-orange-900'
                    : isExpiringSoon
                    ? 'text-yellow-900'
                    : 'text-slate-900'
                }`}>
                  {isExpired 
                    ? 'Document Expired' 
                    : isExpiringUrgent
                    ? 'Expiring Soon!'
                    : isExpiringSoon
                    ? 'Renewal Reminder'
                    : 'Valid Until'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {isExpired 
                  ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                  : `${daysUntilExpiry} days remaining`}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Expiry: {expiryDate.toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {canEdit && (
            <div className="space-y-2 pt-2">
              <button
                onClick={() => router.push('/vendor/dashboard/verification/update')}
                className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 ${
                  isExpired || isExpiringUrgent || isExpiringSoon
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                {isExpired ? 'Renew Document' : isExpiringSoon ? 'Update Document' : 'Update Verification'}
              </button>
              
              <button
                onClick={() => router.push('/vendor/dashboard/verification')}
                className="w-full px-4 py-2 text-xs text-slate-600 hover:text-slate-900 transition"
              >
                View History →
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // If vendor has pending update
  if (verificationDoc?.status === 'pending_update') {
    return (
      <section className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-purple-600" />
          <h4 className="text-base font-semibold text-slate-900">Verification Status</h4>
        </div>

        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-purple-900">Update Under Review</span>
            </div>
            <Clock className="w-5 h-5 text-purple-600" />
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900 font-semibold mb-1">
              ✅ Your verification badge remains active
            </p>
            <p className="text-xs text-blue-700">
              Your update is being reviewed by our team. Current verification stays valid during review.
            </p>
          </div>

          {/* Update Details */}
          {verificationDoc.update_type && (
            <div className="text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Type: {verificationDoc.update_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <button
              onClick={() => router.push('/vendor/dashboard/verification')}
              className="w-full mt-2 px-4 py-2 text-xs text-slate-600 hover:text-slate-900 transition border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              View Update Status →
            </button>
          )}
        </div>
      </section>
    );
  }

  // If vendor is not verified
  return (
    <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-amber-600" />
        <h4 className="text-base font-semibold text-slate-900">Verification Status</h4>
      </div>

      <div className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="text-sm font-semibold text-amber-900">Not Verified</span>
          </div>
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>

        {/* Info */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-900 font-semibold mb-1">
            Get Verified to Build Trust
          </p>
          <p className="text-xs text-amber-700">
            Verified businesses receive more inquiries and appear higher in search results.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-slate-700">Verified badge on profile</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-slate-700">Higher search ranking</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-slate-700">Increased customer trust</span>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <button
            onClick={() => router.push('/vendor/dashboard/verification')}
            className="w-full mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Get Verified Now
          </button>
        )}
      </div>
    </section>
  );
}
