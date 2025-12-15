'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import {
  Search,
  Filter,
  MapPin,
  Star,
  CheckCircle,
  AlertTriangle,
  Eye,
  PauseCircle,
  Trash2,
  Mail,
  Shield,
  User,
  Download,
  MessageSquare,
} from 'lucide-react';

const statusOptions = ['all', 'pending', 'active', 'suspended', 'rejected', 'flagged'];
const planOptions = ['all', 'Free', 'Basic', 'Premium', 'Diamond'];
const ratingOptions = ['all', '4.5+', '4.0+', '3.5+', '3.0+'];

export default function VendorsAdminPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [detailVendor, setDetailVendor] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setMessage('');
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        setMessage(`Error loading vendors: ${error.message}`);
        setLoading(false);
        return;
      }
      setVendors(data || []);
      setSelected([]);
      setLoading(false);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  const updateVendor = async (ids, payload) => {
    if (!ids.length) return;
    const { error } = await supabase.from('vendors').update(payload).in('id', ids);
    if (error) {
      setMessage(`Error updating vendor(s): ${error.message}`);
      return false;
    }
    setMessage(`Updated ${ids.length} vendor(s)`);
    fetchVendors();
    return true;
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const exportCSV = () => {
    const headers = ['Company Name', 'Email', 'Phone', 'Category', 'County', 'Location', 'Plan', 'Status', 'Rating', 'Joined'];
    const rows = filtered.map((v) => [
      v.company_name || '',
      v.email || '',
      v.phone || '',
      v.category || '',
      v.county || '',
      v.location || '',
      v.subscription_plan || v.plan || 'Free',
      v.status || 'pending',
      v.rating || '',
      v.created_at ? new Date(v.created_at).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vendors.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const ratingPass = (rating) => {
    if (ratingFilter === 'all') return true;
    const threshold = parseFloat(ratingFilter);
    return (rating || 0) >= threshold;
  };

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        (v.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.phone || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.id || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (v.status || 'pending') === statusFilter;
      const matchesCategory = categoryFilter === 'all' || (v.category || '').toLowerCase() === categoryFilter.toLowerCase();
      const matchesCounty = countyFilter === 'all' || (v.county || '').toLowerCase() === countyFilter.toLowerCase();
      const matchesPlan = planFilter === 'all' || (v.subscription_plan || v.plan || 'Free').toLowerCase() === planFilter.toLowerCase();
      const matchesRating = ratingPass(v.rating);
      return matchesSearch && matchesStatus && matchesCategory && matchesCounty && matchesPlan && matchesRating;
    });
  }, [vendors, search, statusFilter, categoryFilter, countyFilter, planFilter, ratingFilter]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(vendors.map((v) => v.category).filter(Boolean)))],
    [vendors]
  );
  const counties = useMemo(
    () => ['all', ...Array.from(new Set(vendors.map((v) => v.county).filter(Boolean)))],
    [vendors]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
            <p className="text-sm text-gray-600">Search, filter, moderate, and manage vendors</p>
          </div>
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => updateVendor(selected, { status: 'active' })}
              disabled={!selected.length}
              className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50"
            >
              Bulk Approve
            </button>
            <button
              onClick={() => updateVendor(selected, { status: 'suspended' })}
              disabled={!selected.length}
              className="px-3 py-2 rounded bg-yellow-600 text-white disabled:opacity-50"
            >
              Bulk Suspend
            </button>
            <button
              onClick={() => updateVendor(selected, { status: 'flagged' })}
              disabled={!selected.length}
              className="px-3 py-2 rounded bg-orange-600 text-white disabled:opacity-50"
            >
              Bulk Flag
            </button>
            <button
              onClick={exportCSV}
              disabled={!filtered.length}
              className="px-3 py-2 rounded bg-slate-200 text-slate-800 disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {message && (
          <div className="p-3 border rounded text-sm bg-amber-50 text-amber-800 border-amber-200">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, ID..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2">
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
                ))}
              </select>
              <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2">
                {planOptions.map((p) => (
                  <option key={p} value={p}>{p === 'all' ? 'All plans' : p}</option>
                ))}
              </select>
              <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2">
                {ratingOptions.map((r) => (
                  <option key={r} value={r}>{r === 'all' ? 'All ratings' : r}</option>
                ))}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2">
                {categories.map((c) => (
                  <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
                ))}
              </select>
              <select value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2">
                {counties.map((c) => (
                  <option key={c} value={c}>{c === 'all' ? 'All counties' : c}</option>
                ))}
              </select>
              <button
                onClick={fetchVendors}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onChange={(e) =>
                        setSelected(e.target.checked ? filtered.map((v) => v.id) : [])
                      }
                    />
                  </th>
                  <th className="px-4 py-2 text-left">Vendor</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Plan</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Rating</th>
                  <th className="px-4 py-2 text-left">RFQs</th>
                  <th className="px-4 py-2 text-left">Revenue</th>
                  <th className="px-4 py-2 text-left">Joined</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-6 text-center text-gray-600">Loading vendors...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-6 text-center text-gray-600">No vendors found.</td>
                  </tr>
                ) : (
                  filtered.map((vendor) => (
                    <tr key={vendor.id}>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selected.includes(vendor.id)}
                          onChange={() => toggleSelect(vendor.id)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-semibold text-gray-900 flex items-center gap-1">
                          {vendor.company_name || 'Vendor'}
                          {(vendor.verified || vendor.verification_status === 'verified') && (
                            <Shield className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {vendor.email || 'No email'}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" /> {vendor.phone || 'No phone'}
                        </div>
                      </td>
                      <td className="px-4 py-2">{vendor.category || '—'}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 text-gray-700">
                          <MapPin className="w-4 h-4 text-gray-400" /> {vendor.location || '—'}
                        </div>
                        <div className="text-xs text-gray-500">{vendor.county || ''}</div>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {vendor.subscription_plan || vendor.plan || 'Free'}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {vendor.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 text-sm text-gray-800">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {vendor.rating || '—'}
                        </div>
                        <div className="text-xs text-gray-500">{vendor.review_count || 0} reviews</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {vendor.rfqs_completed || vendor.rfqs_received || 0}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {vendor.revenue ? `KSh ${Number(vendor.revenue).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2 space-x-2 text-xs">
                        <Link href={`/vendor-profile/${vendor.id}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                          <Eye className="w-4 h-4" /> View
                        </Link>
                        <button onClick={() => updateVendor([vendor.id], { status: 'active' })} className="text-green-700 inline-flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Verify
                        </button>
                        <button onClick={() => updateVendor([vendor.id], { status: 'suspended' })} className="text-yellow-700 inline-flex items-center gap-1">
                          <PauseCircle className="w-4 h-4" /> Suspend
                        </button>
                        <button onClick={() => updateVendor([vendor.id], { status: 'flagged' })} className="text-orange-700 inline-flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Flag
                        </button>
                        <button onClick={() => setDetailVendor(vendor)} className="text-gray-700 inline-flex items-center gap-1">
                          <Filter className="w-4 h-4" /> Details
                        </button>
                        <button onClick={() => alert('Messaging coming soon')} className="text-purple-700 inline-flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" /> Message
                        </button>
                        <button onClick={() => updateVendor([vendor.id], { status: 'deleted' })} className="text-red-700 inline-flex items-center gap-1">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Drawer */}
        {detailVendor && (
          <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
            <div className="w-full max-w-md bg-white h-full shadow-xl overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{detailVendor.company_name}</h3>
                  <p className="text-xs text-gray-500">{detailVendor.email}</p>
                </div>
                <button onClick={() => setDetailVendor(null)} className="text-gray-500 text-sm">Close</button>
              </div>
              <div className="p-4 space-y-4 text-sm text-gray-800">
                <div>
                  <p className="font-semibold text-gray-900">Status & Verification</p>
                  <p>Status: {detailVendor.status || 'pending'}</p>
                  <p>Verified: {detailVendor.verified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Contact</p>
                  <p>{detailVendor.phone}</p>
                  <p>{detailVendor.location}{detailVendor.county ? `, ${detailVendor.county}` : ''}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Plan & Billing</p>
                  <p>Plan: {detailVendor.subscription_plan || detailVendor.plan || 'Free'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Performance</p>
                  <p>Quote acceptance: {detailVendor.quote_acceptance_rate || '—'}</p>
                  <p>Avg response time: {detailVendor.response_time || '—'}</p>
                  <p>Revenue: {detailVendor.revenue ? `KSh ${Number(detailVendor.revenue).toLocaleString()}` : '—'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">RFQs</p>
                  <p>RFQs received: {detailVendor.rfqs_received || 0}</p>
                  <p>RFQs responded: {detailVendor.rfqs_responded || 0}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Compliance</p>
                  <p>Flags: {detailVendor.flags || 0}</p>
                  <p>Suspensions: {detailVendor.suspensions || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
