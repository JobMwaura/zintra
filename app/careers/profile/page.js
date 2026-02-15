'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, Upload, Plus, X, Check, Shield } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput';
import useOTP from '@/components/hooks/useOTP';
import EmailOTPVerification from '@/components/EmailOTPVerification';

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

  // Phone verification state
  const { sendOTP, verifyOTP } = useOTP();
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpMessage, setPhoneOtpMessage] = useState('');

  // Email verification state
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
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

  // Phone OTP handlers
  async function handleSendPhoneOTP() {
    if (!profile.phone?.trim()) {
      setPhoneOtpMessage('Please enter a phone number first');
      return;
    }
    setPhoneOtpLoading(true);
    setPhoneOtpMessage('');
    try {
      const result = await sendOTP(profile.phone, 'sms', 'registration');
      if (result.success) {
        setShowPhoneOTP(true);
        setPhoneOtpMessage('✓ SMS sent! Enter the 6-digit code');
      } else {
        setPhoneOtpMessage(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setPhoneOtpMessage('Error: ' + err.message);
    } finally {
      setPhoneOtpLoading(false);
    }
  }

  async function handleVerifyPhoneOTP() {
    if (!phoneOtpCode.trim() || phoneOtpCode.length !== 6) {
      setPhoneOtpMessage('Enter a valid 6-digit code');
      return;
    }
    setPhoneOtpLoading(true);
    setPhoneOtpMessage('');
    try {
      const result = await verifyOTP(phoneOtpCode, profile.phone);
      if (result.verified) {
        setPhoneVerified(true);
        setPhoneOtpMessage('✓ Phone verified!');
        setShowPhoneOTP(false);
        setPhoneOtpCode('');
      } else {
        setPhoneOtpMessage(result.error || 'Invalid code');
      }
    } catch (err) {
      setPhoneOtpMessage('Error: ' + err.message);
    } finally {
      setPhoneOtpLoading(false);
    }
  }

  async function handleSaveProfile() {
    try {
      setSaving(true);
      setError(null);

      // Require at least one verified contact method
      if (!phoneVerified && !emailVerified) {
        setError('Please verify at least your phone number or email address before saving.');
        setSaving(false);
        return;
      }

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
        <div className="flex items-center justify-center pt-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

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
                </div>
              </div>

              {/* Verified Contact Details */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={18} className="text-orange-500" />
                  <h2 className="text-lg font-bold text-gray-900">Verify Your Contact Details</h2>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Verify at least one contact method. You can use different details than your Zintra login.
                </p>

                <div className="space-y-5">
                  {/* Phone Verification */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number {phoneVerified && <span className="text-green-600 text-xs ml-1">✓ Verified</span>}
                    </label>

                    {!phoneVerified ? (
                      <>
                        <PhoneInput
                          value={profile.phone}
                          onChange={(phone) => {
                            setProfile({ ...profile, phone });
                            setShowPhoneOTP(false);
                            setPhoneOtpCode('');
                            setPhoneOtpMessage('');
                          }}
                          country="KE"
                          placeholder="721345678"
                        />

                        {!showPhoneOTP ? (
                          <button
                            type="button"
                            onClick={handleSendPhoneOTP}
                            disabled={!profile.phone?.trim() || phoneOtpLoading}
                            className={`mt-3 w-full px-4 py-2 rounded-lg font-semibold text-sm transition ${
                              profile.phone?.trim() && !phoneOtpLoading
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {phoneOtpLoading ? 'Sending...' : 'Send SMS Code'}
                          </button>
                        ) : (
                          <div className="mt-3 space-y-3">
                            <input
                              type="text"
                              maxLength="6"
                              value={phoneOtpCode}
                              onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              className="w-full text-center text-2xl tracking-widest font-mono rounded-lg border-2 border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyPhoneOTP}
                              disabled={phoneOtpCode.length !== 6 || phoneOtpLoading}
                              className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition ${
                                phoneOtpCode.length === 6 && !phoneOtpLoading
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {phoneOtpLoading ? 'Verifying...' : 'Verify Code'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShowPhoneOTP(false); setPhoneOtpCode(''); setPhoneOtpMessage(''); }}
                              className="w-full text-orange-600 text-xs hover:text-orange-700"
                            >
                              ← Change Number
                            </button>
                          </div>
                        )}

                        {phoneOtpMessage && (
                          <p className={`mt-2 text-xs font-medium ${phoneOtpMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                            {phoneOtpMessage}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        <Check size={18} className="text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{profile.phone}</p>
                          <p className="text-xs text-green-600">Phone verified via SMS</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setPhoneVerified(false); setPhoneOtpMessage(''); }}
                          className="ml-auto text-xs text-gray-500 hover:text-orange-600"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email Verification */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address {emailVerified && <span className="text-green-600 text-xs ml-1">✓ Verified</span>}
                    </label>

                    {!emailVerified ? (
                      <>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => {
                            setProfile({ ...profile, email: e.target.value });
                            setEmailVerified(false);
                          }}
                          placeholder="your.email@example.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition mb-3"
                        />
                        <EmailOTPVerification
                          email={profile.email}
                          onVerified={setEmailVerified}
                          isVerified={emailVerified}
                        />
                      </>
                    ) : (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        <Check size={18} className="text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{profile.email}</p>
                          <p className="text-xs text-green-600">Email verified via OTP</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEmailVerified(false)}
                          className="ml-auto text-xs text-gray-500 hover:text-orange-600"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Verification status hint */}
                  {!phoneVerified && !emailVerified && (
                    <p className="text-xs text-amber-600 font-medium">
                      ⚠ You must verify at least one contact method before saving your profile.
                    </p>
                  )}
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
              <div className="border-t border-gray-200 pt-6">
                {!phoneVerified && !emailVerified && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-center">
                    <p className="text-sm text-amber-800 font-medium">
                      🔒 Verify your phone or email above to enable saving
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving || !profile.full_name || !profile.role || (!phoneVerified && !emailVerified)}
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
    </div>
  );
}
