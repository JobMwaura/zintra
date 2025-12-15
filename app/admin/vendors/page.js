'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Search, Filter, Shield, MapPin, Star, CheckCircle, AlertTriangle, Eye, PauseCircle, PlayCircle, Trash2, Mail } from 'lucide-react';

const statusOptions = ['all', 'pending', 'active', 'suspended', 'rejected', 'flagged'];

export default function VendorsAdminPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

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

  const updateStatus = async (ids, status) => {
    if (!ids.length) return;
    const { error } = await supabase.from('vendors').update({ status }).in('id', ids);
    if (error) {
      setMessage(`Error updating status: ${error.message}`);
      return;
    }
    setMessage(`Updated ${ids.length} vendor(s) to ${status}`);
    fetchVendors();
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        (v.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.phone || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (v.status || 'pending') === statusFilter;
      const matchesCategory = categoryFilter === 'all' || (v.category || '').toLowerCase() === categoryFilter.toLowerCase();
      const matchesCounty = countyFilter === 'all' || (v.county || '').toLowerCase() === countyFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesCategory && matchesCounty;
    });
  }, [vendors, search, statusFilter, categoryFilter, countyFilter]);

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
            <p className="text-sm text-gray-600">Search, filter, and moderate vendors</p>
          </div>
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => updateStatus(selected, 'active')}
              disabled={!selected.length}
              className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50"
            >
              Bulk Approve
            </button>
            <button
              onClick={() => updateStatus(selected, 'suspended')}
              disabled={!selected.length}
              className="px-3 py-2 rounded bg-yellow-600 text-white disabled:opacity-50"
            >
              Bulk Suspend
            </button>
            <button
              onClick={() => updateStatus(selected, 'flagged')}
              disabled={!selected.length}
              className="px-3 py-2 rounded bg-orange-600 text-white disabled:opacity-50"
            >
              Bulk Flag
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
                placeholder="Search by name, email, phone..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2">
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>
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
                  <th className="px-4 py-2 text-left">Joined</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-600">Loading vendors...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-600">No vendors found.</td>
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
                        <div className="font-semibold text-gray-900">{vendor.company_name || 'Vendor'}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {vendor.email || 'No email'}
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
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <Link href={`/vendor-profile/${vendor.id}`} className="text-blue-600 hover:underline text-xs inline-flex items-center gap-1">
                          <Eye className="w-4 h-4" /> View
                        </Link>
                        <button onClick={() => updateStatus([vendor.id], 'active')} className="text-green-700 text-xs inline-flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => updateStatus([vendor.id], 'suspended')} className="text-yellow-700 text-xs inline-flex items-center gap-1">
                          <PauseCircle className="w-4 h-4" /> Suspend
                        </button>
                        <button onClick={() => updateStatus([vendor.id], 'flagged')} className="text-orange-700 text-xs inline-flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Flag
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
