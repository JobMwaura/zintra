'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Link as LinkIcon,
  X,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  MoreVertical,
  Send,
} from 'lucide-react';

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = params.id;
  const [vendor, setVendor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  
  // Tab and modal states
  const [activeTab, setActiveTab] = useState('overview');
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showReviewReplyModal, setShowReviewReplyModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [gallery, setGallery] = useState([]);

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

        if (fetchError) {
          setError('Failed to load vendor profile');
          setLoading(false);
          return;
        }

        if (!data) {
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

        // Mock data - replace with real database queries
        setProducts([
          { id: 1, name: 'Premium Portland Cement', price: 'KSh 12,999 / bag', category: 'Materials', image: null },
          { id: 2, name: 'Structural Steel I-Beams', price: 'KSh 85,000 / ft', category: 'Steel', image: null },
        ]);

        setServices([
          { id: 1, name: 'Material delivery with same-day options' },
          { id: 2, name: 'Project consultation and quantity estimation' },
          { id: 3, name: 'Custom cutting & fabrication' },
        ]);

        setReviews([
          { id: 1, author: 'John Doe', rating: 5, text: 'Excellent service and quality materials!', date: '2024-12-10', replied: false },
          { id: 2, author: 'Jane Smith', rating: 4, text: 'Good prices, fast delivery.', date: '2024-12-08', replied: false },
        ]);

        setError(null);
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

    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        location: form.location,
        county: form.county,
        phone: form.phone,
        email: form.email,
        website: form.website,
        whatsapp: form.whatsapp,
        category: form.category,
      })
      .eq('id', vendor.id);

    if (updateError) {
      setError('Failed to save: ' + updateError.message);
    } else {
      setVendor((prev) => ({ ...prev, ...form }));
      setEditingContact(false);
    }
    setSaving(false);
  };

  const addProduct = () => {
    if (productForm.name && productForm.price) {
      setProducts([...products, { id: Date.now(), ...productForm, image: null }]);
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

  const replyToReview = (id) => {
    setReviews(reviews.map((r) => r.id === id ? { ...r, replied: true } : r));
    setShowReviewReplyModal(false);
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

  const canEdit = currentUser && vendor?.user_id && vendor.user_id === currentUser.id;

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
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between text-sm font-semibold text-slate-700">
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-amber-700">Home</Link>
            <Link href="/browse" className="hover:text-amber-700">Browse</Link>
            <Link href="/post-rfq" className="hover:text-amber-700">Post RFQ</Link>
            <Link href="/about" className="hover:text-amber-700">About</Link>
            <Link href="/contact" className="hover:text-amber-700">Contact</Link>
          </div>
          {currentUser ? (
            <button
              onClick={() => supabase.auth.signOut().then(() => (window.location.href = '/'))}
              className="text-amber-700 hover:underline"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="text-amber-700">Login</Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-lg bg-amber-600 text-white flex items-center justify-center text-2xl font-bold">
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">{vendor.company_name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" /> Verified
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700 mb-2">
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
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    {vendor.rating || '4.9'} ({vendor.review_count || 128} reviews)
                  </div>
                  <span className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {vendor.response_time || '24 hrs'} response time
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {canEdit ? (
                <>
                  <Link
                    href="/vendor-messages"
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-semibold hover:bg-amber-700"
                  >
                    <MessageSquare className="w-5 h-5" /> Inbox
                  </Link>
                  <Link
                    href="/vendor-quotes"
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 font-semibold hover:bg-amber-100"
                  >
                    Requested Quotes
                  </Link>
                </>
              ) : (
                <>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 font-semibold hover:bg-amber-100">
                    <MessageSquare className="w-5 h-5" /> Contact Vendor
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-slate-700 font-semibold hover:border-slate-300">
                    Request Quote
                  </button>
                  <button
                    onClick={() => setSaved((s) => !s)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-semibold ${
                      saved
                        ? 'border-amber-500 text-amber-700 bg-amber-50'
                        : 'border-slate-200 text-slate-700'
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
      <div className="border-b border-slate-200 bg-white sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-8 h-14 text-sm font-semibold text-slate-700">
            {['overview', 'products', 'services', 'gallery', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize pb-4 border-b-2 transition ${
                  activeTab === tab
                    ? 'text-amber-700 border-amber-700'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">About {vendor.company_name}</h3>
                  {canEdit && (
                    <button
                      onClick={() => setEditingAbout(!editingAbout)}
                      className="text-amber-700 hover:text-amber-800"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {editingAbout ? (
                  <div className="space-y-4">
                    <input
                      name="company_name"
                      value={form.company_name}
                      onChange={handleFieldChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Company name"
                    />
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFieldChange}
                      rows={4}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="About your company..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveAbout}
                        disabled={saving}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-60"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingAbout(false)}
                        className="px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 leading-relaxed">
                    {vendor.description || 'No description yet. Click edit to add one.'}
                  </p>
                )}
              </div>

              {/* Featured Products Preview */}
              {products.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Featured Products</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {products.slice(0, 4).map((product) => (
                      <div key={product.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="w-full h-32 bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-slate-400 text-2xl">📦</span>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-900 text-sm">{product.name}</h4>
                        <p className="text-amber-700 font-semibold text-sm">{product.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured Services Preview */}
              {services.length > 0 && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Services Offered</h3>
                  <div className="space-y-2">
                    {services.slice(0, 3).map((service) => (
                      <div key={service.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span className="text-slate-900">{service.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Contact Info */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-900">Contact Info</h4>
                  {canEdit && (
                    <button
                      onClick={() => setEditingContact(!editingContact)}
                      className="text-amber-700 hover:text-amber-800"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {editingContact ? (
                  <div className="space-y-3 mb-4">
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleFieldChange}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      placeholder="Phone"
                    />
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleFieldChange}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      placeholder="Email"
                    />
                    <input
                      name="website"
                      value={form.website}
                      onChange={handleFieldChange}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      placeholder="Website"
                    />
                    <input
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleFieldChange}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      placeholder="WhatsApp"
                    />
                    <input
                      name="location"
                      value={form.location}
                      onChange={handleFieldChange}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      placeholder="Location"
                    />
                    <input
                      name="county"
                      value={form.county}
                      onChange={handleFieldChange}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      placeholder="County"
                    />
                    <input
                      name="category"
                      value={form.category}
                      onChange={handleFieldChange}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                      placeholder="Categories (comma-separated)"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveContact}
                        disabled={saving}
                        className="flex-1 px-3 py-1 bg-amber-600 text-white rounded text-sm font-semibold hover:bg-amber-700 disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingContact(false)}
                        className="flex-1 px-3 py-1 border border-slate-300 rounded text-sm font-semibold hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-slate-700">
                    {vendor.phone && <p><Phone className="w-4 h-4 inline mr-2" />{vendor.phone}</p>}
                    {vendor.email && <p><Mail className="w-4 h-4 inline mr-2" />{vendor.email}</p>}
                    {vendor.website && <p><Globe className="w-4 h-4 inline mr-2" /><a href={vendor.website} target="_blank" rel="noreferrer" className="text-amber-700">{vendor.website}</a></p>}
                    {vendor.whatsapp && <p><LinkIcon className="w-4 h-4 inline mr-2" />{vendor.whatsapp}</p>}
                    {vendor.location && <p><MapPin className="w-4 h-4 inline mr-2" />{vendor.location}{vendor.county ? `, ${vendor.county}` : ''}</p>}
                    {categories.length > 0 && (
                      <div className="pt-2">
                        {categories.map((cat) => (
                          <span key={cat} className="inline-block bg-amber-50 text-amber-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Highlights */}
              <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-6">
                <h4 className="font-semibold text-emerald-900 mb-3">Highlights</h4>
                <div className="space-y-2 text-sm text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Verified business
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4" /> Top performer
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Fast response
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Products</h2>
              {canEdit && (
                <button
                  onClick={() => setShowProductModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-semibold hover:bg-amber-700"
                >
                  <Plus className="w-5 h-5" /> Add Product
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="w-full h-40 bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-slate-400 text-4xl">📦</span>
                    )}
                  </div>
                  <h4 className="font-semibold text-slate-900">{product.name}</h4>
                  <p className="text-amber-700 font-semibold text-lg mb-2">{product.price}</p>
                  {product.category && <p className="text-xs text-slate-500 mb-3">{product.category}</p>}
                  {canEdit && (
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="w-full px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg mb-4">No products yet</p>
                {canEdit && (
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-semibold hover:bg-amber-700"
                  >
                    <Plus className="w-5 h-5" /> Add Your First Product
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Services</h2>
              {canEdit && (
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-semibold hover:bg-amber-700"
                >
                  <Plus className="w-5 h-5" /> Add Service
                </button>
              )}
            </div>
            <div className="space-y-3 max-w-2xl">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    <span className="text-emerald-600 font-bold mt-1">✓</span>
                    <div>
                      <h4 className="font-semibold text-slate-900">{service.name}</h4>
                      {service.description && <p className="text-slate-600 text-sm mt-1">{service.description}</p>}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => deleteService(service.id)}
                      className="text-red-600 hover:text-red-700 ml-4"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {services.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500 text-lg mb-4">No services yet</p>
                {canEdit && (
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-semibold hover:bg-amber-700"
                  >
                    <Plus className="w-5 h-5" /> Add Your First Service
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Gallery</h2>
              {canEdit && (
                <button className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-semibold hover:bg-amber-700">
                  <Upload className="w-5 h-5" /> Upload Image
                </button>
              )}
            </div>
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <p className="text-slate-500 text-lg">Gallery coming soon</p>
              {canEdit && <p className="text-slate-400 text-sm mt-2">Click upload to add images of your work</p>}
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Reviews ({reviews.length})</h2>
            <div className="space-y-4 max-w-2xl">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{review.author}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">{review.date}</span>
                      </div>
                    </div>
                    {review.replied && (
                      <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded">
                        Replied
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 mb-3">{review.text}</p>
                  {canEdit && !review.replied && (
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setShowReviewReplyModal(true);
                      }}
                      className="text-amber-700 hover:text-amber-800 font-semibold text-sm flex items-center gap-1"
                    >
                      <Send className="w-4 h-4" /> Reply
                    </button>
                  )}
                </div>
              ))}
            </div>
            {reviews.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <p className="text-slate-500 text-lg">No reviews yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* Add Product Modal */}
      {showProductModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Add Product</h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <input
                name="name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Product name"
              />
              <textarea
                name="description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Description"
              />
              <input
                name="price"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Price (e.g. KSh 1,000 / unit)"
              />
              <input
                name="category"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Category"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowProductModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={addProduct}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showServiceModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Add Service</h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <input
                name="name"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Service name"
              />
              <textarea
                name="description"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Service description"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowServiceModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={addService}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply to Review Modal */}
      {showReviewReplyModal && selectedReview && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Reply to Review</h3>
              <button onClick={() => setShowReviewReplyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-semibold text-slate-900 mb-1">{selectedReview.author}</p>
              <p className="text-sm text-slate-600">{selectedReview.text}</p>
            </div>
            <textarea
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
              placeholder="Type your reply..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowReviewReplyModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => replyToReview(selectedReview.id)}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}