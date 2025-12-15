'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  ChevronRight,
  X,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  Send,
  MapPinIcon,
  ExternalLink,
  Edit2,
} from 'lucide-react';
import DirectRFQPopup from '@/components/DirectRFQPopup';

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = params.id;
  const [vendor, setVendor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDirectRFQ, setShowDirectRFQ] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replySaving, setReplySaving] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [businessHours, setBusinessHours] = useState([
    { day: 'Monday - Friday', hours: '7:00 AM - 6:00 PM' },
    { day: 'Saturday', hours: '8:00 AM - 5:00 PM' },
    { day: 'Sunday', hours: 'Closed' },
  ]);
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [certificationsList, setCertificationsList] = useState([]);
  const [newCertification, setNewCertification] = useState('');
  const [highlights, setHighlights] = useState([
    'Verified & trusted supplier',
    'Top-rated quality',
    'Fast response time',
  ]);
  const [newHighlight, setNewHighlight] = useState('');

  const [form, setForm] = useState({
    company_name: '',
    description: '',
    location: '',
    county: '',
    phone: '',
    email: '',
    website: '',
    whatsapp: '',
    category: '',
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user || null);
    };

    const fetchVendor = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .single();

        if (fetchError || !data) {
          setError('Vendor not found');
          setLoading(false);
          return;
        }

        setVendor(data);
        setForm({
          company_name: data.company_name || '',
          description: data.description || '',
          location: data.location || '',
          county: data.county || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          whatsapp: data.whatsapp || '',
          category: data.category || '',
        });
        setLocations(
          (data.locations && Array.isArray(data.locations) ? data.locations : (data.location ? data.location.split(',').map((l) => l.trim()).filter(Boolean) : [])) || []
        );
        setCertificationsList(
          Array.isArray(data.certifications)
            ? data.certifications
            : data.certifications
            ? String(data.certifications)
                .split(',')
                .map((c) => c.trim())
                .filter(Boolean)
            : []
        );
        setHighlights(
          Array.isArray(data.highlights)
            ? data.highlights
            : ['Verified & trusted supplier', 'Top-rated quality', 'Fast response time']
        );
        if (data.business_hours && Array.isArray(data.business_hours)) {
          setBusinessHours(data.business_hours);
        }

        // Mock data
        setProducts([
          { id: 1, name: 'Premium Portland Cement', description: 'High-strength, versatile cement for all construction needs', price: 'KSh 12,999', unit: 'bag', status: 'In Stock' },
          { id: 2, name: 'Structural Steel I-Beams', description: 'ASTM A36 certified, multiple sizes available', price: 'KSh 85,000', unit: 'ft', status: 'In Stock' },
          { id: 3, name: 'Engineered Hardwood Flooring', description: 'Premium oak, pre-finished, 5" wide planks', price: 'KSh 6,750', unit: 'sq.ft', status: 'In Stock' },
          { id: 4, name: 'Insulated Concrete Forms', description: 'Energy-efficient building system, R-value: 22+', price: 'KSh 28,500', unit: 'form', status: 'In Stock' },
        ]);

        setServices([
          { id: 1, name: 'Material Delivery', description: 'Same-day and scheduled delivery options available for all products' },
          { id: 2, name: 'Project Consultation', description: 'Expert advice on material selection and quantity estimation' },
          { id: 3, name: 'Custom Cutting & Fabrication', description: 'On-site cutting and fabrication services for lumber, steel, and other materials' },
          { id: 4, name: 'Equipment Rental', description: 'Rent specialized tools and equipment for your project needs' },
          { id: 5, name: 'Contractor Referrals', description: 'Connect with our network of trusted contractors for your project' },
        ]);

        // Load reviews from Supabase
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });

        setReviews(reviewData || []);

        // Load subscription for this vendor/user
        setSubscriptionLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: activeSub } = await supabase
            .from('vendor_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();
          if (activeSub) {
            setSubscription(activeSub);
            const { data: planData } = await supabase
              .from('subscription_plans')
              .select('*')
              .eq('id', activeSub.plan_id)
              .maybeSingle();
            if (planData) setPlan(planData);

            if (activeSub.end_date) {
              const endDate = new Date(activeSub.end_date);
              const today = new Date();
              const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
              setDaysRemaining(Math.max(0, daysLeft));
            }
          }
        }
        setSubscriptionLoading(false);

        setLoading(false);
      } catch (err) {
        setError('Error loading vendor profile');
        setLoading(false);
      }
    };

    fetchUser();
    if (vendorId) fetchVendor();
  }, [vendorId]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAbout = async () => {
    if (!vendor) return;
    setSaving(true);
    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        company_name: form.company_name,
        description: form.description,
        user_id:
          vendor.user_id || (currentUser?.email === vendor.email ? currentUser?.id : vendor.user_id),
      })
      .eq('id', vendor.id);
    if (updateError) {
      setError('Failed to save: ' + updateError.message);
    } else {
      setVendor((prev) => ({ ...prev, ...form }));
      setEditingAbout(false);
    }
    setSaving(false);
  };

  const handleSaveContact = async () => {
    if (!vendor) return;
    setSaving(true);
    const updatePayload = {
      location: locations[0] || form.location,
      county: form.county,
      phone: form.phone,
      email: form.email,
      website: form.website,
      whatsapp: form.whatsapp,
      category: form.category,
      user_id:
        vendor.user_id || (currentUser?.email === vendor.email ? currentUser?.id : vendor.user_id),
    };

    // Only include optional fields if they exist on this table to avoid schema errors
    if (vendor.hasOwnProperty('locations')) updatePayload.locations = locations;
    if (vendor.hasOwnProperty('business_hours')) updatePayload.business_hours = businessHours;
    if (vendor.hasOwnProperty('highlights')) updatePayload.highlights = highlights;
    if (vendor.hasOwnProperty('certifications')) updatePayload.certifications = certificationsList;

    const { error: updateError } = await supabase
      .from('vendors')
      .update(updatePayload)
      .eq('id', vendor.id);
    if (updateError) {
      setError('Failed to save: ' + updateError.message);
    } else {
      setVendor((prev) => ({
        ...prev,
        ...form,
        location: locations[0] || form.location,
        locations: updatePayload.locations ?? prev?.locations,
        business_hours: updatePayload.business_hours ?? prev?.business_hours,
        highlights: updatePayload.highlights ?? prev?.highlights,
        certifications: updatePayload.certifications ?? prev?.certifications,
      }));
      setEditingContact(false);
    }
    setSaving(false);
  };

  const addProduct = () => {
    if (productForm.name && productForm.price) {
      setProducts([...products, { id: Date.now(), ...productForm, status: 'In Stock' }]);
      setProductForm({ name: '', description: '', price: '', category: '' });
      setShowProductModal(false);
    }
  };

  const deleteProduct = (id) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const addService = () => {
    if (serviceForm.name) {
      setServices([...services, { id: Date.now(), ...serviceForm }]);
      setServiceForm({ name: '', description: '' });
      setShowServiceModal(false);
    }
  };

  const deleteService = (id) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const addLocationItem = () => {
    if (!newLocation.trim()) return;
    setLocations((prev) => [...prev, newLocation.trim()]);
    setNewLocation('');
  };

  const removeLocation = (idx) => {
    setLocations((prev) => prev.filter((_, i) => i !== idx));
  };

  const addCertificationItem = () => {
    if (!newCertification.trim()) return;
    setCertificationsList((prev) => [...prev, newCertification.trim()]);
    setNewCertification('');
  };

  const removeCertification = (idx) => {
    setCertificationsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const addHighlightItem = () => {
    if (!newHighlight.trim()) return;
    setHighlights((prev) => [...prev, newHighlight.trim()]);
    setNewHighlight('');
  };

  const removeHighlight = (idx) => {
    setHighlights((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveBusinessHours = async () => {
    if (!vendor || !vendor.hasOwnProperty('business_hours')) return;
    setSavingHours(true);
    const { error } = await supabase
      .from('vendors')
      .update({ business_hours: businessHours })
      .eq('id', vendor.id);
    if (error) {
      setError('Failed to save hours: ' + error.message);
    } else {
      setVendor((prev) => ({ ...prev, business_hours: businessHours }));
    }
    setSavingHours(false);
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
      const fileName = `vendor-${vendor.id}-${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('vendor-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Logo upload error:', uploadError);
        setUploadingLogo(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('vendor-logos').getPublicUrl(data.path);
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

  const canEdit =
    !!currentUser &&
    (!!vendor?.user_id ? vendor.user_id === currentUser.id : vendor?.email === currentUser.email);

  const handleReplyChange = (id, value) => {
    setReplyDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const saveReply = async (reviewId) => {
    if (!canEdit) return;
    const reply = replyDrafts[reviewId]?.trim();
    setReplySaving(true);
    const { error } = await supabase
      .from('reviews')
      .update({ vendor_response: reply || null, responded_at: new Date().toISOString() })
      .eq('id', reviewId);
    if (!error) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, vendor_response: reply || null, responded_at: new Date().toISOString() } : r
        )
      );
    } else {
      console.error('Error saving reply:', error);
    }
    setReplySaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-lg font-semibold">{error || 'Vendor not found'}</p>
          <Link href="/browse" className="text-amber-600 hover:text-amber-700 font-semibold">
            ← Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="text-slate-600 hover:text-slate-900">Home</Link>
            <Link href="/browse" className="text-slate-600 hover:text-slate-900">Browse</Link>
            <Link href="/post-rfq" className="text-slate-600 hover:text-slate-900">Post RFQ</Link>
          </div>
          {currentUser ? (
            <button
              onClick={() => supabase.auth.signOut().then(() => (window.location.href = '/'))}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Hero / Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-6 items-start">
            {/* Logo */}
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-3xl font-bold flex-shrink-0 relative">
              {vendor?.logo_url ? (
                <img src={vendor.logo_url} alt={vendor.company_name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
              {canEdit && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 bg-white/90 text-slate-700 text-xs px-2 py-1 rounded shadow"
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? 'Uploading...' : 'Change'}
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

            {/* Main Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{vendor.company_name}</h1>
                <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Verified
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  {averageRating ? (
                    <>
                      <span className="font-semibold text-slate-900">{averageRating}</span>
                      <span>({reviews.length} reviews)</span>
                    </>
                  ) : (
                    <span className="text-slate-500">No ratings yet</span>
                  )}
                </div>
                {vendor.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {vendor.location}
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {vendor.phone}
                  </div>
                )}
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <span key={cat} className="bg-amber-100 text-amber-700 px-3 py-1 rounded text-xs font-semibold">
                      {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 flex-wrap justify-end">
              {canEdit ? (
                <>
                  <Link
                    href="/vendor-messages"
                    className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
                  >
                    <MessageSquare className="w-5 h-5" /> Inbox
                  </Link>
                  <Link
                    href="/vendor-quotes"
                    className="inline-flex items-center gap-2 border border-amber-200 bg-amber-50 text-amber-700 px-6 py-3 rounded-lg font-semibold hover:bg-amber-100 transition"
                  >
                    📋 Quotes
                  </Link>
                </>
              ) : (
                <>
                  <button className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition">
                    <MessageSquare className="w-5 h-5" /> Contact
                  </button>
                  <button
                    onClick={() => setShowDirectRFQ(true)}
                    className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-50 transition"
                  >
                    Request Quote
                  </button>
                  <button
                    onClick={() => setSaved(!saved)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                      saved
                        ? 'bg-amber-50 border border-amber-300 text-amber-700'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8 h-16">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'products', label: `Products (${products.length})` },
              { id: 'services', label: `Services (${services.length})` },
              { id: 'reviews', label: `Reviews (${reviews.length})` },
              { id: 'faq', label: 'FAQ' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-medium pb-4 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'text-amber-600 border-blue-600'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">About {vendor.company_name}</h2>
                  {canEdit && (
                    <button
                      onClick={() => setEditingAbout(!editingAbout)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {editingAbout ? (
                  <div className="space-y-4">
                    <input
                      name="company_name"
                      value={form.company_name}
                      onChange={handleFieldChange}
                      className="w-full border border-slate-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFieldChange}
                      rows={5}
                      className="w-full border border-slate-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveAbout}
                        disabled={saving}
                        className="px-4 py-2 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700 disabled:opacity-60"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingAbout(false)}
                        className="px-4 py-2 border border-slate-300 rounded font-semibold hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 leading-relaxed text-base">
                    {vendor.description || 'No description available. Click edit to add one.'}
                  </p>
                )}
              </div>

              {/* Featured Products */}
              {products.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Featured Products</h2>
                    {canEdit && (
                      <button
                        onClick={() => setShowProductModal(true)}
                        className="text-amber-600 hover:text-amber-700 text-sm font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {products.slice(0, 4).map((product) => (
                      <div key={product.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="w-full h-40 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4.5-8 3 4 2.5-4 3.5 6z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm mb-1">{product.name}</h3>
                        <p className="text-xs text-slate-500 mb-2">{product.description}</p>
                        <p className="text-amber-600 font-bold mb-2">{product.price} / {product.unit}</p>
                        <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded">
                          {product.status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 text-center text-amber-600 hover:text-amber-700 font-semibold py-2 flex items-center justify-center gap-1">
                    View all products <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Services */}
              {services.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Services Offered</h2>
                    {canEdit && (
                      <button
                        onClick={() => setShowServiceModal(true)}
                        className="text-amber-600 hover:text-amber-700 text-sm font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div key={service.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 text-sm">{service.name}</h4>
                          {service.description && <p className="text-slate-600 text-sm mt-1">{service.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              {/* Business Hours */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Business Hours</h3>
                  {canEdit && (
                    <button
                      onClick={() => setBusinessHours((prev) => [...prev, { day: 'New day', hours: '8:00 AM - 5:00 PM' }])}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800"
                    >
                      + Add row
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {businessHours.map((row, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 ${canEdit ? 'bg-slate-50 border border-slate-200 rounded-lg p-2' : ''}`}
                    >
                      {canEdit ? (
                        <>
                          <input
                            value={row.day}
                            onChange={(e) => {
                              const next = [...businessHours];
                              next[idx] = { ...next[idx], day: e.target.value };
                              setBusinessHours(next);
                            }}
                            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
                            placeholder="Day"
                          />
                          <input
                            value={row.hours}
                            onChange={(e) => {
                              const next = [...businessHours];
                              next[idx] = { ...next[idx], hours: e.target.value };
                              setBusinessHours(next);
                            }}
                            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
                            placeholder="Hours"
                          />
                          <button
                            onClick={() => setBusinessHours((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-slate-700 text-sm">{row.day}</span>
                          <span className="ml-auto font-semibold text-slate-900 text-sm">{row.hours}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {canEdit && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={saveBusinessHours}
                      disabled={savingHours}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
                    >
                      {savingHours ? 'Saving...' : 'Save hours'}
                    </button>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Contact Information</h3>
                  {canEdit && (
                    <button onClick={() => setEditingContact(!editingContact)} className="text-slate-400 hover:text-slate-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {editingContact ? (
                  <div className="space-y-3 mb-4">
                    <input name="phone" value={form.phone} onChange={handleFieldChange} className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm" placeholder="Phone" />
                    <input name="email" value={form.email} onChange={handleFieldChange} className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm" placeholder="Email" />
                    <input name="website" value={form.website} onChange={handleFieldChange} className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm" placeholder="Website" />
                    <input name="whatsapp" value={form.whatsapp} onChange={handleFieldChange} className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm" placeholder="WhatsApp" />
                    <div className="space-y-2">
                      <input
                        name="location"
                        value={locations[0] || form.location}
                        onChange={(e) => {
                          const updated = [...locations];
                          updated[0] = e.target.value;
                          setLocations(updated);
                          handleFieldChange(e);
                        }}
                        className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm"
                        placeholder="Primary Location"
                      />
                      <div className="flex gap-2">
                        <input
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-sm"
                          placeholder="Add another location"
                        />
                        <button
                          type="button"
                          onClick={addLocationItem}
                          className="px-3 py-1.5 bg-amber-600 text-white rounded text-sm font-semibold hover:bg-amber-700"
                        >
                          Add
                        </button>
                      </div>
                      {locations.slice(1).map((loc, idx) => (
                        <div key={idx} className="flex items-center justify-between border border-slate-200 rounded px-3 py-1">
                          <span className="text-sm text-slate-700">{loc}</span>
                          <button onClick={() => removeLocation(idx + 1)} className="text-xs text-red-600 hover:underline">
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <input name="county" value={form.county} onChange={handleFieldChange} className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm" placeholder="County" />
                    <button onClick={handleSaveContact} disabled={saving} className="w-full px-3 py-1.5 bg-amber-600 text-white rounded text-sm font-semibold hover:bg-amber-700 disabled:opacity-60">
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {vendor.phone && (
                      <div>
                        <p className="text-slate-500 text-xs font-semibold mb-1">PHONE</p>
                        <p className="text-slate-900 font-medium">{vendor.phone}</p>
                      </div>
                    )}
                    {vendor.email && (
                      <div>
                        <p className="text-slate-500 text-xs font-semibold mb-1">EMAIL</p>
                        <p className="text-slate-900 font-medium">{vendor.email}</p>
                      </div>
                    )}
                    {vendor.website && (
                      <div>
                        <p className="text-slate-500 text-xs font-semibold mb-1">WEBSITE</p>
                        <a href={vendor.website} target="_blank" rel="noreferrer" className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {(vendor.locations && vendor.locations.length > 0) || vendor.location ? (
                      <div>
                        <p className="text-slate-500 text-xs font-semibold mb-1">LOCATIONS</p>
                        <div className="space-y-1">
                          {(vendor.locations || [vendor.location]).filter(Boolean).map((loc, idx) => (
                            <p key={idx} className="text-slate-900 font-medium">{loc}{vendor.county && idx === 0 ? `, ${vendor.county}` : ''}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Subscription */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900">Subscription</h3>
                  <Link href="/subscription-plans" className="text-amber-600 text-sm font-semibold hover:text-amber-700">
                    Manage
                  </Link>
                </div>
                {subscriptionLoading ? (
                  <p className="text-sm text-slate-500">Loading...</p>
                ) : subscription && plan ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Plan</p>
                        <p className="font-semibold text-slate-900">{plan.name}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Days remaining</p>
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                        <span>{typeof daysRemaining === 'number' ? `${daysRemaining} days` : 'N/A'}</span>
                        <span className="text-slate-500">{plan.price ? `KSh ${plan.price}/mo` : ''}</span>
                      </div>
                      {subscription.start_date && subscription.end_date && (
                        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{
                              width: (() => {
                                const totalMs = new Date(subscription.end_date) - new Date(subscription.start_date);
                                const remainingMs = new Date(subscription.end_date) - new Date();
                                const pct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
                                return `${pct}%`;
                              })(),
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href="/subscription-plans"
                        className="flex-1 text-center px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50"
                      >
                        Change plan
                      </Link>
                      <button
                        onClick={() => alert('Downgrade coming soon')}
                        className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700"
                      >
                        Downgrade
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">No active subscription.</p>
                    <Link
                      href="/subscription-plans"
                      className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700"
                    >
                      Choose a plan
                    </Link>
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Certifications</h3>
                {canEdit && (
                  <div className="flex gap-2 mb-3">
                    <input
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
                      placeholder="Add certification"
                    />
                    <button
                      onClick={addCertificationItem}
                      className="px-3 py-2 bg-amber-600 text-white rounded text-sm font-semibold hover:bg-amber-700"
                    >
                      Add
                    </button>
                  </div>
                )}
                <ul className="space-y-2 text-sm text-slate-700">
                  {certificationsList.length === 0 && <li className="text-slate-500">No certifications listed.</li>}
                  {certificationsList.map((cert, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-600" /> {cert}
                      </span>
                      {canEdit && (
                        <button onClick={() => removeCertification(idx)} className="text-xs text-red-600 hover:underline">
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Highlights */}
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Why Choose Us</h3>
                {canEdit && (
                  <div className="flex gap-2 mb-3">
                    <input
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      className="flex-1 border border-amber-300 rounded px-3 py-2 text-sm"
                      placeholder="Add highlight"
                    />
                    <button
                      onClick={addHighlightItem}
                      className="px-3 py-2 bg-amber-600 text-white rounded text-sm font-semibold hover:bg-amber-700"
                    >
                      Add
                    </button>
                  </div>
                )}
                <ul className="space-y-3 text-sm">
                  {highlights.length === 0 && <li className="text-slate-600">Add reasons to choose you.</li>}
                  {highlights.map((item, idx) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-slate-700 flex-1">{item}</span>
                      {canEdit && (
                        <button onClick={() => removeHighlight(idx)} className="text-xs text-red-600 hover:underline">
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">All Products</h2>
              {canEdit && (
                <button
                  onClick={() => setShowProductModal(true)}
                  className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700"
                >
                  <Plus className="w-5 h-5" /> Add Product
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition">
                  <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4.5-8 3 4 2.5-4 3.5 6z" />
                    </svg>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-slate-900 mb-2">{product.name}</h4>
                    <p className="text-xs text-slate-500 mb-3">{product.description}</p>
                    <p className="text-lg font-bold text-amber-600 mb-2">{product.price}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">{product.unit}</span>
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded">{product.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">All Services</h2>
              {canEdit && (
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-700"
                >
                  <Plus className="w-5 h-5" /> Add Service
                </button>
              )}
            </div>
            <div className="space-y-3 max-w-3xl">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 mb-1">{service.name}</h4>
                      <p className="text-slate-600 text-sm">{service.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Customer Reviews</h2>
            <div className="max-w-3xl space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{review.author || 'Customer'}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-700 mb-4">{review.comment || review.text}</p>

                  {review.vendor_response ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
                      <p className="font-semibold mb-1">Vendor response</p>
                      <p>{review.vendor_response}</p>
                    </div>
                  ) : canEdit ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        placeholder="Write a response to this review..."
                        value={replyDrafts[review.id] ?? ''}
                        onChange={(e) => handleReplyChange(review.id, e.target.value)}
                      />
                      <button
                        onClick={() => saveReply(review.id)}
                        disabled={replySaving}
                        className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
                      >
                        {replySaving ? 'Saving...' : 'Post Response'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-sm text-slate-500">No reviews yet.</p>
              )}
            </div>
          </div>
        )}

        {/* FAQ TAB */}
        {activeTab === 'faq' && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {[
                { q: 'What is your delivery timeframe?', a: 'We offer same-day and scheduled deliveries based on your location and availability.' },
                { q: 'Do you offer bulk discounts?', a: 'Yes! Contact our team for custom pricing on large orders.' },
                { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, bank transfers, and M-Pesa.' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-lg border border-slate-200 p-6">
                  <h4 className="font-semibold text-slate-900 mb-2">{item.q}</h4>
                  <p className="text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {showProductModal && canEdit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Product</h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Product name"
              />
              <textarea rows={2} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Description" />
              <input
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Price"
              />
              <input
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Category"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowProductModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded font-semibold hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={addProduct} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700">
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showServiceModal && canEdit && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Service</h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <input
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Service name"
              />
              <textarea rows={3} value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Service description" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowServiceModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded font-semibold hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={addService} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700">
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct RFQ Modal */}
      <DirectRFQPopup
        isOpen={showDirectRFQ}
        onClose={() => setShowDirectRFQ(false)}
        vendor={vendor}
        user={currentUser}
      />
    </div>
  );
}
