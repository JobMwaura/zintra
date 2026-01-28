'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import CareersNavbar from '@/components/careers/CareersNavbar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, Upload, Plus, X } from 'lucide-react';

export default function CreateProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [profile, setProfile] = useState({
    full_name: '',
    role: '',
    bio: '',
    city: '',
    email: '',
    phone: '',
    skills: [],
    experience: '',
    certifications: [],
    avatar_url: '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/careers/auth/role-selector');
      } else {
        fetchProfile();
      }
    }
  }, [authLoading, user]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          ...data,
          skills: typeof data.skills === 'string' ? data.skills.split(',').map(s => s.trim()) : (data.skills || []),
          certifications: typeof data.certifications === 'string' ? data.certifications.split(',').map(c => c.trim()) : (data.certifications || []),
        });
        if (data.avatar_url) {
          setPreviewUrl(data.avatar_url);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
    }
  }

  async function handleSaveProfile() {
    try {
      setSaving(true);
      setError(null);

      let avatarUrl = profile.avatar_url;

      // Upload avatar if new file selected
      if (avatarFile) {
        const fileName = `${user.id}-${Date.now()}-${avatarFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('worker-avatars')
          .upload(`${user.id}/${fileName}`, avatarFile);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('worker-avatars')
          .getPublicUrl(`${user.id}/${fileName}`);

        avatarUrl = publicUrl.publicUrl;
      }

      // Prepare profile data
      const profileData = {
        id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        city: profile.city,
        bio: profile.bio,
        skills: profile.skills.join(', '),
        certifications: profile.certifications.join(', '),
        experience: profile.experience,
        avatar_url: avatarUrl,
        account_type: 'worker',
        updated_at: new Date().toISOString(),
      };

      // Upsert profile
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (upsertError) throw upsertError;

      setSuccess(true);
      setAvatarFile(null);
      setTimeout(() => {
        router.push(`/careers/talent/${user.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CareersNavbar />
        <div className="flex items-center justify-center pt-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CareersNavbar />

      {/* Back Button & Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/careers/talent"
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Talent
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Your Profile</h1>
          <p className="text-gray-600 mt-2">Showcase your skills and experience to connect with employers</p>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-semibold">✅ Profile saved successfully! Redirecting...</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Avatar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Photo</h2>

              {/* Avatar Preview */}
              <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl text-white font-bold">
                    {profile.full_name?.charAt(0) || '?'}
                  </span>
                )}
              </div>

              {/* Upload Button */}
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-orange-500 transition">
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-semibold text-gray-700">Upload Photo</p>
                <p className="text-xs text-gray-500">JPG, PNG or WebP (max 5MB)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Right Column: Form Fields */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+254 700 000 000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Professional Information</h2>
                <div className="space-y-4">
                  {/* Role */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Primary Role *
                    </label>
                    <input
                      type="text"
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      placeholder="e.g., Electrician, Carpenter, Plumber"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      City/County
                    </label>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      placeholder="e.g., Nairobi, Mombasa, Kisumu"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      About You
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell us about yourself, your expertise, and what you're passionate about..."
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Skills</h2>
                <div className="space-y-4">
                  {/* Existing Skills */}
                  {profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.skills.map((skill, index) => (
                        <div
                          key={index}
                          className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => setProfile({
                              ...profile,
                              skills: profile.skills.filter((_, i) => i !== index)
                            })}
                            className="hover:text-orange-900"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Skill */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill (e.g., Electrical Wiring)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newSkill.trim()) {
                            setProfile({
                              ...profile,
                              skills: [...profile.skills, newSkill.trim()]
                            });
                            setNewSkill('');
                          }
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newSkill.trim()) {
                          setProfile({
                            ...profile,
                            skills: [...profile.skills, newSkill.trim()]
                          });
                          setNewSkill('');
                        }
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
                    >
                      <Plus size={18} />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Experience</h2>
                <textarea
                  value={profile.experience}
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                  placeholder="Describe your work experience, projects you've completed, and achievements..."
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              {/* Certifications */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Certifications</h2>
                <div className="space-y-4">
                  {/* Existing Certifications */}
                  {profile.certifications.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {profile.certifications.map((cert, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-green-50 border border-green-200 px-4 py-2 rounded-lg"
                        >
                          <span className="text-gray-900">{cert}</span>
                          <button
                            type="button"
                            onClick={() => setProfile({
                              ...profile,
                              certifications: profile.certifications.filter((_, i) => i !== index)
                            })}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Certification */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="Add a certification"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCertification.trim()) {
                            setProfile({
                              ...profile,
                              certifications: [...profile.certifications, newCertification.trim()]
                            });
                            setNewCertification('');
                          }
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCertification.trim()) {
                          setProfile({
                            ...profile,
                            certifications: [...profile.certifications, newCertification.trim()]
                          });
                          setNewCertification('');
                        }
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
                    >
                      <Plus size={18} />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving || !profile.full_name || !profile.email || !profile.role}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <Link
                  href="/careers/talent"
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 rounded-lg text-center transition"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
