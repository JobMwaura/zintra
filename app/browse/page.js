'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Search, MapPin, Star, Filter, X } from 'lucide-react';

export default function BrowseVendors() {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState(['All Categories']);
  const [locations, setLocations] = useState(['All Locations']);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Fetch vendors and extract filters
  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('vendors').select('*');

      if (error) {
        console.error('❌ Error fetching vendors:', error.message);
      } else {
        setVendors(data);

        const uniqueCategories = [
          'All Categories',
          ...new Set(data.map((v) => v.category).filter(Boolean)),
        ];

        const uniqueLocations = [
          'All Locations',
          ...new Set(data.map((v) => v.location).filter(Boolean)),
        ];

        setCategories(uniqueCategories);
        setLocations(uniqueLocations);
      }
      setLoading(false);
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
    const matchesLocation =
      selectedLocation === 'All Locations' || vendor.location === selectedLocation;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  const clearFilters = () => {
    setSelectedCategory('All Categories');
    setSelectedLocation('All Locations');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
          >
            <Filter className="w-5 h-5 mr-2" /> Filters
          </button>
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex gap-4 px-4 pb-4 max-w-7xl mx-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
          >
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
          >
            {locations.map((loc) => (
              <option key={loc}>{loc}</option>
            ))}
          </select>

          {(selectedCategory !== 'All Categories' ||
            selectedLocation !== 'All Locations') && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium flex items-center"
            >
              <X className="w-4 h-4 mr-1" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Vendor Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-gray-600">Loading vendors...</p>
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

                  {/* ✅ Navigation to Vendor Profile */}
                  <Link href={`/vendor/${vendors.id}`}>
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