'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save, AlertCircle, Check } from 'lucide-react';

export default function VendorProfileEdit() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);

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
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setMessage('Not authenticated');
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Get vendor data
      const { data: vendorData, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching vendor:', error);
        setMessage('Error loading profile');
        setLoading(false);
        return;
      }

      if (vendorData) {
        setVendor(vendorData);
        
        // Populate form with existing data
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
      console.error('Error in fetchVendorProfile:', err);
      setMessage('Error loading profile');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage(''); // Clear message when user starts editing
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage('');

      if (!user) {
        setMessage('Not authenticated');
        setSaving(false);
        return;
      }

      // Validate required fields
      if (!formData.company_name.trim()) {
        setMessage('Company name is required');
        setSaving(false);
        return;
      }

      // Parse certifications into array
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
        // Update existing vendor
        const { error } = await supabase
          .from('vendors')
          .update(updateData)
          .eq('id', vendor.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Update error:', error);
          setMessage(`Error saving profile: ${error.message}`);
          setSaving(false);
          return;
        }

        setMessage('Profile saved successfully!');
        // Refresh vendor data
        fetchVendorProfile();
      } else {
        // Create new vendor (shouldn't happen, but just in case)
        const { error } = await supabase
          .from('vendors')
          .insert([{
            ...updateData,
            user_id: user.id,
          }]);

        if (error) {
          console.error('Insert error:', error);
          setMessage(`Error creating profile: ${error.message}`);
          setSaving(false);
          return;
        }

        setMessage('Profile created successfully!');
        // Refresh vendor data
        fetchVendorProfile();
      }

      setSaving(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setMessage(`Error: ${err.message}`);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Success/Error Messages */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.includes('success') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.includes('success') ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message}
          </div>
        )}

        {/* Company Information Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell customers about your business, expertise, and what makes you unique"
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City/Town
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Nairobi"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                County
              </label>
              <input
                type="text"
                name="county"
                value={formData.county}
                onChange={handleInputChange}
                placeholder="e.g., Nairobi County"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">This is your business email</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g., +254701234567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website (Optional)
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number (Optional)
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                placeholder="e.g., +254701234567"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Business Details Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Typical Price Range
              </label>
              <input
                type="text"
                name="price_range"
                value={formData.price_range}
                onChange={handleInputChange}
                placeholder="e.g., KSh 50,000 - KSh 500,000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Help customers understand your pricing</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications & Awards
              </label>
              <textarea
                name="certifications"
                value={formData.certifications}
                onChange={handleInputChange}
                placeholder="e.g., ISO 9001, KNBS certified, Award winner. Separate with commas"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter each certification separated by commas</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            style={{ backgroundColor: '#ea8f1e' }}
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <button
            type="button"
            onClick={fetchVendorProfile}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <p className="font-medium mb-2">✓ Your profile information will be visible to customers on your public profile page</p>
          <p>Make sure all information is accurate and up-to-date to attract more inquiries.</p>
        </div>
      </form>
    </div>
  );
}