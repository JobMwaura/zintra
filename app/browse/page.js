'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Filter, X } from 'lucide-react';

export default function BrowseVendors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [priceRange, setPriceRange] = useState('All Prices');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'All Categories',
    'Building & Structural Materials',
    'Wood & Timber Solutions',
    'Roofing & Waterproofing',
    'Doors, Windows & Hardware',
    'Flooring & Wall Finishes',
    'Plumbing & Sanitation',
    'Electrical & Lighting',
    'Kitchen & Interior Fittings',
    'HVAC & Climate Solutions'
  ];

  const locations = [
    'All Locations',
    'Nairobi',
    'Mombasa',
    'Kisumu',
    'Nakuru',
    'Eldoret'
  ];

  const priceRanges = [
    'All Prices',
    'Under KSh 50,000',
    'KSh 50,000 - 100,000',
    'KSh 100,000 - 500,000',
    'Over KSh 500,000'
  ];

  // Mock vendor data
  const vendors = [
    {
      id: 1,
      name: 'Karibu Supplies Ltd',
      category: 'Building & Structural Materials',
      location: 'Nairobi',
      rating: 4.8,
      reviews: 124,
      badge: 'Featured',
      priceRange: 'KSh 50,000 - 500,000',
      description: 'Quality building materials for all your construction needs. We specialize in cement, steel and aggregates.',
      verified: true
    },
    {
      id: 2,
      name: 'Mwanainchi Electricians',
      category: 'Electrical & Lighting',
      location: 'Mombasa',
      rating: 4.9,
      reviews: 89,
      badge: 'Premium',
      priceRange: 'KSh 20,000 - 200,000',
      description: 'Professional electrical services and supplies. Full quality electrical installations.',
      verified: true
    },
    {
      id: 3,
      name: 'Jembe Plumbing',
      category: 'Plumbing & Sanitation',
      location: 'Kisumu',
      rating: 4.7,
      reviews: 156,
      badge: 'Diamond',
      priceRange: 'KSh 30,000 - 300,000',
      description: 'Expert plumbing solutions for residential and commercial properties.',
      verified: true
    },
    {
      id: 4,
      name: 'Timber Masters Kenya',
      category: 'Wood & Timber Solutions',
      location: 'Nakuru',
      rating: 4.6,
      reviews: 78,
      badge: 'Basic',
      priceRange: 'KSh 10,000 - 150,000',
      description: 'Premium timber and wood products for construction and furniture.',
      verified: false
    },
    {
      id: 5,
      name: 'Roofing Experts Ltd',
      category: 'Roofing & Waterproofing',
      location: 'Nairobi',
      rating: 4.5,
      reviews: 92,
      badge: 'Premium',
      priceRange: 'KSh 100,000 - 500,000',
      description: 'Complete roofing solutions with quality materials and expert installation.',
      verified: true
    },
    {
      id: 6,
      name: 'Kitchen Dreams',
      category: 'Kitchen & Interior Fittings',
      location: 'Mombasa',
      rating: 4.9,
      reviews: 145,
      badge: 'Featured',
      priceRange: 'KSh 80,000 - 600,000',
      description: 'Modern kitchen fittings and interior design services.',
      verified: true
    }
  ];

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || vendor.category === selectedCategory;
    const matchesLocation = selectedLocation === 'All Locations' || vendor.location === selectedLocation;
    const matchesRating = vendor.rating >= minRating;
    
    return matchesSearch && matchesCategory && matchesLocation && matchesRating;
  });

  const clearFilters = () => {
    setSelectedCategory('All Categories');
    setSelectedLocation('All Locations');
    setPriceRange('All Prices');
    setMinRating(0);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img src="/zintra-svg-logo.svg" alt="Zintra" className="h-8 w-auto" />
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
              <Link href="/browse" className="text-gray-900 font-medium" style={{ color: '#ea8f1e' }}>Browse</Link>
              <Link href="/post-rfq" className="text-gray-700 hover:text-gray-900 font-medium">Post RFQ</Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <button className="text-gray-700 hover:text-gray-900 font-medium">Login</button>
              </Link>
              <Link href="/vendor-registration">
                <button className="text-white px-4 py-2 rounded-lg font-medium hover:opacity-90" style={{ backgroundColor: '#ea8f1e' }}>
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-4">Find Construction Vendors</h1>
          <p className="text-gray-200">Browse verified vendors and connect with the best construction professionals in Kenya</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors, services or materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:flex gap-4 mt-4">
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

            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
            >
              {priceRanges.map((range) => (
                <option key={range}>{range}</option>
              ))}
            </select>

            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
            >
              <option value={0}>All Ratings</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>

            {(selectedCategory !== 'All Categories' || selectedLocation !== 'All Locations' || minRating > 0) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </button>
            )}
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="md:hidden mt-4 space-y-3 pb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                {categories.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                {locations.map((loc) => (
                  <option key={loc}>{loc}</option>
                ))}
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                {priceRanges.map((range) => (
                  <option key={range}>{range}</option>
                ))}
              </select>

              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                <option value={0}>All Ratings</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>

              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">{filteredVendors.length}</span> vendors found
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
                  <div className="text-6xl">🏗️</div>
                </div>
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white`} style={{ backgroundColor: vendor.badge === 'Featured' || vendor.badge === 'Diamond' ? '#ea8f1e' : vendor.badge === 'Premium' ? '#3b82f6' : '#6b7280' }}>
                    {vendor.badge}
                  </span>
                </div>
                {vendor.verified && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      ✓ Verified
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{vendor.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{vendor.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-900 ml-1">{vendor.rating}</span>
                    <span className="text-sm text-gray-600 ml-1">({vendor.reviews})</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {vendor.location}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-xs text-gray-500">{vendor.category}</span>
                  <p className="text-sm font-medium text-gray-700">{vendor.priceRange}</p>
                </div>

                <Link href={`/vendor/${vendor.id}`}>
                  <button className="w-full text-white py-2 rounded-lg font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: '#ea8f1e' }}>
                    View Profile
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No vendors found matching your criteria</p>
            <button
              onClick={clearFilters}
              className="text-white px-6 py-2 rounded-lg font-medium hover:opacity-90"
              style={{ backgroundColor: '#ea8f1e' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}