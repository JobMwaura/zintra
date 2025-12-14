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
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = params.id;
  const [vendor, setVendor] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  
  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'about', 'contact', 'products', 'services', null
  const [saving, setSaving] = useState(false);
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

  const handleSaveSection = async () => {
    if (!vendor) return;
    setSaving(true);
    
    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        company_name: form.company_name,
        description: form.description,
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
      setError('Failed to save changes: ' + updateError.message);
      setSaving(false);
      return;
    }

    setVendor((prev) => ({ ...prev, ...form }));
    setActiveModal(null);
    setSaving(false);
    setError(null);
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

  const featuredProducts = [
    { name: 'Premium Portland Cement', price: 'KSh 12,999 / bag', status: 'In Stock' },
    { name: 'Structural Steel I-Beams', price: 'KSh 85,000 / ft', status: 'In Stock' },
    { name: 'Engineered Hardwood Flooring', price: 'KSh 6,750 / sq.ft', status: 'Limited' },
    { name: 'Insulated Concrete Forms', price: 'KSh 28,500 / form', status: 'In Stock' },
  ];

  const servicesOffered = [
    'Material delivery with same-day options',
    'Project consultation and quantity estimation',
    'Custom cutting & fabrication',
    'Equipment rental and contractor referrals',
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between text-sm font-semibold text-slate-700">
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-amber-700 transition">Home</Link>
            <Link href="/browse" className="hover:text-amber-700 transition">Browse</Link>
            <Link href="/post-rfq" className="hover:text-amber-700 transition">Post RFQ</Link>
            <Link href="/about" className="hover:text-amber-700 transition">About</Link>
            <Link href="/contact" className="hover:text-amber-700 transition">Contact</Link>
            {canEdit && <Link href="/vendor-messages" className="hover:text-amber-700 transition">Inbox</Link>}
          </div>
          {currentUser ? (
            <button
              onClick={() => supabase.auth.signOut().then(() => (window.location.href = '/'))}
              className="text-amber-700 hover:text-amber-800 transition font-semibold"
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="text-amber-700 hover:text-amber-800 transition font-semibold">Login</Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-slate-900">{vendor.company_name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-sm font-semibold">
                    <ShieldCheck className="w-4 h-4" /> Verified
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
                  {vendor.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      {vendor.location}
                      {vendor.county ? `, ${vendor.county}` : ''}
                    </span>
                  )}
                  {vendor.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-amber-600" />
                      {vendor.phone}
                    </span>
                  )}
                  {vendor.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-amber-600" />
                      {vendor.email}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-slate-900">{vendor.rating || '4.9'}</span>
                    <span>({vendor.review_count || 128} reviews)</span>
                  </div>
                  <span className="w-px h-4 bg-slate-300" />
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-500" /> 
                    <span>{vendor.response_time || '24 hrs'} response time</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {canEdit ? (
                <>
                  <Link
                    href="/vendor-messages"
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2.5 font-semibold hover:bg-amber-700 transition shadow-md"
                  >
                    <MessageSquare className="w-5 h-5" /> Inbox
                  </Link>
                </>
              ) : (
                <>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2.5 font-semibold hover:bg-amber-700 transition shadow-md">
                    <MessageSquare className="w-5 h-5" /> Contact Vendor
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-800 font-semibold hover:bg-amber-100 transition">
                    Request Quote
                  </button>
                  <button
                    onClick={() => setSaved((s) => !s)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 font-semibold transition ${
                      saved
                        ? 'border-amber-500 text-amber-700 bg-amber-50'
                        : 'border-slate-300 text-slate-700 hover:border-amber-300'
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="space-y-6">
          {/* About Section */}
          <section className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">About {vendor.company_name}</h3>
                <p className="text-sm text-slate-500 mt-1">Company overview and mission</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => setActiveModal('about')}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-amber-700 font-semibold hover:bg-amber-100 transition"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              )}
            </div>
            <p className="text-slate-700 leading-relaxed text-lg">
              {vendor.description ||
                'We provide high-quality materials and services with excellent customer support. Add your story and expertise here to win buyer trust.'}
            </p>
          </section>

          {/* Featured Products */}
          <section className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Featured Products</h3>
                <p className="text-sm text-slate-500 mt-1">Showcase your best-selling items</p>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => setActiveModal('products')}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-amber-700 font-semibold hover:bg-amber-100 transition"
                  >
                    <Plus className="w-4 h-4" /> Manage
                  </button>
                )}
                <button className="inline-flex items-center gap-1 text-amber-700 font-semibold hover:text-amber-800 transition text-sm">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {featuredProducts.map((product, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition p-4 group">
                  <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 mb-3 flex items-center justify-center text-slate-400 group-hover:from-amber-50 group-hover:to-amber-100 transition">
                    <div className="text-center">
                      <div className="text-3xl mb-1">📦</div>
                      <span className="text-xs text-slate-500">No image</span>
                    </div>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm">{product.name}</h4>
                  <p className="text-sm text-amber-700 font-semibold mb-2">{product.price}</p>
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">
                    {product.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Services Offered */}
          <section className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Services Offered</h3>
                <p className="text-sm text-slate-500 mt-1">What you provide beyond products</p>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => setActiveModal('services')}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-amber-700 font-semibold hover:bg-amber-100 transition"
                  >
                    <Plus className="w-4 h-4" /> Manage
                  </button>
                )}
                <button className="inline-flex items-center gap-1 text-amber-700 font-semibold hover:text-amber-800 transition text-sm">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {servicesOffered.map((service) => (
                <div key={service} className="flex gap-3 rounded-xl border border-slate-200 hover:border-amber-200 p-4 bg-slate-50 hover:bg-amber-50 transition group">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:bg-amber-100 group-hover:text-amber-700 transition">
                    ✓
                  </div>
                  <p className="text-slate-800 text-sm font-medium">{service}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Contact Information */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-900">Contact Info</h4>
              {canEdit && (
                <button
                  onClick={() => setActiveModal('contact')}
                  className="text-amber-700 hover:text-amber-800 transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-4 text-sm text-slate-700">
              {categories.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <span key={cat} className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {vendor.phone && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-600" /> {vendor.phone}
                  </div>
                </div>
              )}
              {vendor.email && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-600" /> {vendor.email}
                  </div>
                </div>
              )}
              {vendor.whatsapp && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">WhatsApp</p>
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-amber-600" /> {vendor.whatsapp}
                  </div>
                </div>
              )}
              {vendor.website && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Website</p>
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                  >
                    Visit <Globe className="w-4 h-4" />
                  </a>
                </div>
              )}
              {vendor.location && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>
                      {vendor.location}
                      {vendor.county ? `, ${vendor.county}` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Highlights */}
          <section className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-6 shadow-sm">
            <h4 className="text-lg font-bold text-emerald-900 mb-4">Highlights</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-emerald-900 font-medium">Verified business</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <span className="text-emerald-900 font-medium">Top performer</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-sky-500 flex-shrink-0" />
                <span className="text-emerald-900 font-medium">Fast response</span>
              </div>
            </div>
          </section>

          {/* Payment & Certifications */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Payments & Certs</h4>
            <div className="space-y-3 text-sm text-slate-700">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Payment Methods</p>
                <p className="font-medium">M-Pesa, Visa, Mastercard</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Certifications</p>
                <p className="font-medium">LEED, ISO 9001</p>
              </div>
            </div>
          </section>

          {/* Hours */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
            <h4 className="text-lg font-bold text-slate-900 mb-4">Business Hours</h4>
            <div className="text-sm text-slate-700 space-y-2 font-medium">
              <p>Mon - Fri: <span className="text-amber-700">7:00 AM - 6:00 PM</span></p>
              <p>Saturday: <span className="text-amber-700">8:00 AM - 5:00 PM</span></p>
              <p>Sunday: <span className="text-slate-400">Closed</span></p>
            </div>
          </section>
        </div>
      </div>

      {/* MODALS */}

      {/* About Modal */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Edit About</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Business Name</label>
                <input
                  name="company_name"
                  value={form.company_name}
                  onChange={handleFieldChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Your company name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">About Your Company</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFieldChange}
                  rows={5}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  placeholder="Tell your story..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSection}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-60 transition"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 sticky top-0 bg-white pb-4">
              <h2 className="text-2xl font-bold text-slate-900">Edit Contact Info</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Categories</label>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleFieldChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  placeholder="e.g. Plumbing, Roofing, etc."
                />
                <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleFieldChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="+254 712 345 678"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Email</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleFieldChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Website</label>
                <input
                  name="website"
                  value={form.website}
                  onChange={handleFieldChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="https://yoursite.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">WhatsApp</label>
                <input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleFieldChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="+254 712 345 678"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleFieldChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="City/Town"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">County</label>
                <input
                  name="county"
                  value={form.county}
                  onChange={handleFieldChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="County"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSection}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-60 transition"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {activeModal === 'products' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Manage Products</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-900"><Sparkles className="w-4 h-4 inline mr-2" />Feature coming soon! You'll be able to add and manage products here.</p>
            </div>
            <div className="space-y-2 mb-6">
              {featuredProducts.map((product) => (
                <div key={product.name} className="flex justify-between items-start p-3 border border-slate-200 rounded-lg text-sm">
                  <span className="font-medium text-slate-900">{product.name}</span>
                  <span className="text-xs text-slate-500 ml-2">{product.price}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Services Modal */}
      {activeModal === 'services' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-slate-900">Manage Services</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-900"><Sparkles className="w-4 h-4 inline mr-2" />Feature coming soon! You'll be able to add and manage services here.</p>
            </div>
            <div className="space-y-2 mb-6">
              {servicesOffered.map((service) => (
                <div key={service} className="flex items-start p-3 border border-slate-200 rounded-lg text-sm">
                  <span className="text-emerald-600 font-bold mr-2">✓</span>
                  <span className="text-slate-900">{service}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}