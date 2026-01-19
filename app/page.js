'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, Trees, Home, DoorOpen, Layers, Droplet, Zap, ChefHat, Wind, MapPin, Star, ArrowRight, Users, CheckCircle, MessageSquare, TrendingUp, Shield, Clock, Bell, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { CountyTownFilter } from '@/components/LocationSelector';
import { KENYA_COUNTIES, KENYA_TOWNS_BY_COUNTY } from '@/lib/kenyaLocations';
import { ALL_CATEGORIES_FLAT } from '@/lib/constructionCategories';
import { useNotifications } from '@/hooks/useNotifications';

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

// Category cards for homepage display - All 20 RFQ template categories
const CATEGORY_CARDS = [
  {
    name: 'Architectural Design',
    icon: Building2,
    slug: 'architectural_design',
    type: 'services',
    description: 'Professional architects and design services'
  },
  {
    name: 'Building & Masonry',
    icon: Building2,
    slug: 'building_masonry',
    type: 'services',
    description: 'Masonry, concrete, and structural builders'
  },
  {
    name: 'Carpentry & Joinery',
    icon: Home,
    slug: 'carpentry_joinery',
    type: 'services',
    description: 'Custom carpentry and woodwork specialists'
  },
  {
    name: 'Doors, Windows & Glass',
    icon: DoorOpen,
    slug: 'doors_windows_glass',
    type: 'services',
    description: 'Door and window installation and finishing'
  },
  {
    name: 'Electrical & Solar',
    icon: Zap,
    slug: 'electrical_solar',
    type: 'services',
    description: 'Electrical systems and solar solutions'
  },
  {
    name: 'Equipment Hire',
    icon: Layers,
    slug: 'equipment_hire',
    type: 'services',
    description: 'Equipment and machinery rental services'
  },
  {
    name: 'Fencing & Gates',
    icon: DoorOpen,
    slug: 'fencing_gates',
    type: 'services',
    description: 'Fencing, gates, and boundary solutions'
  },
  {
    name: 'Flooring & Wall Finishes',
    icon: Home,
    slug: 'flooring_wall_finishes',
    type: 'services',
    description: 'Flooring, tiling, and wall finishing'
  },
  {
    name: 'HVAC & Climate Control',
    icon: Wind,
    slug: 'hvac_climate',
    type: 'services',
    description: 'Heating, cooling, and ventilation systems'
  },
  {
    name: 'Interior Decoration',
    icon: ChefHat,
    slug: 'interior_decor',
    type: 'services',
    description: 'Interior design and decoration services'
  },
  {
    name: 'Kitchens & Wardrobes',
    icon: ChefHat,
    slug: 'kitchens_wardrobes',
    type: 'services',
    description: 'Kitchen and wardrobe installation specialists'
  },
  {
    name: 'Landscaping & Outdoor',
    icon: Trees,
    slug: 'landscaping_outdoor',
    type: 'services',
    description: 'Landscaping design and outdoor construction'
  },
  {
    name: 'Painting & Decorating',
    icon: DoorOpen,
    slug: 'painting_decorating',
    type: 'services',
    description: 'Painting, wallpaper, and decoration services'
  },
  {
    name: 'Plumbing & Drainage',
    icon: Droplet,
    slug: 'plumbing_drainage',
    type: 'services',
    description: 'Plumbing systems and water drainage'
  },
  {
    name: 'Pools & Water Features',
    icon: Droplet,
    slug: 'pools_water_features',
    type: 'services',
    description: 'Pool construction and water feature design'
  },
  {
    name: 'Project Management',
    icon: Layers,
    slug: 'project_management_qs',
    type: 'services',
    description: 'Project management and quantity surveying'
  },
  {
    name: 'Roofing & Waterproofing',
    icon: Home,
    slug: 'roofing_waterproofing',
    type: 'services',
    description: 'Roofing materials and waterproofing solutions'
  },
  {
    name: 'Security & Smart Systems',
    icon: Shield,
    slug: 'security_smart',
    type: 'services',
    description: 'Security systems and smart building tech'
  },
  {
    name: 'Special Structures',
    icon: Layers,
    slug: 'special_structures',
    type: 'services',
    description: 'Specialized structural construction'
  },
  {
    name: 'Waste Management & Cleaning',
    icon: Trees,
    slug: 'waste_cleaning',
    type: 'services',
    description: 'Construction waste removal and site cleaning'
  },
];

export default function ZintraHomepage() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [vendorProfileLink, setVendorProfileLink] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredVendors, setFeaturedVendors] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [featuredRFQs, setFeaturedRFQs] = useState([]);
  const [showSignUpDropdown, setShowSignUpDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [stats, setStats] = useState([
    { icon: Users, value: '—', label: 'Verified Vendors' },
    { icon: TrendingUp, value: '—', label: 'Active RFQs' },
    { icon: Star, value: '—', label: 'Avg Vendor Rating' },
    { icon: Clock, value: '—', label: 'Avg Response Time' }
  ]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Refs for menu management
  const userMenuRef = useRef(null);
  const signUpMenuRef = useRef(null);
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('query', searchQuery);
    if (selectedCategory && selectedCategory !== 'All Categories') params.set('category', selectedCategory);
    if (selectedCounty) params.set('county', selectedCounty);
    if (selectedTown) params.set('location', selectedTown);
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
          setCurrentUser(null);
          setVendorProfileLink('');
          return;
        }

        // Set current user
        setCurrentUser(user);

      // Check if user is a vendor
        try {
          const { data: vendor, error } = await Promise.race([
            supabase
              .from('vendors')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Vendor query timeout')), 5000)
            )
          ]);

          if (error && error.status !== 406) {
            // Only log non-406 errors as 406 might be RLS related
            console.warn('Warning fetching vendor:', error.message);
          }

          if (vendor?.id) {
            console.log('Vendor found, setting profile link:', vendor.id);
            setVendorProfileLink(`/vendor-profile/${vendor.id}`);
          } else {
            console.log('No vendor found for user:', user.id);
            setVendorProfileLink('');
          }
        } catch (vendorErr) {
          console.warn('Error in vendor check:', vendorErr.message);
          setVendorProfileLink('');
        }
      } catch (err) {
        console.error('Error in fetchVendorProfile:', err);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        // Fetch vendor profile when user authenticates
        fetchVendorProfile();
      } else {
        setCurrentUser(null);
        setVendorProfileLink('');
      }
    });

    if (currentUser) {
      fetchVendorProfile();
    }

    const fetchData = async () => {
      // Use comprehensive construction categories
      setCategories([
        { name: 'All Categories' },
        ...ALL_CATEGORIES_FLAT.map((cat) => ({
          name: cat.label,
          slug: cat.value,
        })),
      ]);

      // Featured vendors - fetch all, prioritize those with images, then sort by rating
      const { data: allVendors, error: vendorError } = await supabase
        .from('vendors')
        .select('*');
      
      if (vendorError) {
        console.error('Error fetching vendors:', vendorError);
        setFeaturedVendors([]);
      } else if (allVendors && allVendors.length > 0) {
        console.log('Fetched total vendors:', allVendors.length);
        
        // Separate vendors with images and without
        const vendorsWithImages = allVendors.filter(v => v.logo_url || v.business_logo || v.cover_image);
        const vendorsWithoutImages = allVendors.filter(v => !v.logo_url && !v.business_logo && !v.cover_image);
        
        // Sort each group by rating (descending)
        const sortByRating = (a, b) => (b.rating || 0) - (a.rating || 0);
        vendorsWithImages.sort(sortByRating);
        vendorsWithoutImages.sort(sortByRating);
        
        // Combine: with images first, then without
        const sortedVendors = [...vendorsWithImages, ...vendorsWithoutImages].slice(0, 6);
        
        console.log('Featured vendors (prioritized with images):', sortedVendors.length);
        setFeaturedVendors(sortedVendors);
      } else {
        console.warn('No vendors found');
        setFeaturedVendors([]);
      }

      // Products teaser
      const { data: products } = await supabase
        .from('vendor_products')
        .select('id, name, price, image_url, vendor_id')
        .order('created_at', { ascending: false })
        .limit(4);
      if (products) setTopProducts(products);

      // Featured RFQs - fetch active public RFQs
      try {
        const { data: rfqs, error: rfqError } = await supabase
          .from('rfqs')
          .select('id, title, description, category, budget_range, location, county, deadline, status, created_at')
          .eq('rfq_type', 'public')
          .eq('visibility', 'public')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(6);
        
        if (rfqError) {
          console.error('Error fetching RFQs:', rfqError);
          setFeaturedRFQs([]);
        } else if (rfqs && rfqs.length > 0) {
          console.log('Fetched RFQs:', rfqs.length);
          setFeaturedRFQs(rfqs);
        } else {
          console.warn('No public RFQs found');
          setFeaturedRFQs([]);
        }
      } catch (rfqErr) {
        console.error('Error in RFQ fetch:', rfqErr);
        setFeaturedRFQs([]);
      }

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
    };
    
    fetchVendorProfile();
    fetchData();

    return () => subscription?.unsubscribe();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (signUpMenuRef.current && !signUpMenuRef.current.contains(event.target)) {
        setShowSignUpDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
              {currentUser ? (
                // User is logged in - show profile options
                <div className="flex items-center space-x-4">
                  {vendorProfileLink ? (
                    // User is a vendor
                    <Link href={vendorProfileLink}>
                      <button className="text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm" style={{ backgroundColor: '#ca8637' }}>
                        My Profile
                      </button>
                    </Link>
                  ) : (
                    // User is not a vendor - show dashboard
                    <Link href="/user-dashboard">
                      <button className="text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm" style={{ backgroundColor: '#ca8637' }}>
                        Dashboard
                      </button>
                    </Link>
                  )}
                  
                  {/* User menu dropdown */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="text-gray-700 hover:text-gray-900 font-medium transition-colors border border-gray-300 px-4 py-2 rounded-lg"
                    >
                      Menu ▼
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <Link href="/my-profile">
                          <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-200">
                            My Profile
                          </button>
                        </Link>
                        <Link href="/user-messages">
                          <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-200 flex items-center justify-between">
                            <span>Messages</span>
                            {unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                        </Link>
                        <button
                          onClick={async () => {
                            await supabase.auth.signOut();
                            setCurrentUser(null);
                            setVendorProfileLink('');
                            setShowUserMenu(false);
                            router.push('/');
                          }}
                          className="w-full text-left px-4 py-2 text-red-700 hover:bg-red-50 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // User is not logged in - show login and signup
                <>
                  <Link href="/login">
                    <button className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Login</button>
                  </Link>
                  
                  {/* Sign Up Dropdown */}
                  <div className="relative" ref={signUpMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowSignUpDropdown(!showSignUpDropdown)}
                      className="text-white px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm"
                      style={{ backgroundColor: '#ca8637' }}
                    >
                      Sign Up
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showSignUpDropdown && (
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        {/* User Registration Option */}
                        <button
                          type="button"
                          onClick={() => {
                            router.push('/user-registration');
                            setShowSignUpDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-200 transition-colors"
                        >
                          <div className="font-semibold text-gray-900 mb-1">👤 User Sign Up</div>
                          <div className="text-sm text-gray-600">
                            Create an account to find and request quotes from verified contractors
                          </div>
                        </button>
                        
                        {/* Vendor Registration Option */}
                        <button
                          type="button"
                          onClick={() => {
                            router.push('/vendor-registration');
                            setShowSignUpDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors"
                        >
                          <div className="font-semibold text-gray-900 mb-1">🏢 Vendor Registration</div>
                          <div className="text-sm text-gray-600">
                            Register your construction business to receive RFQs and grow your client base
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
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

      <section className="bg-white py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop: Single Row Layout */}
          <div className="hidden md:flex gap-3 items-center">
            {/* Search Bar - Takes 40% */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors, materials, or services..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  performLiveSearch(e.target.value);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all"
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

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white transition-all text-sm"
            >
              <option>All Categories</option>
              {categories.map((category) => (
                <option key={category.name}>{category.name}</option>
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

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="text-white px-6 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              style={{ backgroundColor: '#ca8637' }}
            >
              Search
            </button>
          </div>

          {/* Mobile Filters */}
          <div className="md:hidden flex flex-col gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  performLiveSearch(e.target.value);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-500 transition-all"
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

            <div className="grid grid-cols-2 gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white transition-all text-sm"
              >
                <option>Categories</option>
                {categories.map((category) => (
                  <option key={category.name}>{category.name}</option>
                ))}
              </select>

              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white transition-all text-sm"
              >
                <option value="">Counties</option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={selectedTown}
              onChange={(e) => setSelectedTown(e.target.value)}
              disabled={!selectedCounty}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white transition-all text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Locations</option>
              {selectedCounty && KENYA_TOWNS_BY_COUNTY[selectedCounty]?.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              onClick={handleSearch}
              className="text-white px-4 py-2.5 rounded-lg font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg w-full"
              style={{ backgroundColor: '#ca8637' }}
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 1: CATEGORIES */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold" style={{ color: '#535554' }}>Categories</h2>
            <Link href="/browse">
              <button className="font-semibold flex items-center hover:opacity-80 transition-opacity" style={{ color: '#ca8637' }}>
                View More <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORY_CARDS.slice(0, 6).map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Link key={index} href={`/browse?category=${encodeURIComponent(category.name)}`}>
                  <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all cursor-pointer group h-full flex flex-col">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform mb-3" style={{ backgroundColor: '#ca863720' }}>
                      <IconComponent className="w-5 h-5" style={{ color: '#ca8637' }} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{category.name}</h3>
                    <p className="text-gray-600 text-xs leading-relaxed flex-grow line-clamp-2">{category.description}</p>
                    <div className="mt-3 flex items-center text-xs font-medium group-hover:translate-x-1 transition-transform" style={{ color: '#ca8637' }}>
                      Browse <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2: FEATURED VENDORS */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold" style={{ color: '#535554' }}>Featured Vendors</h2>
            <Link href="/browse">
              <button className="font-semibold flex items-center hover:opacity-80 transition-opacity" style={{ color: '#ca8637' }}>
                View More <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredVendors.length > 0 ? (
              featuredVendors.map((vendor) => (
                <div key={vendor.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all flex flex-col">
                  <div className="relative h-24 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center overflow-hidden">
                    {vendor.logo_url ? (
                      <img src={vendor.logo_url} alt={vendor.company_name} className="w-full h-full object-contain p-3" />
                    ) : (
                      <Building2 className="w-8 h-8 text-gray-300" />
                    )}
                    {vendor.is_verified && (
                      <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex-grow flex flex-col">
                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{vendor.company_name || 'Vendor'}</h3>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">{vendor.category || '—'}</p>
                    <div className="flex items-center justify-between text-xs mb-3 flex-grow">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="font-bold text-gray-900 ml-1">{vendor.rating?.toFixed(1) || '—'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-3 h-3 mr-0.5" />
                        <span className="text-xs">{vendor.county || 'Location'}</span>
                      </div>
                    </div>
                    <Link href={`/vendor-profile/${vendor.id}`}>
                      <button className="w-full text-white py-2 rounded-lg font-semibold text-xs hover:opacity-90 transition-all" style={{ backgroundColor: '#ca8637' }}>
                        Profile
                      </button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500 font-medium">No vendors available yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURED RFQs */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold" style={{ color: '#535554' }}>Featured RFQs</h2>
            <Link href="/post-rfq">
              <button className="font-semibold flex items-center hover:opacity-80 transition-opacity" style={{ color: '#ca8637' }}>
                View More <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredRFQs.length > 0 ? (
              featuredRFQs.map((rfq) => (
                <Link key={rfq.id} href={`/rfq/${rfq.id}`}>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:border-orange-300 hover:shadow-lg transition-all p-4 flex flex-col cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{rfq.title}</h3>
                        <p className="text-xs text-gray-600 line-clamp-1">{rfq.description}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium ml-2 flex-shrink-0 whitespace-nowrap">Open</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div>
                        <p className="text-gray-500 font-semibold text-xs">Budget</p>
                        <p className="font-bold text-gray-900 text-xs">{rfq.budget_range || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-semibold text-xs">Location</p>
                        <p className="font-bold text-gray-900 text-xs">{rfq.county || 'Not specified'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500 font-semibold text-xs">Category</p>
                        <p className="font-bold text-gray-900 text-xs line-clamp-1">{rfq.category || 'General'}</p>
                      </div>
                    </div>
                    
                    <button className="w-full text-white py-2 rounded-lg font-semibold text-xs hover:opacity-90 transition-all mt-auto" style={{ backgroundColor: '#ca8637' }}>
                      View & Quote
                    </button>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No active RFQs at the moment</p>
                <p className="text-gray-400 text-sm mt-1">Check back soon or post your own RFQ</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURED GIGS/JOBS */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold" style={{ color: '#535554' }}>Featured Gigs & Jobs</h2>
            <Link href="/careers/gigs">
              <button className="font-semibold flex items-center hover:opacity-80 transition-opacity" style={{ color: '#ca8637' }}>
                View More <ArrowRight className="w-5 h-5 ml-1" />
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Test data for Gigs */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`test-gig-${i}`} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-lg transition-all p-4 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5" style={{ color: '#ca8637' }} />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Gig</span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2">Job Title {i + 1}</h3>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">Short term opportunity at a great company</p>
                <div className="mb-3 flex-grow">
                  <p className="text-xs text-gray-500 mb-1"><strong>Pay:</strong> KES {2000 * (i + 1)} - {3000 * (i + 1)}</p>
                  <p className="text-xs text-gray-500"><strong>Location:</strong> Nairobi</p>
                  <p className="text-xs text-gray-500"><strong>Duration:</strong> 1-2 weeks</p>
                </div>
                <button className="w-full text-white py-2 rounded-lg font-semibold text-xs hover:opacity-90 transition-all" style={{ backgroundColor: '#ca8637' }}>
                  Apply Now
                </button>
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
                <li><Link href="/careers" className="hover:text-white transition-colors">Career Centre</Link></li>
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
