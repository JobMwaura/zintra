'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';

export default function DirectRFQWizard() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    county: '',
    budget_range: '',
    timeline: '',
    attachments: [],
  });
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');

  // Fetch vendors for selection
  useState(() => {
    const fetchVendors = async () => {
      const { data } = await supabase.from('vendors').select('id, company_name, location, category');
      if (data) setVendors(data);
    };
    fetchVendors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVendorSelect = (vendorId) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
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
          rfq_type: 'direct',
          visibility: 'private',
          status: 'open',
          created_at: new Date(),
          published_at: new Date(),
        }])
        .select();

      if (rfqError) throw rfqError;

      if (rfqData && rfqData[0]) {
        const rfqId = rfqData[0].id;

        // Store selected vendors
        if (selectedVendors.length > 0) {
          const { error: recipientError } = await supabase
            .from('rfq_recipients')
            .insert(
              selectedVendors.map(vendorId => ({
                rfq_id: rfqId,
                vendor_id: vendorId,
              }))
            );
          if (recipientError) throw recipientError;
        }

        setSuccess(true);
        setTimeout(() => {
          router.push(`/rfq/${rfqId}`);
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
          <h2 className="text-2xl font-bold text-green-900 mb-2">RFQ Created Successfully!</h2>
          <p className="text-green-700 mb-4">Redirecting to your RFQ details...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Send Direct RFQ</h1>
          </div>
          <p className="text-gray-600">Select specific vendors and send them your project details</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Project Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Project Details</h2>
            
            <div className="space-y-6">
              {/* Title */}
              <div>
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

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your project in detail. Include dimensions, materials, timeline preferences, etc."
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>

              {/* Category */}
              <div>
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

              {/* Location & Budget - 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>

              {/* Timeline */}
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
          </div>

          {/* Vendor Selection Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Select Vendors *</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search vendors by name or location..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              />
            </div>

            {vendors.length === 0 ? (
              <div className="text-center py-8 bg-blue-50 rounded-lg">
                <p className="text-blue-700 font-semibold">No vendors available yet</p>
                <p className="text-blue-600 text-sm mt-2">Check back soon as vendors register</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vendors
                  .filter(v =>
                    vendorSearch === '' ||
                    v.company_name?.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                    v.location?.toLowerCase().includes(vendorSearch.toLowerCase())
                  )
                  .map(vendor => (
                    <label
                      key={vendor.id}
                      className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.id)}
                        onChange={() => handleVendorSelect(vendor.id)}
                        className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{vendor.company_name}</p>
                        <p className="text-sm text-gray-600">{vendor.location}</p>
                        {vendor.category && (
                          <p className="text-xs text-gray-500 mt-1">{vendor.category}</p>
                        )}
                      </div>
                    </label>
                  ))}
              </div>
            )}

            {selectedVendors.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold">{selectedVendors.length} vendor(s) selected</p>
              </div>
            )}
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
              disabled={loading || selectedVendors.length === 0}
              className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Sending...' : 'Send RFQ to Vendors'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
