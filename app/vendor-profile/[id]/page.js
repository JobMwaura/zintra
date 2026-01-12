'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Bookmark,
  Star,
  Clock,
  CheckCircle,
  Award,
  ShieldCheck,
  LogOut,
  User,
  Bell,
  Heart,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import RFQModal from '@/components/RFQModal/RFQModal';
import VendorMessagingModal from '@/components/VendorMessagingModal';
import ProductUploadModal from '@/components/vendor-profile/ProductUploadModal';
import ServiceUploadModal from '@/components/vendor-profile/ServiceUploadModal';
import BusinessHoursEditor from '@/components/vendor-profile/BusinessHoursEditor';
import LocationManager from '@/components/vendor-profile/LocationManager';
import CertificationManager from '@/components/vendor-profile/CertificationManager';
import HighlightsManager from '@/components/vendor-profile/HighlightsManager';
import CategoryManagement from '@/components/vendor-profile/CategoryManagement';
import SubscriptionPanel from '@/components/vendor-profile/SubscriptionPanel';
import ReviewResponses from '@/components/vendor-profile/ReviewResponses';
import StatusUpdateModal from '@/components/vendor-profile/StatusUpdateModal';
import StatusUpdateCard from '@/components/vendor-profile/StatusUpdateCard';
import RFQInboxTab from '@/components/vendor-profile/RFQInboxTab';
import ReviewRatingSystem from '@/components/vendor-profile/ReviewRatingSystem';
import ReviewsList from '@/components/vendor-profile/ReviewsList';
import CategoryBadges from '@/components/VendorCard/CategoryBadges';
import AddProjectModal from '@/components/vendor-profile/AddProjectModal';
import PortfolioProjectCard from '@/components/vendor-profile/PortfolioProjectCard';
import PortfolioProjectModal from '@/components/vendor-profile/PortfolioProjectModal';
import EditPortfolioProjectModal from '@/components/vendor-profile/EditPortfolioProjectModal';
import PortfolioEmptyState from '@/components/vendor-profile/PortfolioEmptyState';
import EditAboutModal from '@/components/vendor-profile/EditAboutModal';

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const supabase = createClient();
  const vendorId = params.id;
  const fileInputRef = useRef(null);

  // Essential state for public profile view
  const [vendor, setVendor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('updates');

  // Modal visibility states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHoursEditor, setShowHoursEditor] = useState(false);
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [showCertManager, setShowCertManager] = useState(false);
  const [showHighlightsManager, setShowHighlightsManager] = useState(false);
  const [showDirectRFQ, setShowDirectRFQ] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [showReviewResponses, setShowReviewResponses] = useState(false);
  const [showSubscriptionPanel, setShowSubscriptionPanel] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
  const [statusUpdates, setStatusUpdates] = useState([]);
  const [rfqInboxData, setRfqInboxData] = useState([]);
  const [rfqStats, setRfqStats] = useState({ total: 0, unread: 0, pending: 0, with_quotes: 0 });
  const [rfqLoading, setRfqLoading] = useState(false);
  const [profileStats, setProfileStats] = useState({ likes_count: 0, views_count: 0 });
  const [userLiked, setUserLiked] = useState(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [portfolioProjects, setPortfolioProjects] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Data needed for rendering
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);

  // Fetch vendor and related data
  useEffect(() => {
    // Don't fetch if we're still waiting for auth
    if (authLoading) {
      console.log('🔹 VendorProfile: Waiting for auth...');
      return;
    }

    const fetchData = async () => {
      try {
        let isMounted = true;
        setLoading(true);

        setCurrentUser(authUser || null);

        // Fetch vendor and all related data with timeout
        await Promise.race([
          (async () => {
            try {
              // Fetch vendor
              console.log('🔹 Fetching vendor with ID:', vendorId);
              const { data: vendorData, error: fetchError } = await supabase
                .from('vendors')
                .select('*')
                .eq('id', vendorId)
                .single();

              if (fetchError || !vendorData) {
                console.error('Vendor fetch error:', fetchError?.message || 'No data');
                if (isMounted) {
                  setError('Vendor not found. The vendor may have been deleted or the ID is incorrect.');
                }
                return;
              }

              if (isMounted) {
                setVendor(vendorData);
              }

              // Fetch products
              const { data: productData } = await supabase
                .from('vendor_products')
                .select('*')
                .eq('vendor_id', vendorId)
                .order('created_at', { ascending: false });
              if (isMounted && productData) setProducts(productData);

              // Fetch services
              const { data: serviceData } = await supabase
                .from('vendor_services')
                .select('*')
                .eq('vendor_id', vendorId)
                .order('created_at', { ascending: false });
              if (isMounted) {
                if (serviceData) setServices(serviceData);
                else setServices([]);
              }

              // Fetch reviews
              const { data: reviewData } = await supabase
                .from('reviews')
                .select('*')
                .eq('vendor_id', vendorId)
                .order('created_at', { ascending: false });
              if (isMounted) {
                setReviews(reviewData || []);
              }

              // Fetch subscription if user owns this vendor
              if (authUser) {
                const { data: activeSub } = await supabase
                  .from('vendor_subscriptions')
                  .select('*')
                  .eq('user_id', authUser.id)
                  .eq('status', 'active')
                  .maybeSingle();

                if (isMounted && activeSub) {
                  setSubscription(activeSub);
                  if (activeSub.end_date) {
                    const endDate = new Date(activeSub.end_date);
                    const today = new Date();
                    const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                    setDaysRemaining(Math.max(0, daysLeft));
                  }
                }
              }
            } catch (err) {
              console.error('Error in data fetch:', err);
              if (isMounted) {
                setError('Error loading vendor profile');
              }
            } finally {
              if (isMounted) {
                setLoading(false);
              }
            }
          })(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Vendor profile fetch timeout')), 20000)
          )
        ]);
      } catch (err) {
        console.error('Error loading vendor profile:', err);
        if (err.message === 'Vendor profile fetch timeout') {
          setError('Request timed out. Please try again.');
        } else {
          setError('Error loading vendor profile');
        }
        setLoading(false);
      }
    };

    if (vendorId) fetchData();
  }, [vendorId, authLoading, authUser]);

  const canEdit =
    !!currentUser &&
    (!!vendor?.user_id ? vendor.user_id === currentUser.id : vendor?.email === currentUser.email);

  // Fetch RFQ Inbox data for vendor
  useEffect(() => {
    // RFQ inbox feature disabled - requires get_vendor_rfq_inbox RPC function
    // This feature will be re-enabled once the RPC function is properly created in Supabase
    const fetchRFQData = async () => {
      if (!canEdit || !vendor?.id) return;
      
      try {
        setRfqLoading(true);
        // Commented out until get_vendor_rfq_inbox RPC function is created
        // const { data: rfqs, error } = await supabase.rpc('get_vendor_rfq_inbox', {
        //   p_vendor_id: vendor.id
        // });

        // Set empty data to prevent errors
        setRfqInboxData([]);
        setRfqStats({ total: 0, unread: 0, pending: 0, with_quotes: 0 });
      } catch (err) {
        console.error('Error loading RFQ data:', err);
      } finally {
        setRfqLoading(false);
      }
    };

    fetchRFQData();
    // Removed setInterval to prevent repeated connection errors
    return () => {};
  }, [vendor?.id, canEdit]);

  // Fetch profile stats and like status
  useEffect(() => {
    const fetchProfileStats = async () => {
      if (!vendor?.id) return;

      try {
        // Fetch profile stats
        const { data: stats } = await supabase
          .from('vendor_profile_stats')
          .select('likes_count, views_count')
          .eq('vendor_id', vendor.id)
          .maybeSingle();

        if (stats) {
          setProfileStats(stats);
        }

        // Check if current user liked this profile
        if (currentUser) {
          const { data: likeData } = await supabase
            .from('vendor_profile_likes')
            .select('id')
            .eq('vendor_id', vendor.id)
            .eq('user_id', currentUser.id)
            .maybeSingle();

          setUserLiked(!!likeData);
        }
      } catch (err) {
        console.error('Error fetching profile stats:', err);
      }
    };

    fetchProfileStats();
  }, [vendor?.id, currentUser?.id]);

  // Fetch portfolio projects
  useEffect(() => {
    const fetchPortfolioProjects = async () => {
      if (!vendor?.id) return;

      try {
        setPortfolioLoading(true);
        console.log('🔹 Fetching portfolio projects for vendor:', vendor.id);
        const response = await fetch(`/api/portfolio/projects?vendorId=${vendor.id}`);
        
        // Handle all responses gracefully - even 500 errors should return empty array
        const data = await response.json();
        const { projects } = data;
        
        console.log('✅ Portfolio projects fetched:', projects?.length || 0);
        setPortfolioProjects(projects || []);
      } catch (err) {
        console.error('Error fetching portfolio projects:', err);
        // Silently fail - portfolio is optional
        setPortfolioProjects([]);
      } finally {
        setPortfolioLoading(false);
      }
    };

    fetchPortfolioProjects();
  }, [vendor?.id]);

  // Fetch status updates (business updates)
  useEffect(() => {
    const fetchStatusUpdates = async () => {
      if (!vendor?.id) return;

      try {
        console.log('🔹 Fetching status updates for vendor:', vendor.id);
        const response = await fetch(`/api/status-updates?vendorId=${vendor.id}`);
        
        if (!response.ok) {
          console.error('Failed to fetch status updates:', response.status);
          setStatusUpdates([]);
          return;
        }

        const { updates } = await response.json();
        console.log('✅ Status updates fetched:', updates?.length || 0);
        console.log('📋 Update IDs:', updates?.map(u => u.id) || []);
        setStatusUpdates(prev => {
          console.log('🔹 useEffect setState - replacing with fetched updates');
          return updates || [];
        });
      } catch (err) {
        console.error('Error fetching status updates:', err);
        setStatusUpdates([]);
      }
    };

    fetchStatusUpdates();
  }, [vendor?.id]);

  // Track profile view (non-critical, errors are silently ignored)
  useEffect(() => {
    if (!vendor?.id) return;

    const trackView = async () => {
      try {
        console.log('📊 Tracking view for vendor:', vendor.id);
        const response = await fetch('/api/track-vendor-profile-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ vendorId: vendor.id }),
        });

        const data = await response.json();
        if (data.tracked) {
          console.log('✅ Profile view tracked successfully');
        } else {
          console.log('ℹ️ Profile view tracking skipped (not critical)');
        }
      } catch (err) {
        // Silently ignore tracking errors - not critical to app functionality
        console.log('ℹ️ Profile view tracking unavailable');
      }
    };

    // Track view after a short delay (user is definitely looking at the profile)
    const timer = setTimeout(trackView, 1000);

    return () => clearTimeout(timer);
  }, [vendor?.id]);

  // Handle profile like/unlike
  const handleLikeProfile = async () => {
    if (!vendor?.id || !currentUser?.id) {
      console.warn('Cannot like: vendor.id=', vendor?.id, 'currentUser.id=', currentUser?.id);
      alert('Please log in to like vendors');
      return;
    }

    if (canEdit) {
      console.warn('Cannot like your own profile');
      return;
    }

    try {
      setLikeLoading(true);
      console.log('🔹 Toggling like for vendor:', vendor.id, 'user:', currentUser.id, 'currently liked:', userLiked);

      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session. Please log in again.');
      }

      const action = userLiked ? 'unlike' : 'like';
      console.log('→ Attempting to', action, '...');

      const response = await fetch('/api/vendor/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          action: action,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(`❌ ${action} error:`, result.error);
        throw new Error(result.error || `Failed to ${action} vendor`);
      }

      console.log(`✅ ${action} successful:`, result.data);

      if (action === 'like') {
        setUserLiked(true);
        setProfileStats((prev) => ({
          ...prev,
          likes_count: prev.likes_count + 1,
        }));
      } else {
        setUserLiked(false);
        setProfileStats((prev) => ({
          ...prev,
          likes_count: Math.max(0, prev.likes_count - 1),
        }));
      }
    } catch (err) {
      console.error('❌ Error toggling profile like:', err);
      alert(`Error: ${err.message || 'Failed to update like'}`);
    } finally {
      setLikeLoading(false);
    }
  };

  const initials = useMemo(() => {
    if (!vendor?.company_name) return 'VN';
    return vendor.company_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }, [vendor?.company_name]);

  const categories = vendor?.category
    ? vendor.category.split(',').map((c) => c.trim()).filter(Boolean)
    : [];

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return total / reviews.length;  // Return as number, not string
  }, [reviews]);

  const handleLogoUpload = async (event) => {
    if (!vendor?.id) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `logos/${vendor.id}/vendor-${vendor.id}-${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('vendor-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('vendor-assets').getPublicUrl(data.path);
      const publicUrl = urlData?.publicUrl;

      if (publicUrl) {
        await supabase.from('vendors').update({ logo_url: publicUrl }).eq('id', vendor.id);
        setVendor((prev) => ({ ...prev, logo_url: publicUrl }));
      }
    } catch (err) {
      console.error('Logo upload failed:', err);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Vendor not found'}</p>
          <a href="/browse" className="text-amber-700 hover:underline font-semibold">
            Back to browse vendors
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      {canEdit && (
        <nav className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center">
                <img src="/zintrass-new-logo.png" alt="Zintra" className="h-8 w-auto" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xl font-bold overflow-hidden">
                  {vendor?.logo_url ? (
                    <img src={vendor.logo_url} alt={vendor.company_name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 bg-white/90 text-slate-700 text-xs px-2 py-1 rounded shadow hover:bg-white"
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? '...' : 'Change'}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-900">{vendor.company_name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" /> Verified
                  </span>
                </div>
                
                {/* Phase 3: Category Badges */}
                {(vendor.primaryCategorySlug || vendor.secondaryCategories?.length > 0) && (
                  <div className="mt-2 mb-3">
                    <CategoryBadges 
                      primaryCategorySlug={vendor.primaryCategorySlug}
                      secondaryCategories={vendor.secondaryCategories || []}
                      size="sm"
                      showLabel={false}
                      maxVisible={5}
                    />
                  </div>
                )}
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700 mt-1">
                  {vendor.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {vendor.location}
                      {vendor.county ? `, ${vendor.county}` : ''}
                    </span>
                  )}
                  {vendor.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {vendor.phone}
                    </span>
                  )}
                  {vendor.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {vendor.email}
                    </span>
                  )}
                  {vendor.website && (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-amber-700 font-semibold hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Show Inbox & Quotes buttons when vendor is logged into their own profile */}
              {canEdit ? (
                <>
                  <Link
                    href="/vendor-messages"
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-semibold hover:bg-amber-700 transition"
                  >
                    <MessageSquare className="w-5 h-5" /> Inbox
                  </Link>
                  <Link
                    href="/vendor-quotes"
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 font-semibold hover:bg-amber-100 transition"
                  >
                    📋 Quotes
                  </Link>
                </>
              ) : (
                <>
                  {/* Show Contact & Request Quote buttons when viewing other vendors */}
                  <button
                    onClick={() => setShowMessaging(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 font-semibold hover:bg-amber-100"
                  >
                    <MessageSquare className="w-5 h-5" /> Contact Vendor
                  </button>
                  <button
                    onClick={() => router.push(`/post-rfq/vendor-request?vendorId=${vendor.id}`)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50"
                  >
                    Request Quote
                  </button>
                </>
              )}
              
              {/* Like button - only for non-vendors or when viewing other vendors */}
              {currentUser && !canEdit && (
                <button
                  onClick={handleLikeProfile}
                  disabled={likeLoading}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-semibold transition ${
                    userLiked
                      ? 'border-red-500 text-red-700 bg-red-50 hover:bg-red-100'
                      : 'border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={likeLoading ? 'Updating...' : userLiked ? 'Unlike this profile' : 'Like this profile'}
                >
                  <Heart
                    className={`w-5 h-5 ${userLiked ? 'fill-current' : ''}`}
                  />
                  <span>{profileStats.likes_count}</span>
                </button>
              )}
              {!currentUser && (
                <button
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50"
                >
                  <Heart className="w-5 h-5" />
                  <span>{profileStats.likes_count}</span>
                </button>
              )}
              
              {/* Save button - only for non-vendors or when viewing other vendors */}
              {!canEdit && (
                <button
                  onClick={() => setSaved((s) => !s)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-semibold ${
                    saved
                      ? 'border-amber-500 text-amber-700 bg-amber-50'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                  Save
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              {averageRating || '4.9'} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </div>
            <span className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
              {profileStats.likes_count} {profileStats.likes_count === 1 ? 'like' : 'likes'}
            </div>
            <span className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1">
              👁️ {profileStats.views_count} {profileStats.views_count === 1 ? 'view' : 'views'}
            </div>
            <span className="w-px h-4 bg-slate-200" />
            <span className="capitalize">Plan: {vendor.plan || 'Free'}</span>
            <span className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-500" /> {vendor.response_time || '24 hrs'} response time
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto pb-2">
          {['updates', 'portfolio', 'products', 'services', 'reviews', ...(canEdit ? ['categories', 'rfqs'] : [])].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold text-sm border-b-2 transition whitespace-nowrap ${
                activeTab === tab
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'updates'
                ? 'Updates'
                : tab === 'rfqs'
                ? 'RFQ Inbox'
                : tab === 'categories'
                ? 'Categories'
                : tab === 'portfolio'
                ? 'Portfolio'
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <>
                {portfolioLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-3"></div>
                      <p className="text-slate-600">Loading portfolio projects...</p>
                    </div>
                  </div>
                ) : portfolioProjects.length > 0 ? (
                  <div className="space-y-6">
                    {/* Portfolio Header with Add Button */}
                    <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Portfolio & Projects</h3>
                          <p className="text-sm text-slate-600">Showcase of completed projects</p>
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => setShowAddProjectModal(true)}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition"
                          >
                            + Add Project
                          </button>
                        )}
                      </div>

                      {/* Projects Grid */}
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {portfolioProjects.map((project) => (
                          <PortfolioProjectCard
                            key={project.id}
                            project={project}
                            canEdit={canEdit}
                            onView={() => {
                              setSelectedProject(project);
                              setShowProjectModal(true);
                            }}
                            onEdit={() => {
                              setSelectedProject(project);
                              setShowEditProjectModal(true);
                            }}
                            onDelete={() => {
                              if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
                                return;
                              }
                              
                              const deleteProject = async () => {
                                try {
                                  const response = await fetch(`/api/portfolio/projects/${project.id}`, {
                                    method: 'DELETE',
                                  });
                                  
                                  if (!response.ok) {
                                    const error = await response.json();
                                    throw new Error(error.message || 'Failed to delete project');
                                  }
                                  
                                  // Remove project from list
                                  setPortfolioProjects(prev => prev.filter(p => p.id !== project.id));
                                  alert('Project deleted successfully!');
                                } catch (err) {
                                  console.error('Delete error:', err);
                                  alert('Failed to delete project: ' + err.message);
                                }
                              };
                              
                              deleteProject();
                            }}
                            onShare={() => {
                              // TODO: Implement share (Phase 3)
                              const url = `${window.location.origin}/vendor-profile/${vendor.id}/portfolio/${project.id}`;
                              navigator.clipboard.writeText(url);
                              alert('Portfolio link copied to clipboard!');
                            }}
                            onRequestQuote={() => {
                              // TODO: Implement request quote modal (Phase 3)
                              console.log('Request quote for project:', project.id);
                            }}
                          />
                        ))}
                      </div>
                    </section>
                  </div>
                ) : (
                  <PortfolioEmptyState
                    canEdit={canEdit}
                    onAddProject={() => setShowAddProjectModal(true)}
                  />
                )}

                {/* Add Project Modal */}
                {canEdit && (
                  <AddProjectModal
                    vendorId={vendor?.id}
                    vendorPrimaryCategory={vendor?.primaryCategorySlug}
                    isOpen={showAddProjectModal}
                    onClose={() => setShowAddProjectModal(false)}
                    onSuccess={(newProject) => {
                      // Refresh portfolio projects
                      setPortfolioProjects((prev) => [newProject, ...prev]);
                      setShowAddProjectModal(false);
                    }}
                  />
                )}

                {/* View Project Modal */}
                <PortfolioProjectModal
                  isOpen={showProjectModal}
                  project={selectedProject}
                  onClose={() => {
                    setShowProjectModal(false);
                    setSelectedProject(null);
                  }}
                  onEdit={() => {
                    setShowProjectModal(false);
                    setShowEditProjectModal(true);
                  }}
                  onShare={() => {
                    const url = `${window.location.origin}/vendor-profile/${vendor?.id}/portfolio/${selectedProject?.id}`;
                    navigator.clipboard.writeText(url);
                    alert('Project link copied to clipboard!');
                  }}
                  onRequestQuote={() => {
                    // TODO: Implement quote request
                    console.log('Request quote for project:', selectedProject?.id);
                  }}
                />

                {/* Edit Project Modal */}
                {canEdit && (
                  <EditPortfolioProjectModal
                    isOpen={showEditProjectModal}
                    project={selectedProject}
                    onClose={() => {
                      setShowEditProjectModal(false);
                      setSelectedProject(null);
                    }}
                    onSave={async (updatedData) => {
                      // TODO: Implement save to API
                      console.log('Save project:', updatedData);
                      // For now just refresh
                      setShowEditProjectModal(false);
                      // Refresh portfolio projects
                      // await fetchPortfolioProjects();
                    }}
                    onDelete={async () => {
                      try {
                        const response = await fetch(`/api/portfolio/projects/${selectedProject?.id}`, {
                          method: 'DELETE',
                        });
                        
                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.message || 'Failed to delete project');
                        }
                        
                        // Remove project from list
                        setPortfolioProjects(prev => prev.filter(p => p.id !== selectedProject?.id));
                        setShowEditProjectModal(false);
                        setSelectedProject(null);
                        alert('Project deleted successfully!');
                      } catch (err) {
                        console.error('Delete error:', err);
                        alert('Failed to delete project: ' + err.message);
                      }
                    }}
                  />
                )}
              </>
            )}

            {/* Updates Tab */}
            {activeTab === 'updates' && (
              <>
                <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Business Updates</h3>
                      <p className="text-sm text-slate-600">Keep customers informed with latest news and updates</p>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => setShowStatusUpdateModal(true)}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition"
                      >
                        + Share Update
                      </button>
                    )}
                  </div>
                  
                  {statusUpdates.length > 0 ? (
                    <div className="space-y-4">
                      {statusUpdates.map((update) => (
                        <StatusUpdateCard
                          key={update.id}
                          update={update}
                          vendor={vendor}
                          currentUser={currentUser}
                          onDelete={(deletedId) => {
                            setStatusUpdates(prev => prev.filter(u => u.id !== deletedId));
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-600 mb-4">No updates yet. Share your first business update!</p>
                      {canEdit && (
                        <button
                          onClick={() => setShowStatusUpdateModal(true)}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition"
                        >
                          + Share Update
                        </button>
                      )}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Phase 3: Services & Expertise Tab */}
            {activeTab === 'expertise' && (
              <>
                <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Services & Expertise</h3>
                  
                  {/* Primary Category */}
                  {vendor.primaryCategorySlug && (
                    <div className="mb-6 pb-6 border-b border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Primary Specialization</h4>
                      <div>
                        <CategoryBadges 
                          primaryCategorySlug={vendor.primaryCategorySlug}
                          secondaryCategories={[]}
                          size="md"
                          showLabel={false}
                        />
                        <p className="text-sm text-slate-600 mt-3">
                          We specialize in {vendor.primaryCategorySlug.replace(/-/g, ' ')} and have extensive experience in this field.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Secondary Categories */}
                  {vendor.secondaryCategories && vendor.secondaryCategories.length > 0 && (
                    <div className="mb-6 pb-6 border-b border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Additional Services</h4>
                      <div>
                        <CategoryBadges 
                          primaryCategorySlug={null}
                          secondaryCategories={vendor.secondaryCategories}
                          size="md"
                          showLabel={false}
                        />
                        <p className="text-sm text-slate-600 mt-3">
                          We also offer expertise and services in these related areas.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Edit for vendor */}
                  {canEdit && (
                    <div className="pt-4">
                      <button
                        onClick={() => setActiveTab('categories')}
                        className="text-amber-700 hover:text-amber-800 font-semibold text-sm"
                      >
                        Manage Categories & Expertise →
                      </button>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <>
          {/* Products Section */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Featured Products</h3>
                <p className="text-sm text-slate-600">Highlight key products buyers look for.</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowProductModal(true)}
                  className="text-sm font-semibold text-amber-700 hover:text-amber-800"
                >
                  Add Product
                </button>
              )}
            </div>
            {products.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="rounded-lg border border-slate-200 hover:border-amber-200 transition p-4">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="aspect-[4/3] rounded-lg object-cover mb-3"
                      />
                    )}
                    <h4 className="font-semibold text-slate-900">{product.name}</h4>
                    <p className="text-sm text-slate-600 mb-2">{product.price}</p>
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
                      {product.status || 'In Stock'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No products yet.</p>
            )}
          </section>
              </>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <>
          {/* Services Section */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Services Offered</h3>
                <p className="text-sm text-slate-600">List what you provide beyond products.</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="text-sm font-semibold text-amber-700 hover:text-amber-800"
                >
                  Add Service
                </button>
              )}
            </div>
            {services.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {services.map((service) => (
                  <div key={service.id} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="text-slate-900 text-sm font-semibold">{service.name}</p>
                      {service.description && (
                        <p className="text-slate-600 text-sm">{service.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No services yet.</p>
            )}
          </section>
              </>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <>
              <div className="space-y-6">
                {/* Rating System - Top */}
                <ReviewRatingSystem 
                  vendor={vendor} 
                  currentUser={currentUser}
                  onReviewAdded={(newReview) => {
                    if (newReview && newReview.id) {
                      setReviews(prev => [newReview, ...prev]);
                    }
                  }}
                />

                {/* Reviews List */}
                <ReviewsList 
                  reviews={reviews}
                  averageRating={averageRating}
                />
              </div>
              </>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && canEdit && (
              <>
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Service Categories</h3>
                <CategoryManagement
                  vendorId={vendorId}
                  initialPrimary={vendor?.primary_category_slug}
                  initialSecondary={vendor?.secondary_categories || []}
                  onSave={async () => {
                    // Refresh vendor data after saving
                    const { data } = await supabase
                      .from('vendors')
                      .select('*')
                      .eq('id', vendorId)
                      .single();
                    if (data) setVendor(data);
                  }}
                />
              </section>
              </>
            )}

            {/* RFQ Inbox Tab */}
            {activeTab === 'rfqs' && canEdit && (
              <>
              <RFQInboxTab vendor={vendor} currentUser={currentUser} />
              </>
            )}
          </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* RFQ Inbox Widget - Top Right */}
          {canEdit && (
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h4 className="text-base font-semibold text-slate-900">RFQ Inbox</h4>
                  {rfqStats.unread > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {rfqStats.unread}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-blue-600">{rfqStats.total}</p>
                  <p className="text-xs text-slate-600">Total</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-red-600">{rfqStats.unread}</p>
                  <p className="text-xs text-slate-600">Unread</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-amber-600">{rfqStats.pending}</p>
                  <p className="text-xs text-slate-600">Pending</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{rfqStats.with_quotes}</p>
                  <p className="text-xs text-slate-600">With Quotes</p>
                </div>
              </div>

              {/* Recent RFQs */}
              {rfqInboxData.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {rfqInboxData.slice(0, 5).map((rfq) => (
                    <div
                      key={rfq.id}
                      className="bg-white rounded-lg p-3 border border-blue-100 hover:border-blue-300 cursor-pointer transition"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            rfq.rfq_type === 'direct'
                              ? 'bg-blue-100 text-blue-800'
                              : rfq.rfq_type === 'matched'
                              ? 'bg-purple-100 text-purple-800'
                              : rfq.rfq_type === 'wizard'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-cyan-100 text-cyan-800'
                          }`}
                        >
                          {rfq.rfq_type_label}
                        </span>
                        {rfq.viewed_at === null && (
                          <span className="inline-flex w-2 h-2 bg-red-500 rounded-full mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{rfq.title}</p>
                      <p className="text-xs text-slate-600">{rfq.category} • {rfq.county}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                        <span>💬 {rfq.quote_count}/{rfq.total_quotes} quotes</span>
                        <span>{new Date(rfq.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {rfqInboxData.length === 0 && !rfqLoading && (
                <p className="text-sm text-slate-600 text-center py-4">No RFQs yet</p>
              )}

              {rfqLoading && (
                <p className="text-sm text-slate-600 text-center py-2">Loading RFQs...</p>
              )}

              {rfqInboxData.length > 0 && (
                <button
                  onClick={() => setActiveTab('rfqs')}
                  className="w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
                >
                  View All RFQs
                </button>
              )}
            </section>
          )}

          {/* Business Information */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900 mb-3">Business Information</h4>
            <div className="space-y-3 text-sm text-slate-700">
              {categories.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <span key={cat} className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-500">Contact</p>
                {vendor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" /> {vendor.phone}
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" /> {vendor.email}
                  </div>
                )}
                {vendor.whatsapp && (
                  <div className="text-sm">WhatsApp: {vendor.whatsapp}</div>
                )}
              </div>
            </div>
          </section>

          {/* Business Locations */}
          {(vendor.locations && vendor.locations.length > 0) || vendor.location ? (
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-slate-900">Business Locations</h4>
                {canEdit && (
                  <button
                    onClick={() => setShowLocationManager(true)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Manage
                  </button>
                )}
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                {(vendor.locations || (vendor.location ? [vendor.location] : [])).filter(Boolean).map((loc, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-900">
                      {loc}
                      {vendor.county && idx === 0 ? `, ${vendor.county}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Business Hours */}
          {vendor.business_hours && (
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-slate-900">Hours</h4>
                {canEdit && (
                  <button
                    onClick={() => setShowHoursEditor(true)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="text-sm text-slate-700 space-y-1">
                {Array.isArray(vendor.business_hours) ? (
                  vendor.business_hours.map((hour, idx) => (
                    <div key={idx}>
                      {typeof hour === 'string' ? hour : `${hour.day}: ${hour.hours}`}
                    </div>
                  ))
                ) : (
                  <p>Mon - Fri: 7:00 AM - 6:00 PM</p>
                )}
              </div>
            </section>
          )}

          {/* Highlights */}
          {vendor.highlights && (
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-slate-900">Highlights</h4>
                {canEdit && (
                  <button
                    onClick={() => setShowHighlightsManager(true)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                {Array.isArray(vendor.highlights) ? (
                  vendor.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> {highlight}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> Verified business
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" /> Top performer
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Certifications */}
          {vendor.certifications && vendor.certifications.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-slate-900">Certifications</h4>
                {canEdit && (
                  <button
                    onClick={() => setShowCertManager(true)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Manage
                  </button>
                )}
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                {Array.isArray(vendor.certifications) ? (
                  vendor.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900">{cert.name || cert}</p>
                        {cert.issuer && <p className="text-xs text-slate-500">Issued by: {cert.issuer}</p>}
                        {cert.date && <p className="text-xs text-slate-500">Date: {cert.date}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">No certifications yet.</p>
                )}
              </div>
            </section>
          )}

          {/* Subscription Info */}
          {canEdit && (
            <section 
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 shadow-sm cursor-pointer hover:shadow-md transition"
              onClick={() => setShowSubscriptionPanel(true)}
            >
              <h4 className="text-base font-semibold text-slate-900 mb-3">Subscription</h4>
              {subscription ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{subscription.plan_type || 'Plan Name'}</p>
                    <p className="text-xs text-slate-600 mt-1">{subscription.price || 'KES N/A'}/month</p>
                  </div>
                  
                  {/* Days Remaining Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-blue-900">{daysRemaining} days remaining</p>
                      <p className="text-xs text-blue-700">{daysRemaining > 0 ? 'Active' : 'Expired'}</p>
                    </div>
                    <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${daysRemaining > 10 ? 'bg-green-500' : daysRemaining > 5 ? 'bg-amber-500' : 'bg-red-500'} transition-all`}
                        style={{ width: `${Math.min((daysRemaining / 30) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSubscriptionPanel(true);
                    }}
                    className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
                  >
                    Manage Subscription
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">No active subscription</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSubscriptionPanel(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition"
                  >
                    View Plans
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
      </div>

      {/* Modal Components */}
      {showProductModal && (
        <ProductUploadModal
          vendor={vendor}
          onClose={() => setShowProductModal(false)}
          onSuccess={(newProduct) => {
            setProducts([newProduct, ...products]);
            setShowProductModal(false);
          }}
        />
      )}

      {showServiceModal && (
        <ServiceUploadModal
          vendor={vendor}
          services={services}
          onClose={() => setShowServiceModal(false)}
          onSuccess={(newService) => {
            setServices([newService, ...services]);
            setShowServiceModal(false);
          }}
        />
      )}

      {showAboutModal && (
        <EditAboutModal
          vendor={vendor}
          onClose={() => setShowAboutModal(false)}
          onSuccess={(updatedVendor) => {
            setVendor(updatedVendor);
            setShowAboutModal(false);
          }}
        />
      )}

      {showHoursEditor && vendor.business_hours && (
        <BusinessHoursEditor
          vendor={vendor}
          onClose={() => setShowHoursEditor(false)}
          onSuccess={(updatedVendor) => {
            setVendor(updatedVendor);
            setShowHoursEditor(false);
          }}
        />
      )}

      {showLocationManager && (
        <LocationManager
          vendor={vendor}
          onClose={() => setShowLocationManager(false)}
          onSuccess={(updatedVendor) => {
            setVendor(updatedVendor);
            setShowLocationManager(false);
          }}
        />
      )}

      {showCertManager && (
        <CertificationManager
          vendor={vendor}
          onClose={() => setShowCertManager(false)}
          onSuccess={(updatedVendor) => {
            setVendor(updatedVendor);
            setShowCertManager(false);
          }}
        />
      )}

      {showHighlightsManager && (
        <HighlightsManager
          vendor={vendor}
          onClose={() => setShowHighlightsManager(false)}
          onSuccess={(updatedVendor) => {
            setVendor(updatedVendor);
            setShowHighlightsManager(false);
          }}
        />
      )}

      {showReviewResponses && reviews.length > 0 && (
        <ReviewResponses
          vendor={vendor}
          reviews={reviews}
          onClose={() => setShowReviewResponses(false)}
          onSuccess={() => {
            // Refresh reviews
            setShowReviewResponses(false);
          }}
        />
      )}

      {/* Subscription Panel Modal */}
      {showSubscriptionPanel && canEdit && (
        <SubscriptionPanel
          vendor={vendor}
          subscription={subscription}
          daysRemaining={daysRemaining}
          onClose={() => setShowSubscriptionPanel(false)}
        />
      )}

      {/* Status Update Modal */}
      {showStatusUpdateModal && canEdit && (
        <StatusUpdateModal
          vendor={vendor}
          onClose={() => setShowStatusUpdateModal(false)}
          onSuccess={(newUpdate) => {
            console.log('✅ onSuccess callback fired with update:', newUpdate.id);
            console.log('📊 Current statusUpdates count before adding:', statusUpdates.length);
            setStatusUpdates(prev => {
              console.log('📊 Inside setState - current updates:', prev.length);
              // Check if update already exists to prevent duplicates
              const alreadyExists = prev.some(u => u.id === newUpdate.id);
              console.log('🔍 Update already in state?', alreadyExists);
              
              if (alreadyExists) {
                console.warn('⚠️ Update already exists, not adding duplicate');
                return prev;
              }
              
              const updated = [newUpdate, ...prev];
              console.log('📊 After adding - new updates:', updated.length);
              console.log('📋 Update IDs in state:', updated.map(u => u.id));
              return updated;
            });
            setShowStatusUpdateModal(false);
          }}
        />
      )}

      {/* Direct RFQ Modal - With Category-Specific Forms */}
      {showDirectRFQ && vendor && (
        <RFQModal
          rfqType="direct"
          isOpen={showDirectRFQ}
          onClose={() => setShowDirectRFQ(false)}
          vendorCategories={[
            vendor.primaryCategorySlug,
            ...(vendor.secondaryCategories || [])
          ].filter(Boolean)}
          vendorName={vendor.company_name}
        />
      )}

      {/* Vendor Messaging Modal */}
      {showMessaging && vendor && currentUser && (
        <VendorMessagingModal
          vendorId={vendor.id}
          vendorName={vendor.company_name}
          userId={currentUser.id}
          onClose={() => setShowMessaging(false)}
        />
      )}
    </div>
  );
}
