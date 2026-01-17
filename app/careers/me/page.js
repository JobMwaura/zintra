'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function CandidateProfile() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

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
    skills: [],
    availability: 'Available now',
    rate_per_day: '',
    bio: '',
    experience_years: 0,
  });

  const [newSkill, setNewSkill] = useState('');

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

        // Fetch candidate profile
        const { data: candidateProfile, error: profileError } = await supabase
          .from('candidate_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!profileError && candidateProfile) {
          setProfile(candidateProfile);
          setFormData({
            full_name: candidateProfile.profile?.full_name || '',
            phone: candidateProfile.profile?.phone || '',
            location: candidateProfile.profile?.location || '',
            skills: candidateProfile.skills || [],
            availability: candidateProfile.availability || 'Available now',
            rate_per_day: candidateProfile.rate_per_day || '',
            bio: candidateProfile.bio || '',
            experience_years: candidateProfile.experience_years || 0,
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
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value,
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
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
      if (!formData.full_name.trim()) {
        setError('Full name is required');
        setSaving(false);
        return;
      }

      if (!formData.location.trim()) {
        setError('Location is required');
        setSaving(false);
        return;
      }

      // Update or insert candidate profile
      const { error: upsertError } = await supabase.from('candidate_profiles').upsert(
        {
          id: user.id,
          skills: formData.skills,
          availability: formData.availability,
          rate_per_day: formData.rate_per_day ? parseFloat(formData.rate_per_day) : null,
          bio: formData.bio,
          experience_years: formData.experience_years,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (upsertError) {
        console.error('Error saving profile:', upsertError);
        setError('Failed to save profile');
        setSaving(false);
        return;
      }

      // Update basic profile info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          location: formData.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        setError('Failed to update profile');
        setSaving(false);
        return;
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
          <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
          <p className="mt-2 text-gray-600">Complete your profile to get hired faster</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">✓ Profile saved successfully!</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Basic Info */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">Basic Information</legend>

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name *
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

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location (County) *
              </label>
              <select
                id="location"
                name="location"
                value={formData.location}
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
          </fieldset>

          {/* Experience */}
          <fieldset className="space-y-4 pt-4 border-t">
            <legend className="text-lg font-semibold text-gray-900">Experience</legend>

            <div>
              <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                type="number"
                id="experience_years"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleInputChange}
                min="0"
                max="50"
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                About You
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="4"
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell employers about yourself, your experience, and what you're looking for..."
              />
            </div>
          </fieldset>

          {/* Skills */}
          <fieldset className="space-y-4 pt-4 border-t">
            <legend className="text-lg font-semibold text-gray-900">Skills</legend>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Masonry, Electrical, Plumbing..."
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>

            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <div
                    key={skill}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-blue-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {/* Availability & Rate */}
          <fieldset className="space-y-4 pt-4 border-t">
            <legend className="text-lg font-semibold text-gray-900">Availability & Rate</legend>

            <div>
              <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                Availability
              </label>
              <select
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Available now">Available now</option>
                <option value="Available in 1 week">Available in 1 week</option>
                <option value="Available in 2 weeks">Available in 2 weeks</option>
                <option value="Available in 1 month">Available in 1 month</option>
                <option value="Not available">Not available</option>
              </select>
            </div>

            <div>
              <label htmlFor="rate_per_day" className="block text-sm font-medium text-gray-700">
                Expected Rate (KES per day)
              </label>
              <input
                type="number"
                id="rate_per_day"
                name="rate_per_day"
                value={formData.rate_per_day}
                onChange={handleInputChange}
                min="0"
                step="100"
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1500"
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
