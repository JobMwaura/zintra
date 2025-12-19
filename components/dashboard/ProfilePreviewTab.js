'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export default function ProfilePreviewTab() {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      setLoading(true);

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const { data: vendorData, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching vendor:', error);
        setLoading(false);
        return;
      }

      if (vendorData) {
        setVendor(vendorData);

        // Fetch products
        const { data: productData } = await supabase
          .from('vendor_products')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false });
        if (productData) setProducts(productData);

        // Fetch services
        const { data: serviceData } = await supabase
          .from('vendor_services')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false });
        if (serviceData) setServices(serviceData);

        // Fetch reviews
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false });
        setReviews(reviewData || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in fetchVendorData:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile preview...</p>
        </div>
      </div>
    );
  }

  // Calculate derived values BEFORE conditional returns
  let initials = 'V';
  let categories = [];
  let averageRating = null;

  if (vendor) {
    initials = (vendor.company_name || 'V')
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    if (vendor.categories) {
      if (Array.isArray(vendor.categories)) {
        categories = vendor.categories;
      } else if (typeof vendor.categories === 'string') {
        categories = vendor.categories.split(',').map((c) => c.trim());
      }
    }

    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      averageRating = (sum / reviews.length).toFixed(1);
    }
  }

  if (!vendor) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <p className="text-blue-900 mb-4">
          <strong>No profile yet!</strong> Go to "My Profile" and fill in your details to see your preview here.
        </p>
        <p className="text-sm text-blue-700">
          Once you save your profile information, it will appear here exactly as customers see it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0 bg-slate-50 -m-6 p-0">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
                  {vendor?.logo_url ? (
                    <img src={vendor.logo_url} alt={vendor.company_name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
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
              <button className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 font-semibold hover:bg-amber-100">
                <MessageSquare className="w-5 h-5" /> Contact
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-slate-700 font-semibold hover:border-slate-300">
                Request Quote
              </button>
              <button
                onClick={() => setSaved((s) => !s)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-semibold ${
                  saved
                    ? 'border-amber-500 text-amber-700 bg-amber-50'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              {averageRating || '4.9'} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
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
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 px-0 py-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* About Section */}
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">About {vendor.company_name}</h3>
            <p className="text-slate-700 leading-relaxed">
              {vendor.description || 'No description yet. Add your story and expertise here to win buyer trust.'}
            </p>
          </section>

          {/* Products Section */}
          {products.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Featured Products</h3>
                <p className="text-sm text-slate-600">Highlight key products buyers look for.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {products.slice(0, 4).map((product) => (
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
            </section>
          )}

          {/* Services Section */}
          {services.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Services Offered</h3>
                <p className="text-sm text-slate-600">List what you provide beyond products.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {services.slice(0, 4).map((service) => (
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
            </section>
          )}

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Reviews ({reviews.length})</h3>
              </div>
              <div className="space-y-4">
                {reviews.slice(0, 3).map((review) => (
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
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
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

          {/* Business Hours */}
          {vendor.business_hours && (
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-base font-semibold text-slate-900 mb-3">Hours</h4>
              <div className="space-y-2 text-sm">
                {Object.entries(vendor.business_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-slate-700">
                    <span className="capitalize font-medium">{day}:</span>
                    <span>{hours || 'Closed'}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Highlights */}
          {vendor.highlights && vendor.highlights.length > 0 && (
            <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-base font-semibold text-slate-900 mb-3">Highlights</h4>
              <ul className="space-y-2">
                {vendor.highlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 border-t border-blue-200 p-4 flex gap-3">
        <div className="flex-shrink-0 text-blue-600 font-bold">ℹ️</div>
        <div>
          <p className="text-sm text-blue-900">
            <strong>This is your live profile preview!</strong> This is exactly what customers see. Changes made in "My Profile" tab will appear here automatically.
          </p>
        </div>
      </div>
    </div>
  );
}