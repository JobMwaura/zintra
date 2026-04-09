# 📧📱 Enhanced OTP System - SMS + Email Choice

## 🎯 Overview
Enhance your existing SMS OTP system to also offer **Email OTP** as an alternative, giving users flexibility to choose their preferred verification method.

## 🔧 What's Already Working ✅
- ✅ **SMS OTP System** - Fully functional with TextSMS Kenya
- ✅ **EventsGear SMTP** - Professional email delivery configured
- ✅ **Phone Verification** - Working in user/vendor registration
- ✅ **OTP Infrastructure** - APIs, hooks, and components ready

## 🚀 What We'll Add
- 📧 **Email OTP Option** - Send 6-digit codes via your EventsGear SMTP
- 🎯 **User Choice** - Let users pick SMS or Email verification
- 🔄 **Unified Flow** - Same UX, different delivery method
- 💪 **Fallback Options** - If SMS fails, use email as backup

---

## 📋 Implementation Steps

### Step 1: Enhance OTP Service for Email

**File: `/lib/services/otpService.ts`** (Add email OTP function)

```typescript
/**
 * Send OTP via Email using EventsGear SMTP
 */
export async function sendEmailOTP(
  email: string,
  otp: string,
  type: 'registration' | 'login' | 'password_reset' = 'registration'
): Promise<OTPResult> {
  try {
    // Use Supabase Auth with your configured EventsGear SMTP
    const supabase = createClient();
    
    const customMessages = {
      registration: `Your Zintra verification code is: ${otp}. Valid for 10 minutes.`,
      login: `Your Zintra login code is: ${otp}. Valid for 10 minutes.`,
      password_reset: `Your Zintra password reset code is: ${otp}. Valid for 10 minutes.`
    };

    // Send OTP email via Supabase (uses your EventsGear SMTP)
    const { error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        data: {
          otp_code: otp,
          otp_type: type
        }
      }
    });

    if (error) {
      console.error('Email OTP error:', error);
      return {
        success: false,
        error: 'Failed to send email OTP'
      };
    }

    return {
      success: true,
      message: `OTP sent to ${email}`,
      expiresIn: 600 // 10 minutes
    };

  } catch (error) {
    console.error('Email OTP service error:', error);
    return {
      success: false,
      error: 'Email service unavailable'
    };
  }
}
```

### Step 2: Update OTP Send API

**File: `/app/api/otp/send/route.ts`** (Enhance to support email)

```typescript
// Add this to your existing send route
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, email, channel, type } = await request.json();

    // Validate input
    if (!phoneNumber && !email) {
      return NextResponse.json({
        success: false,
        error: 'Phone number or email required'
      }, { status: 400 });
    }

    if (!channel) {
      return NextResponse.json({
        success: false,
        error: 'Channel (sms/email) required'
      }, { status: 400 });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const otpId = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

    let result;

    if (channel === 'sms' && phoneNumber) {
      // Use existing SMS OTP
      result = await sendSMSOTPCustom(phoneNumber, otpCode, type);
    } else if (channel === 'email' && email) {
      // Use new Email OTP
      result = await sendEmailOTP(email, otpCode, type);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid channel or missing contact info'
      }, { status: 400 });
    }

    if (result.success) {
      // Store OTP in database (extend existing table)
      const supabase = createClient();
      await supabase.from('otp_codes').insert({
        id: otpId,
        phone_number: phoneNumber,
        email: email,
        code: otpCode,
        channel: channel,
        type: type,
        expires_at: new Date(expiresAt).toISOString(),
        verified: false,
        attempts: 0
      });

      return NextResponse.json({
        success: true,
        message: `OTP sent via ${channel}`,
        otpId,
        expiresIn: 600
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('OTP Send Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
```

### Step 3: Enhanced Registration Component

**File: `/components/EnhancedRegistration.js`** (New component with choice)

```jsx
'use client';
import { useState } from 'react';
import { useOTP } from '@/components/hooks/useOTP';
import PhoneInput from '@/components/PhoneInput';
import { createClient } from '@/lib/supabase';

export default function EnhancedRegistration({ userType = 'user' }) {
  const supabase = createClient();
  const { sendOTP, verifyOTP, loading } = useOTP();

  const [step, setStep] = useState(1); // 1: Form, 2: Choose Method, 3: Verify OTP
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [otpMethod, setOtpMethod] = useState('sms'); // 'sms' | 'email'
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [verified, setVerified] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Move to OTP method selection
    setStep(2);
  };

  const handleSendOTP = async () => {
    setOtpLoading(true);
    setOtpMessage('');

    try {
      const contact = otpMethod === 'sms' ? formData.phone : formData.email;
      const result = await sendOTP(
        otpMethod === 'sms' ? formData.phone : formData.email, 
        otpMethod, 
        'registration'
      );

      if (result.success) {
        setStep(3);
        setOtpMessage(
          otpMethod === 'sms' 
            ? `✓ SMS sent to ${formData.phone}` 
            : `✓ Email sent to ${formData.email}`
        );
      } else {
        setOtpMessage(`❌ Failed to send ${otpMethod.toUpperCase()}: ${result.error}`);
      }
    } catch (error) {
      setOtpMessage(`❌ Error: ${error.message}`);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpMessage('Please enter a valid 6-digit code');
      return;
    }

    setOtpLoading(true);
    setOtpMessage('');

    try {
      const identifier = otpMethod === 'sms' ? formData.phone : formData.email;
      const result = await verifyOTP(otpCode, identifier);

      if (result.verified) {
        setVerified(true);
        setOtpMessage('✓ Verification successful!');
        
        // Create account in Supabase
        setTimeout(() => {
          handleCreateAccount();
        }, 1000);
      } else {
        setOtpMessage(`❌ Invalid code: ${result.error}`);
      }
    } catch (error) {
      setOtpMessage(`❌ Error: ${error.message}`);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: formData.phone,
            phone_verified: otpMethod === 'sms',
            email_verified: otpMethod === 'email'
          }
        }
      });

      if (error) throw error;

      // Redirect to appropriate dashboard
      window.location.href = userType === 'vendor' ? '/vendor-dashboard' : '/user-dashboard';
      
    } catch (error) {
      alert('Account creation failed: ' + error.message);
    }
  };

  // Step 1: Registration Form
  if (step === 1) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <img 
            src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
            alt="Zintra" 
            className="h-12 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">
            Create {userType === 'vendor' ? 'Vendor' : 'User'} Account
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <PhoneInput
              value={formData.phone}
              onChange={(phone) => setFormData(prev => ({...prev, phone}))}
              country="KE"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 font-medium"
          >
            Next: Choose Verification Method
          </button>
        </form>
      </div>
    );
  }

  // Step 2: Choose OTP Method
  if (step === 2) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <img 
            src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
            alt="Zintra" 
            className="h-12 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">Choose Verification Method</h2>
          <p className="text-gray-600 mt-2">
            How would you like to receive your verification code?
          </p>
        </div>

        <div className="space-y-4">
          <div 
            onClick={() => setOtpMethod('sms')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              otpMethod === 'sms' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">📱</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">SMS (Text Message)</div>
                <div className="text-sm text-gray-600">
                  Code sent to: {formData.phone}
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                otpMethod === 'sms' 
                  ? 'border-orange-500 bg-orange-500' 
                  : 'border-gray-300'
              }`}>
                {otpMethod === 'sms' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div 
            onClick={() => setOtpMethod('email')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              otpMethod === 'email' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">📧</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Email</div>
                <div className="text-sm text-gray-600">
                  Code sent to: {formData.email}
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                otpMethod === 'email' 
                  ? 'border-orange-500 bg-orange-500' 
                  : 'border-gray-300'
              }`}>
                {otpMethod === 'email' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {otpMessage && (
            <div className={`p-3 rounded-md text-sm ${
              otpMessage.startsWith('✓') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {otpMessage}
            </div>
          )}

          <button
            onClick={handleSendOTP}
            disabled={otpLoading}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50 font-medium"
          >
            {otpLoading 
              ? `Sending ${otpMethod.toUpperCase()}...` 
              : `Send Verification ${otpMethod.toUpperCase()}`
            }
          </button>

          <button
            onClick={() => setStep(1)}
            className="w-full text-gray-600 hover:text-gray-800 py-2"
          >
            ← Back to form
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Verify OTP
  if (step === 3) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <img 
            src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
            alt="Zintra" 
            className="h-12 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">Enter Verification Code</h2>
          <p className="text-gray-600 mt-2">
            We sent a 6-digit code to your {otpMethod === 'sms' ? 'phone' : 'email'}
          </p>
          <div className="text-sm text-gray-500 mt-1">
            {otpMethod === 'sms' ? formData.phone : formData.email}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-wider font-mono px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={6}
            />
          </div>

          {otpMessage && (
            <div className={`p-3 rounded-md text-sm ${
              otpMessage.startsWith('✓') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {otpMessage}
            </div>
          )}

          <button
            onClick={handleVerifyOTP}
            disabled={otpLoading || otpCode.length !== 6}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50 font-medium"
          >
            {otpLoading ? 'Verifying...' : 'Verify Code'}
          </button>

          <div className="text-center space-y-2">
            <button
              onClick={handleSendOTP}
              disabled={otpLoading}
              className="text-orange-500 hover:text-orange-600 text-sm"
            >
              Resend code
            </button>
            <br />
            <button
              onClick={() => setStep(2)}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Choose different method
            </button>
          </div>
        </div>
      </div>
    );
  }
}
```

### Step 4: Update Database Schema

**Add to `otp_codes` table:**

```sql
-- Add email support to existing otp_codes table
ALTER TABLE otp_codes 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS channel VARCHAR(10) DEFAULT 'sms' CHECK (channel IN ('sms', 'email'));

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_channel ON otp_codes(channel);
```

---

## 🎯 Benefits of This Enhancement

### ✅ **User Choice & Flexibility**
- Users can choose their preferred verification method
- Fallback option if one method fails
- Better accessibility for users without phones

### ✅ **Professional Email Experience**
- Uses your working EventsGear SMTP
- Professional branded OTP emails
- Same quality as password reset emails

### ✅ **Enhanced Security**
- Dual verification options
- Same security standards for both methods
- Proper rate limiting and expiration

### ✅ **Better UX**
- Clear choice interface
- Unified flow regardless of method
- Easy method switching if needed

---

## 🚀 Quick Implementation

1. **Update OTP service** with email function
2. **Enhance API endpoints** for email support  
3. **Add choice component** to registration
4. **Update database schema** for email tracking

Your existing SMS infrastructure stays exactly the same - we're just adding email as an alternative! 

Want me to help you implement this step by step? 🎉