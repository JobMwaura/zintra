'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, MapPin, Clock, DollarSign, Briefcase, ChevronRight } from 'lucide-react';

function GigsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [gigs, setGigs] = useState([]);
  const [filteredGigs, setFilteredGigs] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filterLocation, setFilterLocation] = useState(searchParams.get('location') || '');
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '');
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadGigs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [gigs, searchTerm, filterLocation, filterCategory]);

  async function loadGigs() {
    try {
      const supabase = createClient();

      // Fetch all active gigs from listings table
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          category,
          location,
          pay_min,
          pay_max,
          pay_currency,
          job_type,
          start_date,
          duration,
          status,
          type,
          created_at,
          employer:employer_id(id, company_name, company_logo_url)
        `)
        .eq('type', 'gig')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setGigs(data || []);

      // Extract unique locations and categories
      const uniqueLocations = [...new Set(data?.map(g => g.location) || [])].sort();
      const uniqueCategories = [...new Set(data?.map(g => g.category) || [])].sort();

      setLocations(uniqueLocations);
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error loading gigs:', err);
      setError('Failed to load gigs');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = gigs;

    // Search by title or description
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        g =>
          g.title.toLowerCase().includes(query) ||
          g.description?.toLowerCase().includes(query) ||
          g.category?.toLowerCase().includes(query)
      );
    }

    // Filter by location
    if (filterLocation) {
      filtered = filtered.filter(g => g.location === filterLocation);
    }

    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter(g => g.category === filterCategory);
    }

    setFilteredGigs(filtered);
  }

  function handleGigClick(gigId) {
    router.push(`/careers/gigs/${gigId}`);
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Available Gigs</h1>
            <div className="w-16"></div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by title, role, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Location Filter */}
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => loadGigs()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No gigs found</h2>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterLocation || filterCategory
                ? 'Try adjusting your filters'
                : 'Check back soon for new opportunities'}
            </p>
            {(searchTerm || filterLocation || filterCategory) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterLocation('');
                  setFilterCategory('');
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600 font-medium">
                Found <span className="font-bold text-gray-900">{filteredGigs.length}</span>{' '}
                {filteredGigs.length === 1 ? 'gig' : 'gigs'}
              </p>
            </div>

            {/* Gigs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredGigs.map((gig) => (
                <div
                  key={gig.id}
                  onClick={() => handleGigClick(gig.id)}
                  className="bg-white rounded-lg border border-gray-200 hover:border-orange-500 hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                >
                  {/* Header with category badge */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-white">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold">{gig.title}</h3>
                      <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        URGENT
                      </span>
                    </div>
                    <p className="text-orange-100 text-sm">{gig.category}</p>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Company name if available */}
                    {gig.employer?.company_name && (
                      <p className="text-sm text-gray-600 font-medium">📌 {gig.employer.company_name}</p>
                    )}

                    {/* Description */}
                    <p className="text-gray-700 text-sm line-clamp-2">{gig.description || 'No description provided'}</p>

                    {/* Meta Information - Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                      {/* Location */}
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">LOCATION</p>
                          <p className="text-sm font-medium text-gray-900">{gig.location}</p>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="flex items-start gap-2">
                        <Clock size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">DURATION</p>
                          <p className="text-sm font-medium text-gray-900">{gig.duration || gig.job_type || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Start Date */}
                      <div className="flex items-start gap-2">
                        <Clock size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">STARTS</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(gig.start_date)}</p>
                        </div>
                      </div>

                      {/* Pay */}
                      <div className="flex items-start gap-2">
                        <DollarSign size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">PAY</p>
                          <p className="text-sm font-bold text-orange-600">
                            {gig.pay_min && gig.pay_max
                              ? `${formatCurrency(gig.pay_min)} - ${formatCurrency(gig.pay_max)}`
                              : gig.pay_min
                                ? formatCurrency(gig.pay_min)
                                : 'Negotiable'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 group-hover:gap-3">
                      View & Apply
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function GigsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GigsPageContent />
    </Suspense>
  );
}
