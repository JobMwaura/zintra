'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function ServiceUploadModal({ vendor, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setError('Service name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: service, error: saveError } = await supabase
        .from('vendor_services')
        .insert([
          {
            vendor_id: vendor.id,
            name: form.name,
            description: form.description,
          },
        ])
        .select()
        .single();

      if (saveError) throw saveError;
      onSuccess(service);
    } catch (err) {
      console.error('Service save failed:', err);
      setError(err.message || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Add Service</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Service Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Material Delivery"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe this service..."
              rows="4"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
