# Email OTP Registration Integration Guide

## 📋 **Current Registration Status**

### ❌ **Missing Email OTP Option:**

- **User Registration** (`/user-registration`) - Only SMS OTP
- **Vendor Registration** (`/vendor-registration`) - Only SMS OTP

### ✅ **Components Ready for Integration:**

- **VerificationMethodToggle** - Method selection UI
- **EmailOTPVerification** - Email verification component
- **useOTP Hook** - Supports both SMS and Email
- **OTP Service** - EventsGear SMTP integration

## 🧪 **Test Demo Available:**

**URL**: `https://zintra-sandy.vercel.app/test-registration-email-otp`

This demo shows exactly how the Email OTP choice would work in the registration flow.

## 🔧 **Implementation Steps**

### Step 1: Add Required Imports

Add to both `/app/user-registration/page.js` and `/app/vendor-registration/page.js`:

```javascript
import VerificationMethodToggle from '@/components/VerificationMethodToggle';
import EmailOTPVerification from '@/components/EmailOTPVerification';
```

### Step 2: Add State Variables

```javascript
// Email OTP states (add after existing OTP states)
const [verificationMethod, setVerificationMethod] = useState('sms'); // 'sms' or 'email'
const [emailVerified, setEmailVerified] = useState(false);
```

### Step 3: Update Step Validation

Replace existing Step 2 validation:

```javascript
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
```

### Step 4: Update Step 2 UI

Replace the existing Step 2 section with:

```javascript
{/* Step 2: Verification Method Choice */}
{currentStep === 2 && (
  <div>
    <h2 className="text-2xl font-bold mb-2 text-gray-800">Verify Your Account</h2>
    <p className="text-gray-600 mb-6 text-sm">Choose your preferred verification method</p>

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
        {/* Existing phone OTP UI here */}
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

    {/* Continue Button */}
    {(phoneVerified || emailVerified) && (
      <button
        type="button"
        onClick={handleStep2Continue}
        className="w-full mt-6 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
      >
        Continue to Profile →
      </button>
    )}
  </div>
)}
```

### Step 5: Update Database Storage (Optional)

Add email verification tracking to user profile creation:

```javascript
// In profile creation step, save verification method used
const profileData = {
  // ... existing fields
  verification_method: verificationMethod,
  email_verified: emailVerified,
  phone_verified: phoneVerified
};
```

## 🎯 **Implementation Priority**

1. **User Registration** - Primary user signup flow
2. **Vendor Registration** - Business registration flow

## 🔍 **Testing Checklist**

After implementation:

- [ ] SMS verification still works
- [ ] Email verification works via EventsGear SMTP  
- [ ] Method toggle switches correctly
- [ ] Validation prevents continuing without verification
- [ ] Both methods create successful accounts
- [ ] Build completes without errors

## 📱 **User Experience**

Users will see:

1. **Account Setup** (Step 1) - Name, email, password
2. **Verification Choice** (Step 2) - SMS or Email toggle
3. **Verification Process** - Code input for chosen method
4. **Profile Setup** (Step 3) - Additional details
5. **Complete** (Step 4) - Success and redirect

## 🔐 **Security Features**

- **Rate limiting** applies to both SMS and Email OTP
- **Email verification** via secure EventsGear SMTP
- **Method validation** prevents skipping verification
- **Code expiration** handled by OTP service

## 🚀 **Next Actions**

1. **Review the demo** at `/test-registration-email-otp`
2. **Choose integration approach** (user first or vendor first)
3. **Apply the changes** following this guide
4. **Test thoroughly** with both methods
5. **Deploy incrementally** to avoid breaking existing flow

The Email OTP system is fully ready - it just needs integration into the existing registration UI!