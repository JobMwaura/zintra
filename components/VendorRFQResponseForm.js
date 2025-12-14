'use client';

import { useState } from 'react';
import { Upload, Send } from 'lucide-react';

export default function VendorRFQResponseForm({ rfqId }) {
  const [form, setForm] = useState({ amount: '', message: '', file: null });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Quote submitted:', { rfqId, ...form });
    alert('Quote submitted successfully!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          Message to Buyer
        </label>
        <textarea
          rows="4"
          className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="Include details or clarifications about your quote..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attachment (optional)
        </label>
        <input
          type="file"
          onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
          className="text-sm text-gray-600"
        />
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-orange-600"
      >
        <Send size={16} /> Submit Quote
      </button>
    </form>
  );
}