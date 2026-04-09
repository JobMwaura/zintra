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
  X,
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
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageVendor, setMessageVendor] = useState(null);
  const [messageBody, setMessageBody] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setMessage('');
      const { data, error, count } = await supabase
        .from('vendors')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (error) {
        setMessage(`Error loading vendors: ${error.message}`);
        setLoading(false);
        return;
      }
      console.log('Total vendors in database:', count);
      console.log('Vendors fetched:', data?.length);
      console.log('Active vendors:', data?.filter(v => v.status === 'active').length);
      console.log('Vendors data:', data);
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
    const base = vendors.filter((v) => {
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
    return base.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'rating':
          return ((a.rating || 0) - (b.rating || 0)) * dir;
        case 'rfqs':
          return ((a.rfqs_completed || a.rfqs_received || 0) - (b.rfqs_completed || b.rfqs_received || 0)) * dir;
        case 'revenue':
          return ((a.revenue || 0) - (b.revenue || 0)) * dir;
        case 'created_at':
        default:
          return ((new Date(a.created_at || 0)) - (new Date(b.created_at || 0))) * dir;
      }
    });
  }, [vendors, search, statusFilter, categoryFilter, countyFilter, planFilter, ratingFilter, sortDir, sortKey]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(vendors.map((v) => v.category).filter(Boolean)))],
    [vendors]
  );
  const counties = useMemo(
    () => ['all', ...Array.from(new Set(vendors.map((v) => v.county).filter(Boolean)))],
    [vendors]
  );

  const summaryStats = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => (v.status || 'pending') === 'active').length;
    const pending = vendors.filter((v) => (v.status || 'pending') === 'pending').length;
    const flagged = vendors.filter((v) => (v.status || 'pending') === 'flagged').length;
    const avgRating =
      vendors.length > 0
        ? (vendors.reduce((sum, v) => sum + (Number(v.rating) || 0), 0) / vendors.length).toFixed(1)
        : '—';
    return { total, active, pending, flagged, avgRating };
  }, [vendors]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setCountyFilter('all');
    setPlanFilter('all');
    setRatingFilter('all');
  };

  const statusColor = (status = 'pending') => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'suspended':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'flagged':
        return 'bg-orange-50 text-orange-700 border border-orange-100';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  const summaryCounts = useMemo(() => {
    const byStatus = vendors.reduce((acc, v) => {
      const key = v.status || 'pending';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return byStatus;
  }, [vendors]);

  const openMessageModal = (vendor) => {
    setMessageVendor(vendor);
    setMessageBody('');
    setMessageStatus('');
    setShowMessageModal(true);
  };

  const sendMessage = async () => {
    if (!messageVendor) return;
    if (!messageBody.trim()) {
      setMessageStatus('Please enter a message.');
      return;
    }
    try {
      setSending(true);
      setMessageStatus('');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setMessageStatus('You must be signed in as admin to send messages.');
        setSending(false);
        return;
      }

      // Create/find conversation
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('admin_id', user.id)
        .eq('vendor_id', messageVendor.user_id || messageVendor.id)
        .maybeSingle();

      let conversationId = conv?.id;
      if (!conversationId) {
        const { data: newConv, error: convErr } = await supabase
          .from('conversations')
          .insert([{
            admin_id: user.id,
            vendor_id: messageVendor.user_id || messageVendor.id,
            subject: `Message to ${messageVendor.company_name || 'Vendor'}`,
          }])
          .select()
          .maybeSingle();
        if (convErr) throw convErr;
        conversationId = newConv?.id;
      }

      const { error: msgErr } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          recipient_id: messageVendor.user_id || messageVendor.id,
          conversation_id: conversationId,
          body: messageBody.trim(),
          message_type: 'admin_to_vendor',
        }]);
      if (msgErr) throw msgErr;

      setMessageStatus('Message sent.');
      setMessageBody('');
      setTimeout(() => setShowMessageModal(false), 800);
    } catch (err) {
      setMessageStatus(`Error sending message: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-gradient-to-r from-orange-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <Link href="/admin/dashboard" className="hidden md:inline-flex items-center text-sm text-orange-700 hover:text-orange-800 mt-1">
                ← Dashboard
              </Link>
              <div>
                <p className="text-xs uppercase tracking-wide text-orange-600 font-semibold">Control Center</p>
                <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
                <p className="text-sm text-gray-600">Search, filter, moderate, and manage vendors</p>
                <Link href="/admin/dashboard" className="md:hidden inline-flex items-center text-sm text-orange-700 hover:text-orange-800 mt-2">
                  ← Back to dashboard
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <button
                onClick={() => updateVendor(selected, { status: 'active', verified: true })}
                disabled={!selected.length}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50 shadow-sm"
              >
                Bulk Approve
              </button>
              <button
                onClick={() => updateVendor(selected, { status: 'suspended' })}
                disabled={!selected.length}
                className="px-3 py-2 rounded-lg bg-amber-500 text-white disabled:opacity-50 shadow-sm"
              >
                Bulk Suspend
              </button>
              <button
                onClick={() => updateVendor(selected, { status: 'flagged' })}
                disabled={!selected.length}
                className="px-3 py-2 rounded-lg bg-orange-500 text-white disabled:opacity-50 shadow-sm"
              >
                Bulk Flag
              </button>
              <button
                onClick={exportCSV}
                disabled={!filtered.length}
                className="px-3 py-2 rounded-lg bg-white text-gray-800 border border-gray-200 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 bg-white shadow-sm rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Total Vendors</p>
              <p className="text-2xl font-semibold text-gray-900">{summaryStats.total}</p>
              <p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active {summaryStats.active}</p>
            </div>
            <div className="p-4 bg-white shadow-sm rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Pending Review</p>
              <p className="text-2xl font-semibold text-gray-900">{summaryStats.pending}</p>
              <p className="text-xs text-orange-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Flagged {summaryStats.flagged}</p>
            </div>
            <div className="p-4 bg-white shadow-sm rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Average Rating</p>
              <p className="text-2xl font-semibold text-gray-900 flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> {summaryStats.avgRating}
              </p>
              <p className="text-xs text-gray-500">Based on current listings</p>
            </div>
            <div className="p-4 bg-white shadow-sm rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Filters Applied</p>
              <p className="text-2xl font-semibold text-gray-900">
                {[statusFilter, planFilter, ratingFilter, categoryFilter, countyFilter].filter((v) => v !== 'all').length}
              </p>
              <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">Reset filters</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {message && (
          <div className="p-3 border rounded text-sm bg-amber-50 text-amber-800 border-amber-200">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100 space-y-4 lg:col-span-2">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, phone, ID..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-gray-50"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2 lg:mt-0">
                  {[statusFilter, planFilter, ratingFilter, categoryFilter, countyFilter]
                    .filter((f) => f !== 'all')
                    .map((chip) => (
                      <span key={chip} className="px-3 py-1 rounded-full text-xs bg-orange-50 text-orange-700 border border-orange-100">
                        {chip}
                      </span>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2 text-sm">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Status</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-2 bg-white">
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Plan</label>
                  <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-2 bg-white">
                    {planOptions.map((p) => (
                      <option key={p} value={p}>{p === 'all' ? 'All plans' : p}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Rating</label>
                  <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-2 bg-white">
                    {ratingOptions.map((r) => (
                      <option key={r} value={r}>{r === 'all' ? 'All ratings' : r}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Category</label>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-2 bg-white">
                    {categories.map((c) => (
                      <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">County</label>
                  <select value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-2 bg-white">
                    {counties.map((c) => (
                      <option key={c} value={c}>{c === 'all' ? 'All counties' : c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={fetchVendors}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4" /> Refresh data
                </button>
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                >
                  Clear filters
                </button>
                <span className="text-xs text-gray-500">Showing {filtered.length} of {vendors.length} vendors</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Quick Actions</p>
            <div className="flex flex-col gap-2 text-sm">
              <button onClick={() => updateVendor(selected, { verified: true })} disabled={!selected.length} className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50">
                Verify selected
              </button>
              <button onClick={exportCSV} disabled={!filtered.length} className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button onClick={() => alert('Announcements coming soon')} className="px-3 py-2 border rounded hover:bg-gray-50">
                Send announcement
              </button>
              <button onClick={() => alert('Reports coming soon')} className="px-3 py-2 border rounded hover:bg-gray-50">
                Performance report
              </button>
            </div>
            <div className="border-t pt-3 text-xs text-gray-600 space-y-1">
              <p>Status: active {summaryCounts.active || 0}</p>
              <p>Status: pending {summaryCounts.pending || 0}</p>
              <p>Status: suspended {summaryCounts.suspended || 0}</p>
              <p>Status: flagged {summaryCounts.flagged || 0}</p>
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
                  <th className="px-4 py-2 text-left cursor-pointer" onClick={() => { setSortKey('company_name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    Vendor
                  </th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Plan</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left cursor-pointer" onClick={() => { setSortKey('rating'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    Rating
                  </th>
                  <th className="px-4 py-2 text-left cursor-pointer" onClick={() => { setSortKey('rfqs'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    RFQs
                  </th>
                  <th className="px-4 py-2 text-left cursor-pointer" onClick={() => { setSortKey('revenue'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    Revenue
                  </th>
                  <th className="px-4 py-2 text-left cursor-pointer" onClick={() => { setSortKey('created_at'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
                    Joined
                  </th>
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

      {/* Message Modal */}
      {showMessageModal && messageVendor && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Message vendor</p>
                <h3 className="text-lg font-semibold text-gray-900">{messageVendor.company_name || 'Vendor'}</h3>
              </div>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows="4"
                placeholder="Type your message to the vendor..."
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
              />
              {messageStatus && (
                <div className={`text-sm ${messageStatus.startsWith('Error') ? 'text-red-600' : 'text-gray-700'}`}>
                  {messageStatus}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2 justify-end">
              <button
                onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={sending}
                className="px-4 py-2 rounded-lg text-white font-semibold"
                style={{ backgroundColor: '#7c3aed', opacity: sending ? 0.6 : 1 }}
              >
                {sending ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </div>
        </div>
      )}
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
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(vendor.status)}`}>
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
                        <button onClick={() => openMessageModal(vendor)} className="text-purple-700 inline-flex items-center gap-1">
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
