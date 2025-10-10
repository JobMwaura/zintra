'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Eye, EyeOff, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'; // ✅ Supabase client

export default function UserRegistration() {
  const supabase = createClient();

  // States
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    bio: '',
    profilePicture: null,
  });
  const [errors, setErrors] = useState({});

  // Step definitions
  const steps = [
    { number: 1, name: 'Account' },
    { number: 2, name: 'Verification' },
    { number: 3, name: 'Profile' },
    { number: 4, name: 'Complete' },
  ];

  // Utility functions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) setFormData({ ...formData, profilePicture: file });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Enter a valid email';
    if (!validatePassword(formData.password))
      newErrors.password = 'Must be 8+ chars, include uppercase, number & special char';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Registration logic
  const handleContinue = async () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              role: 'user',
            },
          },
        });
        setLoading(false);

        if (error) {
          alert(`Signup failed: ${error.message}`);
          return;
        }

        // If email confirmation is enabled, go to step 2
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      // Proceed to profile step (you can add code verification logic here later)
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Save additional profile data
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              gender: formData.gender,
              date_of_birth: formData.dateOfBirth,
              bio: formData.bio,
            },
          });
          if (updateError) throw updateError;
        }
        setCurrentStep(4);
      } catch (err) {
        alert(`Profile update failed: ${err.message}`);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <img src="/zintra-svg-logo.svg" alt="Zintra" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium">
              Login
            </Link>
            <Link href="/vendor-registration">
              <button
                className="text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
                style={{ backgroundColor: '#ea8f1e' }}
              >
                Vendor Sign Up
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#5f6466' }}>
            Create Your Account
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Join Zintra to connect with trusted construction vendors
          </p>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-12">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors ${
                      currentStep >= step.number
                        ? 'text-white bg-orange-500'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? <Check className="w-6 h-6" /> : step.number}
                  </div>
                  <span className="text-sm mt-2 font-medium text-gray-700">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > step.number ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Account */}
          {currentStep === 1 && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Confirm Password
                </label>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#ea8f1e' }}
              >
                {loading ? 'Creating Account...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 2: Verification */}
          {currentStep === 2 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-700">Verify Your Account</h2>
              <p className="text-gray-600 mb-8">
                Check your inbox at <strong>{formData.email}</strong> for a verification link.
              </p>
              <button
                onClick={() => setCurrentStep(3)}
                className="text-white py-3 px-6 rounded-lg font-semibold"
                style={{ backgroundColor: '#ea8f1e' }}
              >
                I’ve Verified My Email
              </button>
            </div>
          )}

          {/* Step 3: Profile */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-700">Complete Your Profile</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="+254 700 000 000"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Gender (Optional)
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="Tell us a bit about yourself"
                />
              </div>

              <button
                onClick={handleContinue}
                className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90"
                style={{ backgroundColor: '#ea8f1e' }}
              >
                Save Profile
              </button>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#fef3e2' }}
              >
                <Check className="w-8 h-8" style={{ color: '#ea8f1e' }} />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-700">Registration Complete!</h2>
              <p className="text-gray-600 mb-8">
                Your account has been successfully created. You can now log in.
              </p>
              <Link href="/login">
                <button
                  className="text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Go to Login
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
