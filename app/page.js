'use client';

import React, { useState, useEffect } from 'react';
import { Search, Building2, Trees, Home, DoorOpen, Layers, Droplet, Zap, ChefHat, Wind, MapPin, Star, ArrowRight, Users, CheckCircle, MessageSquare, TrendingUp, Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

function HowItWorksCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: '🔍',
      title: 'Search & Match',
      description: 'Browse verified vendors and find the perfect match for your project',
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80'
    },
    {
      icon: '💬',
      title: 'Connect & Engage',
      description: 'Message vendors directly, negotiate pricing, and clarify requirements',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80'
    },
    {
      icon: '✅',
      title: 'Hire & Build',
      description: 'Select your vendor and start your construction journey with confidence',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative max-w-4xl mx-auto mb-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="relative h-80">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-700"
            style={{ 
              backgroundImage: `url(${slides[currentSlide].image})`,
              filter: 'brightness(0.3)'
            }}
          />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
            <div className="text-6xl mb-4">{slides[currentSlide].icon}</div>
            <h3 className="text-3xl font-bold text-white mb-4">{slides[currentSlide].title}</h3>
            <p className="text-xl text-gray-100 max-w-2xl">{slides[currentSlide].description}</p>
          </div>
        </div>
        <div className="flex justify-center gap-2 py-4 bg-white">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${currentSlide === index ? 'w-8' : 'w-2'}`}
              style={{ backgroundColor: currentSlide === index ? '#ca8637' : '#d1d5db' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ZintraHomepage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [vendorProfileLink, setVendorProfileLink] = useState('');
  const [categories, setCategories] = useState([]);
  const [featuredVendors, setFeaturedVendors] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [stats, setStats] = useState([
    { icon: Users, value: '—', label: 'Verified Vendors' },
    { icon: TrendingUp, value: '—', label: 'Active RFQs' },
    { icon: Star, value: '—', label: 'Avg Vendor Rating' },
    { icon: Clock, value: '—', label: 'Avg Response Time' }
  ]);
  const [counties, setCounties] = useState(['All Locations']);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('query', searchQuery);
    if (selectedCategory && selectedCategory !== 'All Categories') params.set('category', selectedCategory);
    if (selectedLocation && selectedLocation !== 'All Locations') params.set('county', selectedLocation);
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const performLiveSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      setShowSearchResults(true);

      // Search vendors by company name or category
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, company_name, category, county, rating, verified, logo_url')
        .or(
          `company_name.ilike.%${query}%,category.ilike.%${query}%`
        )
        .eq('status', 'active')
        .limit(5);

      setSearchResults(vendors || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user logged in');
          return;
        }
        const { data: vendor, error } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (error) {
          console.error('Error fetching vendor:', error);
          return;
        }
        if (vendor?.id) {
          console.log('Vendor found, setting profile link:', vendor.id);
          setVendorProfileLink(`/vendor-profile/${vendor.id}`);
        } else {
          console.log('No vendor found for user:', user.id);
        }
      } catch (err) {
        console.error('Error in fetchVendorProfile:', err);
      }
    };
    const fetchData = async () => {
      // Categories
      const { data: cats } = await supabase.from('categories').select('name, slug').limit(9);
      if (cats) setCategories(cats);

      // Featured vendors (top rated, verified)
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, company_name, category, county, rating, logo_url, verified')
        .order('rating', { ascending: false })
        .limit(6);
      if (vendors) setFeaturedVendors(vendors);

      // Products teaser
      const { data: products } = await supabase
        .from('vendor_products')
        .select('id, name, price, image_url, vendor_id')
        .order('created_at', { ascending: false })
        .limit(4);
      if (products) setTopProducts(products);

      // Stats
      const { count: vendorCount } = await supabase.from('vendors').select('*', { count: 'exact', head: true });
      const { count: rfqCount } = await supabase.from('rfqs').select('*', { count: 'exact', head: true }).in('status', ['open', 'active']);
      const { data: ratingsData } = await supabase.from('vendors').select('rating');
      const avgRating = ratingsData?.length
        ? (ratingsData.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / ratingsData.length).toFixed(1)
        : '—';
      setStats([
        { icon: Users, value: vendorCount ?? '—', label: 'Verified Vendors' },
        { icon: TrendingUp, value: rfqCount ?? '—', label: 'Active RFQs' },
        { icon: Star, value: avgRating, label: 'Avg Vendor Rating' },
        { icon: Clock, value: 'Fast', label: 'Response Time' }
      ]);

      // Counties list
      const { data: countiesData } = await supabase.from('vendors').select('county');
      const uniqueCounties = Array.from(new Set((countiesData || []).map((c) => c.county).filter(Boolean)));
      setCounties(['All Locations', ...uniqueCounties]);
    };
    fetchVendorProfile();
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img src="/zintrass-new-logo.png" alt="Zintra" className="h-32 w-auto" />
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Home</Link>
              <Link href="/browse" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Browse</Link>
              <Link href="/post-rfq" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Post RFQ</Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              {vendorProfileLink ? (
                <Link href={vendorProfileLink}>
                  <button className="text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm" style={{ backgroundColor: '#ca8637' }}>
                    My Profile
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <button className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Login</button>
                  </Link>
                  <Link href="/vendor-registration">
                    <button className="text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm" style={{ backgroundColor: '#ca8637' }}>
                      Sign Up
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden text-white min-h-screen lg:min-h-[600px] flex items-center">
        {/* Banner Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: 'url(https://zeomgqlnztcdqtespsjx.supabase.co/storage/v1/object/public/vendor-assets/Website%20Images/zintra%20banner.png)',
            filter: 'brightness(0.5)'
          }}
        />

        {/* Overlay for better contrast */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 w-full flex flex-col items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full max-w-5xl">
            {/* Glass Box 1 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-400/20 mb-3">
                <Search className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">Find Vendors</h3>
              <p className="text-gray-100 text-sm leading-relaxed">Browse thousands of verified vendors in your area. Filter by category, location, and rating.</p>
            </div>

            {/* Glass Box 2 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-400/20 mb-3">
                <MessageSquare className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">Get Quotes</h3>
              <p className="text-gray-100 text-sm leading-relaxed">Post your project requirements and receive competitive quotes from multiple vendors instantly.</p>
            </div>

            {/* Glass Box 3 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-6 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-400/20 mb-3">
                <CheckCircle className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">Compare & Hire</h3>
              <p className="text-gray-100 text-sm leading-relaxed">Compare quotes side-by-side, read reviews, and hire the perfect vendor for your project.</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/post-rfq">
              <button
                className="px-8 py-4 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all"
                style={{ backgroundColor: '#ca8637' }}
              >
                Post an RFQ
              </button>
            </Link>
            <Link href="/browse">
              <button className="px-8 py-4 rounded-xl font-semibold border border-white/30 bg-white/10 hover:bg-white/20 transition-all backdrop-blur">
                Browse Vendors
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center relative">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors, materials, or services..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  performLiveSearch(e.target.value);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all"
              />
              
              {/* Live Search Results Dropdown */}
              {showSearchResults && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#ca8637' }}></div>
                      <p className="mt-2 text-sm">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {searchResults.map((vendor) => (
                        <Link
                          key={vendor.id}
                          href={`/vendor-profile/${vendor.id}`}
                          onClick={() => setShowSearchResults(false)}
                        >
                          <div className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                {vendor.logo_url ? (
                                  <img src={vendor.logo_url} alt={vendor.company_name} className="w-full h-full object-contain rounded" />
                                ) : (
                                  <Building2 className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-900 truncate">{vendor.company_name}</p>
                                  {vendor.verified && (
                                    <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span>{vendor.category}</span>
                                  {vendor.rating && (
                                    <>
                                      <span>•</span>
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                        <span>{vendor.rating.toFixed(1)}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>No vendors found matching "{searchQuery}"</p>
                      <p className="text-sm mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white w-full md:w-auto transition-all"
            >
              <option>All Categories</option>
              {categories.map((category) => (
                <option key={category.name}>{category.name}</option>
              ))}
            </select>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white w-full md:w-auto transition-all"
            >
              {counties.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="text-white px-8 py-3.5 rounded-lg font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg w-full md:w-auto"
              style={{ backgroundColor: '#ca8637' }}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Link key={index} href={`/browse?category=${encodeURIComponent(category.name)}`}>
                  <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: '#ca863720' }}>
                        <IconComponent className="w-7 h-7" style={{ color: '#ca8637' }} />
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                        category.type === 'services' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {category.type === 'services' ? 'Service' : 'Materials'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{category.description}</p>
                    <div className="mt-4 flex items-center text-sm font-medium group-hover:translate-x-1 transition-transform" style={{ color: '#ca8637' }}>
                      Browse <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-4xl font-bold mb-2" style={{ color: '#535554' }}>Featured Vendors</h2>
              <p className="text-gray-600 text-lg">Top-rated construction professionals in Kenya</p>
            </div>
            <Link href="/browse">
              <button className="font-semibold flex items-center hover:opacity-80 transition-opacity" style={{ color: '#ca8637' }}>
                View All <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredVendors.map((vendor) => (
              <div key={vendor.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                <div className="relative h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {vendor.logo_url ? (
                    <img src={vendor.logo_url} alt={vendor.company_name} className="w-full h-full object-contain p-6" />
                  ) : (
                    <Building2 className="w-16 h-16 text-gray-300" />
                  )}
                  {vendor.verified && (
                    <span className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{vendor.company_name || 'Vendor'}</h3>
                  <p className="text-xs text-gray-500 mb-3">{vendor.category || '—'}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-bold text-gray-900 ml-1.5">{vendor.rating || '—'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {vendor.county || 'Location'}
                    </div>
                  </div>
                  <Link href={`/vendor-profile/${vendor.id}`}>
                    <button className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all shadow-sm" style={{ backgroundColor: '#ca8637' }}>
                      View Profile
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#535554' }}>How Zintra Works</h2>
            <p className="text-gray-600 text-lg">Your complete construction marketplace journey</p>
          </div>
          <HowItWorksCarousel />
          <div className="mt-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl p-10 text-center text-white shadow-xl">
            <h3 className="text-3xl font-bold mb-4">Why Choose Zintra?</h3>
            <p className="text-lg text-gray-100 mb-8 max-w-3xl mx-auto">
              We empower transparency, trust, and growth across Kenya's construction ecosystem.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                <span className="font-medium">Verified Vendors</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 mr-2" />
                <span className="font-medium">Secure Payments</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 mr-2" />
                <span className="font-medium">Market Insights</span>
              </div>
              <div className="flex items-center">
                <Star className="w-6 h-6 mr-2" />
                <span className="font-medium">Quality Assurance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#535554' }}>Three Ways to Request Quotes</h2>
            <p className="text-gray-600 text-lg">Choose the RFQ method that works best for your project</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Type 1: Direct RFQ */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all overflow-hidden">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 border-b-2 border-orange-200">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-200 mb-3 mx-auto">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center">Direct RFQ</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-sm font-semibold mb-4 text-center" style={{ color: '#ca8637' }}>I know who I want to contact</p>
                <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                  Already have specific vendors in mind? Send your RFQ directly to the vendors you trust and want to work with.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Personal, targeted approach</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Work with trusted partners</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>2-5 quotes typically</span>
                  </li>
                </ul>
                <Link href="/post-rfq?type=direct">
                  <button className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all" style={{ backgroundColor: '#ca8637' }}>
                    Send Direct RFQ
                  </button>
                </Link>
              </div>
            </div>

            {/* Type 2: Wizard Auto-Match RFQ */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all overflow-hidden md:scale-105">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b-2 border-blue-200">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-200 mb-3 mx-auto">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center">Wizard RFQ</h3>
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold mb-4 text-center text-blue-600">Help me find the right vendors</p>
                <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                  Not sure who to contact? Let our smart system find the best-matched vendors for your project based on expertise, location, and ratings.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Guided 5-step wizard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Smart vendor matching</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>3-8 quality quotes</span>
                  </li>
                </ul>
                <Link href="/post-rfq?type=matched">
                  <button className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all" style={{ backgroundColor: '#2563eb' }}>
                    Use Wizard
                  </button>
                </Link>
              </div>
            </div>

            {/* Type 3: Public RFQ */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 border-b-2 border-purple-200">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-200 mb-3 mx-auto">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 text-center">Public RFQ</h3>
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold mb-4 text-center text-purple-600">Let all vendors compete</p>
                <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                  Post publicly and get competitive bids from all qualified vendors. Great for comparing options and getting the best market prices.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Transparent marketplace</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Competitive bidding</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span>5-20+ quotes available</span>
                  </li>
                </ul>
                <Link href="/post-rfq?type=public">
                  <button className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all" style={{ backgroundColor: '#9333ea' }}>
                    Post Publicly
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Public RFQs Marketplace Section */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-2" style={{ color: '#535554' }}>Public RFQ Marketplace</h3>
              <p className="text-gray-600">Active projects open for bidding - Browse available opportunities</p>
            </div>

            {/* RFQs List */}
            <div className="space-y-4">
              {/* This will be populated with data from Supabase */}
              {/* For now, showing placeholder state */}
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No active public RFQs at the moment</p>
                <p className="text-gray-400 text-sm mt-2">Post your project above to get started!</p>
              </div>

              {/* Sample RFQ Card Structure (commented for reference) */}
              {/* 
              <div className="bg-white rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Kitchen Renovation</h4>
                    <p className="text-gray-600 text-sm line-clamp-2">Modern kitchen renovation with new cabinets, countertops, and appliances</p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full ml-4">Open</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Budget</p>
                    <p className="text-lg font-bold text-gray-900">KSh 500K - 1M</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Location</p>
                    <p className="text-lg font-bold text-gray-900">Nairobi</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Deadline</p>
                    <p className="text-lg font-bold text-gray-900">Dec 24</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">Quotes</p>
                    <p className="text-lg font-bold text-gray-900">3</p>
                  </div>
                </div>
                <button className="w-full md:w-auto text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-all" style={{ backgroundColor: '#ca8637' }}>
                  View & Quote
                </button>
              </div>
              */}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img src="/zintrass-new-logo.png" alt="Zintra" className="h-32 w-auto" />
              </div>
              <p className="text-gray-200 text-lg font-medium mb-4 leading-tight">
                The smarter way to source, hire, and build.
              </p>
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-500 transition-colors">
                  <span className="text-sm font-semibold">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-500 transition-colors">
                  <span className="text-sm font-semibold">𝕏</span>
                </a>
                <a href="#" className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-500 transition-colors">
                  <span className="text-sm font-semibold">in</span>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/post-rfq" className="hover:text-white transition-colors">Post RFQ</Link></li>
                <li><Link href="/browse" className="hover:text-white transition-colors">Find Vendors</Link></li>
                <li><Link href="/browse" className="hover:text-white transition-colors">Browse Materials</Link></li>
                <li><Link href="/vendor-registration" className="hover:text-white transition-colors">Become a Vendor</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link href="/about" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-600 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Zintra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
