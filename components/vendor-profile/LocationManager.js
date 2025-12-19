'use client';

import { X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LocationManager({ vendor, onClose, onSuccess }) {
  const [locations, setLocations] = useState(vendor.locations || []);
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      setLocations([...locations, newLocation]);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (idx) => {
    setLocations(locations.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: updated, error } = await supabase
        .from('vendors')
        .update({ locations })
        .eq('id', vendor.id)
        .select()
        .single();

      if (error) throw error;
      onSuccess(updated);
    } catch (err) {
      console.error('Save locations failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">Manage Locations</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Add new location"
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg"
            />
            <button
              onClick={handleAddLocation}
              className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {locations.map((location, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-900">{location}</span>
                <button
                  onClick={() => handleRemoveLocation(idx)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

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
              {loading ? 'Saving...' : 'Save Locations'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
