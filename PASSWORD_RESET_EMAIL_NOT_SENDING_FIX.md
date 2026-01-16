# 🔧 Supabase Password Reset Email Not Sending - Fix Guide

**Issue:** Password reset emails not being delivered to users

---

## 🎯 Common Causes & Solutions

### **1. Email Provider Not Configured (Most Common)**

**Symptom:** 
- User requests password reset
- Shows "✅ Check your email" message
- But NO email arrives (not even in spam)

**Cause:** Supabase is using default email service (limited/unreliable)

**Solution:** Configure custom SMTP email provider

---

## 🔧 **Fix 1: Configure SMTP Email (Recommended)**

### **Step 1: Go to Supabase Dashboard**

1. Open your Supabase project
2. Go to **Settings** (left sidebar)
3. Click **Authentication** 
4. Scroll to **Email** section

### **Step 2: Check Current Email Settings**

Look for:
- **Enable Email Signups:** Should be ON ✅
- **Email Provider:** Probably shows "Built-in" (this is the problem)

### **Step 3: Configure Custom SMTP**

Click **"Use Custom SMTP"** and configure:

**For Gmail (Free):**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Password: [App Password - see below]
Sender Name: Zintra
Sender Email: your-email@gmail.com
```

**For SendGrid (Recommended for Production):**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Your SendGrid API Key]
Sender Name: Zintra
Sender Email: noreply@yourdomain.com
```

**For AWS SES:**
```
SMTP Host: email-smtp.us-east-1.amazonaws.com
SMTP Port: 587
SMTP User: [Your AWS SES SMTP User]
SMTP Password: [Your AWS SES SMTP Password]
Sender Name: Zintra
Sender Email: noreply@yourdomain.com
```

---

## 📧 **How to Get Gmail App Password**

If using Gmail for testing:

1. Go to Google Account → Security
2. Enable **2-Step Verification** (required)
3. Go to **App Passwords**
4. Create new app password for "Mail"
5. Copy the 16-character password
6. Use this as SMTP Password in Supabase

**Important:** Don't use your regular Gmail password - use App Password!

---

## 🔧 **Fix 2: Check Email Template URL**

The code currently uses:

```javascript
const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
  redirectTo: `${window.location.origin}/auth/reset`,
});
```

**Make sure this URL is correct for your domain:**

### **For Local Development:**
```javascript
redirectTo: 'http://localhost:3000/auth/reset'
```

### **For Production:**
```javascript
redirectTo: 'https://yourdomain.com/auth/reset'
```

Or keep dynamic:
```javascript
redirectTo: `${window.location.origin}/auth/reset`  // ✅ Works for both
```

---

## 🔧 **Fix 3: Add Redirect URL to Supabase**

### **Step 1: Go to Supabase Dashboard**

1. Settings → Authentication
2. Scroll to **Redirect URLs**

### **Step 2: Add Your URLs**

Add these URLs to the whitelist:

**For Development:**
```
http://localhost:3000/auth/reset
http://localhost:3000/auth/callback
```

**For Production:**
```
https://zintra-sandy.vercel.app/auth/reset
https://zintra-sandy.vercel.app/auth/callback
https://yourdomain.com/auth/reset
https://yourdomain.com/auth/callback
```

### **Step 3: Add Wildcard (Optional)**

For Vercel preview deployments:
```
https://*.vercel.app/auth/reset
https://*.vercel.app/auth/callback
```

---

## 🔧 **Fix 4: Check Email Rate Limits**

**Supabase Default Limits:**
- **Built-in Email:** 3-4 emails per hour (very limited!)
- **Custom SMTP:** Depends on your provider

**If you're hitting rate limits:**
1. Wait 1 hour
2. Try again
3. Configure custom SMTP (no rate limits)

---

## 🔧 **Fix 5: Check Spam Folder**

Sometimes emails go to spam, especially with built-in email service.

**Check:**
1. Inbox (obviously)
2. Spam/Junk folder
3. Promotions tab (Gmail)
4. All Mail folder

**If in spam, mark as "Not Spam" to train filter**

---

## 🧪 **Testing Email Delivery**

### **Test 1: Check Supabase Logs**

1. Go to Supabase Dashboard
2. **Logs** (left sidebar)
3. Filter by **Authentication**
4. Look for password reset events

**Should see:**
```
password_recovery: email sent to user@example.com
```

**If you see errors:**
```
email_send_failed: SMTP connection failed
```
→ SMTP configuration is wrong

### **Test 2: Try Different Email**

Test with multiple email providers:
- Gmail
- Outlook/Hotmail
- Yahoo
- Custom domain email

Some providers have stricter spam filters.

### **Test 3: Check Email Preview**

In Supabase Dashboard:
1. Settings → Authentication → Email Templates
2. Click **Password Reset**
3. Click **Preview** button
4. See what the email looks like

---

## 📋 **Checklist for Password Reset Emails**

- [ ] **SMTP configured** (Settings → Auth → Email → Custom SMTP)
- [ ] **SMTP credentials valid** (test with email client)
- [ ] **Sender email verified** (if using Gmail/custom domain)
- [ ] **Redirect URLs whitelisted** (Settings → Auth → Redirect URLs)
- [ ] **Email signups enabled** (Settings → Auth → Email)
- [ ] **Not hitting rate limits** (wait 1 hour if unsure)
- [ ] **Checked spam folder** (multiple email accounts)
- [ ] **Template URL correct** (`/auth/reset` exists in your app)
- [ ] **Supabase logs checked** (Logs → Authentication)

---

## 🎯 **Quick Fix for Testing (Gmail)**

If you just want to test quickly:

### **Step 1: Enable Gmail SMTP**

1. Go to Supabase → Settings → Authentication
2. Scroll to **Email**
3. Click **"Use Custom SMTP"**
4. Enter:
   ```
   Host: smtp.gmail.com
   Port: 587
   User: your-test-email@gmail.com
   Password: [Your Gmail App Password]
   ```

### **Step 2: Get Gmail App Password**

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Click **App Passwords**
4. Generate password for "Mail"
5. Copy the 16-character code
6. Paste into Supabase SMTP Password

### **Step 3: Test**

1. Go to your forgot password page
2. Enter any test email
3. Click "Send Reset Link"
4. Check Gmail inbox (and spam)

**Should receive email within 1-2 minutes** ✅

---

## 🚀 **Production Setup (SendGrid - Free Tier)**

For production, use a proper email service:

### **Step 1: Create SendGrid Account**

1. Go to https://sendgrid.com/
2. Sign up (free tier: 100 emails/day)
3. Verify your email

### **Step 2: Create API Key**

1. Dashboard → Settings → API Keys
2. Create API Key
3. Name: "Zintra - Supabase"
4. Permissions: "Full Access" or "Mail Send"
5. Copy the API key

### **Step 3: Configure in Supabase**

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [Paste your SendGrid API Key]
Sender Name: Zintra
Sender Email: noreply@yourdomain.com
```

### **Step 4: Verify Sender Email**

1. SendGrid → Settings → Sender Authentication
2. Verify your domain OR single sender email
3. Follow verification steps
4. Wait for verification (can take 24-48 hours)

**Now you can send 100 emails/day for free!** 🎉

---

## 📊 **Debugging: What Email Users See**

### **Default Supabase Email Template:**

```
Subject: Reset Your Password

Hi,

Follow this link to reset your password for your Zintra account:

[Reset Password]

If you didn't request this, you can safely ignore this email.

Thanks,
Zintra Team
```

### **Customize the Template:**

1. Supabase → Settings → Authentication → Email Templates
2. Click **Password Reset**
3. Edit the HTML template
4. Use these variables:
   - `{{ .ConfirmationURL }}` - Reset link
   - `{{ .Token }}` - Reset token
   - `{{ .TokenHash }}` - Token hash
   - `{{ .SiteURL }}` - Your site URL

---

## 🐛 **Common Errors & Fixes**

### **Error: "SMTP connection failed"**

**Cause:** Wrong SMTP credentials or port

**Fix:**
1. Double-check SMTP settings
2. Try port 587 (TLS) instead of 465 (SSL)
3. Verify email/password is correct

---

### **Error: "Sender email not verified"**

**Cause:** Using custom domain without verification

**Fix:**
1. Use Gmail for testing first
2. Or verify your domain with email provider
3. Or use email provider's verified domain

---

### **Error: "Rate limit exceeded"**

**Cause:** Too many emails sent (built-in service limit)

**Fix:**
1. Wait 1 hour
2. Configure custom SMTP (no limits)

---

### **No Error, But No Email**

**Cause:** Email going to spam or rate limited

**Fix:**
1. Check spam folder thoroughly
2. Try different email provider
3. Check Supabase logs
4. Configure custom SMTP

---

## ✅ **Expected Behavior (When Working)**

1. User goes to `/forgot-password`
2. Enters email
3. Clicks "Send Reset Link"
4. Sees "✅ Check your email" message
5. **Within 1-2 minutes**, receives email
6. Email contains reset link
7. Clicks link → Redirected to `/auth/reset`
8. Enters new password
9. Password updated ✅

---

## 📞 **Still Not Working?**

**Check these:**

1. **Is email in auth.users table?**
   ```sql
   SELECT email, confirmed_at FROM auth.users WHERE email = 'test@example.com';
   ```
   - If `confirmed_at` is NULL → Email not verified yet
   - User must verify email before resetting password

2. **Are you using the right email?**
   - Email must match exactly (case-insensitive)
   - No extra spaces before/after

3. **Is Email Auth enabled?**
   - Supabase → Settings → Authentication
   - **Enable Email provider** must be ON ✅

4. **Check Supabase service status**
   - Go to https://status.supabase.com/
   - Check if email service has issues

---

## 🎉 **Quick Test Script**

Run this in browser console on `/forgot-password`:

```javascript
// Test password reset email
const testEmail = 'your-test@email.com';

await supabase.auth.resetPasswordForEmail(testEmail, {
  redirectTo: window.location.origin + '/auth/reset',
});

console.log('✅ Reset email requested. Check inbox and spam folder.');
```

If this works but the form doesn't → Form has a bug  
If this doesn't work → Supabase/SMTP configuration issue

---

## 📚 **Documentation Links**

- [Supabase Email Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Password Recovery](https://supabase.com/docs/guides/auth/passwords)
- [SendGrid Setup](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

## 🎯 **TL;DR - Fastest Fix**

1. **Go to Supabase Dashboard**
2. **Settings → Authentication → Email**
3. **Click "Use Custom SMTP"**
4. **Enter Gmail SMTP** (use App Password)
5. **Add redirect URLs** to whitelist
6. **Test again** ✅

**This should take 5-10 minutes and fix the issue!**

---

**Last Updated:** January 16, 2026  
**Status:** Complete guide for password reset email issues
