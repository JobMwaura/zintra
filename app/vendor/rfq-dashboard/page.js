'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import RFQModalDispatcher from '@/components/modals/RFQModalDispatcher';
import {
  ChevronRight,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  MessageSquare,
  ArrowRight,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  XCircle,
  Ban
} from 'lucide-react';

const urgencyColors = {
  low: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  normal: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
};

const responseStatusColors = {
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Your Quote Submitted' },
  viewed: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Quote Viewed' },
  accepted: { bg: 'bg-green-100', text: 'text-green-700', label: 'Quote Accepted!' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Quote Rejected' },
  declined: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Declined' }
};

// Debounce hook for search optimization
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Skeleton loader component
function RFQSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded-full w-32"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

// Stats skeleton
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse border-l-4 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VendorRFQDashboard() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all, not_responded, responded
  const [user, setUser] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_eligible: 0,
    pending_response: 0,
    submitted_quotes: 0,
    accepted_quotes: 0
  });
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Memoized filtered RFQs based on debounced search and filters
  const filteredRfqs = useMemo(() => {
    let filtered = rfqs;

    // Search filter (using debounced term)
    if (debouncedSearchTerm) {
      filtered = filtered.filter(rfq =>
        rfq.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        rfq.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Urgency filter
    if (filterUrgency !== 'all') {
      filtered = filtered.filter(rfq => rfq.urgency === filterUrgency);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(rfq => rfq.category === filterCategory);
    }

    // Response status filter
    if (filterStatus === 'not_responded') {
      filtered = filtered.filter(rfq => !rfq.vendor_response);
    } else if (filterStatus === 'responded') {
      filtered = filtered.filter(rfq => rfq.vendor_response && rfq.vendor_response.status !== 'declined');
    } else if (filterStatus === 'declined') {
      filtered = filtered.filter(rfq => rfq.vendor_response?.status === 'declined');
    } else {
      // 'all' — hide declined by default to keep the list clean
      filtered = filtered.filter(rfq => rfq.vendor_response?.status !== 'declined');
    }

    return filtered;
  }, [rfqs, debouncedSearchTerm, filterUrgency, filterCategory, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Fetch vendor profile (required for dashboard)
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (vendorError || !vendor) {
        setError('Vendor profile not found. Please complete your vendor setup.');
        setLoading(false);
        return;
      }

      setVendorProfile(vendor);

      // Fetch eligible RFQs
      const token = session.access_token;
      const rfqRes = await fetch('/api/vendor/eligible-rfqs?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (rfqRes.ok) {
        const rfqData = await rfqRes.json();
        const rfqsList = rfqData.rfqs || [];
        setRfqs(rfqsList);

        // Extract unique categories (safely handle null rfqs)
        const uniqueCategories = [...new Set(rfqsList?.map(r => r?.category)?.filter(Boolean))].filter(Boolean);
        setCategories(uniqueCategories);

        // Calculate stats
        const submitted = rfqsList?.filter(r => r?.vendor_response?.status === 'submitted')?.length || 0;
        const accepted = rfqsList?.filter(r => r?.vendor_response?.status === 'accepted')?.length || 0;
        const declined = rfqsList?.filter(r => r?.vendor_response?.status === 'declined')?.length || 0;
        const pending = rfqsList?.filter(r => !r?.vendor_response)?.length || 0;

        setStats({
          total_eligible: (rfqsList?.length || 0) - declined,
          pending_response: pending,
          submitted_quotes: submitted,
          accepted_quotes: accepted,
          declined_rfqs: declined
        });
      } else {
        setError('Failed to fetch RFQs');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondClick = useCallback((rfq) => {
    setSelectedRfq(rfq);
    setShowRFQModal(true);
    setModalError(null);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowRFQModal(false);
    setSelectedRfq(null);
    setModalError(null);
  }, []);

  const handleModalSubmit = useCallback(async (responseData) => {
    try {
      handleModalClose();
      await fetchData();
    } catch (error) {
      console.error('Error in modal submission:', error);
      setModalError(error.message);
    }
  }, [handleModalClose]);

  const handleViewDetails = useCallback((rfqId) => {
    router.push(`/vendor/rfq/${rfqId}`);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-96 mt-2"></div>
              </div>
              <div className="text-right animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
          </div>

          {/* Stats skeleton */}
          <StatsSkeleton />

          {/* Filters skeleton */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>

          {/* RFQ list skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <RFQSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !vendorProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 text-center">
            <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{error}</h2>
            <p className="text-red-600 mb-4">Please complete your vendor profile setup to continue.</p>
            <a href="/vendor-registration" className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              Complete Setup
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard content
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">RFQ Opportunities</h1>
              <p className="text-gray-600 mt-2">Find and bid on construction projects{vendorProfile?.primary_category_slug ? ` in ${vendorProfile.primary_category_slug}` : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back</p>
              <p className="text-xl font-semibold text-gray-900">{vendorProfile?.company_name || 'Vendor'}</p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => vendorProfile?.id && router.push(`/vendor-profile/${vendorProfile.id}`)}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              View Profile
            </button>
            <button
              onClick={() => router.push('/vendor/rfq-dashboard')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              My RFQs
            </button>
            <button
              onClick={() => router.push('/vendor-quotes')}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              My Quotes
            </button>
            <button
              onClick={() => router.push('/user-dashboard')}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Dashboard
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Available RFQs</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.total_eligible}</p>
              </div>
              <Eye size={32} className="text-emerald-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending Response</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending_response}</p>
              </div>
              <Clock size={32} className="text-orange-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Quotes Submitted</p>
                <p className="text-3xl font-bold text-blue-600">{stats.submitted_quotes}</p>
              </div>
              <MessageSquare size={32} className="text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Accepted Quotes</p>
                <p className="text-3xl font-bold text-green-600">{stats.accepted_quotes}</p>
              </div>
              <CheckCircle size={32} className="text-green-200" />
            </div>
          </div>

          {stats.declined_rfqs > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Declined</p>
                  <p className="text-3xl font-bold text-gray-500">{stats.declined_rfqs}</p>
                </div>
                <Ban size={32} className="text-gray-200" />
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search RFQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Urgency</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="not_responded">Not Responded</option>
              <option value="responded">Already Responded</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        {/* RFQ List */}
        {filteredRfqs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No RFQs found</p>
            <p className="text-gray-500">
              {searchTerm || filterUrgency !== 'all' || filterCategory !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'No matching opportunities at this time. Check back soon!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRfqs.map((rfq) => {
              const urgencyColor = urgencyColors[rfq.urgency || 'normal'];
              const daysUntilExpiry = rfq.days_until_expiry;
              const hasResponded = !!rfq.vendor_response;
              const responseStatus = rfq.vendor_response?.status;
              const responseColor = responseStatusColors[responseStatus];

              return (
                <div
                  key={rfq.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-emerald-500"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {rfq.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {rfq.description}
                      </p>
                    </div>
                    <div className="text-right">
                      {hasResponded ? (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${responseColor?.bg} ${responseColor?.text}`}>
                          {responseColor?.label}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-50 text-yellow-700">
                          Your Response Needed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <DollarSign size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Budget</p>
                        <p className="font-semibold text-gray-900">
                          {rfq.budget_estimate || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Expires</p>
                        <p className={`font-semibold ${daysUntilExpiry < 3 ? 'text-red-600' : 'text-gray-900'}`}>
                          {daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry} days`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <MessageSquare size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Responses</p>
                        <p className="font-semibold text-gray-900">
                          {rfq.response_count || 0} quotes
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${urgencyColor?.bg} ${urgencyColor?.text}`}>
                        {rfq.urgency ? rfq.urgency.charAt(0).toUpperCase() + rfq.urgency.slice(1) : 'Normal'} Urgency
                      </span>
                    </div>
                  </div>

                  {/* Location and Type */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    {rfq.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        {rfq.location}
                      </div>
                    )}
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold capitalize">{rfq.type}</span> Request
                    </div>
                  </div>

                  {/* Competition Info */}
                  {rfq.response_count > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                      <span className="font-semibold">{rfq.response_count} vendor{rfq.response_count !== 1 ? 's' : ''}</span> already responded.{' '}
                      <span className="font-semibold">Quick response increases your chances!</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewDetails(rfq.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
                    >
                      <Eye size={18} />
                      View Details
                    </button>
                    {!hasResponded && daysUntilExpiry > 0 && (
                      <button
                        onClick={() => handleRespondClick(rfq)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition"
                      >
                        <TrendingUp size={18} />
                        Submit Quote
                      </button>
                    )}
                    {hasResponded && responseStatus !== 'rejected' && responseStatus !== 'declined' && (
                      <button
                        onClick={() => router.push(`/rfq/${rfq.id}/negotiate`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition"
                      >
                        <MessageSquare size={18} />
                        Negotiate
                      </button>
                    )}
                    {hasResponded && responseStatus === 'rejected' && (
                      <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold cursor-not-allowed">
                        <CheckCircle size={18} />
                        Quote Rejected
                      </div>
                    )}
                    {daysUntilExpiry <= 0 && !hasResponded && (
                      <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold cursor-not-allowed">
                        <Clock size={18} />
                        Expired
                      </div>
                    )}
                    {hasResponded && responseStatus === 'declined' && (
                      <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed">
                        <Ban size={18} />
                        Declined
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {filteredRfqs.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">
              Showing <span className="font-semibold">{filteredRfqs.length}</span> of{' '}
              <span className="font-semibold">{stats.total_eligible}</span> available RFQs
            </p>
          </div>
        )}

        {/* RFQ Modal for quote submission */}
        {selectedRfq && (
          <RFQModalDispatcher
            isOpen={showRFQModal}
            rfqId={selectedRfq.id}
            categorySlug={selectedRfq.category_slug}
            vendorId={user?.id}
            onClose={handleModalClose}
            onSubmit={handleModalSubmit}
          />
        )}

        {/* Modal Error Display */}
        {modalError && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2 z-50">
            <AlertCircle size={20} />
            <span>{modalError}</span>
            <button onClick={() => setModalError(null)} className="ml-4 font-bold">×</button>
          </div>
        )}
      </div>
    </div>
  );
}
