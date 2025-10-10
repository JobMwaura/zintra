'use client';

import React, { useState, useEffect } from 'react';
import { Search, Building2, Trees, Home, DoorOpen, Layers, Droplet, Zap, ChefHat, Wind, MapPin, Star, ArrowRight, Users, CheckCircle, MessageSquare, TrendingUp, Shield, Clock } from 'lucide-react';
import Link from 'next/link';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');

  const categories = [
    { name: 'Building & Structural Materials', icon: Building2, description: 'Cement, concrete, bricks, blocks, and structural steel', type: 'materials' },
    { name: 'Electrical Services & Supplies', icon: Zap, description: 'Licensed electricians, wiring, and installations', type: 'services' },
    { name: 'Plumbing Services & Supplies', icon: Droplet, description: 'Professional plumbers and sanitary installations', type: 'services' },
    { name: 'Wood & Timber Solutions', icon: Trees, description: 'Lumber, plywood, and carpentry services', type: 'materials' },
    { name: 'Roofing & Waterproofing', icon: Home, description: 'Roofing contractors and waterproofing services', type: 'services' },
    { name: 'Doors, Windows & Hardware', icon: DoorOpen, description: 'Doors, windows, frames, and fittings', type: 'materials' },
    { name: 'Flooring & Wall Finishes', icon: Layers, description: 'Tiles, laminates, paints, and finishing services', type: 'materials' },
    { name: 'Kitchen & Interior Fittings', icon: ChefHat, description: 'Cabinets, countertops, and interior design', type: 'services' },
    { name: 'HVAC & Climate Solutions', icon: Wind, description: 'Heating, ventilation, and air conditioning', type: 'services' }
  ];

  const featuredVendors = [
    {
      name: 'Karibu Supplies Ltd',
      category: 'Building Materials',
      location: 'Nairobi',
      rating: 4.8,
      reviews: 124,
      badge: 'Featured',
      description: 'Quality building materials for all your construction needs. Specialists in cement, steel and aggregates.'
    },
    {
      name: 'Mwanainchi Electricians',
      category: 'Electrical Services',
      location: 'Mombasa',
      rating: 4.9,
      reviews: 89,
      badge: 'Verified',
      description: 'Professional electrical services. Maintenance, repairs, and quality installations for all properties.'
    },
    {
      name: 'Jembe Plumbing',
      category: 'Plumbing Services',
      location: 'Kisumu',
      rating: 4.7,
      reviews: 156,
      badge: 'Gold',
      description: 'Expert plumbing solutions. Quality installations, repairs and maintenance for residential and commercial.'
    }
  ];

  const stats = [
    { icon: Users, value: '500+', label: 'Verified Vendors' },
    { icon: TrendingUp, value: '2,000+', label: 'Projects Completed' },
    { icon: Star, value: '4.8/5', label: 'Average Rating' },
    { icon: Clock, value: '24hrs', label: 'Response Time' }
  ];

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
              <Link href="/login">
                <button className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Login</button>
              </Link>
              <Link href="/vendor-registration">
                <button className="text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm" style={{ backgroundColor: '#ca8637' }}>
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute transform rotate-45 -right-20 top-20 w-96 h-96 bg-white rounded-full"></div>
          <div className="absolute transform -rotate-45 -left-20 bottom-20 w-96 h-96 bg-white rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Find the Best Construction<br />Materials & Services in Kenya
            </h1>
            <p className="text-xl mb-8 text-gray-100 max-w-3xl mx-auto leading-relaxed">
              Connect with trusted vendors and service providers, request quotes, and get your construction project moving - all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse">
                <button className="text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" style={{ backgroundColor: '#ca8637' }}>
                  Find Vendors
                </button>
              </Link>
              <Link href="/vendor-registration">
                <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-slate-700 transition-all shadow-lg">
                  Become a Vendor
                </button>
              </Link>
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
              <option>All Locations</option>
              <option>Nairobi</option>
              <option>Mombasa</option>
              <option>Kisumu</option>
              <option>Nakuru</option>
            </select>
            <button className="text-white px-8 py-3.5 rounded-lg font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg w-full md:w-auto" style={{ backgroundColor: '#ca8637' }}>
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                  <IconComponent className="w-8 h-8 mx-auto mb-3" style={{ color: '#ca8637' }} />
                  <div className="text-3xl font-bold mb-1" style={{ color: '#535554' }}>{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              );
            })}
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
            {featuredVendors.map((vendor, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Building2 className="w-20 h-20 text-gray-300" />
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                      vendor.badge === 'Featured' ? 'text-white' :
                      vendor.badge === 'Verified' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`} style={vendor.badge === 'Featured' ? { backgroundColor: '#ca8637' } : {}}>
                      {vendor.badge}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{vendor.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{vendor.description}</p>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="text-sm font-bold text-gray-900 ml-1.5">{vendor.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({vendor.reviews})</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {vendor.location}
                    </div>
                  </div>
                  <button className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all shadow-sm" style={{ backgroundColor: '#ca8637' }}>
                    View Profile
                  </button>
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