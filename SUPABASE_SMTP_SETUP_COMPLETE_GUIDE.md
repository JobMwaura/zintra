# SMTP Configuration Guide - EventsGear for Zintra Password Reset

## Overview
This guide shows you exactly how to configure the EventsGear email service for password reset functionality in Supabase.

## 📧 Email Configuration Details

**EventsGear SMTP Settings:**
- **SMTP Host:** `mail.eventsgear.co.ke`
- **SMTP Port:** `587` (TLS - recommended) or `465` (SSL)
- **Encryption:** TLS/SSL (required)
- **Username:** `forgetpassword@eventsgear.co.ke`
- **Password:** `[Your EventsGear password]`

---

## 🔧 Step 1: Configure Supabase SMTP Settings

### Go to Supabase Dashboard:
1. Open https://supabase.com/dashboard
2. Select your **Zintra** project
3. Navigate to **Settings** → **Authentication** → **Email**

### Enable Custom SMTP:
4. Scroll to **"SMTP Settings"** section
5. Toggle **"Enable custom SMTP server"** to ON

### Enter Configuration:
```
SMTP Host: mail.eventsgear.co.ke
SMTP Port: 587
SMTP User: forgetpassword@eventsgear.co.ke  
SMTP Pass: [Your EventsGear email password]
```

### Email Templates Configuration:
6. Scroll to **"Email Templates"** section
7. Configure **"Reset Password"** template:

**Sender Name:** `Zintra`
**Sender Email:** `forgetpassword@eventsgear.co.ke`
**Subject:** `Reset Your Zintra Password`

**Email Template:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #ea8f1e; padding: 20px; text-align: center;">
    <img src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
         alt="Zintra" style="max-height: 50px;">
  </div>
  
  <div style="padding: 30px; background: #f9f9f9;">
    <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
      You requested to reset your password for your Zintra account. 
      Click the button below to reset your password:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: #ea8f1e; color: white; padding: 15px 30px; 
                text-decoration: none; border-radius: 5px; font-weight: bold;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
      Or copy and paste this link into your browser:
    </p>
    
    <p style="color: #ea8f1e; word-break: break-all; background: #f0f0f0; 
              padding: 10px; border-radius: 5px;">
      {{ .ConfirmationURL }}
    </p>
    
    <p style="color: #999; font-size: 14px; margin-top: 30px;">
      If you didn't request this password reset, you can safely ignore this email.
      This link will expire in 1 hour.
    </p>
  </div>
  
  <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 14px;">
    <p style="margin: 0;">© 2024 Zintra. All rights reserved.</p>
  </div>
</div>
```

### Save Configuration:
8. Click **"Save"** to apply settings

---

## 🧪 Step 2: Test SMTP Configuration

### Option A: Test with Supabase (Recommended)
1. In the SMTP settings page, look for **"Send Test Email"** button
2. Enter a test email address
3. Click "Send Test Email"
4. Check your inbox (and spam folder)

### Option B: Test with Our Script (Advanced)
```bash
# Install nodemailer for testing
npm install nodemailer

# Run test with your credentials
EMAIL_PASSWORD=your_eventsgear_password TEST_EMAIL=your_test_email@example.com node test-smtp-eventsgear.mjs
```

---

## 🔄 Step 3: Test Password Reset Flow

### Test the Complete Flow:
1. Go to your Zintra login page: `/login`
2. Click **"Forgot Password?"**
3. Enter a test email address
4. Click **"Send Reset Email"**
5. Check email inbox for reset message
6. Click the reset link
7. Enter new password
8. Verify login works

### Expected Flow:
```
User clicks "Forgot Password" 
    ↓
Enters email address
    ↓
Supabase sends reset email via EventsGear SMTP
    ↓
User receives email with reset link
    ↓
User clicks link → redirected to /auth/confirm
    ↓
Auth confirmation page validates token
    ↓
User redirected to set new password
    ↓
Password updated successfully
```

---

## ⚠️ Troubleshooting

### Common Issues:

**"SMTP connection failed"**
- Verify EventsGear password is correct
- Try port 465 with SSL instead of 587 TLS
- Check if email account has SMTP enabled

**"Authentication failed"** 
- Double-check username: `forgetpassword@eventsgear.co.ke`
- Verify password (no extra spaces)
- Contact EventsGear support for account status

**"Emails not sending"**
- Check Supabase logs in Dashboard → Logs → Auth
- Verify "Send Test Email" works first
- Check spam folder for test emails

**"Reset link not working"**
- Check URL redirect configuration in Supabase Auth
- Verify `/auth/confirm` route is working
- Check browser console for errors

### Firewall/Network Issues:
- Ensure outbound connections to port 587/465 are allowed
- Check if your hosting provider blocks SMTP
- Test from local development first

---

## 📋 Verification Checklist

- [ ] SMTP settings saved in Supabase
- [ ] "Send Test Email" works from Supabase dashboard
- [ ] Forgot password form submits successfully  
- [ ] Reset email arrives in inbox (check spam)
- [ ] Reset link redirects to correct page
- [ ] New password can be set and works
- [ ] User can log in with new password

---

## 🔒 Security Notes

- Reset links expire after 1 hour (Supabase default)
- Only one active reset token per email address
- EventsGear SMTP uses TLS encryption
- All reset requests are logged in Supabase

---

## 📞 Support Contacts

**EventsGear SMTP Issues:**
- Contact EventsGear support for email server problems
- Verify account status and SMTP permissions

**Supabase Configuration Issues:**
- Check Supabase documentation: https://supabase.com/docs/guides/auth
- Review Auth logs in Supabase Dashboard

---

## ✅ Success Confirmation

Once configured, your password reset will:
1. ✅ Send professional branded emails from `forgetpassword@eventsgear.co.ke`
2. ✅ Include Zintra logo and branding
3. ✅ Provide secure reset links that expire properly
4. ✅ Work reliably with EventsGear's email infrastructure
5. ✅ Handle high volume of reset requests

Your Zintra password reset system will be production-ready! 🚀