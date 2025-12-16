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
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('query', searchQuery);
    if (selectedCategory && selectedCategory !== 'All Categories') params.set('category', selectedCategory);
    if (selectedLocation && selectedLocation !== 'All Locations') params.set('county', selectedLocation);
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ''}`);
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

      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute transform rotate-45 -right-20 top-20 w-96 h-96 bg-white rounded-full"></div>
          <div className="absolute transform -rotate-45 -left-20 bottom-20 w-96 h-96 bg-white rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <p className="text-sm font-semibold uppercase tracking-widest text-amber-300">Post RFQ • Auto-match vendors • Compare quotes</p>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Request Quotes from Verified Vendors<br />and Compare Side-by-Side
              </h1>
              <p className="text-xl text-gray-200 leading-relaxed">
                Auto-validation, smart vendor matching, and a clean comparison view help you pick the best offer with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/post-rfq">
                  <button className="text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" style={{ backgroundColor: '#ca8637' }}>
                    Post an RFQ
                  </button>
                </Link>
                <Link href="/browse">
                  <button className="text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-all border border-white/60">
                    Browse Vendors
                  </button>
                </Link>
                {vendorProfileLink && (
                  <Link href={vendorProfileLink}>
                    <button className="text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-all border border-white/60">
                      My Vendor Profile
                    </button>
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                {stats.map((item, idx) => (
                  <div key={idx} className="bg-white/10 border border-white/10 rounded-xl p-4 flex items-center gap-3 justify-center">
                    <item.icon className="w-6 h-6 text-amber-300" />
                    <div>
                      <p className="text-lg font-bold">{item.value}</p>
                      <p className="text-sm text-gray-200">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-amber-200/60 blur-3xl"></div>
              <div className="absolute -bottom-10 -right-8 w-32 h-32 rounded-full bg-blue-200/40 blur-3xl"></div>
              <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://zeomgqlnztcdqtespsjx.supabase.co/storage/v1/object/public/vendor-assets/Website%20Images/zintra%20image.png"
                  alt="Zintra RFQ flow"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors, materials, or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all"
              />
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
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: '#535554' }}>Browse by Category</h2>
            <p className="text-gray-600 text-lg">Find the right vendors for your construction needs</p>
          </div>
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
