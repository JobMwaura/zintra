'use client';

import { X, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CertificationManager({ vendor, onClose, onSuccess }) {
  const [certifications, setCertifications] = useState(vendor.certifications || []);
  const [formData, setFormData] = useState({ name: '', issuer: '', date: '' });
  const [loading, setLoading] = useState(false);

  const handleAddCert = () => {
    if (formData.name.trim()) {
      setCertifications([...certifications, formData]);
      setFormData({ name: '', issuer: '', date: '' });
    }
  };

  const handleRemoveCert = (idx) => {
    setCertifications(certifications.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: updated, error } = await supabase
        .from('vendors')
        .update({ certifications })
        .eq('id', vendor.id)
        .select()
        .single();

      if (error) throw error;
      onSuccess(updated);
    } catch (err) {
      console.error('Save certifications failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">Certifications</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Certification name"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              placeholder="Issuing organization"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg"
            />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg"
            />
            <button
              onClick={handleAddCert}
              className="w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
            >
              Add Certification
            </button>
          </div>

          <div className="space-y-2">
            {certifications.map((cert, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">{cert.name}</p>
                  <p className="text-sm text-slate-600">{cert.issuer}</p>
                  {cert.date && <p className="text-xs text-slate-500">{cert.date}</p>}
                </div>
                <button
                  onClick={() => handleRemoveCert(idx)}
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
              {loading ? 'Saving...' : 'Save Certifications'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
