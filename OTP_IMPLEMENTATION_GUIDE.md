# 📱 OTP Implementation Guide - Email & Phone Verification

## 🎯 Overview
Add secure OTP (One-Time Password) verification using your EventsGear email and phone SMS for user registration and authentication.

## 🔧 Supabase OTP Configuration

### 1. Enable OTP in Supabase Dashboard

**Go to:** Settings → Authentication → General

**Enable these options:**
- ✅ **Email OTP** (using your EventsGear SMTP)
- ✅ **Phone OTP** (requires SMS provider setup)
- ✅ **Confirm email** for new signups

### 2. Configure Phone Provider (Optional)

**Popular SMS Providers:**
- **Twilio** (most common)
- **MessageBird** 
- **AWS SNS**
- **African providers:** Africa's Talking, Infobip

---

## 💻 Frontend Implementation

### 1. Enhanced Signup Form with OTP Choice

```jsx
// /app/signup/page.js
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    otpMethod: 'email' // 'email' or 'phone'
  });
  const [step, setStep] = useState('signup'); // 'signup' | 'verify'
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.otpMethod === 'email') {
        // Email OTP Signup
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`
          }
        });

        if (error) throw error;
        
        alert('Check your email for the verification code!');
        setStep('verify');
        
      } else {
        // Phone OTP Signup
        const { data, error } = await supabase.auth.signUp({
          phone: formData.phone,
          password: formData.password
        });

        if (error) throw error;
        
        alert('Check your phone for the verification code!');
        setStep('verify');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      
      if (formData.otpMethod === 'email') {
        result = await supabase.auth.verifyOtp({
          email: formData.email,
          token: otpCode,
          type: 'signup'
        });
      } else {
        result = await supabase.auth.verifyOtp({
          phone: formData.phone,
          token: otpCode,
          type: 'sms'
        });
      }

      if (result.error) throw result.error;
      
      // Success! User is now verified and logged in
      window.location.href = '/user-dashboard';
      
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <img 
              src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
              alt="Zintra" 
              className="h-12 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900">Verify Your Account</h2>
            <p className="text-gray-600 mt-2">
              Enter the 6-digit code sent to your {formData.otpMethod === 'email' ? 'email' : 'phone'}
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setStep('signup')}
              className="text-orange-500 hover:text-orange-600"
            >
              ← Back to signup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <img 
            src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
            alt="Zintra" 
            className="h-12 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          {/* OTP Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you like to receive your verification code?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({...prev, otpMethod: 'email'}))}
                className={`p-3 border rounded-md text-center ${
                  formData.otpMethod === 'email' 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                📧 Email
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({...prev, otpMethod: 'phone'}))}
                className={`p-3 border rounded-md text-center ${
                  formData.otpMethod === 'phone' 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                📱 SMS
              </button>
            </div>
          </div>

          {/* Email Input */}
          {formData.otpMethod === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          )}

          {/* Phone Input */}
          {formData.otpMethod === 'phone' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                placeholder="+254712345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Include country code (e.g., +254 for Kenya)
              </p>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
              placeholder="Create a secure password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account & Send Code'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-orange-500 hover:text-orange-600">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 📧 Email OTP Template Configuration

### Custom Email Template for OTP

**In Supabase Dashboard:** Settings → Authentication → Email → Confirm signup

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #ea8f1e; padding: 20px; text-align: center;">
    <img src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
         alt="Zintra" style="max-height: 50px;">
  </div>
  
  <div style="padding: 30px; background: #f9f9f9;">
    <h2 style="color: #333; margin-bottom: 20px;">Welcome to Zintra!</h2>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
      Thank you for signing up! To complete your registration, please use this verification code:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="background: #ea8f1e; color: white; padding: 15px 30px; 
                  font-size: 24px; font-weight: bold; border-radius: 5px; 
                  letter-spacing: 3px; display: inline-block;">
        {{ .Token }}
      </div>
    </div>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
      Enter this code in the verification form to activate your account.
    </p>
    
    <p style="color: #999; font-size: 14px; margin-top: 30px;">
      This code will expire in 10 minutes. If you didn't sign up for Zintra, 
      you can safely ignore this email.
    </p>
  </div>
  
  <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 14px;">
    <p style="margin: 0;">© 2024 Zintra. All rights reserved.</p>
  </div>
</div>
```

---

## 📱 Phone OTP Setup (Optional)

### 1. Twilio Configuration (Most Popular)

**In Supabase Dashboard:** Settings → Authentication → Phone

```
Provider: Twilio
Account SID: [Your Twilio Account SID]
Auth Token: [Your Twilio Auth Token]
Phone Number: [Your Twilio Phone Number]
```

### 2. Africa's Talking (Local Option)

```
Provider: Custom
API Key: [Your Africa's Talking API Key]
Username: [Your Africa's Talking Username]
```

---

## 🔒 Enhanced Login with OTP Option

```jsx
// /app/login/page.js - Add OTP login option
const handleOTPLogin = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/confirm`
    }
  });
  
  if (!error) {
    alert('Check your email for the login code!');
  }
};
```

---

## 🎯 Benefits of OTP Implementation

### ✅ **Enhanced Security:**
- Two-factor authentication
- Prevents fake account creation
- Verifies real email/phone ownership

### ✅ **Better User Experience:**
- Choice between email and SMS
- Professional branded OTP emails
- Seamless verification flow

### ✅ **Fraud Prevention:**
- Reduces spam accounts
- Ensures valid contact information
- Improves platform quality

---

## 📊 Implementation Priority

### **Phase 1: Email OTP (Immediate)**
- ✅ EventsGear SMTP already configured
- ✅ No additional costs
- ✅ Professional branded emails

### **Phase 2: Phone OTP (Optional)**
- Requires SMS provider setup
- Additional costs per SMS
- Great for regions with high mobile usage

---

## 🚀 Quick Start

1. **Enable Email OTP** in Supabase Dashboard
2. **Replace signup page** with the OTP version above
3. **Test the flow** with your email
4. **Add phone OTP** later if needed

Your EventsGear email system is perfect for OTP delivery - reliable, professional, and already working! 🎉

Want me to help you implement this step by step?