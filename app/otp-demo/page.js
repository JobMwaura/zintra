'use client';

import { useState } from 'react';
import OTPModal from '@/components/OTPModal';
import PhoneNumberInput from '@/components/PhoneNumberInput';
import OTPInput from '@/components/OTPInput';
import { useOTP } from '@/components/hooks/useOTP';

/**
 * OTP Components Demo & Testing Page
 * 
 * This page demonstrates how to use all OTP components
 * Can be accessed at: /otp-demo
 */
export default function OTPDemo() {
  const { sendOTP, verifyOTP, loading } = useOTP();

  // States
  const [activeTab, setActiveTab] = useState('input'); // input, modal, phone
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);

  const handleOTPComplete = (code) => {
    console.log('OTP completed:', code);
  };

  const handleSendOTP = async () => {
    const result = await sendOTP(phone, 'sms', 'registration');
    if (result.success) {
      setShowModal(true);
      setOtpError('');
    } else {
      setOtpError(result.error);
    }
  };

  const handleVerifyOTP = async (code) => {
    const result = await verifyOTP(code);
    if (result.success) {
      setOtpSuccess(true);
      setOtpError('');
    } else {
      setOtpError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">OTP Components Demo</h1>
          <p className="text-gray-600 mb-8">
            Test and interact with all OTP components. These are production-ready components with clean UI and full functionality.
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-gray-200">
            {['input', 'modal', 'phone'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'input' && 'OTP Input'}
                {tab === 'modal' && 'OTP Modal'}
                {tab === 'phone' && 'Phone Input'}
              </button>
            ))}
          </div>

          {/* OTP Input Demo */}
          {activeTab === 'input' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">OTP Input Component</h2>
                <p className="text-gray-600 mb-6">
                  A 6-digit OTP input with auto-focus, paste support, and beautiful styling.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold mb-4 text-gray-700">
                  Enter OTP Code:
                </label>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleOTPComplete}
                  error={otp.length === 6 && otp < 100000}
                  errorMessage={otp.length === 6 && otp < 100000 ? 'Invalid OTP' : ''}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Current value:</strong> {otp || '(empty)'}
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>✨ <strong>Features:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Auto-focus to next digit</li>
                  <li>Paste from clipboard support</li>
                  <li>Keyboard navigation (arrow keys)</li>
                  <li>Backspace support</li>
                  <li>Real-time validation</li>
                  <li>Error state styling</li>
                </ul>
              </div>
            </div>
          )}

          {/* OTP Modal Demo */}
          {activeTab === 'modal' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">OTP Modal Component</h2>
                <p className="text-gray-600 mb-6">
                  A complete modal with OTP input, timers, resend button, and error handling.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number (e.g., +254712345678)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />

                <button
                  onClick={handleSendOTP}
                  disabled={!phone || loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>

                {otpError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {otpError}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>✨ <strong>Features:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Beautiful modal overlay</li>
                  <li>10-minute countdown timer</li>
                  <li>3-attempt counter</li>
                  <li>60-second resend cooldown</li>
                  <li>Error and success messages</li>
                  <li>Loading states</li>
                  <li>Accessibility support</li>
                </ul>
              </div>

              <OTPModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleVerifyOTP}
                channel="sms"
                recipient={phone}
                title="Verify Your Phone Number"
                description="Enter the 6-digit code sent to your"
                loading={loading}
                error={otpError}
                success={otpSuccess}
                onResend={() => handleSendOTP()}
              />
            </div>
          )}

          {/* Phone Input Demo */}
          {activeTab === 'phone' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Phone Number Input Component</h2>
                <p className="text-gray-600 mb-6">
                  A Kenya-optimized phone input with format validation and real-time feedback.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <PhoneNumberInput
                  label="Mobile Phone"
                  value={phone}
                  onChange={setPhone}
                  hint="Enter Kenya phone number (Safaricom, Airtel, Vodafone)"
                  placeholder="0712345678 or +254712345678"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Current value:</strong> {phone || '(empty)'}
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>✨ <strong>Features:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Kenya phone format validation</li>
                  <li>Auto-format as user types</li>
                  <li>Quick format buttons</li>
                  <li>Real-time validation feedback</li>
                  <li>Success/error states</li>
                  <li>Helpful hints and examples</li>
                </ul>
              </div>
            </div>
          )}

          {/* Code Examples */}
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Usage Examples</h2>

            <div className="space-y-6">
              {/* OTP Input Example */}
              <div className="bg-gray-900 rounded-lg p-6 text-white overflow-x-auto">
                <p className="text-sm font-semibold mb-3 text-gray-300">OTP Input Usage:</p>
                <pre className="text-sm"><code>{`import OTPInput from '@/components/OTPInput';

function MyComponent() {
  const [otp, setOtp] = useState('');

  return (
    <OTPInput
      value={otp}
      onChange={setOtp}
      onComplete={(code) => console.log('Complete:', code)}
      error={false}
      errorMessage=""
    />
  );
}`}</code></pre>
              </div>

              {/* useOTP Hook Example */}
              <div className="bg-gray-900 rounded-lg p-6 text-white overflow-x-auto">
                <p className="text-sm font-semibold mb-3 text-gray-300">useOTP Hook Usage:</p>
                <pre className="text-sm"><code>{`import { useOTP } from '@/components/hooks/useOTP';

function MyComponent() {
  const { sendOTP, verifyOTP, loading } = useOTP();

  // Send OTP
  const result = await sendOTP(phone, 'sms', 'registration');

  // Verify OTP
  const verified = await verifyOTP(code, otpId);
}`}</code></pre>
              </div>

              {/* Phone Input Example */}
              <div className="bg-gray-900 rounded-lg p-6 text-white overflow-x-auto">
                <p className="text-sm font-semibold mb-3 text-gray-300">Phone Input Usage:</p>
                <pre className="text-sm"><code>{`import PhoneNumberInput from '@/components/PhoneNumberInput';

function MyComponent() {
  const [phone, setPhone] = useState('');

  return (
    <PhoneNumberInput
      label="Phone Number"
      value={phone}
      onChange={setPhone}
      hint="Kenya phone format"
    />
  );
}`}</code></pre>
              </div>
            </div>
          </div>

          {/* Integration Guide */}
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Integration Steps</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
              <ol className="space-y-4 list-decimal list-inside">
                <li>
                  <strong>Add OTP Modal to registration:</strong>
                  <p className="text-gray-700 ml-6 mt-1">Import OTPModal and useOTP hook into your registration form</p>
                </li>
                <li>
                  <strong>Call sendOTP after account creation:</strong>
                  <p className="text-gray-700 ml-6 mt-1">Use the hook to send OTP to email or SMS</p>
                </li>
                <li>
                  <strong>Show OTP Modal:</strong>
                  <p className="text-gray-700 ml-6 mt-1">Display the modal for user to enter code</p>
                </li>
                <li>
                  <strong>Verify and continue:</strong>
                  <p className="text-gray-700 ml-6 mt-1">On success, proceed to next registration step</p>
                </li>
              </ol>
            </div>
          </div>

          {/* Status */}
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">✅ OTPInput - Ready</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">✅ OTPModal - Ready</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">✅ PhoneInput - Ready</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">✅ useOTP Hook - Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
