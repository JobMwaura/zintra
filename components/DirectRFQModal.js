'use client';

import { useState } from 'react';
import { X, Mail, FileText, Upload, Loader2 } from 'lucide-react';

/**
 * Brand colors (same as main vendor page)
 */
const BRAND = {
  primary: '#ea8f1e',
  primaryHover: '#d88013',
  slate900: 'rgb(15 23 42)',
  slate700: 'rgb(51 65 85)',
  slate600: 'rgb(71 85 105)',
  slate200: 'rgb(226 232 240)',
  slate100: 'rgb(241 245 249)',
};

export default function DirectRFQModal({ vendor, isOpen, onClose }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    projectDetails: '',
    budgetRange: '',
    attachment: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Placeholder for now — integrate Supabase RFQ table next
    await new Promise((r) => setTimeout(r, 1000));
    alert(`RFQ submitted successfully to ${vendor.company_name}`);

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Request Quote – {vendor.company_name}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
              placeholder="Enter your full name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
                placeholder="+254 700 000 000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Project Details
            </label>
            <textarea
              name="projectDetails"
              value={form.projectDetails}
              onChange={handleChange}
              required
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
              placeholder="Describe your project requirements..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Estimated Budget Range
            </label>
            <input
              type="text"
              name="budgetRange"
              value={form.budgetRange}
              onChange={handleChange}
              placeholder="e.g., KSh 500,000 – 1,000,000"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Attach Files (optional)
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:border-orange-400">
              <Upload className="h-4 w-4 text-orange-500" />
              <span>
                {form.attachment ? form.attachment.name : 'Upload reference documents'}
              </span>
              <input
                type="file"
                name="attachment"
                onChange={handleChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium text-white shadow-sm disabled:opacity-70"
              style={{ backgroundColor: BRAND.primary }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}