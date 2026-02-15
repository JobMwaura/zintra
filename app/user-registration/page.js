'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PhoneInput from '@/components/PhoneInput';
import useOTP from '@/components/hooks/useOTP';
import VerificationMethodToggle from '@/components/VerificationMethodToggle';
import EmailOTPVerification from '@/components/EmailOTPVerification';

export default function UserRegistration() {
  const supabase = createClient();
  const { sendOTP, verifyOTP } = useOTP();

  // States
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Store user after signup
  
  // Email OTP states
  const [verificationMethod, setVerificationMethod] = useState('sms'); // 'sms' or 'email'
  const [emailVerified, setEmailVerified] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false); // Track if already signed in
  const [checkingSession, setCheckingSession] = useState(true); // Loading state for session check
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    bio: '',
  });
  const [errors, setErrors] = useState({});

  // Check if user is already signed in on mount
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
          console.log('✅ Existing user detected:', user.id);
          setCurrentUser(user);
          setIsExistingUser(true);
          setFormData(prev => ({
            ...prev,
            fullName: user.user_metadata?.full_name || '',
            email: user.email || '',
          }));
          // Skip Step 1 (account creation), go straight to Step 2 (verify)
          setCurrentStep(2);
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setCheckingSession(false);
      }
    }
    checkExistingSession();
  }, []);

  // Step definitions
  const steps = [
    { number: 1, name: 'Account' },
    { number: 2, name: 'Verify' },
    { number: 3, name: 'Profile' },
    { number: 4, name: 'Complete' },
  ];

  // Utility functions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
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

  const validateStep2 = () => {
    const newErrors = {};
    
    if (verificationMethod === 'sms') {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required for SMS verification';
      }
      if (!phoneVerified) {
        newErrors.verification = 'Phone must be verified via SMS';
      }
    } else if (verificationMethod === 'email') {
      if (!emailVerified) {
        newErrors.verification = 'Email must be verified';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: Create Account
  const handleStep1 = async () => {
    if (validateStep1()) {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              role: 'user',
            },
          },
        });

        if (error) {
          alert(`Signup failed: ${error.message}`);
          setLoading(false);
          return;
        }

        // CRITICAL: Verify user was created with valid ID
        if (!data?.user?.id) {
          setOtpMessage('❌ Error: Account created but user ID not returned. Please try again.');
          setLoading(false);
          return;
        }

        console.log('✅ User created with ID:', data.user.id);

        // Store user data for use in later steps
        setCurrentUser(data.user);

        // Account created, move to verification step
        setCurrentStep(2);
      } catch (err) {
        alert('Error creating account: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Step 2: Phone OTP
  const handleSendPhoneOTP = async () => {
    if (!formData.phone.trim()) {
      setOtpMessage('Please enter a phone number first');
      return;
    }

    setOtpLoading(true);
    setOtpMessage('');

    try {
      const result = await sendOTP(formData.phone, 'sms', 'registration');
      if (result.success) {
        setShowPhoneOTP(true);
        setOtpMessage('✓ SMS sent! Enter the 6-digit code');
      } else {
        setOtpMessage(result.error || 'Failed to send OTP');
      }
    } catch (err) {
      setOtpMessage('Error sending OTP: ' + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      setOtpMessage('Please enter a valid 6-digit code');
      return;
    }

    setOtpLoading(true);
    setOtpMessage('');

    try {
      const result = await verifyOTP(otpCode, formData.phone);
      if (result.verified) {
        setPhoneVerified(true);
        
        // CRITICAL: Mark phone as verified in database
        // Use UPSERT (insert or update) because users table row may not exist yet
        if (currentUser && currentUser.id) {
          console.log('Attempting to save phone_verified for user:', currentUser.id);
          const { data: upsertData, error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: currentUser.id,
              phone_verified: true,
              phone_verified_at: new Date().toISOString(),
              phone_number: formData.phone,
            }, { onConflict: 'id' });

          if (upsertError) {
            console.error('❌ Error saving phone_verified to database:', {
              error: upsertError,
              message: upsertError.message,
              code: upsertError.code,
              userId: currentUser.id,
            });
          } else {
            console.log('✅ Phone marked as verified for user:', currentUser.id);
            console.log('Upsert data:', upsertData);
          }
        } else {
          console.warn('⚠️ CurrentUser not available during OTP verification');
        }
        
        setOtpMessage('✓ Phone verified successfully!');
        setTimeout(() => {
          setShowPhoneOTP(false);
          setOtpCode('');
          setCurrentStep(3);
        }, 1500);
      } else {
        setOtpMessage(result.error || 'Invalid OTP code');
      }
    } catch (err) {
      setOtpMessage('Error verifying OTP: ' + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleStep2Continue = () => {
    if (validateStep2()) {
      setCurrentStep(3);
    }
  };

  // Step 3: Profile
  const handleStep3 = async () => {
    setLoading(true);
    setOtpMessage('');

    try {
      // Get the authenticated user
      let user = currentUser;
      
      if (!user) {
        const { data: { user: fetchedUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !fetchedUser) {
          setOtpMessage('❌ Error: Not authenticated. Please log in again.');
          setLoading(false);
          return;
        }
        user = fetchedUser;
      }

      // Verify user ID exists
      if (!user.id) {
        setOtpMessage('❌ Error: User ID not found. Please try signing up again.');
        setLoading(false);
        return;
      }

      console.log('Step 3 - Inserting for user:', user.id);

      // Try INSERT first
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          phone_number: formData.phone,
          phone_verified: phoneVerified,
          phone_verified_at: phoneVerified ? new Date().toISOString() : null,
          bio: formData.bio || null,
        })
        .select();

      // If insert failed because row exists, try update
      if (insertError && insertError.code === '23505') {
        console.log('Row exists, updating instead...');
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({
            full_name: formData.fullName,
            phone: formData.phone,
            phone_number: formData.phone,
            phone_verified: phoneVerified,
            phone_verified_at: phoneVerified ? new Date().toISOString() : null,
            bio: formData.bio || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select();

        if (updateError) {
          console.error('Update error:', updateError);
          setOtpMessage(`❌ Error updating profile: ${updateError.message}`);
          setLoading(false);
          return;
        }
      } else if (insertError) {
        // Check if it's a foreign key error
        if (insertError.code === '23503') {
          console.error('Foreign key error - auth user not found:', insertError);
          setOtpMessage('❌ Error: User account not created properly. Please try signing up again.');
          setLoading(false);
          return;
        }
        console.error('Insert error:', insertError);
        setOtpMessage(`❌ Error saving profile: ${insertError.message}`);
        setLoading(false);
        return;
      }

      // Success - move to completion step
      setOtpMessage('✅ Profile saved successfully! Redirecting...');
      
      setTimeout(() => {
        setCurrentStep(4);
        setLoading(false);
      }, 1000);

    } catch (err) {
      console.error('Unexpected error:', err);
      setOtpMessage(`❌ Unexpected error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 md:py-12" style={{ backgroundColor: '#f8fafc' }}>
      <div className="w-full max-w-2xl px-4 md:px-6">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-10">

          {/* Loading state while checking session */}
          {checkingSession ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Checking your account...</p>
            </div>
          ) : (
          <>
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2" style={{ color: '#5f6466' }}>
            {isExistingUser ? 'Complete Your Profile' : 'Create Your Account'}
          </h1>
          <p className="text-center text-gray-600 mb-10 text-sm md:text-base">
            {isExistingUser
              ? 'Verify your contact details for jobs & gigs on Zintra'
              : 'Join Zintra to connect with trusted construction vendors'}
          </p>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-12 px-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold transition-colors flex-shrink-0 ${
                      currentStep >= step.number
                        ? 'text-white bg-orange-500'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : step.number}
                  </div>
                  <span className="text-xs md:text-sm mt-2 font-medium text-gray-700 text-center whitespace-nowrap">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 md:mx-4 ${
                      currentStep > step.number ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Account Creation */}
          {currentStep === 1 && (
            <div>
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-gray-800">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1.5">{errors.fullName}</p>}
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-gray-800">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-gray-800">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>}
                <p className="text-xs text-gray-500 mt-1.5">
                  Must be 8+ chars with uppercase, number & special char
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-800">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                onClick={handleStep1}
                disabled={loading}
                className="w-full text-white py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: '#ea8f1e' }}
              >
                {loading ? 'Creating Account...' : 'Continue to Verification'}
              </button>

              <p className="text-center text-gray-600 text-sm mt-5">
                Already have an account?{' '}
                <Link href="/login" className="text-orange-500 font-semibold hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          )}

          {/* Step 2: Verification Method Choice */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Verify Your Account</h2>
              <p className="text-gray-600 mb-4 text-sm">Choose your preferred verification method</p>

              {/* Info banner for existing users */}
              {isExistingUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-blue-800">👋 Welcome back, {formData.fullName || 'there'}!</p>
                  <p className="text-xs text-blue-600 mt-1">
                    You&apos;re already signed in. Verify a phone number or email below for your profile.
                    You can use a different number/email than your account if you prefer.
                  </p>
                </div>
              )}

              <VerificationMethodToggle
                currentMethod={verificationMethod}
                onMethodChange={(method) => {
                  setVerificationMethod(method);
                  setOtpMessage('');
                  setShowPhoneOTP(false);
                }}
                showEmailVerified={true}
                emailVerified={emailVerified}
              />

              {/* SMS Verification Section */}
              {verificationMethod === 'sms' && (
                <div>
                  <div className="mb-7">
                    <PhoneInput
                      label="Phone Number"
                      value={formData.phone}
                      onChange={(phone) => setFormData({ ...formData, phone })}
                      country="KE"
                      required
                      error={errors.phone}
                      placeholder="721345678"
                    />
                  </div>

                  {!showPhoneOTP && !phoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendPhoneOTP}
                      disabled={!formData.phone.trim() || otpLoading}
                      className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                        formData.phone.trim() && !otpLoading
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {otpLoading ? 'Sending SMS...' : 'Send SMS Code'}
                    </button>
                  )}

                  {showPhoneOTP && !phoneVerified && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Enter 6-Digit Code *</label>
                        <input
                          type="text"
                          maxLength="6"
                          value={otpCode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setOtpCode(val.slice(0, 6));
                          }}
                          placeholder="000000"
                          className="w-full text-center text-3xl tracking-widest font-mono rounded-lg border-2 border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                        />
                        <p className="text-xs text-gray-600 mt-2">Check your SMS for the code</p>
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyPhoneOTP}
                        disabled={!otpCode.trim() || otpLoading}
                        className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                          otpCode.trim() && !otpLoading
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {otpLoading ? 'Verifying...' : 'Verify SMS Code'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowPhoneOTP(false);
                          setOtpCode('');
                          setOtpMessage('');
                        }}
                        className="w-full text-orange-600 text-sm hover:text-orange-700 transition"
                      >
                        ← Use Different Number
                      </button>
                    </div>
                  )}

                  {phoneVerified && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Phone Verified!</p>
                        <p className="text-xs text-green-600">Your phone number has been successfully verified</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Email Verification Section */}
              {verificationMethod === 'email' && (
                <EmailOTPVerification
                  email={formData.email}
                  onVerified={setEmailVerified}
                  isVerified={emailVerified}
                />
              )}

              {/* Messages */}
              {otpMessage && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  otpMessage.startsWith('✓') 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {otpMessage}
                </div>
              )}

              {errors.verification && (
                <p className="text-red-500 text-xs mt-2">{errors.verification}</p>
              )}

              {/* Continue Button */}
              {(phoneVerified || emailVerified) && (
                <button
                  onClick={handleStep2Continue}
                  className="w-full mt-5 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Continue to Profile Setup →
                </button>
              )}
            </div>
          )}

          {/* Step 3: Profile */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-7 text-gray-800">Complete Your Profile</h2>

              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  Date of Birth (Optional)
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  Gender (Optional)
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-7">
                <label className="block text-sm font-semibold mb-2 text-gray-800">Bio (Optional)</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
                  placeholder="Tell us a bit about yourself"
                />
              </div>

              {otpMessage && (
                <div
                  className={`mb-5 p-3 rounded-lg text-sm font-medium ${
                    otpMessage.includes('✓') || otpMessage.includes('successfully')
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {otpMessage}
                </div>
              )}

              <button
                onClick={handleStep3}
                disabled={loading}
                className="w-full text-white py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: '#ea8f1e' }}
              >
                {loading ? 'Saving Profile...' : 'Complete Registration'}
              </button>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <div className="text-center py-8 md:py-12">
              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-5 flex-shrink-0"
                style={{ backgroundColor: '#fef3e2' }}
              >
                <Check className="w-7 h-7 md:w-8 md:h-8" style={{ color: '#ea8f1e' }} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800">Registration Complete!</h2>
              <p className="text-gray-600 mb-8 text-sm md:text-base leading-relaxed">
                {isExistingUser
                  ? 'Your profile has been verified and updated. You can now browse jobs and gigs.'
                  : 'Your account has been successfully created with verified phone number. You can now log in.'}
              </p>
              {isExistingUser ? (
                <Link href="/careers">
                  <button
                    className="text-white px-8 py-2.5 rounded-lg font-semibold hover:opacity-90 transition inline-block"
                    style={{ backgroundColor: '#ea8f1e' }}
                  >
                    Browse Jobs & Gigs →
                  </button>
                </Link>
              ) : (
                <Link href="/login">
                  <button
                    className="text-white px-8 py-2.5 rounded-lg font-semibold hover:opacity-90 transition inline-block"
                    style={{ backgroundColor: '#ea8f1e' }}
                  >
                    Go to Login
                  </button>
                </Link>
              )}
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
