'use client';

import { useState } from 'react';
import { Upload, Send } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function VendorRFQResponseForm({ rfqId }) {
  const [form, setForm] = useState({
    amount: '',
    message: '',
    timeline: '',
    terms: '',
    file: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rfqId) return;

    try {
      setSubmitting(true);
      setStatus('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('❌ Please log in to send a quote');
        setSubmitting(false);
        return;
      }

      const combinedMessage = [form.message, form.timeline ? `Timeline: ${form.timeline}` : null, form.terms ? `Terms: ${form.terms}` : null]
        .filter(Boolean)
        .join('\n');

      const { error } = await supabase.from('rfq_responses').insert([{
        rfq_id: rfqId,
        vendor_id: user.id,
        amount: parseFloat(form.amount),
        message: combinedMessage,
        status: 'submitted',
        attachment_url: null,
      }]);

      if (error) {
        setStatus(`❌ Error submitting quote: ${error.message}`);
        setSubmitting(false);
        return;
      }

      setStatus('✅ Quote submitted successfully');
      setForm({ amount: '', message: '', timeline: '', terms: '', file: null });
      setSubmitting(false);
    } catch (err) {
      console.error('Quote submit error:', err);
      setStatus(`❌ Error: ${err.message}`);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status && (
        <div className={`p-3 rounded-lg text-sm ${status.startsWith('❌') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {status}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quote Amount (KSh)
        </label>
        <input
          type="number"
          required
          className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quote Breakdown / Message
        </label>
        <textarea
          rows="4"
          className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="Include breakdown (labor, materials), assumptions, and key notes..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeline to Complete
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="e.g., 3 weeks from start"
            value={form.timeline}
            onChange={(e) => setForm({ ...form, timeline: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Terms
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="e.g., 50% deposit, balance on completion"
            value={form.terms}
            onChange={(e) => setForm({ ...form, terms: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attachment (optional)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
            className="text-sm text-gray-600"
          />
          <Upload className="w-4 h-4 text-gray-500" />
        </div>
        {form.file && <p className="text-xs text-gray-500 mt-1">{form.file.name}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-60"
      >
        <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Quote'}
      </button>
    </form>
  );
}
