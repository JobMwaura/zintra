# 📧 Email OTP Configuration - Use Existing EventsGear Email

## 🎯 Recommendation: Use Your Current Email

**KEEP using:** `forgetpassword@eventsgear.co.ke`

**Why this works perfectly:**
- ✅ Already configured and working
- ✅ Same SMTP settings 
- ✅ Professional EventsGear infrastructure
- ✅ No additional email setup needed
- ✅ Users trust one consistent sender

## 🔧 Implementation with Current Email

### Supabase Email Template Configuration

**Go to:** Supabase Dashboard → Settings → Authentication → Email

**Update these templates to use your existing email:**

#### 1. Confirm Signup (for Email OTP)

**Sender Email:** `forgetpassword@eventsgear.co.ke`
**Sender Name:** `Zintra`
**Subject:** `Your Zintra Verification Code`

**Template:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #ea8f1e; padding: 20px; text-align: center;">
    <img src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
         alt="Zintra" style="max-height: 50px;">
  </div>
  
  <div style="padding: 30px; background: #f9f9f9;">
    <h2 style="color: #333; margin-bottom: 20px;">Verification Code</h2>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
      Enter this code to verify your account:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="background: #ea8f1e; color: white; padding: 15px 30px; 
                  font-size: 28px; font-weight: bold; border-radius: 8px; 
                  letter-spacing: 4px; display: inline-block; font-family: monospace;">
        {{ .Token }}
      </div>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      This code will expire in <strong>10 minutes</strong>.
    </p>
    
    <p style="color: #999; font-size: 14px; margin-top: 30px;">
      If you didn't request this code, please ignore this email.
    </p>
  </div>
  
  <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 14px;">
    <p style="margin: 0;">© 2024 Zintra. All rights reserved.</p>
  </div>
</div>
```

#### 2. Magic Link (Alternative OTP Method)

**Sender Email:** `forgetpassword@eventsgear.co.ke`
**Sender Name:** `Zintra`
**Subject:** `Your Zintra Login Link`

**Template:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #ea8f1e; padding: 20px; text-align: center;">
    <img src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
         alt="Zintra" style="max-height: 50px;">
  </div>
  
  <div style="padding: 30px; background: #f9f9f9;">
    <h2 style="color: #333; margin-bottom: 20px;">Login to Zintra</h2>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
      Click the button below to securely log into your account:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: #ea8f1e; color: white; padding: 15px 30px; 
                text-decoration: none; border-radius: 5px; font-weight: bold;">
        Login to Zintra
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      This link will expire in <strong>1 hour</strong> for your security.
    </p>
  </div>
</div>
```

#### 3. Keep Password Reset Template As-Is

Your password reset template is already perfect - no changes needed!

---

## 💻 Code Implementation

### Enhanced OTP Service Using Existing Email

```typescript
// /lib/services/otpService.ts

/**
 * Send Email OTP using existing EventsGear email
 */
export async function sendEmailOTP(
  email: string,
  otp: string,
  type: 'registration' | 'login' = 'registration'
): Promise<OTPResult> {
  try {
    const supabase = createClient();

    // Method 1: Use Supabase Magic Link with OTP token
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify`,
        data: {
          otp_code: otp,
          verification_type: type
        }
      }
    });

    if (error) {
      console.error('Email OTP error:', error);
      return { success: false, error: 'Failed to send email verification' };
    }

    return { 
      success: true, 
      message: `Verification email sent to ${email}`,
      expiresIn: 600 
    };

  } catch (error) {
    console.error('Email OTP service error:', error);
    return { success: false, error: 'Email service unavailable' };
  }
}
```

### Enhanced useOTP Hook

```javascript
// /components/hooks/useOTP.js

export function useOTP() {
  // ... existing code ...

  /**
   * Send OTP via email or SMS
   */
  const sendOTP = useCallback(async (contact, channel = 'sms', type = 'registration') => {
    setLoading(true);
    setError(null);

    try {
      if (channel === 'email') {
        // Use Supabase direct email OTP
        const { error } = await supabase.auth.signInWithOtp({
          email: contact,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/verify`,
            data: { verification_type: type }
          }
        });

        if (error) throw error;
        
        return {
          success: true,
          message: `Verification email sent to ${contact}`,
          expiresIn: 600
        };

      } else {
        // Use existing SMS OTP system
        const response = await fetch('/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: contact,
            channel: 'sms',
            type: type
          })
        });

        const data = await response.json();
        return data;
      }

    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendOTP, verifyOTP, loading, error };
}
```

---

## 🎯 Why This Approach is Perfect

### ✅ **Consistency**
- Same sender email for all authentication
- Users recognize and trust `forgetpassword@eventsgear.co.ke`
- Professional EventsGear delivery infrastructure

### ✅ **No Additional Setup**
- Use existing SMTP configuration
- No new email accounts needed
- Leverages your working system

### ✅ **User Experience**
- All auth emails come from same source
- Clear subject line differentiation
- Professional branded templates

### ✅ **Technical Benefits**
- Same rate limits and delivery settings
- Consolidated email logging
- Simplified configuration management

---

## 🚀 Quick Setup

1. **Update Supabase Email Templates** with your existing email
2. **Add Email OTP function** to your OTP service
3. **Test with your current EventsGear configuration**
4. **No new email setup required!**

Your `forgetpassword@eventsgear.co.ke` email is perfect for all authentication purposes! 🎉

## 📝 Optional: Better Email Name

If you want, you could rename the email in EventsGear from:
- `forgetpassword@eventsgear.co.ke` → `security@eventsgear.co.ke`
- Or keep it as-is and just change the display name to "Zintra Security"

But functionally, your current email works perfectly for both password resets AND OTP verification! ✅