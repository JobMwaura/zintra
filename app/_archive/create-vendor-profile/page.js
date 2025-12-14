'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, Check } from 'lucide-react';

export default function CreateVendorProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    company_name: 'Munich Pipes',
    email: '',
    phone: '0714123456',
    location: 'Westlands',
    county: 'Nairobi',
    description: 'We lay Pipes',
    website: '',
    whatsapp: '0714123456',
    price_range: 'Premium',
    category: 'Plumbing',
    certifications: [],
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        setFormData(prev => ({ ...prev, email: currentUser.email }));
      }
    };
    getUser();
  }, []);

  const handleCreateProfile = async () => {
    if (!user) {
      setMessage('❌ Not logged in');
      return;
    }

    if (!formData.company_name.trim()) {
      setMessage('❌ Company name is required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      console.log('Creating vendor profile:', {
        user_id: user.id,
        ...formData,
      });

      const { data, error } = await supabase
        .from('vendors')
        .insert([
          {
            user_id: user.id,
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
            certifications: [],
          }
        ])
        .select();

      if (error) {
        console.error('Error:', error);
        setMessage(`❌ Error: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ Profile created:', data);
      setMessage('✅ Vendor profile created successfully! Redirecting to dashboard...');

      setTimeout(() => {
        window.location.href = '/dashboard/vendor';
      }, 2000);

    } catch (err) {
      console.error('Exception:', err);
      setMessage(`❌ Error: ${err.message}`);
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#5f6466' }}>Create Vendor Profile</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
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

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User ID (logged in as):</label>
            <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">{user.id}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email:</label>
            <p className="text-gray-900">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name:</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location:</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleCreateProfile}
          disabled={loading}
          className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#ea8f1e' }}
        >
          {loading ? 'Creating...' : 'Create Vendor Profile'}
        </button>

        <p className="text-xs text-gray-600 mt-4 text-center">
          This will create your vendor profile and redirect to the dashboard.
        </p>
      </div>
    </div>
  );
}