'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Layers,
  Image as ImageIcon,
} from 'lucide-react';

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = params.id;
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
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
        setError(null);
        setLoading(false);
      } catch (err) {
        setError('Error loading vendor profile');
        setLoading(false);
      }
    };

    if (vendorId) fetchVendor();
  }, [vendorId]);

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
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xl font-bold">
                {initials}
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
                      className="flex items-center gap-1 text-amber-700 font-semibold"
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
              {vendor.rating || '4.9'} ({vendor.review_count || 128} reviews)
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

      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-6 h-14 text-sm font-semibold text-slate-700">
            <span className="text-amber-700 border-b-2 border-amber-700 pb-3">Overview</span>
            <span className="pb-3 border-b-2 border-transparent text-slate-500">Products</span>
            <span className="pb-3 border-b-2 border-transparent text-slate-500">Services</span>
            <span className="pb-3 border-b-2 border-transparent text-slate-500">Gallery</span>
            <span className="pb-3 border-b-2 border-transparent text-slate-500">Reviews</span>
            <span className="pb-3 border-b-2 border-transparent text-slate-500">FAQ</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">About {vendor.company_name}</h3>
            <p className="text-slate-700 leading-relaxed">
              {vendor.description ||
                'We provide high-quality materials and services with excellent customer support. Add your story and expertise here to win buyer trust.'}
            </p>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Featured Products</h3>
                <p className="text-sm text-slate-600">Highlight key products buyers look for.</p>
              </div>
              <button className="text-sm font-semibold text-amber-700 hover:text-amber-800">View all products</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {featuredProducts.map((product, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 hover:border-amber-200 transition p-4">
                  <div className="aspect-[4/3] rounded-lg bg-slate-100 mb-3 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <h4 className="font-semibold text-slate-900">{product.name}</h4>
                  <p className="text-sm text-slate-600 mb-2">{product.price}</p>
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
                    {product.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Services Offered</h3>
                <p className="text-sm text-slate-600">List what you provide beyond products.</p>
              </div>
              <button className="text-sm font-semibold text-amber-700 hover:text-amber-800">View all services</button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {servicesOffered.map((service) => (
                <div key={service} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                    ✓
                  </div>
                  <p className="text-slate-800 text-sm">{service}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
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
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-slate-500" /> WhatsApp: {vendor.whatsapp}
                  </div>
                )}
              </div>
              {vendor.website && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Website</p>
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-700 hover:underline font-semibold"
                  >
                    {vendor.website}
                  </a>
                </div>
              )}
              {vendor.location && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>
                      {vendor.location}
                      {vendor.county ? `, ${vendor.county}` : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900 mb-3">Highlights</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Verified business
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Top performer
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-500" /> Fast response
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900 mb-3">Payment & Certifications</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <p>Payment Methods: M-Pesa, Visa, Mastercard</p>
              <p>Certifications: LEED, ISO 9001 (add yours)</p>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-base font-semibold text-slate-900 mb-3">Hours</h4>
            <div className="text-sm text-slate-700 space-y-1">
              <p>Mon - Fri: 7:00 AM - 6:00 PM</p>
              <p>Saturday: 8:00 AM - 5:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
