'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, Loader } from 'lucide-react';

const CONSTRUCTION_CATEGORIES = [
  { slug: 'general_contractor', name: 'General Contractor' },
  { slug: 'architect', name: 'Architect' },
  { slug: 'engineer', name: 'Engineer' },
  { slug: 'quantity_surveyor', name: 'Quantity Surveyor' },
  { slug: 'interior_designer', name: 'Interior Designer' },
  { slug: 'electrician', name: 'Electrician' },
  { slug: 'plumber', name: 'Plumber' },
  { slug: 'carpenter', name: 'Carpenter' },
  { slug: 'mason', name: 'Mason' },
  { slug: 'painter', name: 'Painter' },
  { slug: 'tiler', name: 'Tiler' },
  { slug: 'roofer', name: 'Roofer' },
  { slug: 'welder', name: 'Welder' },
  { slug: 'landscaper', name: 'Landscaper' },
  { slug: 'solar_installer', name: 'Solar Installer' },
  { slug: 'hvac_technician', name: 'HVAC Technician' },
  { slug: 'waterproofing', name: 'Waterproofing' },
  { slug: 'security_installer', name: 'Security Installer' },
  { slug: 'materials_supplier', name: 'Materials Supplier' },
  { slug: 'equipment_rental', name: 'Equipment Rental' },
  { slug: 'hardware_store', name: 'Hardware Store' },
  { slug: 'other', name: 'Other' },
];

const KENYAN_COUNTIES = [
  'Nairobi', 'Kiambu', 'Machakos', 'Kajiado', 'Muranga',
  'Nyeri', 'Laikipia', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia',
  'Kericho', 'Bomet', 'Kisii', 'Nyamira', 'Siaya',
  'Kisumu', 'Homa Bay', 'Migori', 'Narok', 'Samburu',
  'Isiolo', 'Meru', 'Tharaka Nithi', 'Embu', 'Kitui',
  'Makueni', 'Mombasa', 'Kwale', 'Kilifi', 'Tana River',
  'Lamu', 'Garissa', 'Wajir', 'Mandera', 'West Pokot',
  'Baringo', 'Turkana', 'Elgeyo Marakwet'
];

export default function PublicRFQForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    county: '',
    location: '',
    budget_range: '',
    urgency: 'normal',
    timeline: '',
    material_requirements: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Project title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Project description is required');
      return false;
    }
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    if (!formData.county) {
      setError('Please select a county');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Location/area is required');
      return false;
    }
    if (!formData.budget_range) {
      setError('Please select a budget range');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to post an RFQ');
        setLoading(false);
        return;
      }

      // Insert into rfqs table
      const { data, error: insertError } = await supabase
        .from('rfqs')
        .insert([{
          title: formData.title,
          description: formData.description,
          category: formData.category,
          county: formData.county,
          location: formData.location,
          budget_range: formData.budget_range,
          urgency: formData.urgency,
          timeline: formData.timeline || 'Not specified',
          material_requirements: formData.material_requirements,
          rfq_type: 'public',
          visibility: 'public',
          status: 'open',
          user_id: user.id,
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
          expires_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days
          created_at: new Date().toISOString()
        }])
        .select();

      if (insertError) {
        console.error('Error inserting RFQ:', insertError);
        setError(insertError.message || 'Failed to post RFQ');
        setLoading(false);
        return;
      }

      // Success
      onSuccess();
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Project Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Office Building Renovation"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your project in detail..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">Select a category...</option>
          {CONSTRUCTION_CATEGORIES.map(cat => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* County */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          County *
        </label>
        <select
          name="county"
          value={formData.county}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">Select a county...</option>
          {KENYAN_COUNTIES.map(county => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specific Location/Area *
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., Westlands, CBD, Kilimani"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Budget Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Budget Range *
        </label>
        <select
          name="budget_range"
          value={formData.budget_range}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">Select budget range...</option>
          <option value="0-50000">KES 0 - 50,000</option>
          <option value="50000-100000">KES 50,000 - 100,000</option>
          <option value="100000-250000">KES 100,000 - 250,000</option>
          <option value="250000-500000">KES 250,000 - 500,000</option>
          <option value="500000-1000000">KES 500,000 - 1,000,000</option>
          <option value="1000000-5000000">KES 1,000,000 - 5,000,000</option>
          <option value="5000000+">KES 5,000,000+</option>
        </select>
      </div>

      {/* Urgency */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Urgency
        </label>
        <select
          name="urgency"
          value={formData.urgency}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="low">Low - Flexible timeline</option>
          <option value="normal">Normal - Standard timeline</option>
          <option value="high">High - Need soon</option>
          <option value="critical">Critical - ASAP</option>
        </select>
      </div>

      {/* Timeline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Timeline (Optional)
        </label>
        <input
          type="text"
          name="timeline"
          value={formData.timeline}
          onChange={handleChange}
          placeholder="e.g., 3-4 weeks, 2 months"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Material Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Material Requirements (Optional)
        </label>
        <textarea
          name="material_requirements"
          value={formData.material_requirements}
          onChange={handleChange}
          placeholder="Any specific materials, brands, or requirements..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Posting RFQ...
          </>
        ) : (
          'Post Public RFQ'
        )}
      </button>

      <p className="text-sm text-gray-600 text-center">
        * Required fields
      </p>
    </form>
  );
}
