# 📧 Complete Email Configuration Guide - Supabase + Custom OTP

## 🔍 Current Email System Analysis

Your Zintra app has **TWO different email systems** that both need configuration:

### 1. **Supabase Auth Emails** 🔐
- **Used for:** Login magic links, password resets, signup confirmations
- **Current Status:** ❓ Unknown if configured for `noreply@eventsgear.co.ke`
- **Files using this:** `/app/login/page.js`, `/app/forgot-password/page.js`, admin login
- **Function:** `supabase.auth.signInWithOtp()`, `supabase.auth.resetPasswordForEmail()`

### 2. **Custom OTP Emails** 🔢
- **Used for:** Email verification in user dashboard, debug tools
- **Current Status:** ✅ Simulating (ready for SMTP)
- **Files using this:** `/app/user-dashboard/page.js`, `/app/debug-email-otp/page.js`
- **Function:** Our custom `/api/otp/send` endpoint

---

## 🎯 **Step 1: Configure Supabase Auth Emails**

**This is likely why you're not receiving emails from `noreply@eventsgear.co.ke`**

### Open Supabase Dashboard

1. **Go to:** https://supabase.com/dashboard
2. **Select your project:** zintra
3. **Navigate to:** Settings → Authentication → Email

### Configure SMTP Settings

**Enable Custom SMTP and enter:**

```
✅ Enable custom SMTP server: ON

📧 SMTP Host: mail.eventsgear.co.ke
📧 SMTP Port: 587
📧 SMTP User: noreply@eventsgear.co.ke
📧 SMTP Password: [YOUR_EMAIL_PASSWORD]
📧 Sender Email: noreply@eventsgear.co.ke
📧 Sender Name: Zintra
```

### Test Supabase Email Configuration

**In the same Supabase page:**
1. **Look for:** "Send test email" button
2. **Enter your email** and click Send
3. **Check inbox** for email from `Zintra <noreply@eventsgear.co.ke>`

**If you receive the test email:** ✅ Supabase Auth emails are working!

---

## 🎯 **Step 2: Test All Email Systems**

### Test 1: Supabase Magic Link (Login)
1. **Go to:** https://zintra-sandy.vercel.app/login
2. **Toggle to:** Email OTP mode
3. **Enter your email** and click "Send Login Link"
4. **Check inbox** for magic link from `noreply@eventsgear.co.ke`
5. **Click the link** to verify login works

### Test 2: Supabase Password Reset
1. **Go to:** https://zintra-sandy.vercel.app/forgot-password
2. **Enter your email** and click "Send Reset Link"
3. **Check inbox** for reset email from `noreply@eventsgear.co.ke`
4. **Click the link** to verify reset works

### Test 3: Custom OTP Email (Dashboard)
1. **Go to:** https://zintra-sandy.vercel.app/user-dashboard
2. **Click:** "Verify Email" button
3. **Enter your email** and request OTP
4. **Check browser console** for detailed simulation logs
5. **You should see:** `[OTP Email] 📧 SIMULATING EMAIL DELIVERY:`

### Test 4: Custom OTP Email (Debug Tool)
1. **Go to:** https://zintra-sandy.vercel.app/debug-email-otp
2. **Enter your email** and click "Send Email OTP"
3. **Check browser console** for simulation logs
4. **No 500 errors** should occur

---

## 🔧 **Step 3: Enable Real Custom OTP Emails**

**Once Supabase Auth emails are working, you can enable real OTP emails:**

### Add Email Password to Environment
```bash
# In .env.local
EVENTSGEAR_EMAIL_PASSWORD=your_actual_password_here
```

### Or add to Vercel Dashboard:
1. **Go to:** https://vercel.com/dashboard
2. **Select:** zintra project
3. **Go to:** Settings → Environment Variables
4. **Add:** `EVENTSGEAR_EMAIL_PASSWORD` = [your password]
5. **Redeploy** the project

---

## 🧪 **Step 4: Verify Complete Email System**

### Expected Results After Full Configuration:

**✅ Supabase Auth Emails:** `noreply@eventsgear.co.ke`
- Login magic links
- Password reset emails
- Signup confirmation emails

**✅ Custom OTP Emails:** `noreply@eventsgear.co.ke` 
- Email verification codes
- Dashboard OTP verification
- Debug tool OTP testing

**✅ Professional Templates:**
- Zintra branding
- Security warnings
- Professional styling

---

## 🔍 **Troubleshooting Guide**

### If No Emails Are Received:

**Check Supabase Configuration:**
1. **Verify:** SMTP settings in Supabase dashboard
2. **Test:** Supabase test email function
3. **Check:** EventsGear email account status
4. **Verify:** `noreply@eventsgear.co.ke` password is correct

**Check Email Account:**
1. **Log into EventsGear cPanel**
2. **Verify:** `noreply@eventsgear.co.ke` exists and is active
3. **Check:** Inbox/sent mail for any errors
4. **Test:** Manual email from the account

**Check Application Logs:**
1. **Open:** Browser Developer Tools → Console
2. **Look for:** `[OTP Email]` messages (custom system)
3. **Check:** Vercel function logs (Supabase system)
4. **Verify:** No 500 errors in Network tab

---

## 📋 **Email System Reference**

### Supabase Auth Email Functions:
```javascript
// Magic link login (login page)
await supabase.auth.signInWithOtp({ email })

// Password reset (forgot password page) 
await supabase.auth.resetPasswordForEmail(email)

// These use Supabase's SMTP configuration
```

### Custom OTP Email Functions:
```javascript
// Custom OTP (user dashboard, debug tool)
await fetch('/api/otp/send', {
  method: 'POST',
  body: JSON.stringify({
    email: email,
    channel: 'email',
    type: 'verification'
  })
})

// This uses our custom email system
```

---

## 🎯 **Next Steps**

1. **Configure Supabase SMTP** with `noreply@eventsgear.co.ke` credentials
2. **Test Supabase email delivery** with their test function
3. **Test all login/reset flows** to ensure they work
4. **Optionally enable custom OTP** by adding the email password
5. **Verify end-to-end email functionality** for all features

**Most likely solution:** Configure the Supabase SMTP settings, and your login/reset emails will start working immediately! 🎉