'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import QuoteFormSections from '@/components/vendor/QuoteFormSections';
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
  Clock,
  ChevronRight
} from 'lucide-react';

export default function RFQRespond() {
  const router = useRouter();
  const params = useParams();
  
  const [rfq, setRfq] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1); // 1: Details, 2: Preview
  const [rfqId, setRfqId] = useState(null); // Store rfq_id in state

  const [formData, setFormData] = useState({
    // Old fields (still used)
    quoted_price: '',
    currency: 'KES',
    delivery_timeline: '',
    description: '',
    warranty: '',
    payment_terms: '',
    attachments: [],
    
    // SECTION 1: Quote Overview
    quote_title: '',
    intro_text: '',
    validity_days: '7',
    validity_custom_date: '',
    earliest_start_date: '',
    
    // SECTION 2: Pricing & Breakdown
    pricing_model: 'fixed',
    price_min: '',
    price_max: '',
    unit_type: '',
    unit_price: '',
    estimated_units: '',
    vat_included: false,
    line_items: [],
    transport_cost: '',
    labour_cost: '',
    other_charges: '',
    vat_amount: '',
    total_price_calculated: '',
    
    // SECTION 3: Inclusions/Exclusions
    inclusions: '',
    exclusions: '',
    client_responsibilities: '',
    
    // Metadata
    quote_status: 'draft',
    submitted_at: null,
    expires_at: null
  });

  const [attachmentErrors, setAttachmentErrors] = useState([]);

  useEffect(() => {
    if (params && params.rfq_id) {
      fetchData();
    }
  }, []); // Only run once on mount

  const fetchData = async () => {
    try {
      setLoading(true);
      const rfqId = params.rfq_id;

      if (!rfqId) {
        setError('Invalid RFQ ID');
        setLoading(false);
        return;
      }

      // Store rfqId in state for use in handleSubmit
      setRfqId(rfqId);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Fetch vendor profile from API endpoint (uses service role to bypass RLS)
      const token = session.access_token;
      const vendorResponse = await fetch('/api/vendor/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!vendorResponse.ok) {
        setError('Vendor profile not found');
        return;
      }

      const { vendor } = await vendorResponse.json();
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
    // Validate Section 1: Quote Overview
    if (!formData.quote_title || !formData.quote_title.trim()) {
      setError('Please enter a quote title');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.intro_text || !formData.intro_text.trim()) {
      setError('Please provide a brief introduction');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate Section 2: Pricing & Breakdown
    if (!formData.pricing_model) {
      setError('Please select a pricing model');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate pricing based on model
    if (formData.pricing_model === 'fixed') {
      if (!formData.quoted_price || isNaN(parseFloat(formData.quoted_price)) || parseFloat(formData.quoted_price) <= 0) {
        setError('Please enter a valid total price');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } else if (formData.pricing_model === 'range') {
      if (!formData.price_min || isNaN(parseFloat(formData.price_min)) || parseFloat(formData.price_min) <= 0) {
        setError('Please enter a valid minimum price');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!formData.price_max || isNaN(parseFloat(formData.price_max)) || parseFloat(formData.price_max) <= 0) {
        setError('Please enter a valid maximum price');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (parseFloat(formData.price_min) >= parseFloat(formData.price_max)) {
        setError('Minimum price must be less than maximum price');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } else if (formData.pricing_model === 'per_unit') {
      if (!formData.unit_type || !formData.unit_type.trim()) {
        setError('Please specify the unit type');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!formData.unit_price || isNaN(parseFloat(formData.unit_price)) || parseFloat(formData.unit_price) <= 0) {
        setError('Please enter a valid unit price');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!formData.estimated_units || isNaN(parseFloat(formData.estimated_units)) || parseFloat(formData.estimated_units) <= 0) {
        setError('Please enter valid estimated units');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } else if (formData.pricing_model === 'per_day') {
      if (!formData.unit_price || isNaN(parseFloat(formData.unit_price)) || parseFloat(formData.unit_price) <= 0) {
        setError('Please enter a valid daily/hourly rate');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!formData.estimated_units || isNaN(parseFloat(formData.estimated_units)) || parseFloat(formData.estimated_units) <= 0) {
        setError('Please enter valid estimated days/hours');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Validate Section 3: Inclusions/Exclusions
    if (!formData.inclusions || !formData.inclusions.trim()) {
      setError('Please describe what is included in your quote');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.exclusions || !formData.exclusions.trim()) {
      setError('Please specify what is NOT included in your quote');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Validate old required fields (still needed)
    if (!formData.delivery_timeline.trim()) {
      setError('Please specify a delivery timeline');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 30) {
      setError('Proposal must be at least 30 characters');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

      // Calculate totals for Section 2
      const subtotal = formData.line_items.reduce((sum, item) => {
        return sum + (parseFloat(item.lineTotal) || 0);
      }, 0);
      
      const additionalCosts = 
        (parseFloat(formData.transport_cost) || 0) +
        (parseFloat(formData.labour_cost) || 0) +
        (parseFloat(formData.other_charges) || 0);
      
      const vatAmount = formData.vat_included ? ((subtotal + additionalCosts) * 0.16) : 0;
      const grandTotal = subtotal + additionalCosts + vatAmount;

      // Call response submission endpoint
      const response = await fetch(`/api/rfq/${rfqId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          // SECTION 1: Quote Overview
          quote_title: formData.quote_title,
          intro_text: formData.intro_text,
          validity_days: parseInt(formData.validity_days) || 7,
          validity_custom_date: formData.validity_custom_date || null,
          earliest_start_date: formData.earliest_start_date || null,
          
          // SECTION 2: Pricing & Breakdown
          pricing_model: formData.pricing_model,
          price_min: formData.price_min ? parseFloat(formData.price_min) : null,
          price_max: formData.price_max ? parseFloat(formData.price_max) : null,
          unit_type: formData.unit_type || null,
          unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
          estimated_units: formData.estimated_units ? parseFloat(formData.estimated_units) : null,
          vat_included: formData.vat_included,
          line_items: formData.line_items.length > 0 ? formData.line_items : null,
          transport_cost: formData.transport_cost ? parseFloat(formData.transport_cost) : 0,
          labour_cost: formData.labour_cost ? parseFloat(formData.labour_cost) : 0,
          other_charges: formData.other_charges ? parseFloat(formData.other_charges) : 0,
          vat_amount: vatAmount,
          total_price_calculated: grandTotal,
          
          // SECTION 3: Inclusions/Exclusions
          inclusions: formData.inclusions,
          exclusions: formData.exclusions,
          client_responsibilities: formData.client_responsibilities || null,
          
          // Metadata
          quote_status: 'submitted',
          submitted_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days validity
          
          // OLD FIELDS (for backward compatibility)
          quoted_price: formData.quoted_price ? parseFloat(formData.quoted_price) : null,
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
              onClick={() => router.push('/vendor-profile')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Vendor Profile
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
          onClick={() => router.push('/vendor-profile')}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-semibold transition"
        >
          <ArrowLeft size={20} />
          Back to Vendor Profile
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
              {/* NEW: Quote Form Sections (Sections 1-3) */}
              <QuoteFormSections
                formData={formData}
                setFormData={setFormData}
                error={error}
                setError={setError}
              />

              <hr className="my-8" />

              {/* OLD FORM FIELDS (Still kept for backward compatibility) */}
              <h3 className="text-lg font-semibold text-gray-900 mt-8">Additional Details (Legacy Fields)</h3>
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
                onClick={() => router.push('/vendor-profile')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Back to Vendor Profile
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
              {/* SECTION 1: Quote Overview Summary */}
              <div className="border-l-4 border-amber-500 bg-amber-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Section 1: Quote Overview</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Quote Title</p>
                    <p className="font-semibold text-gray-900">{formData.quote_title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Introduction</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{formData.intro_text}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                      <p className="font-semibold text-gray-900">
                        {formData.validity_days === 'custom' ? formData.validity_custom_date : `${formData.validity_days} days`}
                      </p>
                    </div>
                    {formData.earliest_start_date && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Earliest Start Date</p>
                        <p className="font-semibold text-gray-900">{formData.earliest_start_date}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Pricing & Breakdown Summary */}
              <div className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Section 2: Pricing & Breakdown</h3>
                <div className="space-y-4">
                  {/* Pricing Model */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pricing Model</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {formData.pricing_model === 'fixed' && 'Fixed total price'}
                      {formData.pricing_model === 'range' && 'Price range (minimum to maximum)'}
                      {formData.pricing_model === 'per_unit' && 'Per unit / per item'}
                      {formData.pricing_model === 'per_day' && 'Per day / hourly'}
                    </p>
                  </div>

                  {/* Price Display Based on Model */}
                  {formData.pricing_model === 'fixed' && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Price</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        KES {parseFloat(formData.quoted_price).toLocaleString()}
                      </p>
                      {formData.vat_included && <p className="text-xs text-gray-600">VAT Included</p>}
                    </div>
                  )}

                  {formData.pricing_model === 'range' && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Price Range</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        KES {parseFloat(formData.price_min).toLocaleString()} - {parseFloat(formData.price_max).toLocaleString()}
                      </p>
                      {formData.vat_included && <p className="text-xs text-gray-600">VAT Included</p>}
                    </div>
                  )}

                  {(formData.pricing_model === 'per_unit' || formData.pricing_model === 'per_day') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{formData.pricing_model === 'per_unit' ? 'Unit Type' : 'Rate Type'}</p>
                        <p className="font-semibold text-gray-900">{formData.unit_type || formData.pricing_model}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Unit Price</p>
                        <p className="font-semibold text-gray-900">KES {parseFloat(formData.unit_price).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estimated Quantity</p>
                        <p className="font-semibold text-gray-900">{parseFloat(formData.estimated_units)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Estimated Total</p>
                        <p className="text-lg font-bold text-emerald-600">
                          KES {(parseFloat(formData.unit_price) * parseFloat(formData.estimated_units)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Line Items Breakdown */}
                  {formData.line_items.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-xs text-gray-500 mb-2 font-semibold">Item Breakdown</p>
                      <div className="space-y-2">
                        {formData.line_items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm bg-white p-2 rounded border border-blue-200">
                            <span className="text-gray-700">{item.description}</span>
                            <span className="font-semibold text-gray-900">KES {parseFloat(item.lineTotal).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Costs */}
                  {((parseFloat(formData.transport_cost) || 0) > 0 || (parseFloat(formData.labour_cost) || 0) > 0 || (parseFloat(formData.other_charges) || 0) > 0) && (
                    <div className="border-t pt-4 space-y-2">
                      <p className="text-xs text-gray-500 mb-2 font-semibold">Additional Costs</p>
                      {parseFloat(formData.transport_cost) > 0 && (
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>Transport/Delivery:</span>
                          <span>KES {parseFloat(formData.transport_cost).toLocaleString()}</span>
                        </div>
                      )}
                      {parseFloat(formData.labour_cost) > 0 && (
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>Labour Cost:</span>
                          <span>KES {parseFloat(formData.labour_cost).toLocaleString()}</span>
                        </div>
                      )}
                      {parseFloat(formData.other_charges) > 0 && (
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>Other Charges:</span>
                          <span>KES {parseFloat(formData.other_charges).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: Inclusions & Exclusions */}
              <div className="border-l-4 border-green-500 bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Section 3: What's Included & Excluded</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-semibold">What is Included</p>
                    <p className="text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border border-green-200">
                      {formData.inclusions}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-semibold">What is NOT Included</p>
                    <p className="text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border border-red-200">
                      {formData.exclusions}
                    </p>
                  </div>
                  {formData.client_responsibilities && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-semibold">Client Responsibilities</p>
                      <p className="text-gray-900 whitespace-pre-wrap bg-white p-3 rounded border border-blue-200">
                        {formData.client_responsibilities}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Legacy Fields Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Delivery Timeline</p>
                    <p className="font-semibold text-gray-900">{formData.delivery_timeline}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Your Proposal</p>
                    <p className="text-gray-900 bg-white p-3 rounded whitespace-pre-wrap border border-gray-200">
                      {formData.description}
                    </p>
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
