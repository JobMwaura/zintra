'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Eye, Edit, Save, AlertCircle, Check, ArrowLeft } from 'lucide-react';
import LocationSelector from '@/components/LocationSelector';

export default function MyProfileTab() {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [mode, setMode] = useState('edit'); // 'edit' or 'preview'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    location: '',
    county: '',
    description: '',
    website: '',
    whatsapp: '',
    price_range: '',
    category: 'General',
    certifications: '',
  });

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      setMessage('');

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        setMessage('❌ Please log in again');
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const { data: vendorData, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching vendor:', error);
        setMessage(`❌ Error loading profile: ${error.message}`);
        setLoading(false);
        return;
      }

      if (vendorData) {
        setVendor(vendorData);
        setFormData({
          company_name: vendorData.company_name || '',
          email: vendorData.email || currentUser.email || '',
          phone: vendorData.phone || '',
          location: vendorData.location || '',
          county: vendorData.county || '',
          description: vendorData.description || '',
          website: vendorData.website || '',
          whatsapp: vendorData.whatsapp || '',
          price_range: vendorData.price_range || '',
          category: vendorData.category || 'General',
          certifications: Array.isArray(vendorData.certifications) 
            ? vendorData.certifications.join(', ')
            : vendorData.certifications || '',
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in fetchVendorData:', err);
      setMessage(`❌ Unexpected error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage('');

      if (!user) {
        setMessage('❌ Error: Not authenticated');
        setSaving(false);
        return;
      }

      if (!formData.company_name.trim()) {
        setMessage('❌ Company name is required');
        setSaving(false);
        return;
      }

      const certifications = formData.certifications
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const updateData = {
        company_name: formData.company_name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        county: formData.county,
        description: formData.description,
        website: formData.website,
        whatsapp: formData.whatsapp,
        price_range: formData.price_range,
        category: formData.category,
        certifications: certifications,
        updated_at: new Date().toISOString(),
      };

      if (vendor?.id) {
        const { error } = await supabase
          .from('vendors')
          .update(updateData)
          .eq('id', vendor.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Update error:', error);
          setMessage(`❌ Error saving profile: ${error.message}`);
          setSaving(false);
          return;
        }

        setMessage('✅ Profile saved successfully!');
        setTimeout(() => {
          setMessage('');
          fetchVendorData();
        }, 2000);
      } else {
        const { error } = await supabase
          .from('vendors')
          .insert([{
            ...updateData,
            user_id: user.id,
          }]);

        if (error) {
          console.error('Insert error:', error);
          setMessage(`❌ Error creating profile: ${error.message}`);
          setSaving(false);
          return;
        }

        setMessage('✅ Profile created successfully!');
        setTimeout(() => {
          setMessage('');
          fetchVendorData();
        }, 2000);
      }

      setSaving(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setMessage(`❌ Error: ${err.message}`);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // PREVIEW MODE
  // ========================================
  if (mode === 'preview') {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setMode('edit')}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Edit
        </button>

        {/* Preview Header */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-8 border border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {formData.company_name || 'Your Company Name'}
              </h1>
              <div className="flex items-center gap-4 text-gray-700 mb-4">
                <span className="bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  {formData.category}
                </span>
                <span className="text-lg">📍 {formData.location || 'Location'}</span>
              </div>
              <p className="text-gray-600 max-w-2xl">
                {formData.description || 'Add a description of your business...'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="text-gray-900 font-medium">{formData.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <p className="text-gray-900 font-medium">{formData.phone || 'Not provided'}</p>
            </div>
            {formData.whatsapp && (
              <div>
                <p className="text-sm text-gray-500 mb-1">WhatsApp</p>
                <p className="text-gray-900 font-medium">{formData.whatsapp}</p>
              </div>
            )}
            {formData.website && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Website</p>
                <p className="text-gray-900 font-medium">
                  <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                    {formData.website}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Location & Service Area */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Area</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">City/Town</p>
              <p className="text-gray-900 font-medium">{formData.location || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">County</p>
              <p className="text-gray-900 font-medium">{formData.county || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Price Range</p>
              <p className="text-gray-900 font-medium">{formData.price_range || 'Not specified'}</p>
            </div>
            {formData.certifications && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Certifications</p>
                <p className="text-gray-900 font-medium">{formData.certifications}</p>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Actions</h3>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">
              Request Quote
            </button>
            <button className="px-6 py-3 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 font-medium">
              Contact Vendor
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              <strong>This is how your profile appears to customers.</strong> Click "Back to Edit" to make changes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========================================
  // EDIT MODE
  // ========================================
  return (
    <div className="space-y-6">
      {/* Mode Toggle Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setMode('edit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            mode === 'edit'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Edit className="w-5 h-5" />
          Edit Profile
        </button>
        <button
          onClick={() => setMode('preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            mode === 'preview'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Eye className="w-5 h-5" />
          Preview Profile
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.includes('✅') ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Company Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                placeholder="Your company name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="General">General</option>
                <option value="Construction Materials">Construction Materials</option>
                <option value="Hardware & Tools">Hardware & Tools</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Paint & Coatings">Paint & Coatings</option>
                <option value="Services">Services</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell customers about your business..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
          <LocationSelector
            county={formData.county}
            town={formData.location}
            onCountyChange={(e) => setFormData({ ...formData, county: e.target.value })}
            onTownChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required={false}
          />
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+254701234567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website (Optional)</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://www.example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp (Optional)</label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                placeholder="+254701234567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <input
                type="text"
                name="price_range"
                value={formData.price_range}
                onChange={handleInputChange}
                placeholder="e.g., KSh 50,000 - KSh 500,000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
              <textarea
                name="certifications"
                value={formData.certifications}
                onChange={handleInputChange}
                placeholder="e.g., ISO 9001, KNBS certified"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className="flex items-center gap-2 px-6 py-3 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 font-medium"
          >
            <Eye className="w-5 h-5" />
            Preview First
          </button>
        </div>
      </form>
    </div>
  );
}