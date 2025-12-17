'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Search, MapPin, Star, Filter, X } from 'lucide-react';
import { KENYA_COUNTIES, KENYA_TOWNS_BY_COUNTY } from '@/lib/kenyaLocations';
import { ALL_CATEGORIES_FLAT } from '@/lib/constructionCategories';

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

  // ✅ Fetch vendors and extract filters
  useEffect(() => {
    const fetchVendorProfileLink = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (vendor?.id) setVendorProfileLink(`/vendor-profile/${vendor.id}`);
    };
    fetchVendorProfileLink();

    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase.from('vendors').select('*');

        if (fetchError) {
          console.error('❌ Error fetching vendors:', fetchError.message);
          setError(`Failed to load vendors: ${fetchError.message}`);
          setVendors([]);
          // Set comprehensive categories even on error
          setCategories([
            'All Categories',
            ...ALL_CATEGORIES_FLAT.map((cat) => cat.label),
          ]);
        } else if (!data || data.length === 0) {
          console.warn('No vendors found in database');
          setVendors([]);
          // Set comprehensive categories for filtering even with no vendors
          setCategories([
            'All Categories',
            ...ALL_CATEGORIES_FLAT.map((cat) => cat.label),
          ]);
        } else {
          setVendors(data);
          // Use comprehensive construction categories
          setCategories([
            'All Categories',
            ...ALL_CATEGORIES_FLAT.map((cat) => cat.label),
          ]);
        }
      } catch (err) {
        console.error('Unexpected error fetching vendors:', err);
        setError(`Error: ${err.message || 'Unknown error occurred'}`);
        setVendors([]);
        // Set comprehensive categories on error
        setCategories([
          'All Categories',
          ...ALL_CATEGORIES_FLAT.map((cat) => cat.label),
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  // ✅ Filtering logic
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All Categories' || vendor.category === selectedCategory;
    const matchesCounty =
      !selectedCounty || vendor.county === selectedCounty;
    const matchesTown =
      !selectedTown || vendor.location === selectedTown;

    return matchesSearch && matchesCategory && matchesCounty && matchesTown;
  });

  const clearFilters = () => {
    setSelectedCategory('All Categories');
    setSelectedCounty('');
    setSelectedTown('');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="text-gray-700 hover:text-gray-900">Home</Link>
            <Link href="/browse" className="text-gray-700 hover:text-gray-900">Browse</Link>
            <Link href="/post-rfq" className="text-gray-700 hover:text-gray-900">Post RFQ</Link>
          </div>
          {vendorProfileLink && (
            <Link href={vendorProfileLink} className="text-sm font-semibold text-amber-700 hover:underline">
              Back to Profile
            </Link>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Find Construction Vendors</h1>
          <p className="text-gray-200">
            Browse verified vendors and connect with the best professionals in Kenya.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
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
            <Filter className="w-5 h-5 mr-2" /> Filters
          </button>
        </div>
      </div>

      {/* Vendor Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {vendor.company_name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {vendor.description || 'No description available.'}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" /> {vendor.location}
                    </div>
                    {vendor.rating && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 font-medium">
                          {vendor.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ✅ Navigation to redesigned Vendor Profile */}
                  <Link href={`/vendor-profile/${vendor.id}`}>
                    <button
                      className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      View Profile
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
