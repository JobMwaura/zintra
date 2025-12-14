'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save, AlertCircle, Check, MapPin, Mail, Phone, Eye } from 'lucide-react';

export default function VendorProfilePage() {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
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
  });

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const { data: vendorData, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching vendor:', error);
      }

      if (vendorData) {
        console.log('✅ Vendor found:', vendorData);
        setVendor(vendorData);
        setFormData({
          company_name: vendorData.company_name || '',
          email: vendorData.email || '',
          phone: vendorData.phone || '',
          location: vendorData.location || '',
          county: vendorData.county || '',
          description: vendorData.description || '',
          website: vendorData.website || '',
          whatsapp: vendorData.whatsapp || '',
          price_range: vendorData.price_range || '',
          category: vendorData.category || 'General',
        });
      } else {
        console.log('No vendor profile found');
        setMessage('No profile found. Please create one first.');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!vendor) {
      setMessage('❌ No profile to update');
      return;
    }

    if (!formData.company_name.trim()) {
      setMessage('❌ Company name is required');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      console.log('Updating vendor profile...');

      const { error } = await supabase
        .from('vendors')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendor.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Update error:', error);
        setMessage(`❌ Error: ${error.message}`);
        setSaving(false);
        return;
      }

      console.log('✅ Profile updated successfully');
      setMessage('✅ Profile updated successfully!');

      setTimeout(() => {
        fetchVendorData();
        setMessage('');
      }, 2000);

      setSaving(false);
    } catch (err) {
      console.error('Exception:', err);
      setMessage(`❌ Error: ${err.message}`);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold mb-2">No Profile Found</p>
            <p className="text-gray-600 mb-4">Please create your vendor profile first.</p>
            <a href="/create-vendor-profile" className="inline-block px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              Create Profile
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            <Eye className="w-5 h-5" />
            {showPreview ? 'Edit' : 'Preview'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${
                  message.includes('✅')
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message.includes('✅') ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  {message}
                </div>
              )}

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      placeholder="Your company name"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option>General</option>
                      <option>Construction Materials</option>
                      <option>Hardware & Tools</option>
                      <option>Electrical</option>
                      <option>Plumbing</option>
                      <option>Paint & Coatings</option>
                      <option>Services</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell customers about your business"
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                    <select
                      name="price_range"
                      value={formData.price_range}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="">Select price range</option>
                      <option>Budget</option>
                      <option>Mid-range</option>
                      <option>Premium</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City/Town</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Nairobi"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">County/Region</label>
                    <input
                      type="text"
                      name="county"
                      value={formData.county}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">How Customers See You</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{formData.company_name || 'Company Name'}</h3>
                    <p className="text-sm text-orange-600 font-medium">{formData.category || 'Category'}</p>
                  </div>

                  {formData.description && (
                    <p className="text-sm text-gray-700">{formData.description}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600">
                    {formData.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{formData.location}{formData.county ? `, ${formData.county}` : ''}</span>
                      </div>
                    )}
                    {formData.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{formData.email}</span>
                      </div>
                    )}
                    {formData.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{formData.phone}</span>
                      </div>
                    )}
                  </div>

                  {formData.price_range && (
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-600">Price Range: <span className="font-medium">{formData.price_range}</span></p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}