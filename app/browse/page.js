'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Search, MapPin, Star, Filter, X } from 'lucide-react';
import { KENYA_COUNTIES, KENYA_TOWNS_BY_COUNTY } from '@/lib/kenyaLocations';
import { ALL_CATEGORIES_FLAT } from '@/lib/constructionCategories';
import { VendorCard } from '@/components/VendorCard';

export default function BrowseVendors() {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState(['All Categories']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [vendorProfileLink, setVendorProfileLink] = useState('');

  // ✅ Set categories immediately (no async needed)
  useEffect(() => {
    setCategories([
      'All Categories',
      ...ALL_CATEGORIES_FLAT.map((cat) => cat.label),
    ]);
  }, []);

  // ✅ Fetch vendors — Safari-safe with AbortController + hard timeout
  useEffect(() => {
    let isMounted = true;
    let dataLoaded = false;
    const abortController = new AbortController();
    const supabase = createClient();

    // Hard safety timeout — force-end loading after 10s no matter what
    const safetyTimer = setTimeout(() => {
      if (isMounted && !dataLoaded) {
        console.warn('⚠️ Browse: Safety timeout reached — forcing loading=false');
        setLoading(false);
        dataLoaded = true;
      }
    }, 10000);

    const fetchVendorProfileLink = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (vendor?.id && isMounted) setVendorProfileLink(`/vendor-profile/${vendor.id}`);
      } catch {
        // Silently fail - not critical
      }
    };

    const fetchVendors = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);

        // First try with stats join
        let vendorData = null;
        let fetchError = null;

        try {
          const result = await Promise.race([
            supabase
              .from('vendors')
              .select('*, vendor_profile_stats(views_count, likes_count)'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
          ]);
          vendorData = result.data;
          fetchError = result.error;
        } catch {
          // Stats join timed out or failed — fallback to vendors only
          console.warn('⚠️ Stats join failed, fetching vendors without stats...');
          try {
            const fallback = await Promise.race([
              supabase.from('vendors').select('*'),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 6000))
            ]);
            vendorData = fallback.data;
            fetchError = fallback.error;
          } catch {
            fetchError = { message: 'Request timed out. Please refresh the page.' };
          }
        }

        if (!isMounted) return;

        if (fetchError) {
          console.error('❌ Error fetching vendors:', fetchError.message);
          setError(`Failed to load vendors: ${fetchError.message}`);
          setVendors([]);
        } else if (!vendorData || vendorData.length === 0) {
          console.warn('No vendors found in database');
          setVendors([]);
        } else {
          // Flatten stats (if present) into each vendor object
          const vendorsWithStats = vendorData.map(vendor => ({
            ...vendor,
            views_count: vendor.vendor_profile_stats?.[0]?.views_count || 0,
            likes_count: vendor.vendor_profile_stats?.[0]?.likes_count || 0,
          }));
          setVendors(vendorsWithStats);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Unexpected error fetching vendors:', err.message);
        setError(`Error: ${err.message || 'Failed to load vendors'}`);
        setVendors([]);
      } finally {
        if (isMounted) {
          setLoading(false);
          dataLoaded = true;
        }
      }
    };

    // Run in parallel — neither blocks the other
    fetchVendorProfileLink();
    fetchVendors();

    return () => {
      isMounted = false;
      abortController.abort();
      clearTimeout(safetyTimer);
    };
  }, []);

  // ✅ Filtering logic with improved category matching and priority sorting
  const filteredVendors = vendors
    .filter((vendor) => {
      const matchesSearch =
        vendor.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Match against primary_category_slug or legacy category field
      const matchesCategory =
        selectedCategory === 'All Categories' || 
        vendor.primary_category_slug === selectedCategory ||
        vendor.category === selectedCategory ||
        (selectedCategory && vendor.category?.toLowerCase().includes(selectedCategory.toLowerCase()));
      
      const matchesCounty =
        !selectedCounty || vendor.county === selectedCounty;
      const matchesTown =
        !selectedTown || vendor.location === selectedTown;

      return matchesSearch && matchesCategory && matchesCounty && matchesTown;
    })
    .sort((a, b) => {
      // Priority Tier 1: Verified vendors (highest priority)
      const aVerified = a.is_verified ? 3 : 0;
      const bVerified = b.is_verified ? 3 : 0;
      if (aVerified !== bVerified) return bVerified - aVerified;
      
      // Priority Tier 2: Vendors with profile images (logo or cover)
      const aHasImage = (a.business_logo || a.logo_url || a.cover_image) ? 2 : 0;
      const bHasImage = (b.business_logo || b.logo_url || b.cover_image) ? 2 : 0;
      if (aHasImage !== bHasImage) return bHasImage - aHasImage;
      
      // Priority Tier 3: Sort by rating and reviews
      const aRating = (a.rating || 0) * 100 + (a.total_reviews || 0);
      const bRating = (b.rating || 0) * 100 + (b.total_reviews || 0);
      return bRating - aRating;
    });

  const clearFilters = () => {
    setSelectedCategory('All Categories');
    setSelectedCounty('');
    setSelectedTown('');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Find Construction Vendors</h1>
          <p className="text-gray-200 text-sm sm:text-base">
            Browse verified vendors and connect with the best professionals in Kenya.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          {/* Desktop Filters - Single Row */}
          <div className="hidden md:flex gap-3 items-center">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white transition-all text-sm"
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            {/* County Dropdown */}
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white transition-all text-sm"
            >
              <option value="">All Counties</option>
              {KENYA_COUNTIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Location Dropdown */}
            <select
              value={selectedTown}
              onChange={(e) => setSelectedTown(e.target.value)}
              disabled={!selectedCounty}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white transition-all text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Locations</option>
              {selectedCounty && KENYA_TOWNS_BY_COUNTY[selectedCounty]?.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Clear Button */}
            {(selectedCategory !== 'All Categories' ||
              selectedCounty ||
              selectedTown ||
              searchQuery) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium flex items-center whitespace-nowrap border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 mr-1" /> Clear
              </button>
            )}
          </div>

          {/* Mobile: Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            <Filter className="w-5 h-5 mr-2" /> {showFilters ? 'Hide Filters' : 'Filters'}
            {(selectedCategory !== 'All Categories' || selectedCounty || selectedTown || searchQuery) && (
              <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full"></span>
            )}
          </button>

          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="md:hidden mt-3 space-y-3 animate-in slide-in-from-top">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>

              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>

              {/* County Dropdown */}
              <select
                value={selectedCounty}
                onChange={(e) => { setSelectedCounty(e.target.value); setSelectedTown(''); }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white text-sm"
              >
                <option value="">All Counties</option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Location Dropdown */}
              <select
                value={selectedTown}
                onChange={(e) => setSelectedTown(e.target.value)}
                disabled={!selectedCounty}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Locations</option>
                {selectedCounty && KENYA_TOWNS_BY_COUNTY[selectedCounty]?.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Clear Filters */}
              {(selectedCategory !== 'All Categories' || selectedCounty || selectedTown || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4 mr-1" /> Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Vendor Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-semibold">Error loading vendors</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 text-lg mt-4">Loading vendors...</p>
          </div>
        ) : vendors.length === 0 && !error ? (
          <div className="text-center py-12 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-700 font-semibold mb-2">No vendors registered yet</p>
            <p className="text-blue-600 text-sm">Check back soon or become the first vendor!</p>
            <Link href="/vendor-registration">
              <button className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
                Become a Vendor
              </button>
            </Link>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center text-gray-600 py-10">
            No vendors found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
