'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
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
import DirectRFQPopup from '@/components/DirectRFQPopup';
import ProductUploadModal from '@/components/vendor-profile/ProductUploadModal';
import ServiceUploadModal from '@/components/vendor-profile/ServiceUploadModal';
import BusinessHoursEditor from '@/components/vendor-profile/BusinessHoursEditor';
import LocationManager from '@/components/vendor-profile/LocationManager';
import CertificationManager from '@/components/vendor-profile/CertificationManager';
import HighlightsManager from '@/components/vendor-profile/HighlightsManager';
import SubscriptionPanel from '@/components/vendor-profile/SubscriptionPanel';
import ReviewResponses from '@/components/vendor-profile/ReviewResponses';
import StatusUpdateModal from '@/components/vendor-profile/StatusUpdateModal';
import StatusUpdateCard from '@/components/vendor-profile/StatusUpdateCard';
import RFQInboxTab from '@/components/vendor-profile/RFQInboxTab';

export default function VendorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id;
  const fileInputRef = useRef(null);

  // Essential state for public profile view
  const [vendor, setVendor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('overview');

  // Modal visibility states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showHoursEditor, setShowHoursEditor] = useState(false);
  const [showLocationManager, setShowLocationManager] = useState(false);
  const [showCertManager, setShowCertManager] = useState(false);
  const [showHighlightsManager, setShowHighlightsManager] = useState(false);
  const [showDirectRFQ, setShowDirectRFQ] = useState(false);
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
  const [likeLoading, setLikeLoading] = useState(false);

  // Data needed for rendering
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);

  // Fetch vendor and related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user || null);

        // Fetch vendor
        console.log('🔹 Fetching vendor with ID:', vendorId);
        const { data: vendorData, error: fetchError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .single();

        if (fetchError || !vendorData) {
          console.error('Vendor fetch error:', fetchError?.message || 'No data');
          setError('Vendor not found. The vendor may have been deleted or the ID is incorrect.');
          setLoading(false);
          return;
        }

        setVendor(vendorData);

        // Fetch products
        const { data: productData } = await supabase
          .from('vendor_products')
          .select('*')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });
        if (productData) setProducts(productData);

        // Fetch services
        const { data: serviceData } = await supabase
          .from('vendor_services')
          .select('*')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });
        if (serviceData) setServices(serviceData);
        else setServices([]);

        // Fetch reviews
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });
        setReviews(reviewData || []);

        // Fetch subscription if user owns this vendor
        if (user) {
          const { data: activeSub } = await supabase
            .from('vendor_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

          if (activeSub) {
            setSubscription(activeSub);
            if (activeSub.end_date) {
              const endDate = new Date(activeSub.end_date);
              const today = new Date();
              const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
              setDaysRemaining(Math.max(0, daysLeft));
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading vendor profile:', err);
        setError('Error loading vendor profile');
        setLoading(false);
      }
    };

    if (vendorId) fetchData();
  }, [vendorId]);

  const canEdit =
    !!currentUser &&
    (!!vendor?.user_id ? vendor.user_id === currentUser.id : vendor?.email === currentUser.email);

  // Fetch RFQ Inbox data for vendor
  useEffect(() => {
    const fetchRFQData = async () => {
      if (!canEdit || !vendor?.id) return;
      
      try {
        setRfqLoading(true);
        const { data: rfqs, error } = await supabase
          .from('vendor_rfq_inbox')
          .select('*')
          .eq('vendor_id', vendor.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching RFQ data:', error);
          return;
        }

        setRfqInboxData(rfqs || []);

        // Calculate stats
        const total = rfqs?.length || 0;
        const unread = rfqs?.filter((r) => r.viewed_at === null).length || 0;
        const pending = rfqs?.filter((r) => r.status === 'pending').length || 0;
        const with_quotes = rfqs?.filter((r) => r.quote_count > 0).length || 0;

        setRfqStats({ total, unread, pending, with_quotes });
      } catch (err) {
        console.error('Error loading RFQ data:', err);
      } finally {
        setRfqLoading(false);
      }
    };

    const interval = setInterval(fetchRFQData, 30000); // Refresh every 30 seconds
    fetchRFQData();

    return () => clearInterval(interval);
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

  // Handle profile like/unlike
  const handleLikeProfile = async () => {
    if (!vendor?.id || !currentUser?.id) {
      console.warn('Cannot like: vendor.id=', vendor?.id, 'currentUser.id=', currentUser?.id);
      return;
    }

    if (canEdit) {
      console.warn('Cannot like your own profile');
      return;
    }

    try {
      setLikeLoading(true);
      console.log('🔹 Toggling like for vendor:', vendor.id, 'user:', currentUser.id, 'currently liked:', userLiked);

      if (userLiked) {
        // Unlike
        console.log('→ Attempting to unlike...');
        const { data, error } = await supabase
          .from('vendor_profile_likes')
          .delete()
          .eq('vendor_id', vendor.id)
          .eq('user_id', currentUser.id)
          .select();

        if (error) {
          console.error('❌ Unlike error:', error);
          throw error;
        }

        console.log('✅ Unlike successful, deleted:', data);
        setUserLiked(false);
        setProfileStats((prev) => ({
          ...prev,
          likes_count: Math.max(0, prev.likes_count - 1),
        }));
      } else {
        // Like
        console.log('→ Attempting to like...');
        const { data, error } = await supabase
          .from('vendor_profile_likes')
          .insert({
            vendor_id: vendor.id,
            user_id: currentUser.id,
          })
          .select();

        if (error) {
          console.error('❌ Like error:', error);
          throw error;
        }

        console.log('✅ Like successful, inserted:', data);
        setUserLiked(true);
        setProfileStats((prev) => ({
          ...prev,
          likes_count: prev.likes_count + 1,
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
    return (total / reviews.length).toFixed(1);
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
                <img src="/zintra-svg-logo.svg" alt="Zintra" className="h-8 w-auto" />
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
              <button
                onClick={() => setShowDirectRFQ(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 font-semibold hover:bg-amber-100"
              >
                <MessageSquare className="w-5 h-5" /> Contact Vendor
              </button>
              <button
                onClick={() => setShowDirectRFQ(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50"
              >
                Request Quote
              </button>
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
          {['overview', 'products', 'services', 'reviews', ...(canEdit ? ['updates', 'rfqs'] : [])].map((tab) => (
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
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
              {/* About Section */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900">About {vendor.company_name}</h3>
              {canEdit && (
                <button
                  onClick={() => setShowProductModal(true)}
                  className="text-sm font-semibold text-amber-700 hover:text-amber-800"
                >
                  Edit
                </button>
              )}
            </div>
            <p className="text-slate-700 leading-relaxed">
              {vendor.description || 'No description yet. Add your story and expertise here to win buyer trust.'}
            </p>
          </section>

          {/* Status Updates Box in Overview */}
          {canEdit && (
            <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Business Updates</h3>
                  <p className="text-sm text-slate-600">Keep your customers informed</p>
                </div>
                <button
                  onClick={() => setShowStatusUpdateModal(true)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition"
                >
                  + Share Update
                </button>
              </div>
              {statusUpdates.length > 0 && (
                <div className="space-y-3">
                  {statusUpdates.slice(0, 2).map((update) => (
                    <div key={update.id} className="bg-white rounded-lg p-3 border border-amber-100">
                      <p className="text-sm text-slate-700 line-clamp-2">{update.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>❤️ {update.likes_count || 0} likes</span>
                        <span>{new Date(update.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {statusUpdates.length > 2 && (
                    <p className="text-sm text-slate-600 text-center py-2">+ {statusUpdates.length - 2} more updates</p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Featured Products Preview in Overview */}
          {products.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Featured Products</h3>
                <p className="text-sm text-slate-600">Browse our most popular offerings</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {products.slice(0, 4).map((product) => (
                  <div key={product.id} className="rounded-lg border border-slate-200 hover:border-amber-200 transition overflow-hidden">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="aspect-[4/3] object-cover w-full"
                      />
                    )}
                    <div className="p-3">
                      <h4 className="font-semibold text-slate-900 text-sm truncate">{product.name}</h4>
                      <p className="text-sm text-slate-600 mb-2">{product.price}</p>
                      <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
                        {product.status || 'In Stock'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {products.length > 4 && (
                <p className="text-sm text-slate-500 mt-3">+ {products.length - 4} more products</p>
              )}
            </section>
          )}

          {/* Featured Services Preview in Overview */}
          {services.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Services We Offer</h3>
                <p className="text-sm text-slate-600">Our professional service offerings</p>
              </div>
              <div className="space-y-3">
                {services.slice(0, 4).map((service) => (
                  <div key={service.id} className="flex gap-3 p-3 rounded-lg border border-slate-200 hover:border-amber-200 transition">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      ✓
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-sm font-semibold">{service.name}</p>
                      {service.description && (
                        <p className="text-slate-600 text-sm line-clamp-2">{service.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {services.length > 4 && (
                <p className="text-sm text-slate-500 mt-3">+ {services.length - 4} more services</p>
              )}
            </section>
          )}
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
          {/* Reviews Section */}
          {reviews.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Reviews ({reviews.length})</h3>
                {canEdit && (
                  <button
                    onClick={() => setShowReviewResponses(true)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                  >
                    Respond
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-slate-200 pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{review.reviewer_name || 'Anonymous'}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < (review.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-700 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
              </>
            )}

            {/* Status Updates Tab */}
            {activeTab === 'updates' && canEdit && (
              <>
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Business Updates</h3>
                  <button
                    onClick={() => setShowStatusUpdateModal(true)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700"
                  >
                    Share Update
                  </button>
                </div>
                <p className="text-sm text-slate-600 mb-6">
                  Post updates about your business, special offers, achievements, and news to keep your customers informed.
                </p>
              </section>

              {statusUpdates.length > 0 ? (
                <div className="space-y-4">
                  {statusUpdates.map((update) => (
                    <StatusUpdateCard
                      key={update.id}
                      update={update}
                      vendor={vendor}
                      currentUser={currentUser}
                      onDelete={(id) => setStatusUpdates(statusUpdates.filter((u) => u.id !== id))}
                    />
                  ))}
                </div>
              ) : (
                <section className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <p className="text-slate-600 mb-2">No updates yet</p>
                  <p className="text-sm text-slate-500">Share your first business update to engage with customers</p>
                </section>
              )}
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
            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5 shadow-sm sticky top-20">
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
          products={products}
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
            setStatusUpdates([newUpdate, ...statusUpdates]);
            setShowStatusUpdateModal(false);
          }}
        />
      )}

      {/* Direct RFQ Popup */}
      {showDirectRFQ && (
        <DirectRFQPopup
          vendor={vendor}
          onClose={() => setShowDirectRFQ(false)}
        />
      )}
    </div>
  );
}
