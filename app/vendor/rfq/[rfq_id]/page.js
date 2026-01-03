'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  DollarSign,
  MapPin,
  User,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle,
  X
} from 'lucide-react';

export default function VendorRFQDetails() {
  const router = useRouter();
  const params = useParams();
  const rfqId = params.rfq_id;

  const [rfq, setRfq] = useState(null);
  const [requester, setRequester] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [responseCount, setResponseCount] = useState(0);
  const [userResponse, setUserResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, [rfqId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Fetch vendor profile
      const { data: vendor } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      setVendorProfile(vendor);

      // Fetch RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfqId)
        .single();

      if (rfqError || !rfqData) {
        setError('RFQ not found');
        return;
      }

      setRfq(rfqData);

      // Fetch requester info
      const { data: requesterData } = await supabase
        .from('users')
        .select('id, email, user_metadata')
        .eq('id', rfqData.user_id)
        .single();

      setRequester(requesterData);

      // Fetch response count
      const { count } = await supabase
        .from('rfq_responses')
        .select('id', { count: 'exact' })
        .eq('rfq_id', rfqId);

      setResponseCount(count || 0);

      // Check if user already responded
      if (vendor) {
        const { data: userResp } = await supabase
          .from('rfq_responses')
          .select('*')
          .eq('rfq_id', rfqId)
          .eq('vendor_id', vendor.id)
          .maybeSingle();

        setUserResponse(userResp);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/vendor/rfq-dashboard')}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-semibold transition"
          >
            <ArrowLeft size={20} />
            Back to Opportunities
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">RFQ Not Found</h2>
            <p className="text-gray-600">{error || 'Unable to load this RFQ'}</p>
          </div>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(rfq.expires_at);
  const daysUntilExpiry = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
  const hasExpired = daysUntilExpiry < 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/vendor/rfq-dashboard')}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-semibold transition"
        >
          <ArrowLeft size={20} />
          Back to Opportunities
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - RFQ Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{rfq.title}</h1>
                  <p className="text-gray-600 text-sm">
                    Posted {new Date(rfq.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 capitalize">
                  {rfq.type} Request
                </span>
              </div>

              {hasExpired && (
                <div className="bg-red-50 border border-red-200 rounded p-3 flex items-center gap-2 text-red-700">
                  <X size={20} />
                  <span className="font-semibold">This RFQ has expired</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-xs text-gray-500 mb-2">Budget</p>
                <p className="text-lg font-bold text-gray-900">{rfq.budget_estimate || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-xs text-gray-500 mb-2">Category</p>
                <p className="text-lg font-bold text-gray-900">{rfq.category}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-xs text-gray-500 mb-2">Expires In</p>
                <p className={`text-lg font-bold ${hasExpired ? 'text-red-600' : 'text-gray-900'}`}>
                  {hasExpired ? 'Expired' : `${daysUntilExpiry} days`}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-xs text-gray-500 mb-2">Responses</p>
                <p className="text-lg font-bold text-gray-900">{responseCount}</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Project Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {rfq.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Project Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rfq.location && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-gray-400" />
                      <p className="font-semibold text-gray-900">{rfq.location}</p>
                    </div>
                  </div>
                )}
                {rfq.county && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">County</p>
                    <p className="font-semibold text-gray-900">{rfq.county}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Urgency Level</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    rfq.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                    rfq.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                    rfq.urgency === 'normal' ? 'bg-gray-100 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {rfq.urgency ? rfq.urgency.charAt(0).toUpperCase() + rfq.urgency.slice(1) : 'Normal'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Quotes</p>
                  <p className="font-semibold text-gray-900">{responseCount} vendor{responseCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Your Response */}
            {userResponse && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">Your Quote Submitted</h3>
                    <div className="space-y-2 text-sm text-green-800">
                      <p><span className="font-semibold">Price:</span> {userResponse.currency} {userResponse.quoted_price}</p>
                      <p><span className="font-semibold">Timeline:</span> {userResponse.delivery_timeline}</p>
                      <p><span className="font-semibold">Status:</span> {userResponse.status}</p>
                      <p><span className="font-semibold">Submitted:</span> {new Date(userResponse.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Requester Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Requester</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {requester?.user_metadata?.first_name || 'User'}
                  </p>
                  <p className="text-sm text-gray-500">Verified Customer</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                {requester?.email && (
                  <div className="text-gray-600">
                    <span className="font-semibold">Email:</span> {requester.email}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Posted</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(rfq.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expires</p>
                  <p className={`font-semibold ${hasExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    {expiresAt.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Time Remaining</p>
                  <p className={`font-semibold ${hasExpired ? 'text-red-600' : 'text-emerald-600'}`}>
                    {hasExpired ? 'Expired' : `${daysUntilExpiry} days`}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Card */}
            {!userResponse && !hasExpired && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-emerald-900 mb-4">Ready to Quote?</h2>
                <button
                  onClick={() => router.push(`/vendor/rfq/${rfqId}/respond`)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                >
                  <TrendingUp size={20} />
                  Submit Your Quote
                </button>
                <p className="text-xs text-emerald-700 mt-3 text-center">
                  Quick response increases your chances of winning
                </p>
              </div>
            )}

            {userResponse && (
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
                <p className="text-sm text-emerald-700 font-semibold">✓ You have submitted a quote</p>
              </div>
            )}

            {hasExpired && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                <p className="text-sm text-gray-600 font-semibold text-center">
                  This RFQ is no longer accepting responses
                </p>
              </div>
            )}

            {/* Competition Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Competition</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Quotes Received</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-blue-600">{responseCount}</p>
                    <p className="text-sm text-gray-600">vendor{responseCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {responseCount > 0 && (
                  <p className="text-xs text-orange-700 font-semibold pt-3 border-t border-gray-200">
                    ⚡ Quick response can give you a competitive edge!
                  </p>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-2 text-sm">💡 Quick Tips</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>✓ Submit quotes quickly</li>
                <li>✓ Match requester budget</li>
                <li>✓ Highlight your expertise</li>
                <li>✓ Provide clear timeline</li>
                <li>✓ Be professional & specific</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
