'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Loader,
  DollarSign,
  Calendar,
  FileText,
  Upload,
  Info,
  MapPin,
  Clock
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RFQRespond() {
  const router = useRouter();
  const params = useParams();
  const rfqId = params.rfq_id;

  const [rfq, setRfq] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1); // 1: Details, 2: Preview

  const [formData, setFormData] = useState({
    quoted_price: '',
    currency: 'KES',
    delivery_timeline: '',
    description: '',
    warranty: '',
    payment_terms: '',
    attachments: []
  });

  const [attachmentErrors, setAttachmentErrors] = useState([]);

  useEffect(() => {
    fetchData();
  }, [rfqId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Fetch vendor profile
      const { data: vendor } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!vendor) {
        setError('Vendor profile not found');
        return;
      }

      setVendorProfile(vendor);

      // Fetch RFQ details
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfqId)
        .single();

      if (rfqError || !rfqData) {
        setError('RFQ not found');
        return;
      }

      // Check if expired
      const expiresAt = new Date(rfqData.expires_at);
      if (expiresAt < new Date()) {
        setError('This RFQ has expired and is no longer accepting responses');
        return;
      }

      // Check if already responded
      const { data: existingResponse } = await supabase
        .from('rfq_responses')
        .select('id')
        .eq('rfq_id', rfqId)
        .eq('vendor_id', vendor.id)
        .maybeSingle();

      if (existingResponse) {
        setError('You have already submitted a response to this RFQ');
        return;
      }

      setRfq(rfqData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError(null);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newErrors = [];
    const validFiles = [];

    files.forEach((file) => {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        newErrors.push(`${file.name} is too large (max 5MB)`);
        return;
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'];
      if (!validTypes.includes(file.type)) {
        newErrors.push(`${file.name} has unsupported format`);
        return;
      }

      validFiles.push({
        name: file.name,
        size: (file.size / 1024).toFixed(2),
        type: file.type
      });
    });

    setAttachmentErrors(newErrors);
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...validFiles].slice(0, 5) // Max 5 files
    });
  };

  const removeAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index)
    });
  };

  const handleNext = () => {
    // Validate step 1
    if (!formData.quoted_price || isNaN(parseFloat(formData.quoted_price)) || parseFloat(formData.quoted_price) <= 0) {
      setError('Please enter a valid quoted price');
      return;
    }

    if (!formData.delivery_timeline.trim()) {
      setError('Please specify a delivery timeline');
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 30) {
      setError('Proposal must be at least 30 characters');
      return;
    }

    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Call response submission endpoint
      const response = await fetch(`/api/rfq/${rfqId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          quoted_price: parseFloat(formData.quoted_price),
          currency: formData.currency,
          delivery_timeline: formData.delivery_timeline,
          description: formData.description,
          warranty: formData.warranty || null,
          payment_terms: formData.payment_terms || null,
          attachments: formData.attachments.map(f => f.name)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit response');
      }

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push('/vendor/rfq-dashboard');
      }, 2000);

    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  if (!rfq || !vendorProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load RFQ</h2>
            <p className="text-gray-600 mb-6">{error || 'RFQ not found or has expired'}</p>
            <button
              onClick={() => router.push('/vendor/rfq-dashboard')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Back to Opportunities
            </button>
          </div>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(rfq.expires_at);
  const daysUntilExpiry = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/vendor/rfq-dashboard')}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-semibold transition"
        >
          <ArrowLeft size={20} />
          Back to Opportunities
        </button>

        {/* RFQ Summary Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{rfq.title}</h1>
          <p className="text-gray-600 mb-4">{rfq.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Budget</p>
              <p className="font-semibold text-gray-900">{rfq.budget_estimate || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Expires In</p>
              <p className={`font-semibold ${daysUntilExpiry < 3 ? 'text-red-600' : 'text-gray-900'}`}>
                {daysUntilExpiry} days
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Category</p>
              <p className="font-semibold text-gray-900">{rfq.category}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Type</p>
              <p className="font-semibold text-gray-900 capitalize">{rfq.type}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Quote Submitted!</h3>
              <p className="text-green-800 text-sm">Redirecting to your dashboard...</p>
            </div>
          </div>
        )}

        {/* Step 1: Enter Quote Details */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Your Quote</h2>

            <div className="space-y-6">
              {/* Quoted Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quoted Price *
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <DollarSign size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="number"
                      name="quoted_price"
                      value={formData.quoted_price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Delivery Timeline */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Timeline *
                </label>
                <input
                  type="text"
                  name="delivery_timeline"
                  value={formData.delivery_timeline}
                  onChange={handleInputChange}
                  placeholder="E.g., '3-5 business days', '1 week', 'ASAP'"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Proposal Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Proposal *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your approach, materials, methodology, and why you're the best choice for this project..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 30 characters
                </p>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Warranty (Optional)
                  </label>
                  <input
                    type="text"
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleInputChange}
                    placeholder="E.g., '1 year warranty'"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Terms (Optional)
                  </label>
                  <input
                    type="text"
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleInputChange}
                    placeholder="E.g., '50% upfront, 50% on completion'"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* File Attachments */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 font-semibold mb-1">Upload files</p>
                  <p className="text-gray-500 text-sm mb-3">
                    Images, PDFs, or documents (max 5MB each, up to 5 files)
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer transition"
                  >
                    Select Files
                  </label>
                </div>

                {/* File Errors */}
                {attachmentErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachmentErrors.map((err, idx) => (
                      <p key={idx} className="text-red-600 text-sm">
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                {/* Listed Files */}
                {formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2">
                          <FileText size={18} className="text-gray-400" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{file.size} KB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="text-red-600 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Tips for a winning quote:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Be specific about what you'll deliver</li>
                    <li>Include your timeline and any milestones</li>
                    <li>Mention relevant experience or certifications</li>
                    <li>Offer competitive pricing</li>
                    <li>Respond quickly to improve your chances</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => router.push('/vendor/rfq-dashboard')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                Review Quote
                <ChevronRight size={20} className="rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Quote</h2>

            <div className="space-y-6 mb-8">
              {/* Quote Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Quoted Price</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {formData.currency} {parseFloat(formData.quoted_price).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Delivery Timeline</p>
                    <p className="text-xl font-semibold text-gray-900">{formData.delivery_timeline}</p>
                  </div>
                  {formData.warranty && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Warranty</p>
                      <p className="font-semibold text-gray-900">{formData.warranty}</p>
                    </div>
                  )}
                  {formData.payment_terms && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payment Terms</p>
                      <p className="font-semibold text-gray-900">{formData.payment_terms}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Proposal */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Your Proposal</p>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                  {formData.description}
                </p>
              </div>

              {/* Attachments Summary */}
              {formData.attachments.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Attachments ({formData.attachments.length})</p>
                  <div className="space-y-2">
                    {formData.attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        <FileText size={16} />
                        {file.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competition Alert */}
              {rfq.response_count > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-900">
                    <span className="font-semibold">{rfq.response_count} vendor{rfq.response_count !== 1 ? 's' : ''}</span> have already responded. Make sure your quote is competitive!
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Submit Quote
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
