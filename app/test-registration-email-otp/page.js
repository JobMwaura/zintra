// File: app/test-registration-email-otp/page.js
// Purpose: Demo of Email OTP integration in registration flow

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import VerificationMethodToggle from '@/components/VerificationMethodToggle';
import EmailOTPVerification from '@/components/EmailOTPVerification';
import PhoneInput from '@/components/PhoneInput';
import useOTP from '@/components/hooks/useOTP';

export default function TestRegistrationEmailOTP() {
  const supabase = createClient();
  const { sendOTP, verifyOTP } = useOTP();

  // Demo form data
  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+254721345678',
    password: 'TestPassword123!'
  });

  // Verification states
  const [verificationMethod, setVerificationMethod] = useState('sms');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  // Phone OTP handlers
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
        setOtpMessage(result.error || 'Failed to send SMS');
      }
    } catch (err) {
      setOtpMessage('Error sending SMS: ' + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!otpCode.trim()) {
      setOtpMessage('Please enter the verification code');
      return;
    }

    setOtpLoading(true);
    setOtpMessage('');

    try {
      const result = await verifyOTP(formData.phone, otpCode, 'sms');
      if (result.success) {
        setPhoneVerified(true);
        setOtpMessage('✓ Phone verified successfully!');
        setTimeout(() => {
          setShowPhoneOTP(false);
          setOtpCode('');
        }, 1500);
      } else {
        setOtpMessage(result.error || 'Invalid verification code');
      }
    } catch (err) {
      setOtpMessage('Error verifying SMS: ' + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registration Email OTP Demo
          </h1>
          <p className="text-gray-600">
            Demo of how Email OTP choice would work in registration
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Step 1 Mock - Account Details */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Step 1: Account Details (Mock)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span> {formData.fullName}
              </div>
              <div>
                <span className="text-gray-600">Email:</span> {formData.email}
              </div>
              <div>
                <span className="text-gray-600">Phone:</span> {formData.phone}
              </div>
              <div>
                <span className="text-gray-600">Password:</span> ••••••••••
              </div>
            </div>
          </div>

          {/* Step 2 - Verification Choice */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Step 2: Verify Your Account</h3>
            <p className="text-gray-600 mb-6">Choose your preferred verification method</p>

            {/* Verification Method Toggle */}
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
              <div className="space-y-4">
                <div>
                  <PhoneInput
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(phone) => setFormData({ ...formData, phone })}
                    country="KE"
                    required
                    placeholder="721345678"
                  />
                </div>

                {!showPhoneOTP && !phoneVerified && (
                  <button
                    type="button"
                    onClick={handleSendPhoneOTP}
                    disabled={!formData.phone.trim() || otpLoading}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition ${
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter 6-Digit SMS Code
                      </label>
                      <input
                        type="text"
                        maxLength="6"
                        value={otpCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setOtpCode(val.slice(0, 6));
                        }}
                        placeholder="000000"
                        className="w-full text-center text-2xl tracking-widest font-mono rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyPhoneOTP}
                      disabled={!otpCode.trim() || otpLoading}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition ${
                        otpCode.trim() && !otpLoading
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {otpLoading ? 'Verifying...' : 'Verify SMS Code'}
                    </button>
                  </div>
                )}

                {phoneVerified && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">✓ Phone verified successfully!</p>
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

            {/* Continue Button */}
            {(phoneVerified || emailVerified) && (
              <button
                type="button"
                className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Continue to Profile Setup →
              </button>
            )}
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📝 Integration Guide for Existing Registration Pages
          </h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900">1. Required State Variables</h4>
              <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                {`const [verificationMethod, setVerificationMethod] = useState('sms');
const [emailVerified, setEmailVerified] = useState(false);`}
              </code>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">2. Updated Step 2 Validation</h4>
              <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                {`// Check both SMS and Email verification
if (verificationMethod === 'sms' && !phoneVerified) return false;
if (verificationMethod === 'email' && !emailVerified) return false;`}
              </code>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">3. UI Integration</h4>
              <ul className="list-disc list-inside mt-1 text-gray-700 space-y-1">
                <li>Add <code>VerificationMethodToggle</code> before phone input</li>
                <li>Wrap phone verification in <code>{`{verificationMethod === 'sms' && ...}`}</code></li>
                <li>Add <code>EmailOTPVerification</code> component for email method</li>
                <li>Update continue button condition to check both methods</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">4. Files to Update</h4>
              <ul className="list-disc list-inside mt-1 text-gray-700 space-y-1">
                <li><code>/app/user-registration/page.js</code> - User registration</li>
                <li><code>/app/vendor-registration/page.js</code> - Vendor registration</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center space-x-4">
          <a
            href="/user-registration"
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            → Current User Registration
          </a>
          <a
            href="/vendor-registration"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            → Current Vendor Registration
          </a>
          <a
            href="/test-email-otp"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            → Email OTP Test
          </a>
        </div>
      </div>
    </div>
  );
}