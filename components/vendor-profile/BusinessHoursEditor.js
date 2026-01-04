'use client';

import { X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_DAYS = [
  { day: 'Monday', hours: '9:00 AM - 5:00 PM' },
  { day: 'Tuesday', hours: '9:00 AM - 5:00 PM' },
  { day: 'Wednesday', hours: '9:00 AM - 5:00 PM' },
  { day: 'Thursday', hours: '9:00 AM - 5:00 PM' },
  { day: 'Friday', hours: '9:00 AM - 5:00 PM' },
  { day: 'Saturday', hours: 'Closed' },
  { day: 'Sunday', hours: 'Closed' },
];

const COMMON_HOURS = [
  '9:00 AM - 5:00 PM',
  '8:00 AM - 6:00 PM',
  '7:00 AM - 7:00 PM',
  '10:00 AM - 4:00 PM',
  'Closed',
  '24 Hours',
];

export default function BusinessHoursEditor({ vendor, onClose, onSuccess }) {
  const [hours, setHours] = useState(
    vendor.business_hours && Array.isArray(vendor.business_hours) && vendor.business_hours.length > 0
      ? vendor.business_hours
      : DEFAULT_DAYS
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (idx, field, value) => {
    const updated = [...hours];
    updated[idx] = { ...updated[idx], [field]: value };
    setHours(updated);
    setError('');
  };

  const handleAddDay = () => {
    setHours([...hours, { day: '', hours: '' }]);
  };

  const handleRemoveDay = (idx) => {
    if (hours.length > 1) {
      setHours(hours.filter((_, i) => i !== idx));
      setError('');
    } else {
      setError('Must have at least one day entry');
    }
  };

  const validateHours = () => {
    // Check if all fields are filled
    const incomplete = hours.some(h => !h.day?.trim() || !h.hours?.trim());
    if (incomplete) {
      setError('All fields must be filled');
      return false;
    }

    // Check for duplicate days
    const days = hours.map(h => h.day?.trim().toLowerCase());
    const uniqueDays = new Set(days);
    if (uniqueDays.size !== days.length) {
      setError('Duplicate days found');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateHours()) return;

    setLoading(true);
    setError('');

    try {
      const { data: updated, error: updateError } = await supabase
        .from('vendors')
        .update({ business_hours: hours })
        .eq('id', vendor.id)
        .select()
        .single();

      if (updateError) throw updateError;

      onSuccess(updated);
    } catch (err) {
      console.error('Save hours failed:', err);
      setError(err.message || 'Failed to save business hours');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">Edit Business Hours</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Help Text */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Tip:</strong> Enter the day name and hours for your business. Use "Closed" for days you don't operate.
            </p>
          </div>

          {/* Hours Entries */}
          <div className="space-y-3">
            {hours.map((hour, idx) => (
              <div key={idx} className="flex gap-3 items-end">
                {/* Day Dropdown */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Day</label>
                  <select
                    value={hour.day || ''}
                    onChange={(e) => handleChange(idx, 'day', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
                  >
                    <option value="">-- Select Day --</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                {/* Hours Input or Dropdown */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Hours</label>
                  <select
                    value={hour.hours || ''}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        handleChange(idx, 'hours', '');
                      } else {
                        handleChange(idx, 'hours', e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
                  >
                    <option value="">-- Select Hours --</option>
                    {COMMON_HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                </div>

                {/* Custom Hours Input (if custom selected) */}
                {hour.hours && !COMMON_HOURS.includes(hour.hours) && (
                  <div className="flex-1">
                    <input
                      type="text"
                      value={hour.hours || ''}
                      onChange={(e) => handleChange(idx, 'hours', e.target.value)}
                      placeholder="e.g., 9:00 AM - 5:00 PM"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveDay(idx)}
                  disabled={hours.length === 1}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Remove this day"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Day Button */}
          <button
            onClick={handleAddDay}
            className="w-full py-2 px-4 border border-dashed border-amber-300 rounded-lg hover:bg-amber-50 flex items-center justify-center gap-2 text-amber-700 font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Another Day
          </button>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Hours'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
