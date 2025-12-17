'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, CheckCircle, Globe } from 'lucide-react';

export default function PublicRFQ() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    county: '',
    budget_range: '',
    timeline: '',
    visibility_duration: '30', // days
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in first');
        setLoading(false);
        return;
      }

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(formData.visibility_duration));

      // Create RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .insert([{
          user_id: user.id,
          buyer_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          county: formData.county,
          budget_range: formData.budget_range,
          timeline: formData.timeline,
          rfq_type: 'public',
          visibility: 'public',
          status: 'open',
          expires_at: expiryDate,
          created_at: new Date(),
          published_at: new Date(),
        }])
        .select();

      if (rfqError) throw rfqError;

      if (rfqData && rfqData[0]) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/rfq/${rfqData[0].id}`);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create RFQ');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">RFQ Posted Successfully!</h2>
          <p className="text-green-700 mb-4">Your project is now visible to all vendors in the marketplace</p>
          <p className="text-green-600 text-sm">Redirecting to your RFQ details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-6 h-6 text-orange-600" />
                <h1 className="text-3xl font-bold text-gray-900">Post Publicly</h1>
              </div>
            </div>
          </div>
          <p className="text-gray-600 ml-16">Let all vendors in our marketplace see your project and submit quotes</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Public RFQ Benefits:</h3>
            <ul className="space-y-2 text-blue-700">
              <li className="flex gap-2">
                <span className="text-lg">✓</span>
                <span>Visible to all vendors in the marketplace</span>
              </li>
              <li className="flex gap-2">
                <span className="text-lg">✓</span>
                <span>Receive competitive quotes from multiple vendors</span>
              </li>
              <li className="flex gap-2">
                <span className="text-lg">✓</span>
                <span>Automatic vendor matching based on category and location</span>
              </li>
              <li className="flex gap-2">
                <span className="text-lg">✓</span>
                <span>Compare quotes and vendor profiles side-by-side</span>
              </li>
            </ul>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            
            {/* Project Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Project Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Kitchen Renovation with New Cabinets"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Project Description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Project Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your project in detail. The more details, the better quotes you'll receive."
                required
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              >
                <option value="">Select a category</option>
                <option>Kitchen & Interior Fittings</option>
                <option>Electrical & Lighting</option>
                <option>Plumbing & Sanitation</option>
                <option>Building & Structural Materials</option>
                <option>Roofing & Waterproofing</option>
                <option>Flooring & Wall Finishes</option>
                <option>HVAC & Ventilation</option>
                <option>Painting & Decoration</option>
              </select>
            </div>

            {/* Location & County */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Westlands, Nairobi"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">County</label>
                <input
                  type="text"
                  name="county"
                  value={formData.county}
                  onChange={handleInputChange}
                  placeholder="e.g., Nairobi"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            {/* Budget & Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Range *</label>
                <input
                  type="text"
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleInputChange}
                  placeholder="e.g., KSh 500,000 - 1,000,000"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Timeline *</label>
                <input
                  type="text"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  placeholder="e.g., 6 weeks, Urgent, ASAP"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            {/* Visibility Duration */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">How long should this RFQ be visible? *</label>
              <select
                name="visibility_duration"
                value={formData.visibility_duration}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              >
                <option value="7">1 week</option>
                <option value="14">2 weeks</option>
                <option value="30">1 month (Recommended)</option>
                <option value="60">2 months</option>
                <option value="90">3 months</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">After this period, vendors can still view your RFQ but won't receive new notifications</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-semibold">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Publishing...' : 'Publish RFQ'}
            </button>
          </div>

          {/* Footer Note */}
          <div className="text-center text-sm text-gray-600">
            <p>Your project details are secure. Only vendors who submit quotes will see your contact information.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
