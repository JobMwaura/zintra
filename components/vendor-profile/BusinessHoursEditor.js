'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function BusinessHoursEditor({ vendor, onClose, onSuccess }) {
  const [hours, setHours] = useState(vendor.business_hours || []);
  const [loading, setLoading] = useState(false);

  const handleChange = (idx, field, value) => {
    const updated = [...hours];
    updated[idx] = { ...updated[idx], [field]: value };
    setHours(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: updated, error } = await supabase
        .from('vendors')
        .update({ business_hours: hours })
        .eq('id', vendor.id)
        .select()
        .single();

      if (error) throw error;
      onSuccess(updated);
    } catch (err) {
      console.error('Save hours failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">Business Hours</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {hours.map((hour, idx) => (
            <div key={idx} className="flex gap-4">
              <input
                type="text"
                value={hour.day || ''}
                onChange={(e) => handleChange(idx, 'day', e.target.value)}
                placeholder="Day"
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                value={hour.hours || ''}
                onChange={(e) => handleChange(idx, 'hours', e.target.value)}
                placeholder="Hours"
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Hours'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
