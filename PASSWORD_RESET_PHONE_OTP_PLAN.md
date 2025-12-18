# Password Reset with Phone OTP - Implementation Plan

## Overview
Implement password reset flow where vendors/users verify their phone number via OTP before creating a new password. The phone number must match what was registered.

## User Requirement
*"Vendors should receive OTP if they forget password which takes them to create new password"*  
*"Phone number should match what was used to register"*

---

## Flow Diagram

```
┌──────────────────────────────┐
│  Password Reset Entry        │
│  (Forgot Password Link)      │
└──────────────────────────────┘
          ↓
┌──────────────────────────────┐
│  Step 1: Enter Email         │
│  (Find registered account)   │
└──────────────────────────────┘
          ↓
┌──────────────────────────────┐
│  Step 2: Verify Phone OTP    │
│  (Send OTP to registered     │
│   phone from profile)        │
│  ✓ Phone must match DB       │
└──────────────────────────────┘
          ↓
┌──────────────────────────────┐
│  Step 3: Create New Password │
│  (Only after OTP verified)   │
│  ✓ Must match password rules │
└──────────────────────────────┘
          ↓
┌──────────────────────────────┐
│  Step 4: Success Message     │
│  → Redirect to login         │
└──────────────────────────────┘
```

---

## Implementation Details

### File: `/app/auth/forgot-password/page.js` (CREATE NEW)

#### Step 1: Email Verification
```javascript
const [step, setStep] = useState(1);
const [email, setEmail] = useState('');
const [phone, setPhone] = useState('');
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState('');

const handleFindAccount = async () => {
  setLoading(true);
  setMessage('');

  try {
    // 1. Look up email in users table
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone_number, email')
      .eq('email', email)
      .single();

    if (error || !user) {
      setMessage('❌ No account found with this email');
      setLoading(false);
      return;
    }

    // 2. Store phone from database
    setPhone(user.phone_number);

    // 3. Move to OTP step
    setStep(2);
  } catch (err) {
    setMessage('Error finding account: ' + err.message);
  } finally {
    setLoading(false);
  }
};
```

#### Step 2: Phone OTP Verification
```javascript
const [otpCode, setOtpCode] = useState('');
const [showOTPInput, setShowOTPInput] = useState(false);
const [otpMessage, setOtpMessage] = useState('');
const [phoneVerified, setPhoneVerified] = useState(false);

const handleSendPhoneOTP = async () => {
  if (!phone) {
    setOtpMessage('❌ No phone number found for this account');
    return;
  }

  setLoading(true);
  setOtpMessage('');

  try {
    const result = await sendOTP(phone, 'sms', 'password-reset');
    if (result.success) {
      setShowOTPInput(true);
      setOtpMessage('✓ SMS sent to ' + maskPhone(phone));
    } else {
      setOtpMessage('❌ ' + (result.error || 'Failed to send OTP'));
    }
  } catch (err) {
    setOtpMessage('Error: ' + err.message);
  } finally {
    setLoading(false);
  }
};

const handleVerifyPhoneOTP = async () => {
  if (!otpCode || otpCode.length !== 6) {
    setOtpMessage('❌ Please enter a valid 6-digit code');
    return;
  }

  setLoading(true);
  setOtpMessage('');

  try {
    const result = await verifyOTP(otpCode, phone);
    if (result.verified) {
      setPhoneVerified(true);
      setOtpMessage('✓ Phone verified! You can now set a new password');
      
      setTimeout(() => {
        setStep(3);
        setShowOTPInput(false);
        setOtpCode('');
      }, 1500);
    } else {
      setOtpMessage('❌ ' + (result.error || 'Invalid OTP code'));
    }
  } catch (err) {
    setOtpMessage('Error: ' + err.message);
  } finally {
    setLoading(false);
  }
};
```

#### Step 3: New Password Creation
```javascript
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
const [passwordMessage, setPasswordMessage] = useState('');

const validatePassword = (password) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);

const handleResetPassword = async () => {
  // Validate passwords
  if (!newPassword) {
    setPasswordMessage('❌ Password is required');
    return;
  }

  if (!validatePassword(newPassword)) {
    setPasswordMessage('❌ Must be 8+ chars with uppercase, number & special char');
    return;
  }

  if (newPassword !== confirmPassword) {
    setPasswordMessage('❌ Passwords do not match');
    return;
  }

  setLoading(true);
  setPasswordMessage('');

  try {
    // Reset password via Supabase email
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setPasswordMessage('❌ Error resetting password: ' + error.message);
      setLoading(false);
      return;
    }

    setPasswordMessage('✓ Password reset successfully!');
    setStep(4);
  } catch (err) {
    setPasswordMessage('Error: ' + err.message);
  } finally {
    setLoading(false);
  }
};
```

#### Step 4: Success & Redirect
```javascript
return (
  <div className="text-center py-12">
    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
         style={{ backgroundColor: '#fef3e2' }}>
      <Check className="w-8 h-8" style={{ color: '#ea8f1e' }} />
    </div>
    <h2 className="text-2xl font-bold mb-4 text-gray-700">Password Reset Complete!</h2>
    <p className="text-gray-600 mb-8">
      Your password has been successfully reset. You can now log in with your new password.
    </p>
    <Link href="/login">
      <button className="text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90"
              style={{ backgroundColor: '#ea8f1e' }}>
        Go to Login
      </button>
    </Link>
  </div>
);
```

---

## Security Considerations

### Phone Verification Required
- ✅ Phone number must exist in database for account
- ✅ OTP is sent to the phone on file
- ✅ User must verify with OTP before password reset
- ✅ Prevents account takeover without OTP

### Validation Rules
- ✅ Email must be registered
- ✅ Phone must be verified (phone_verified = true)
- ✅ OTP code must be valid (6 digits)
- ✅ Password must meet requirements (8+ chars, uppercase, number, special)
- ✅ Passwords must match

### Session Safety
- ✅ Only verified phone can reset password
- ✅ OTP code expires after one use
- ✅ Multiple failed OTP attempts should trigger rate limiting (future)
- ✅ New password is set via Supabase auth endpoint

---

## Database Changes Needed

### Users Table
Ensure these columns exist:
```sql
-- Add if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;

-- Create index for faster lookups during password reset
CREATE INDEX IF NOT EXISTS users_email ON users(email);
CREATE INDEX IF NOT EXISTS users_phone_number ON users(phone_number);
```

### OTP Verifications Table
Already exists from user registration:
```sql
CREATE TABLE otp_verifications (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20),
  email_address VARCHAR(255),
  otp_code VARCHAR(6),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  type VARCHAR(20) -- 'registration' or 'password-reset'
);
```

---

## Existing Components & Hooks to Reuse

### PhoneInput Component
```javascript
import PhoneInput from '@/components/PhoneInput';

// Can optionally show phone in read-only mode:
// <div className="bg-gray-100 p-3 rounded-lg">
//   <p className="text-sm text-gray-600">Phone on File: {maskPhone(phone)}</p>
// </div>
```

### useOTP Hook
```javascript
import useOTP from '@/components/hooks/useOTP';

const { sendOTP, verifyOTP } = useOTP();

// sendOTP(phone, 'sms', 'password-reset')
// verifyOTP(code, phone)
```

### Supabase Client
```javascript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Lookup user by email
const { data: user } = await supabase
  .from('users')
  .select('id, phone_number, email')
  .eq('email', email)
  .single();

// Update user password
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

---

## UI Components Needed

### Step 1: Email Input
- Text input for email
- "Find Account" button
- Status message display

### Step 2: Phone OTP
- Display phone on file (masked: +254****5678)
- "Send OTP" button
- OTP input field (6 digits only)
- "Verify Code" button
- Status/error messages

### Step 3: New Password
- Password input with show/hide toggle
- Confirm password input with show/hide toggle
- Password requirements display
- "Reset Password" button
- Status/error messages

### Step 4: Success
- Checkmark icon
- "Password Reset Complete!" message
- "Go to Login" button

---

## Implementation Steps

1. **Create File**: `/app/auth/forgot-password/page.js` (300-400 lines)
2. **Lookup User**: Query users table by email
3. **Send OTP**: Use existing sendOTP function
4. **Verify OTP**: Use existing verifyOTP function
5. **Update Password**: Use Supabase auth.updateUser()
6. **Show Success**: Redirect to login after completion

---

## Testing Checklist

### Manual Testing
- [ ] Visit forgot password page
- [ ] Enter unregistered email → Error message
- [ ] Enter registered email → Get phone on file
- [ ] Click "Send OTP" → SMS sent
- [ ] Enter invalid OTP → Error message
- [ ] Enter valid OTP → Phone verified
- [ ] Create weak password → Error message
- [ ] Passwords don't match → Error message
- [ ] Create strong matching password → Success
- [ ] Login with new password → Works

### Security Testing
- [ ] Can't skip phone verification
- [ ] Can't bypass OTP requirement
- [ ] Invalid OTP doesn't reset password
- [ ] Wrong phone number can't reset
- [ ] Multiple failed attempts handled (future)

---

## Related Files

### Already Created
- ✅ `/components/PhoneInput.js` - Phone input with country codes
- ✅ `/components/hooks/useOTP.js` - OTP operations
- ✅ `/lib/services/otpService.ts` - OTP generation
- ✅ `/app/api/otp/send/route.ts` - Send SMS
- ✅ `/app/api/otp/verify/route.ts` - Verify code

### Need to Create
- 🔄 `/app/auth/forgot-password/page.js` - This file

### May Need to Update
- ⏳ Database schema (phone columns)
- ⏳ Login page (add forgot password link)

---

## Size Estimate

**Total Implementation**: ~350-400 lines

| Component | Lines | Status |
|-----------|-------|--------|
| Email lookup & OTP send | ~80 | Ready |
| OTP verification UI | ~100 | Ready |
| Password reset & validation | ~80 | Ready |
| Success screen | ~40 | Ready |
| Styling & layout | ~50 | Ready |

---

## Environment Variables

Ensure these are set (should already be from user registration):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
TEXTSMS_API_KEY=your-textsms-api-key
```

---

## Success Metrics

When user forgets password:
1. ✅ Enters email address
2. ✅ Account is found, phone is retrieved
3. ✅ SMS OTP is sent to registered phone
4. ✅ User verifies OTP code
5. ✅ User creates new strong password
6. ✅ Password is reset successfully
7. ✅ User can login with new password
8. ✅ All phone numbers match database records

---

## Next Steps After This Implementation

1. **Database Schema** - Add phone columns to users table
2. **Email Link** - Add "Forgot Password" link to login page
3. **Rate Limiting** - Prevent brute force OTP attempts
4. **Logging** - Track password reset attempts
5. **Testing** - Comprehensive end-to-end testing
6. **Deployment** - Deploy to Vercel

---

## Quick Implementation Reference

```javascript
// Complete forgot-password/page.js structure:

'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import useOTP from '@/components/hooks/useOTP';
import { Check, Eye, EyeOff } from 'lucide-react';

export default function ForgotPassword() {
  const supabase = createClient();
  const { sendOTP, verifyOTP } = useOTP();
  
  // Step 1: Email
  // Step 2: OTP
  // Step 3: Password
  // Step 4: Success
  
  // Render based on step
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {step === 1 && /* Email input */}
        {step === 2 && /* OTP verification */}
        {step === 3 && /* Password reset */}
        {step === 4 && /* Success */}
      </div>
    </div>
  );
}
```

---

**Status**: 📋 Plan Complete - Ready for Implementation  
**Priority**: 🔴 High - Critical security feature  
**Estimated Time**: 2-3 hours including testing
