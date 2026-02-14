'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  MapPin, Clock, FileText, CheckCircle, AlertTriangle, 
  LogIn, User, DollarSign, Calendar, Tag, Eye, Building2,
  Shield, Info
} from 'lucide-react';
import VendorRFQResponseFormNew from '@/components/VendorRFQResponseFormNew';

export default function PublicRFQDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isVendor, setIsVendor] = useState(false);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if user is a vendor
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id, company_name, verified, status')
          .eq('user_id', user.id)
          .single();
        
        if (vendor) {
          setIsVendor(true);
          setVendorProfile(vendor);
        }
      }
      setAuthChecked(true);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setIsVendor(false);
        setVendorProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch RFQ details
  useEffect(() => {
    const fetchRFQ = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading RFQ:', error);
      }
      setRfq(data || null);
      setLoading(false);
    };

    fetchRFQ();
  }, [id]);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading || !authChecked) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-gray-500">
        <FileText size={40} className="mx-auto mb-3 text-gray-400 animate-pulse" />
        <p>Loading RFQ details...</p>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-gray-500">
        <FileText size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-medium">RFQ not found</p>
        <p className="text-sm mt-2">This request may have been removed or doesn't exist.</p>
        <Link href="/post-rfq" className="inline-block mt-4 text-orange-600 hover:text-orange-700">
          ← Back to RFQ Marketplace
        </Link>
      </div>
    );
  }

  // Block access to private/pending RFQs unless the user is the creator or an admin
  const isCreator = user && rfq.user_id === user.id;
  if (rfq.visibility === 'private' && !isCreator) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-gray-500">
        <AlertTriangle size={40} className="mx-auto mb-3 text-amber-400" />
        <p className="text-lg font-medium">This RFQ is not yet public</p>
        <p className="text-sm mt-2">This request is currently under review and not available for viewing.</p>
        <Link href="/post-rfq" className="inline-block mt-4 text-orange-600 hover:text-orange-700">
          ← Back to RFQ Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/post-rfq" className="hover:text-orange-600">RFQ Marketplace</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{rfq.title}</span>
      </div>

      {/* RFQ Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        {/* Status Banner */}
        <div className={`px-6 py-3 flex items-center justify-between ${
          rfq.status === 'submitted' || rfq.status === 'open' 
            ? 'bg-green-50 border-b border-green-100' 
            : 'bg-gray-50 border-b border-gray-100'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              rfq.status === 'submitted' || rfq.status === 'open'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {rfq.status === 'submitted' || rfq.status === 'open' ? '🟢 Open for Quotes' : rfq.status}
            </span>
            {rfq.type && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {rfq.type === 'public' ? 'Public RFQ' : rfq.type}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Eye size={14} />
            <span>Posted {formatDate(rfq.created_at)}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {rfq.title}
          </h1>
          
          {rfq.category_slug && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Tag size={14} />
              <span className="capitalize">{rfq.category_slug.replace(/-/g, ' ')}</span>
            </div>
          )}

          <p className="text-gray-700 mb-6 whitespace-pre-wrap">
            {rfq.description}
          </p>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                <p className="text-sm font-medium text-gray-800">
                  {rfq.location || rfq.county || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Budget Range</p>
                <p className="text-sm font-medium text-gray-800">
                  {rfq.budget_min && rfq.budget_max 
                    ? `${formatCurrency(rfq.budget_min)} - ${formatCurrency(rfq.budget_max)}`
                    : rfq.budget_range || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Timeline</p>
                <p className="text-sm font-medium text-gray-800">
                  {rfq.timeline || 'Flexible'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Posted</p>
                <p className="text-sm font-medium text-gray-800">
                  {formatDate(rfq.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Buyer Status</p>
                <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                  {rfq.buyer_verified ? (
                    <>
                      <CheckCircle size={14} className="text-green-500" />
                      Verified Buyer
                    </>
                  ) : (
                    <>
                      <Info size={14} className="text-gray-400" />
                      Unverified User
                    </>
                  )}
                </p>
              </div>
            </div>

            {rfq.visibility && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Eye className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Visibility</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">
                    {rfq.visibility}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Section - Conditional based on auth status */}
      {!user ? (
        /* ============================================ */
        /* NOT LOGGED IN - Show Sign In CTA */
        /* ============================================ */
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Interested in this project?
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Sign in as a vendor to submit your quote and compete for this job. 
            Join thousands of professionals growing their business on Zintra.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Sign In to Respond
            </Link>
            <Link
              href="/auth/register?type=vendor"
              className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-lg font-medium border border-orange-200 hover:bg-orange-50 transition-colors"
            >
              <User className="w-5 h-5" />
              Register as Vendor
            </Link>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Already have an account? Sign in to access the response form.
          </p>
        </div>
      ) : !isVendor ? (
        /* ============================================ */
        /* LOGGED IN BUT NOT A VENDOR */
        /* ============================================ */
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Complete Your Vendor Profile
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You're logged in, but you need a vendor profile to respond to RFQs. 
            Set up your business profile to start submitting quotes.
          </p>
          
          <Link
            href="/vendor-registration"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Building2 className="w-5 h-5" />
            Complete Vendor Registration
          </Link>
        </div>
      ) : (
        /* ============================================ */
        /* LOGGED IN AS VENDOR - Show Disclaimer + Form */
        /* ============================================ */
        <div className="space-y-6">
          {/* Vendor Welcome */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Logged in as {vendorProfile?.company_name || 'Vendor'}
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                {vendorProfile?.verified ? '✓ Verified Vendor' : 'Complete verification to improve trust'}
              </p>
            </div>
          </div>

          {/* Disclaimer Box */}
          {!disclaimerAccepted ? (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Before You Respond
                  </h3>
                  <div className="text-sm text-gray-700 space-y-2 mb-4">
                    <p>
                      <strong>⚠️ Important:</strong> By submitting a quote, you confirm that:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-2">
                      <li>You have the skills, capacity, and resources to complete this work</li>
                      <li>You intend to deliver quality work as described in your quote</li>
                      <li>You understand the project requirements and can meet the timeline</li>
                      <li>You will communicate professionally with the buyer</li>
                      <li>Your pricing is accurate and you will honor your quoted rates</li>
                    </ul>
                    <p className="text-amber-700 font-medium mt-3">
                      🚫 Do not submit quotes for jobs you cannot or do not intend to complete. 
                      This affects your reputation and wastes the buyer's time.
                    </p>
                  </div>
                  
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={disclaimerAccepted}
                      onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">
                      I understand and confirm that I am genuinely interested in this project 
                      and capable of delivering the requested work.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            /* Collapsed disclaimer after acceptance */
            <div className="bg-green-50 rounded-lg border border-green-200 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>You've confirmed you're ready to submit a genuine quote</span>
              </div>
              <button
                onClick={() => setDisclaimerAccepted(false)}
                className="text-xs text-green-600 hover:text-green-700 underline"
              >
                Review terms
              </button>
            </div>
          )}

          {/* Response Form - Only show when disclaimer accepted */}
          {disclaimerAccepted && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Submit Your Quote
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Fill in the details below. You can save as draft and return later.
                </p>
              </div>
              <div className="p-6">
                <VendorRFQResponseFormNew rfqId={id} rfqDetails={rfq} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Back Link */}
      <div className="mt-8 text-center">
        <Link 
          href="/post-rfq" 
          className="text-sm text-gray-500 hover:text-orange-600 transition-colors"
        >
          ← Back to RFQ Marketplace
        </Link>
      </div>
    </div>
  );
}
