# ⚡ OTP Implementation Quick Start

## 🎯 5-Minute Integration Guide

### Step 1: Import Components
```javascript
import OTPModal from '@/components/OTPModal';
import PhoneNumberInput from '@/components/PhoneNumberInput';
import { useOTP } from '@/components/hooks/useOTP';
```

### Step 2: Initialize Hook
```javascript
const { sendOTP, verifyOTP, loading } = useOTP();
const [showOTPModal, setShowOTPModal] = useState(false);
const [otpIdentifier, setOtpIdentifier] = useState('');
```

### Step 3: Send OTP
```javascript
const handleSendOTP = async (identifier, channel = 'sms') => {
  const result = await sendOTP(identifier, channel, 'registration');
  if (result.success) {
    setOtpIdentifier(identifier);
    setShowOTPModal(true);
  }
};
```

### Step 4: Verify OTP
```javascript
const handleVerifyOTP = async (code) => {
  const result = await verifyOTP(code);
  if (result.success) {
    // User verified! Continue to next step
    setShowOTPModal(false);
    proceedToNextStep();
  }
};
```

### Step 5: Add Modal to JSX
```javascript
<OTPModal
  isOpen={showOTPModal}
  onClose={() => setShowOTPModal(false)}
  onSubmit={handleVerifyOTP}
  channel="sms"
  recipient={otpIdentifier}
  onResend={() => handleSendOTP(otpIdentifier)}
/>
```

---

## 📱 Component Props

### OTPInput
```javascript
<OTPInput
  value={otp}                    // Current OTP value
  onChange={setOtp}              // Called when user types
  onComplete={handleComplete}    // Called when all 6 digits filled
  length={6}                     // Number of digits (default: 6)
  disabled={false}               // Disable input
  error={false}                  // Show error state
  errorMessage="Invalid OTP"     // Error text
/>
```

### OTPModal
```javascript
<OTPModal
  isOpen={true}                           // Show/hide modal
  onClose={() => {}}                      // Called when user clicks X
  onSubmit={async (code) => {}}           // Called when user enters code
  channel="sms"                           // 'sms' or 'email'
  recipient="+254712345678"               // Phone or email to show
  title="Verify Your Phone"               // Modal title
  description="Enter code sent to"        // Modal description
  loading={false}                         // Show loading spinner
  error={null}                            // Error message
  success={false}                         // Show success state
  maxAttempts={3}                         // Max wrong attempts
  expirySeconds={600}                     // 10 minutes default
  onResend={async () => {}}               // Called when user clicks Resend
/>
```

### PhoneNumberInput
```javascript
<PhoneNumberInput
  value={phone}                           // Current phone value
  onChange={setPhone}                     // Called when user types
  label="Phone Number"                    // Input label
  placeholder="0712345678"                // Placeholder text
  error={error}                           // Error message
  disabled={false}                        // Disable input
  required={true}                         // Show required indicator
  hint="Kenya phone format"                // Help text
/>
```

### useOTP Hook
```javascript
const {
  loading,              // Boolean - API call in progress
  error,               // String - Error message
  success,             // Boolean - Last operation succeeded
  otpId,               // String - OTP session ID
  expiresIn,           // Number - Seconds until expiry
  sendOTP,             // Function - Send OTP
  verifyOTP,           // Function - Verify OTP
  resendOTP,           // Function - Resend OTP
  reset,               // Function - Clear state
} = useOTP();
```

---

## 🔄 Common Workflows

### Email OTP Verification
```javascript
// 1. Send OTP to email
const result = await sendOTP(email, 'email', 'registration');

// 2. Show modal
if (result.success) {
  setShowModal(true);
}

// 3. User enters code from email
const verified = await verifyOTP(code);

// 4. Continue if successful
if (verified.success) {
  proceedToNextStep();
}
```

### SMS OTP Verification
```javascript
// 1. Send OTP to phone
const result = await sendOTP(phone, 'sms', 'registration');

// 2. Show modal
if (result.success) {
  setShowModal(true);
}

// 3. User enters code from SMS
const verified = await verifyOTP(code);

// 4. Continue if successful
if (verified.success) {
  proceedToNextStep();
}
```

### Both Email + Phone
```javascript
// 1. Send email OTP first
const emailResult = await sendOTP(email, 'email', 'registration');
setShowModal(true);

// 2. Verify email
const emailVerified = await verifyOTP(emailCode);
if (!emailVerified.success) return;

// 3. Send SMS OTP
const smsResult = await sendOTP(phone, 'sms', 'registration');
setShowModal(true);

// 4. Verify SMS
const smsVerified = await verifyOTP(smsCode);
if (smsVerified.success) {
  proceedToNextStep();
}
```

### With Error Handling
```javascript
const handleSendOTP = async (identifier, channel) => {
  try {
    const result = await sendOTP(identifier, channel, 'registration');
    if (result.success) {
      setShowModal(true);
    } else {
      setErrorMessage(result.error);
    }
  } catch (err) {
    setErrorMessage('Failed to send OTP. Please try again.');
  }
};
```

---

## 🎨 Example: User Registration with OTP

```javascript
'use client';

import { useState } from 'react';
import OTPModal from '@/components/OTPModal';
import PhoneNumberInput from '@/components/PhoneNumberInput';
import { useOTP } from '@/components/hooks/useOTP';

export default function Registration() {
  const { sendOTP, verifyOTP, loading } = useOTP();
  
  const [step, setStep] = useState(1); // 1: Form, 2: Email OTP, 3: Complete
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpChannel, setOtpChannel] = useState('email');
  const [otpRecipient, setOtpRecipient] = useState('');

  // Step 1: Submit account form
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    // Create account logic here
    // ...
    // Then send OTP
    const result = await sendOTP(email, 'email', 'registration');
    if (result.success) {
      setOtpRecipient(email);
      setOtpChannel('email');
      setShowOTPModal(true);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (code) => {
    const result = await verifyOTP(code);
    if (result.success) {
      setShowOTPModal(false);
      setStep(3); // Move to complete
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      {step === 1 && (
        <form onSubmit={handleCreateAccount}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full mb-4 p-2 border rounded"
          />
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            Create Account
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">✅ Verified!</h2>
          <p>Your account is ready. Please log in.</p>
        </div>
      )}

      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onSubmit={handleVerifyOTP}
        channel={otpChannel}
        recipient={otpRecipient}
        onResend={() => sendOTP(otpRecipient, otpChannel, 'registration')}
      />
    </div>
  );
}
```

---

## 🧪 Test Page

Visit `/otp-demo` to:
- ✅ Test OTP Input component
- ✅ Test Phone Input component
- ✅ Test OTP Modal (with real SMS integration)
- ✅ See code examples
- ✅ View integration guides

---

## 📍 Files Created

| File | Purpose |
|------|---------|
| `components/OTPInput.js` | 6-digit OTP input field |
| `components/OTPModal.js` | OTP verification modal |
| `components/PhoneNumberInput.js` | Kenya phone input |
| `components/hooks/useOTP.js` | React hook for OTP |
| `app/otp-demo/page.js` | Interactive demo page |
| `lib/utils.ts` | Utility functions |

---

## ✨ Features Included

- ✅ Auto-focus between digits
- ✅ Paste support
- ✅ Keyboard navigation
- ✅ 10-minute countdown timer
- ✅ 60-second resend cooldown
- ✅ 3-attempt limit
- ✅ Kenya phone validation
- ✅ Beautiful error/success states
- ✅ Loading spinners
- ✅ Mobile responsive
- ✅ Accessibility support

---

## 🚀 Next Steps

1. **Test the demo:** Visit `/otp-demo`
2. **Integrate into registration:** Copy example code above
3. **Test with real SMS:** Send OTP to your phone
4. **Customize styling:** Update Tailwind classes
5. **Deploy:** Push to production

---

## 🆘 Troubleshooting

### OTP not sending?
- Check `.env.local` has TextSMS credentials
- Verify phone number format (+254...)
- Check SMS API endpoint is correct

### Modal not showing?
- Ensure `isOpen={true}`
- Check `onClose` is properly handling state

### Phone validation failing?
- Must be Kenya format (+254... or 0...)
- Use Safaricom (7), Airtel (1), Vodafone (7)

### Timer not working?
- Check `expirySeconds` prop
- Ensure modal is mounted

---

**Status: ✅ Ready for production use!**
