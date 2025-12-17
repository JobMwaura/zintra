'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Check, Globe, Users } from 'lucide-react';

export default function PublicRFQ() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    projectTitle: '',
    category: '',
    description: '',
    budget_min: '',
    budget_max: '',
    county: '',
    specificLocation: '',
    timeline: '',
    paymentTerms: 'upon_completion',
    deadline: '',
    visibilityDays: '7',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = [
    'Building & Structural Materials',
    'Wood & Timber Solutions',
    'Roofing & Waterproofing',
    'Doors, Windows & Hardware',
    'Flooring & Wall Finishes',
    'Plumbing & Sanitation',
    'Electrical & Lighting',
    'Kitchen & Interior Fittings',
    'HVAC & Climate Solutions',
    'Painting & Surface Finishing',
    'Concrete & Aggregates',
    'Construction Services & Labor'
  ];

  const paymentTermsOptions = [
    { value: 'upfront', label: 'Upfront Payment' },
    { value: 'upon_completion', label: 'Upon Completion' },
    { value: 'partial', label: 'Partial (50/50)' },
    { value: 'monthly', label: 'Monthly Installments' },
    { value: 'flexible', label: 'Flexible/Negotiable' }
  ];

  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Naivasha', 'Thika', 'Ongata Rongai', 'Meru', 'Kericho', 'Kiambu', 'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.projectTitle.trim()) newErrors.projectTitle = 'Required';
    if (!formData.category) newErrors.category = 'Required';
    if (!formData.description.trim()) newErrors.description = 'Required';
    if (!formData.budget_min) newErrors.budget_min = 'Required';
    if (!formData.budget_max) newErrors.budget_max = 'Required';
    if (formData.budget_min && formData.budget_max && parseInt(formData.budget_min) > parseInt(formData.budget_max)) {
      newErrors.budget_min = 'Min budget must be less than max';
    }
    if (!formData.county) newErrors.county = 'Required';
    if (!formData.specificLocation.trim()) newErrors.specificLocation = 'Required';
    if (!formData.timeline) newErrors.timeline = 'Required';
    if (!formData.deadline) newErrors.deadline = 'Required - Set a quote submission deadline';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrors({ auth: 'Please log in first' });
        setLoading(false);
        return;
      }

      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .insert([{
          user_id: user.id,
          buyer_id: user.id,
          title: formData.projectTitle,
          description: formData.description,
          category: formData.category,
          location: formData.specificLocation,
          county: formData.county,
          budget_min: parseInt(formData.budget_min) || null,
          budget_max: parseInt(formData.budget_max) || null,
          timeline: formData.timeline,
          payment_terms: formData.paymentTerms,
          deadline: formData.deadline ? new Date(formData.deadline) : null,
          rfq_type: 'public',
          visibility: 'public',
          status: 'open',
          created_at: new Date(),
          published_at: new Date(),
        }])
        .select();

      if (rfqError) throw rfqError;

      if (rfqData && rfqData[0]) {
        const rfqId = rfqData[0].id;
        setSuccess(true);
        setTimeout(() => router.push(`/rfq/${rfqId}`), 2000);
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to create RFQ' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">Public RFQ Posted!</h2>
          <p className="text-green-700 mb-4">Your project is now visible to all vendors in the marketplace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#ea8f1e' }}>zintra</Link>
          <div className="hidden md:flex gap-6">
            <Link href="/browse" className="text-gray-600 hover:text-gray-900">Browse Vendors</Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#5f6466' }}>Post Public RFQ</h1>
          <p className="text-center text-gray-600 mb-8">Reach all qualified vendors in the marketplace</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Public RFQ Benefits</p>
                <ul className="space-y-1">
                  <li>✓ Visible to all vendors in the marketplace</li>
                  <li>✓ Get competitive quotes from multiple suppliers</li>
                  <li>✓ Better pricing through vendor competition</li>
                  <li>✓ Discover new vendors and options</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Project Details</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                  <input 
                    type="text" 
                    name="projectTitle" 
                    placeholder="e.g., Office Renovation - 500 sq meters"
                    value={formData.projectTitle} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                  {errors.projectTitle && <p className="text-red-500 text-sm mt-1">{errors.projectTitle}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select 
                      name="category" 
                      value={formData.category} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timeline *</label>
                    <select 
                      name="timeline" 
                      value={formData.timeline} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    >
                      <option value="">Select timeline</option>
                      <option value="urgent">Urgent (Within 1 week)</option>
                      <option value="soon">Soon (1-2 weeks)</option>
                      <option value="moderate">Moderate (2-4 weeks)</option>
                      <option value="flexible">Flexible (No deadline)</option>
                    </select>
                    {errors.timeline && <p className="text-red-500 text-sm mt-1">{errors.timeline}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Description *</label>
                  <textarea 
                    name="description" 
                    placeholder="Provide detailed information about your project..."
                    value={formData.description} 
                    onChange={handleInputChange}
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Budget & Location</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Budget (KSh) *</label>
                    <input 
                      type="number" 
                      name="budget_min" 
                      placeholder="e.g., 100000"
                      value={formData.budget_min} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                    {errors.budget_min && <p className="text-red-500 text-sm mt-1">{errors.budget_min}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget (KSh) *</label>
                    <input 
                      type="number" 
                      name="budget_max" 
                      placeholder="e.g., 1000000"
                      value={formData.budget_max} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                    {errors.budget_max && <p className="text-red-500 text-sm mt-1">{errors.budget_max}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">County *</label>
                    <select 
                      name="county" 
                      value={formData.county} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    >
                      <option value="">Select county</option>
                      {counties.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specific Location *</label>
                    <input 
                      type="text" 
                      name="specificLocation" 
                      placeholder="e.g., Downtown area"
                      value={formData.specificLocation} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                    {errors.specificLocation && <p className="text-red-500 text-sm mt-1">{errors.specificLocation}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Quote Deadline & Payment</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quote Submission Deadline *</label>
                  <input 
                    type="date" 
                    name="deadline" 
                    value={formData.deadline} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-600 mt-2">When you need to receive quotes by - vendors will see this deadline</p>
                  {errors.deadline && <p className="text-red-500 text-sm mt-1">{errors.deadline}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                  <select 
                    name="paymentTerms" 
                    value={formData.paymentTerms} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  >
                    {paymentTermsOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <p className="text-xs text-gray-600 mt-2">How you prefer to pay for the project</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-900 text-sm">
                <strong>✓ What happens next:</strong> Your RFQ will be posted publicly. All vendors in the marketplace will see it and can submit quotes. You'll be able to compare options and select the best fit.
              </p>
            </div>

            {errors.submit && <p className="text-red-500 text-center font-medium">{errors.submit}</p>}

            <div className="flex gap-4 pt-6">
              <Link href="/post-rfq" className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                Back
              </Link>
              <button 
                type="submit" 
                disabled={loading}
                className="ml-auto px-8 py-2 text-white rounded-lg hover:opacity-90 font-semibold disabled:bg-gray-400"
                style={!loading ? { backgroundColor: '#ea8f1e' } : {}}
              >
                {loading ? 'Publishing...' : 'Publish to Marketplace'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
