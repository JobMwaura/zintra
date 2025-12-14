'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import DirectRFQPopup from '@/components/DirectRFQPopup';
import {
  Star,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Clock,
  Award,
  FileText,
  ChevronDown,
  ChevronUp,
  Share2,
  Bookmark,
} from 'lucide-react';

/** BRAND TOKENS */
const BRAND = {
  primary: '#ea8f1e', // Zintra orange
  primaryHover: '#d88013',
  slate900: 'rgb(15 23 42)',
  slate800: 'rgb(30 41 59)',
  slate700: 'rgb(51 65 85)',
  slate600: 'rgb(71 85 105)',
  slate500: 'rgb(100 116 139)',
  slate200: 'rgb(226 232 240)',
  slate100: 'rgb(241 245 249)',
  white: '#ffffff',
};

// Precompute gradients WITHOUT backticks so JSX never sees an open `
const ACCENT_GRADIENT = 'linear-gradient(90deg, ' + BRAND.primary + ', ' + BRAND.primaryHover + ')';

/** PLACEHOLDER DATA (wire to Supabase later) */
const mockVendor = {
  company_name: 'BuildRight Construction Supplies',
  tagline: 'Trusted provider of high-quality building materials',
  logo: null,
  category: 'Building & Structural Materials',
  location: 'New York, NY',
  county: 'Kings County',
  rating: 4.8,
  review_count: 128,
  projects_completed: 89,
  response_time: '2 hrs',
  member_since: '2019',
  verified: true,
  badge: 'Verified',
  description:
    'BuildRight Construction Supplies has been a trusted provider of high-quality building materials and construction supplies for over 25 years. We pride ourselves on offering premium products at competitive prices, backed by exceptional customer service and technical expertise.',
  price_range: 'KSh 500K – 2M',
  certifications: [
    'LEED Certified Supplier',
    'Green Building Materials Provider',
    'ISO 9001:2015 Certified',
  ],
  phone: '+254 712 345 678',
  email: 'info@buildright.com',
  website: 'www.buildright.com',
  whatsapp: '+254 712 345 678',
  created_at: '2019-07-12T00:00:00.000Z',
};

const mockProducts = [
  { id: 1, name: 'Premium Portland Cement', blurb: 'High-strength cement for all construction needs', price: '$12.99 / bag', status: 'In Stock' },
  { id: 2, name: 'Structural Steel I-Beams', blurb: 'ASTM A36 certified, multiple sizes available', price: '$85.00 / ft', status: 'In Stock' },
  { id: 3, name: 'Engineered Hardwood Flooring', blurb: 'Premium oak, pre-finished, 5” wide planks', price: '$6.75 / sq.ft', status: 'In Stock' },
  { id: 4, name: 'Insulated Concrete Forms', blurb: 'Energy-efficient building system, R-value: 22+', price: '$28.50 / form', status: 'In Stock' },
];

const mockServices = [
  { title: 'Material Delivery', desc: 'Same-day and scheduled delivery options available for all products.' },
  { title: 'Project Consultation', desc: 'Expert advice on material selection and quantity estimation.' },
  { title: 'Custom Cutting & Fabrication', desc: 'On-site cutting and fabrication services for steel, lumber and more.' },
  { title: 'Equipment Rental', desc: 'Rent specialized tools and equipment for your project needs.' },
  { title: 'Contractor Referrals', desc: 'Connect with our network of trusted contractors.' },
];

const mockGallery = [
  { id: 1, title: 'Office Complex – Westlands' },
  { id: 2, title: 'Residential – Karen' },
  { id: 3, title: 'Warehouse – Industrial Area' },
  { id: 4, title: 'School Block – Kiambu' },
  { id: 5, title: 'Medical Center – Thika' },
];

const mockReviews = [
  { id: 1, name: 'John Mwangi', rating: 5, date: '2 weeks ago', text: 'Excellent work on our office renovation. Professional team, completed on time and within budget. Highly recommend!' },
  { id: 2, name: 'Sarah Kimani', rating: 5, date: '1 month ago', text: 'Built our dream home in Karen. Amazing attention to detail and quality craftsmanship. Great communication throughout.' },
  { id: 3, name: 'David Ochieng', rating: 4, date: '2 months ago', text: 'Good quality on our warehouse project. Minor weather delays but they kept us informed. Overall very satisfied.' },
];

const mockFAQ = [
  { q: 'What is your typical project lead time?', a: 'Small orders can be fulfilled same-day. Larger fabrication jobs typically require 3–7 business days.' },
  { q: 'Do you deliver outside Nairobi?', a: 'Yes. We support nationwide delivery with tiered pricing based on distance and load.' },
  { q: 'What warranty do your materials carry?', a: 'Most products include a manufacturer’s warranty. We can share specifics per item on request.' },
];

const tabs = ['Overview', 'Products', 'Services', 'Gallery', 'Reviews', 'FAQ'];

/** Utility */
function StarRow({ value = 0, size = 'text-base' }) {
  const full = Math.floor(Number(value) || 0);
  const half = (Number(value) || 0) - full >= 0.5;
  const empties = 5 - full - (half ? 1 : 0);

  return (
    <div className={'flex items-center ' + size}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={'f-' + i} className="w-4 h-4 fill-current" style={{ color: BRAND.primary }} />
      ))}
      {half ? <Star className="w-4 h-4 fill-current" style={{ color: BRAND.primary }} /> : null}
      {Array.from({ length: Math.max(0, empties) }).map((_, i) => (
        <Star key={'o-' + i} className="w-4 h-4 text-slate-300" />
      ))}
    </div>
  );
}

export default function VendorProfilePage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showPopup, setShowPopup] = useState(false);
  const vendor = useMemo(() => mockVendor, []);

  const statCard = (label, value, icon) => (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-center shadow-sm">
      <div className="mb-2 flex justify-center">{icon}</div>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top banner */}
      <div className="relative w-full bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-300">Zintra Verified Professionals</div>
            <div className="text-sm text-slate-300">Connecting you with trusted construction experts</div>
          </div>
          <div className="hidden gap-8 md:flex">
            <div className="text-center">
              <div className="text-xl font-semibold">2,500+</div>
              <div className="text-xs text-slate-300">Verified Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold">15,000+</div>
              <div className="text-xs text-slate-300">Projects Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Header card */}
      <div className="-mt-4">
        <div className="mx-auto max-w-7xl px-4">
          <div className="relative rounded-2xl bg-white p-6 shadow-lg">
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {/* Logo / initials */}
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-xl text-xl font-bold text-white shadow-md"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  {(vendor.company_name || '')
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-slate-900">{vendor.company_name}</h1>
                    {vendor.verified ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: BRAND.primary }}
                      >
                        <CheckCircle2 className="h-4 w-4" /> {vendor.badge || 'Verified'}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-slate-600">{vendor.tagline}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {vendor.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-4 w-4" /> {vendor.category}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4" style={{ color: BRAND.primary }} />
                      {(vendor.rating || 0).toFixed ? vendor.rating.toFixed(1) : vendor.rating} ({vendor.review_count} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-white shadow-sm md:w-auto"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <Mail className="h-4 w-4" />
                  Contact Vendor
                </button>

                <button
                  onClick={() => setShowPopup(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-50 md:w-auto"
                >
                  <FileText className="h-4 w-4" />
                  Request Quote
                </button>

                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-50 md:w-auto"
                  title="Save Vendor"
                >
                  <Bookmark className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
              {statCard('Rating', ((vendor.rating || 0).toFixed ? vendor.rating.toFixed(1) : vendor.rating) + ' / 5.0', <StarRow value={vendor.rating} />)}
              {statCard('Reviews', vendor.review_count, <Star className="h-5 w-5" style={{ color: BRAND.primary }} />)}
              {statCard('Projects', vendor.projects_completed, <ChevronRight className="h-5 w-5 text-slate-400" />)}
              {statCard('Response Time', vendor.response_time, <Clock className="h-5 w-5 text-slate-400" />)}
              {statCard('Member Since', vendor.member_since, <Award className="h-5 w-5 text-slate-400" />)}
            </div>

            {/* Tabs */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={'rounded-lg px-3 py-2 text-sm font-medium ' + (activeTab === t ? 'bg-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200')}
                  style={activeTab === t ? { border: '1px solid ' + BRAND.primary, color: BRAND.primary } : {}}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto mt-6 max-w-7xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          {/* LEFT */}
          <div className="flex flex-col gap-6">
            {activeTab === 'Overview' ? (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">About {vendor.company_name}</h3>
                <div className="mb-4 h-1 w-24 rounded" style={{ background: ACCENT_GRADIENT }} />
                <div className="mb-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{vendor.category}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">📍 {vendor.location}</span>
                </div>
                <p className="text-slate-700">{vendor.description}</p>
              </section>
            ) : null}

            {activeTab === 'Overview' || activeTab === 'Products' ? (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Featured Products</h3>
                <div className="mb-4 h-1 w-24 rounded" style={{ background: ACCENT_GRADIENT }} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {mockProducts.map((p) => (
                    <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 h-28 w-full rounded-lg bg-slate-100" />
                      <div className="mb-1 text-sm font-medium text-slate-900">{p.name}</div>
                      <div className="mb-3 text-sm text-slate-600">{p.blurb}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{p.price}</span>
                        <span className="rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: BRAND.primary }}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {activeTab === 'Overview' ? (
                  <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                    View all products <ChevronRight className="h-4 w-4" />
                  </button>
                ) : null}
              </section>
            ) : null}

            {activeTab === 'Overview' || activeTab === 'Services' ? (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Services Offered</h3>
                <div className="mb-4 h-1 w-24 rounded" style={{ background: ACCENT_GRADIENT }} />
                <ul className="space-y-3">
                  {mockServices.map((s, i) => (
                    <li key={i} className="rounded-lg border border-slate-200 p-3">
                      <div className="font-medium text-slate-900">{s.title}</div>
                      <div className="text-sm text-slate-600">{s.desc}</div>
                    </li>
                  ))}
                </ul>
                {activeTab === 'Overview' ? (
                  <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                    View all services <ChevronRight className="h-4 w-4" />
                  </button>
                ) : null}
              </section>
            ) : null}

            {activeTab === 'Overview' || activeTab === 'Gallery' ? (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Project Gallery</h3>
                <div className="mb-4 h-1 w-24 rounded" style={{ background: ACCENT_GRADIENT }} />
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {mockGallery.map((g) => (
                    <div key={g.id} className="min-w-[180px] rounded-lg bg-slate-100 p-3 text-center text-sm text-slate-600">
                      {g.title}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === 'Overview' || activeTab === 'Reviews' ? (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Customer Reviews</h3>
                <div className="mb-4 h-1 w-24 rounded" style={{ background: ACCENT_GRADIENT }} />
                <div className="mb-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-4xl font-semibold" style={{ color: BRAND.primary }}>
                      {(vendor.rating || 0).toFixed ? vendor.rating.toFixed(1) : vendor.rating}
                    </div>
                    <StarRow value={vendor.rating} />
                    <div className="text-sm text-slate-600">Based on {vendor.review_count} reviews</div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50">
                    <Share2 className="h-4 w-4" />
                    Share vendor
                  </button>
                </div>
                <div className="space-y-5">
                  {mockReviews.map((r) => (
                    <div key={r.id} className="border-b border-slate-200 pb-5 last:border-0 last:pb-0">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: BRAND.primary }}>
                            {r.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{r.name}</div>
                            <StarRow value={r.rating} size="text-xs" />
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">{r.date}</div>
                      </div>
                      <p className="text-sm text-slate-700">{r.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === 'Overview' || activeTab === 'FAQ' ? (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">FAQ</h3>
                <div className="mb-4 h-1 w-24 rounded" style={{ background: ACCENT_GRADIENT }} />
                <Accordion items={mockFAQ} />
              </section>
            ) : null}
          </div>

          {/* RIGHT: sidebar */}
          <aside className="flex flex-col gap-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h4 className="mb-2 text-base font-semibold text-slate-900">Contact Information</h4>
              <div className="mb-4 h-1 w-20 rounded" style={{ background: ACCENT_GRADIENT }} />
              <SidebarItem icon={<Phone className="h-4 w-4" />} title={vendor.phone} subtitle="Primary Phone" />
              <SidebarItem icon={<Mail className="h-4 w-4" />} title={vendor.email} subtitle="Business Email" />
              <SidebarItem icon={<Globe className="h-4 w-4" />} title={vendor.website} subtitle="Company Website" />
              <SidebarItem icon={<MessageSquare className="h-4 w-4" />} title="WhatsApp Business" subtitle={vendor.whatsapp} />
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h4 className="mb-2 text-base font-semibold text-slate-900">Price Range</h4>
              <div className="mb-4 h-1 w-20 rounded" style={{ background: ACCENT_GRADIENT }} />
              <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4 text-center">
                <div className="text-sm text-slate-700">Typical Project Range</div>
                <div className="mt-1 text-xl font-semibold text-orange-800">{vendor.price_range}</div>
                <div className="mt-1 text-xs text-slate-600">Varies by project scope and complexity</div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h4 className="mb-2 text-base font-semibold text-slate-900">Certifications & Awards</h4>
              <div className="mb-4 h-1 w-20 rounded" style={{ background: ACCENT_GRADIENT }} />
              <ul className="space-y-2">
                {(vendor.certifications || []).map((c, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <Award className="h-4 w-4 text-slate-500" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h4 className="mb-2 text-base font-semibold text-slate-900">Actions</h4>
              <div className="mb-4 h-1 w-20 rounded" style={{ background: ACCENT_GRADIENT }} />
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowPopup(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-white shadow-sm"
                  style={{ backgroundColor: BRAND.primary }}
                >
                  <FileText className="h-4 w-4" />
                  Request Quote
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">Zintra</span>
              <span className="text-slate-400">•</span>
              <span>Connecting construction professionals with quality materials and services.</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:underline">How it works</Link>
              <Link href="#" className="hover:underline">Browse categories</Link>
              <Link href="#" className="hover:underline">Help Center</Link>
            </div>
          </div>
        </div>

        {/* Popup */}
        {showPopup ? (
          <DirectRFQPopup
            isOpen={showPopup}
            onClose={() => setShowPopup(false)}
            vendor={vendor}
          />
        ) : null}
      </div>
    </div>
  );
}

/** Small helpers */
function SidebarItem({ icon, title, subtitle }) {
  if (!title && !subtitle) return null;

  return (
    <div className="flex items-start gap-3 border-b border-slate-200 py-3 last:border-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div>
        {title ? <div className="text-sm font-medium text-slate-900">{title}</div> : null}
        {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
      </div>
    </div>
  );
}

function Accordion({ items }) {
  const [open, setOpen] = useState(-1);

  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={'faq-' + i}>
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-medium text-slate-900">{it.q}</span>
              {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>
            {isOpen ? <div className="px-4 pb-4 text-sm text-slate-700">{it.a}</div> : null}
          </div>
        );
      })}
    </div>
  );
}