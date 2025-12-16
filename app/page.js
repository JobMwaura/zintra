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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (vendor?.id) {
        setVendorProfileLink(`/vendor-profile/${vendor.id}`);
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

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Glass Box 1 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-8 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-400/20 mb-4">
                <Search className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Find Vendors</h3>
              <p className="text-gray-100 leading-relaxed">Browse thousands of verified vendors in your area. Filter by category, location, and rating.</p>
            </div>

            {/* Glass Box 2 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-8 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-400/20 mb-4">
                <MessageSquare className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Get Quotes</h3>
              <p className="text-gray-100 leading-relaxed">Post your project requirements and receive competitive quotes from multiple vendors instantly.</p>
            </div>

            {/* Glass Box 3 */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-8 hover:bg-white/15 transition-all">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-400/20 mb-4">
                <CheckCircle className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Compare & Hire</h3>
              <p className="text-gray-100 leading-relaxed">Compare quotes side-by-side, read reviews, and hire the perfect vendor for your project.</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-12">
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

      <section className="bg-white py-8 shadow-sm">
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

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#535554' }}>Request for Quotation</h2>
          <p className="text-gray-600 text-lg mb-10">Submit one RFQ and receive responses from multiple verified vendors</p>
          <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Post Your Project</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g., Kitchen Renovation"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white transition-all">
                  <option>Select Category</option>
                  <option>Kitchen & Interior Fittings</option>
                  <option>Plumbing & Sanitation</option>
                  <option>Electrical & Lighting</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget (KSh)</label>
                <select className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white transition-all">
                  <option>Select budget range</option>
                  <option>50,000 - 100,000</option>
                  <option>100,000 - 500,000</option>
                  <option>500,000+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="e.g., Nairobi, Westlands"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Project Description</label>
              <textarea
                rows="4"
                placeholder="Describe your project requirements in detail..."
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all"
              ></textarea>
            </div>
            <Link href="/post-rfq">
              <button className="mt-8 text-white px-10 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl" style={{ backgroundColor: '#ca8637' }}>
                Submit RFQ
              </button>
            </Link>
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
