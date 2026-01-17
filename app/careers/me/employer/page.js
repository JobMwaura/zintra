'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EmployerProfile() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    company_name: '',
    company_registration: '',
    company_phone: '',
    company_email: '',
    county: '',
    company_description: '',
  });

  // Fetch current user and profile
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push('/auth/login');
          return;
        }

        setUser(authUser);

        // Fetch base profile
        const { data: baseProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        // Fetch employer profile
        const { data: employerProfile, error: profileError } = await supabase
          .from('employer_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!profileError && employerProfile) {
          setProfile(employerProfile);
          setFormData({
            full_name: baseProfile?.full_name || '',
            phone: baseProfile?.phone || '',
            location: baseProfile?.location || '',
            company_name: employerProfile.company_name || '',
            company_registration: employerProfile.company_registration || '',
            company_phone: employerProfile.company_phone || '',
            company_email: employerProfile.company_email || '',
            county: employerProfile.county || '',
            company_description: employerProfile.company_description || '',
          });
        }

        setError(null);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (!user) {
        setError('Not authenticated');
        return;
      }

      // Validate required fields
      if (!formData.company_name.trim()) {
        setError('Company name is required');
        setSaving(false);
        return;
      }

      if (!formData.county.trim()) {
        setError('County is required');
        setSaving(false);
        return;
      }

      // Update or insert employer profile
      const { error: upsertError } = await supabase.from('employer_profiles').upsert(
        {
          id: user.id,
          company_name: formData.company_name,
          company_registration: formData.company_registration,
          company_phone: formData.company_phone,
          company_email: formData.company_email,
          county: formData.county,
          company_description: formData.company_description,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (upsertError) {
        console.error('Error saving employer profile:', upsertError);
        setError('Failed to save employer profile');
        setSaving(false);
        return;
      }

      // Update base profile info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.county,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        setError('Failed to update profile');
        setSaving(false);
        return;
      }

      // Enable employer flag
      const { error: roleError } = await supabase
        .from('profiles')
        .update({ is_employer: true })
        .eq('id', user.id);

      if (roleError) {
        console.error('Error setting employer role:', roleError);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employer Profile</h1>
          <p className="mt-2 text-gray-600">Set up your company to post jobs and hire talent</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">✓ Employer profile saved successfully!</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Personal Info */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">Your Information</legend>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+254..."
              />
            </div>
          </fieldset>

          {/* Company Info */}
          <fieldset className="space-y-4 pt-4 border-t">
            <legend className="text-lg font-semibold text-gray-900">Company Information</legend>

            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                Company Name *
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your company name"
              />
            </div>

            <div>
              <label htmlFor="company_registration" className="block text-sm font-medium text-gray-700">
                KRA PIN / Registration Number
              </label>
              <input
                type="text"
                id="company_registration"
                name="company_registration"
                value={formData.company_registration}
                onChange={handleInputChange}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., A001234567ABC"
              />
            </div>

            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700">
                County *
              </label>
              <select
                id="county"
                name="county"
                value={formData.county}
                onChange={handleInputChange}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select county</option>
                <option value="Nairobi">Nairobi</option>
                <option value="Mombasa">Mombasa</option>
                <option value="Kisumu">Kisumu</option>
                <option value="Nakuru">Nakuru</option>
                <option value="Eldoret">Eldoret</option>
                <option value="Kiambu">Kiambu</option>
                <option value="Machakos">Machakos</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="company_email" className="block text-sm font-medium text-gray-700">
                Company Email
              </label>
              <input
                type="email"
                id="company_email"
                name="company_email"
                value={formData.company_email}
                onChange={handleInputChange}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="company@example.com"
              />
            </div>

            <div>
              <label htmlFor="company_phone" className="block text-sm font-medium text-gray-700">
                Company Phone
              </label>
              <input
                type="tel"
                id="company_phone"
                name="company_phone"
                value={formData.company_phone}
                onChange={handleInputChange}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+254..."
              />
            </div>

            <div>
              <label htmlFor="company_description" className="block text-sm font-medium text-gray-700">
                About Your Company
              </label>
              <textarea
                id="company_description"
                name="company_description"
                value={formData.company_description}
                onChange={handleInputChange}
                rows="4"
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell candidates about your company, values, and what you're looking for..."
              />
            </div>
          </fieldset>

          {/* Submit */}
          <div className="pt-6 border-t flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
