# Phone OTP Security Implementation - Complete Plan

## Overview

Implement phone number verification via OTP across the entire user journey:
- **User Registration** - Verify phone before completing signup
- **Vendor Registration** - Already done ✓ (but needs country code selector)
- **Password Reset** - Verify phone before creating new password
- **Phone Number Format** - Country code selector (+254 for Kenya, etc.)

---

## Requirements Summary

### 1. User Registration Flow
```
User Signup
  ↓
Step 1: Email & Password
  ↓
Step 2: Phone Number + OTP Verification (NEW)
  ↓ (Can't proceed without verified phone)
Step 3: Complete Profile
  ↓
Account Created ✓
```

### 2. Password Reset Flow
```
User clicks "Forgot Password"
  ↓
Enter email → Find account
  ↓
Phone verification required (matching registered phone)
  ↓
Send OTP to phone on file
  ↓
User enters OTP
  ↓
OTP valid? → Create new password
OTP invalid? → Show error
```

### 3. Phone Number Input Format
**Current Problem**: Users entering `0721829148` instead of `+254721829148`

**Solution**: Country code selector dropdown
```
┌─────────────────────────────┐
│ Select Country Code + Number│
├─────────────────────────────┤
│ [🇰🇪 +254 ▼] [721829148  ]│  ← User selects country, enters number
│ Formats to: +254721829148   │  ← Show formatted number
└─────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Reusable Components
**Create PhoneInput component** that can be used everywhere

#### `/components/PhoneInput.js`
```javascript
- Display country code dropdown (Kenya +254, USA +1, UK +44, etc.)
- Display phone number input field
- Show formatted number preview (+254721829148)
- Validate phone format
- Export normalized phone number with country code

Usage:
<PhoneInput 
  value={phoneNumber}
  onChange={setPhoneNumber}
  country="KE"  // Default to Kenya
  onCountryChange={setCountry}
/>
```

### Phase 2: User Registration
**Modify `/app/user-registration/page.js` or create new flow**

#### Add Phone Verification Step
```javascript
Step 1: Email & Password ✓
Step 2: Phone Number with Country Code + OTP Verification (NEW)
  - Show PhoneInput component
  - "Send OTP" button
  - OTP code input field
  - "Verify Code" button
  - ✓ Block next button until phone_verified = true

Step 3+: Profile, Location, etc.
```

#### Database: Update users table
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;
```

### Phase 3: Password Reset
**Modify `/app/auth/forgot-password/page.js` or `/app/auth/reset-password/page.js`**

#### Add OTP Verification Step
```
1. User enters email
2. System finds account
3. Retrieve phone_number from users table
4. Show masked phone (+254***829148)
5. Send OTP to that phone
6. User enters OTP code
7. If valid: Show new password form
   If invalid: Show error "Invalid code, try again"
8. User creates new password
9. Password updated, redirect to login
```

### Phase 4: Vendor Registration Enhancement
**Modify existing vendor registration** (Step 2 already has phone)

#### Replace phone input with PhoneInput component
```javascript
// Before (Step 2)
<input type="tel" placeholder="0712345678" />

// After (Step 2)
<PhoneInput 
  value={formData.phone}
  onChange={(phone) => setFormData({...formData, phone})}
  country="KE"
/>
```

---

## File Changes Needed

### New Files to Create:
1. **`/components/PhoneInput.js`** - Reusable phone input with country code
2. **`/lib/countries.js`** - Country codes and dialects
3. **`/app/user-registration/page.js`** - User signup flow (or modify existing)
4. **`/app/auth/forgot-password/page.js`** - Password reset flow (or modify existing)

### Files to Modify:
1. **`/app/vendor-registration/page.js`** - Replace phone input with PhoneInput
2. **`/lib/services/otpService.ts`** - Already has sendSMSOTP, ensure it works for users
3. **`/app/api/otp/send/route.ts`** - Already works, no changes needed
4. **`/app/api/otp/verify/route.ts`** - Already works, no changes needed
5. **Database migrations** - Add phone columns to users table

---

## Code Examples

### PhoneInput Component
```javascript
// /components/PhoneInput.js
'use client';

import { useState } from 'react';

const COUNTRIES = [
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
];

export default function PhoneInput({ 
  value, 
  onChange, 
  country = 'KE',
  onCountryChange,
  label = 'Phone Number',
  placeholder = '721829148'
}) {
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find(c => c.code === country) || COUNTRIES[0]
  );

  const handleCountryChange = (e) => {
    const country = COUNTRIES.find(c => c.code === e.target.value);
    setSelectedCountry(country);
    onCountryChange?.(country);
    // Reset phone when changing country
    onChange('');
  };

  const handlePhoneChange = (e) => {
    let phoneNumber = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Format with country code
    if (phoneNumber) {
      const formatted = `${selectedCountry.dialCode}${phoneNumber}`;
      onChange(formatted);
    } else {
      onChange('');
    }
  };

  const displayPhone = value ? value.replace(selectedCountry.dialCode, '') : '';

  return (
    <div>
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <select 
          value={selectedCountry.code}
          onChange={handleCountryChange}
          style={{ width: '120px' }}
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.dialCode}
            </option>
          ))}
        </select>

        <input
          type="tel"
          placeholder={placeholder}
          value={displayPhone}
          onChange={handlePhoneChange}
          style={{ flex: 1 }}
        />
      </div>
      
      {value && (
        <small style={{ color: '#666' }}>
          Formatted: {value}
        </small>
      )}
    </div>
  );
}
```

### User Registration with Phone OTP
```javascript
// /app/user-registration/page.js (simplified example)

const [step, setStep] = useState(1);
const [phoneNumber, setPhoneNumber] = useState('');
const [phoneVerified, setPhoneVerified] = useState(false);
const [showPhoneOTP, setShowPhoneOTP] = useState(false);
const [otpCode, setOtpCode] = useState('');

const handleSendPhoneOTP = async () => {
  const result = await sendOTP(phoneNumber, 'sms', 'registration');
  if (result.success) {
    setShowPhoneOTP(true);
  }
};

const handleVerifyPhoneOTP = async () => {
  const result = await verifyOTP(otpCode, phoneNumber);
  if (result.verified) {
    setPhoneVerified(true);
    setShowPhoneOTP(false);
  }
};

// In form:
{step === 2 && (
  <div>
    <h2>Verify Your Phone Number</h2>
    
    <PhoneInput 
      value={phoneNumber}
      onChange={setPhoneNumber}
      country="KE"
    />
    
    {!showPhoneOTP && (
      <button onClick={handleSendPhoneOTP}>Send OTP</button>
    )}

    {showPhoneOTP && (
      <div>
        <input 
          type="text" 
          placeholder="Enter 6-digit code"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          maxLength="6"
        />
        <button onClick={handleVerifyPhoneOTP}>Verify Code</button>
      </div>
    )}

    {phoneVerified && <p>✓ Phone verified!</p>}

    {/* Block next button until phone verified */}
    <button 
      onClick={() => setStep(3)}
      disabled={!phoneVerified}
    >
      Continue to Next Step
    </button>
  </div>
)}
```

### Password Reset with OTP
```javascript
// /app/auth/forgot-password/page.js (simplified)

const [step, setStep] = useState('email'); // email → otp → newpassword
const [email, setEmail] = useState('');
const [phone, setPhone] = useState('');
const [otpCode, setOtpCode] = useState('');
const [newPassword, setNewPassword] = useState('');

const handleEmailSubmit = async () => {
  // Find user by email, get phone number
  const { data } = await supabase
    .from('users')
    .select('phone_number')
    .eq('email', email)
    .single();
  
  if (data) {
    setPhone(data.phone_number); // e.g., +254721829148
    // Send OTP to this phone
    await sendOTP(data.phone_number, 'sms', 'password_reset');
    setStep('otp');
  }
};

const handleOtpVerify = async () => {
  const result = await verifyOTP(otpCode, phone);
  if (result.verified) {
    setStep('newpassword');
  }
};

const handlePasswordCreate = async () => {
  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (!error) {
    setStep('success');
  }
};

// In JSX:
{step === 'email' && (
  <div>
    <h2>Forgot Password</h2>
    <input 
      type="email"
      placeholder="Enter your email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
    <button onClick={handleEmailSubmit}>Continue</button>
  </div>
)}

{step === 'otp' && (
  <div>
    <h2>Verify Your Phone</h2>
    <p>OTP sent to {phone}</p>
    <input 
      type="text"
      placeholder="Enter 6-digit code"
      value={otpCode}
      onChange={(e) => setOtpCode(e.target.value)}
      maxLength="6"
    />
    <button onClick={handleOtpVerify}>Verify Code</button>
  </div>
)}

{step === 'newpassword' && (
  <div>
    <h2>Create New Password</h2>
    <input 
      type="password"
      placeholder="New password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
    />
    <button onClick={handlePasswordCreate}>Create Password</button>
  </div>
)}
```

---

## Database Schema Updates

```sql
-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;

-- Create index for faster lookups during password reset
CREATE INDEX IF NOT EXISTS users_phone_number_idx ON users(phone_number);
```

---

## Testing Checklist

- [ ] PhoneInput component works with different countries
- [ ] User registration blocks on step 2 without phone verification
- [ ] OTP sends to correct phone number with country code
- [ ] User can verify OTP and proceed
- [ ] Password reset finds user by email
- [ ] Password reset sends OTP to registered phone
- [ ] User can reset password with OTP verification
- [ ] Phone number format is consistent (+254721829148)

---

## Security Considerations

1. **Phone Verification Mandatory**: Cannot complete registration without phone OTP
2. **Password Reset Security**: OTP must match registered phone (prevents unauthorized access)
3. **Rate Limiting**: Already implemented for OTP requests (3 attempts per 10 minutes)
4. **Phone Masking**: Show masked phone in password reset (+254***829148)
5. **Session Validation**: Verify user owns the email before sending OTP

---

## Environment Variables Needed

Already configured:
```
TEXTSMS_API_KEY=...
TEXTSMS_PARTNER_ID=...
TEXTSMS_SHORTCODE=...
```

---

## Implementation Timeline

1. **Phase 1** (1-2 hours): Create PhoneInput component + countries list
2. **Phase 2** (2-3 hours): Implement user registration with phone OTP
3. **Phase 3** (2-3 hours): Implement password reset with phone OTP
4. **Phase 4** (1 hour): Update vendor registration to use PhoneInput
5. **Testing** (1-2 hours): End-to-end testing

**Total: 7-11 hours**

---

## Summary

✅ **What's Already Built**:
- OTP sending (SMS via TextSMS Kenya)
- OTP verification logic
- Rate limiting
- Database table ready

✅ **What You Need**:
1. PhoneInput component with country code selector
2. User registration flow with phone OTP step
3. Password reset flow with phone OTP verification
4. Database schema updates (add phone columns to users table)
5. Security validation (phone must match on password reset)

This gives your platform:
- **Security**: Phone verification prevents fake signups
- **UX**: Country code dropdown (users don't need to remember +254)
- **Trust**: Users know their account is protected
- **Recovery**: Users can reset passwords via phone OTP
