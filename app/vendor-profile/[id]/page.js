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

  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);

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

        setReviews([
          { id: 1, author: 'Sarah Johnson', rating: 5, text: 'Excellent service and quality materials. Delivered faster than expected!', date: 'Dec 10, 2024', replied: false },
          { id: 2, author: 'Michael Chen', rating: 4, text: 'Good prices and knowledgeable staff. Highly recommended.', date: 'Dec 8, 2024', replied: true },
        ]);

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
        user_id:
          vendor.user_id || (currentUser?.email === vendor.email ? currentUser?.id : vendor.user_id),
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

  const canEdit =
    !!currentUser &&
    (!!vendor?.user_id ? vendor.user_id === currentUser.id : vendor?.email === currentUser.email);

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
            <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {initials}
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
                  <span className="font-semibold text-slate-900">{vendor.rating || '4.9'}</span>
                  <span>({vendor.review_count || 128} reviews)</span>
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
                <h3 className="font-bold text-slate-900 mb-4">Business Hours</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Monday - Friday</span>
                    <span className="font-semibold text-slate-900">7:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Saturday</span>
                    <span className="font-semibold text-slate-900">8:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sunday</span>
                    <span className="font-semibold text-slate-900">Closed</span>
                  </div>
                </div>
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
                    <input name="location" value={form.location} onChange={handleFieldChange} className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm" placeholder="Location" />
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
                    {vendor.location && (
                      <div>
                        <p className="text-slate-500 text-xs font-semibold mb-1">LOCATION</p>
                        <p className="text-slate-900 font-medium">{vendor.location}{vendor.county ? `, ${vendor.county}` : ''}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Payment Methods</h3>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-600">💳</div>
                  <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center text-sm font-bold text-red-600">💳</div>
                  <div className="w-10 h-10 rounded bg-yellow-100 flex items-center justify-center text-sm font-bold text-yellow-600">💳</div>
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Certifications</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" /> LEED Certified
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" /> ISO 9001:2015
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" /> Green Supplier
                  </li>
                </ul>
              </div>

              {/* Highlights */}
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Why Choose Us</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">Verified & trusted supplier</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">Top-rated quality</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700">Fast response time</span>
                  </li>
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
                      <h4 className="font-semibold text-slate-900">{review.author}</h4>
                      <p className="text-xs text-slate-500 mt-1">{review.date}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-700 mb-3">{review.text}</p>
                  {review.replied && <p className="text-sm text-emerald-600 font-semibold">✓ Vendor replied</p>}
                </div>
              ))}
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
