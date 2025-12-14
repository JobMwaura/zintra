'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Share2, MapPin, Phone, Mail, Globe, MessageCircle, Star } from 'lucide-react';

export default function ProfilePreviewTab() {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      setLoading(true);

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
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
        setLoading(false);
        return;
      }

      if (vendorData) {
        setVendor(vendorData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in fetchVendorData:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile preview...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <p className="text-blue-900 mb-4">
          <strong>No profile yet!</strong> Go to "My Profile" and fill in your details to see your preview here.
        </p>
        <p className="text-sm text-blue-700">
          Once you save your profile information, it will appear here exactly as customers see it.
        </p>
      </div>
    );
  }

  // Extract certifications array
  const certifications = Array.isArray(vendor.certifications) 
    ? vendor.certifications 
    : vendor.certifications ? vendor.certifications.split(',').map(c => c.trim()) : [];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-8 border border-orange-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-gray-900">
                {vendor.company_name || 'Your Company'}
              </h1>
              <span className="bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                {vendor.category || 'General'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{vendor.location || 'Not specified'}</span>
            </div>

            <p className="text-gray-600 max-w-2xl leading-relaxed">
              {vendor.description || 'No description provided yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-600">
          <p className="text-sm text-gray-500 mb-1">Verified Status</p>
          <p className="text-lg font-semibold text-gray-900">✓ Verified</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
          <p className="text-sm text-gray-500 mb-1">Response Time</p>
          <p className="text-lg font-semibold text-gray-900">2 hours avg</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-600">
          <p className="text-sm text-gray-500 mb-1">Member Since</p>
          <p className="text-lg font-semibold text-gray-900">2024</p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-orange-600" />
          Contact Information
        </h3>
        <div className="space-y-4">
          {vendor.phone && (
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900 font-medium">{vendor.phone}</p>
              </div>
              <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 font-medium">
                Call
              </button>
            </div>
          )}

          {vendor.email && (
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </p>
                <p className="text-gray-900 font-medium">{vendor.email}</p>
              </div>
              <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 font-medium">
                Email
              </button>
            </div>
          )}

          {vendor.whatsapp && (
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </p>
                <p className="text-gray-900 font-medium">{vendor.whatsapp}</p>
              </div>
              <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 font-medium">
                Message
              </button>
            </div>
          )}

          {vendor.website && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </p>
                <a 
                  href={vendor.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:underline font-medium"
                >
                  {vendor.website}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Area */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Area</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">City/Town</p>
            <p className="text-gray-900 font-medium">{vendor.location || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">County</p>
            <p className="text-gray-900 font-medium">{vendor.county || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
        <div className="space-y-4">
          {vendor.price_range && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Typical Project Range</p>
              <p className="text-gray-900 font-medium">{vendor.price_range}</p>
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Certifications & Awards
              </p>
              <div className="space-y-2">
                {certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-900">
                    <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Action Buttons */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition">
            Request Quote
          </button>
          <button className="px-6 py-3 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 font-medium transition">
            Contact Vendor
          </button>
        </div>
        
        <button className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">
          <Share2 className="w-4 h-4" />
          Share Vendor Profile
        </button>
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <div className="flex-shrink-0 text-blue-600 font-bold">ℹ️</div>
        <div>
          <p className="text-sm text-blue-900">
            <strong>This is your live profile preview!</strong> This is exactly what customers see when they visit your profile. Changes you make in "My Profile" tab will appear here automatically.
          </p>
        </div>
      </div>

      {/* Edit Reminder */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <div className="flex-shrink-0 text-yellow-600 font-bold">⚠️</div>
        <div>
          <p className="text-sm text-yellow-900">
            <strong>Want to make changes?</strong> Go to the "My Profile" tab to edit your information, and it will update here in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}