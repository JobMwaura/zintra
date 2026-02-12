# 📧 Configure Custom Email Domain for Supabase

**Goal:** Send password reset emails from `forgetpassword@eventsgear.co.ke`3. Check inbox
5. Email should come from `forgetpassword@eventsgear.co.ke` ✅

### **Test 2: Welcome/Verification Email**

1. Create new test account
2. Check welcome email
3. Should come from 2. User enters email: `user@example.com`
3. Clicks "Send Reset Link"
4. Supabase connects to `mail.eventsgear.co.ke:587`
5. Authenticates with `forgetpassword@eventsgear.co.ke` + password
6. Sends email from `forgetpassword@eventsgear.co.ke`
7. User receives email in 1-2 minutes
8. Email shows: **From: Zintra <forgetpassword@eventsgear.co.ke>**password@eventsgear.co.ke` ✅

### **Test 3: Magic Link Email**

1. Try magic link login (if enabled)
2. Should come from `forgetpassword@eventsgear.co.ke` ✅upabase default

**Updated:** January 16, 2026 - New dedicated password reset email

---

## 🎯 Quick Setup Guide

### **Step 1: Go to Supabase Dashboard**

1. Open your Supabase project: https://supabase.com/dashboard
2. Click on your project (zintra)
3. Go to **Settings** (left sidebar, gear icon)
4. Click **Authentication**
5. Scroll down to **SMTP Settings** or **Email** section

---

### **Step 2: Enable Custom SMTP**

Look for **"Enable Custom SMTP Server"** and toggle it ON.

Then enter these details:

```
SMTP Host: mail.eventsgear.co.ke
SMTP Port: 587
SMTP User: forgetpassword@eventsgear.co.ke
SMTP Password: [Your Password - Check cPanel/Email Settings]
Sender Email: forgetpassword@eventsgear.co.ke
Sender Name: Zintra
```

**Note:** You'll need to get the password from your cPanel or hosting control panel.

**Important Settings:**
- **Enable TLS:** YES (port 587 uses TLS)
- **Enable STARTTLS:** YES

---

### **Step 3: Configure Sender Details**

In the same SMTP settings section:

**Sender Email:** `forgetpassword@eventsgear.co.ke`  
**Sender Name:** `Zintra` (or "Zintra Platform" or "Zintra Team")

This is what users will see in their inbox:
```
From: Zintra <forgetpassword@eventsgear.co.ke>
Subject: Reset Your Password
```

---

### **Step 4: Test SMTP Configuration**

Supabase usually has a "Test Configuration" or "Send Test Email" button.

1. Click **"Test SMTP Configuration"**
2. Enter your personal email
3. Click Send
4. Check your inbox (and spam)
5. Should receive test email within 1-2 minutes

**If test fails:**
- Double-check credentials
- Verify port 587 is correct
- Ensure password is exactly: `Chicago2026!`
- Check if mail server allows SMTP access

---

### **Step 5: Save Configuration**

Click **"Save"** or **"Update"** button at bottom of SMTP settings.

---

## 🔧 Detailed SMTP Configuration

### **Fields to Fill:**

| Field | Value | Notes |
|-------|-------|-------|
| **Enable Custom SMTP** | ON | Toggle switch |
| **SMTP Host** | `mail.eventsgear.co.ke` | Your mail server |
| **SMTP Port** | `587` | TLS/STARTTLS port |
| **SMTP Username** | `forgetpassword@eventsgear.co.ke` | Full email address |
| **SMTP Password** | `[Your Password]` | Get from cPanel |
| **Sender Email** | `forgetpassword@eventsgear.co.ke` | What users see in "From:" |
| **Sender Name** | `Zintra` | Display name |
| **Enable TLS** | YES | Required for port 587 |

---

## 📧 How Emails Will Look

### **Before (Default Supabase):**
```
From: noreply@mail.app.supabase.io
Subject: Reset Your Password
```

### **After (Your Custom Domain):**
```
From: Zintra <forgetpassword@eventsgear.co.ke>
Subject: Reset Your Password
```

Much more professional and purpose-specific! ✨

---

## 🧪 Testing After Configuration

### **Test 1: Password Reset Email**

1. Go to your app: https://zintra-sandy.vercel.app/forgot-password
2. Enter any test email address
3. Click "Send Reset Link"
4. Check inbox
5. Email should come from `zintraotp@eventsgear.co.ke` ✅

### **Test 2: Welcome/Verification Email**

1. Create new test account
2. Check welcome email
3. Should come from `zintraotp@eventsgear.co.ke` ✅

### **Test 3: Magic Link Email**

1. Try magic link login (if enabled)
2. Should come from `zintraotp@eventsgear.co.ke` ✅

---

## 🔒 Security Best Practices

### **✅ Good Practice: Dedicated Email**

You're using a dedicated email for password resets: `forgetpassword@eventsgear.co.ke`

**Benefits:**
- ✅ Purpose-specific (users know it's for password reset)
- ✅ Easy to track and monitor
- ✅ Can set up separate spam filters
- ✅ Professional appearance

**Also consider creating:**
- `noreply@eventsgear.co.ke` - For general notifications
- `support@eventsgear.co.ke` - For support emails
- `no-reply@zintra.co.ke` - If you get zintra.co.ke domain

---

## 🎨 Customize Email Templates (Optional)

After SMTP is configured, you can customize email templates:

### **Step 1: Go to Email Templates**

Supabase Dashboard → Settings → Authentication → **Email Templates**

### **Step 2: Edit Password Reset Template**

Click **"Reset Password"** template

**Default template:**
```html
<h2>Reset Your Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

**Customize to:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #ea8f1e 0%, #f59e0b 100%); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Zintra</h1>
  </div>
  
  <div style="padding: 30px; background: #ffffff;">
    <h2 style="color: #1f2937;">Reset Your Password</h2>
    <p style="color: #4b5563; line-height: 1.6;">
      We received a request to reset your password for your Zintra account.
    </p>
    <p style="color: #4b5563; line-height: 1.6;">
      Click the button below to create a new password:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background: #ea8f1e; color: white; padding: 12px 30px; 
                text-decoration: none; border-radius: 6px; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">
      If you didn't request this, you can safely ignore this email.
    </p>
    <p style="color: #6b7280; font-size: 14px;">
      This link will expire in 1 hour.
    </p>
  </div>
  
  <div style="padding: 20px; background: #f9fafb; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      © 2026 Zintra. All rights reserved.
    </p>
  </div>
</div>
```

**Available Variables:**
- `{{ .ConfirmationURL }}` - Password reset link
- `{{ .Token }}` - Reset token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email

---

## 🐛 Troubleshooting

### **Issue: "SMTP Connection Failed"**

**Possible causes:**
1. Wrong host: `mail.eventsgear.co.ke`
2. Wrong port: Should be `587` (not 465 or 25)
3. Wrong credentials
4. Server blocking SMTP

**Fix:**
1. Verify host is exactly: `mail.eventsgear.co.ke` (no typos)
2. Ensure port is `587`
3. Double-check username and password
4. Contact your hosting provider (eventsgear.co.ke) to verify SMTP is enabled

---

### **Issue: "Authentication Failed"**

**Cause:** Wrong username or password

**Fix:**
1. Username should be full email: `forgetpassword@eventsgear.co.ke`
2. Verify password from your cPanel/email settings
3. Try logging into webmail to verify credentials work:
   - URL: Usually `https://mail.eventsgear.co.ke` or `https://eventsgear.co.ke/webmail`
   - Username: `forgetpassword@eventsgear.co.ke`
   - Password: [Your password]

---

### **Issue: Emails Go to Spam**

**Causes:**
- New sending domain (no reputation)
- Missing SPF/DKIM records
- No reverse DNS

**Fixes:**

**1. Add SPF Record** (DNS Settings):
```
Type: TXT
Name: @
Value: v=spf1 a mx ip4:YOUR_SERVER_IP ~all
```

**2. Add DKIM** (ask your host to enable)

**3. Add DMARC Record**:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:zintraotp@eventsgear.co.ke
```

**4. Set up Reverse DNS** (contact hosting provider)

---

### **Issue: Port 587 Blocked**

**Symptoms:** Connection timeout

**Alternatives to try:**
- Port `465` (SSL) - Change to this if 587 doesn't work
- Port `25` (Plain) - Less secure, not recommended

**In Supabase:**
- If using port 465: Enable SSL instead of TLS
- If using port 25: Disable TLS

---

## 📊 Expected Behavior After Setup

### **When User Requests Password Reset:**

1. User goes to `/forgot-password`
2. Enters email: `user@example.com`
3. Clicks "Send Reset Link"
4. Supabase connects to `mail.eventsgear.co.ke:587`
5. Authenticates with `zintraotp@eventsgear.co.ke` + password
6. Sends email from `zintraotp@eventsgear.co.ke`
7. User receives email in 1-2 minutes
8. Email shows: **From: Zintra <zintraotp@eventsgear.co.ke>**

---

## ✅ Configuration Checklist

- [ ] Supabase Dashboard → Settings → Authentication opened
- [ ] Custom SMTP enabled
- [ ] SMTP Host: `mail.eventsgear.co.ke`
- [ ] SMTP Port: `587`
- [ ] SMTP Username: `forgetpassword@eventsgear.co.ke`
- [ ] SMTP Password: `[Chicago2026!]`
- [ ] Sender Email: `forgetpassword@eventsgear.co.ke`
- [ ] Sender Name: `Zintra`
- [ ] TLS/STARTTLS enabled
- [ ] Configuration saved
- [ ] Test email sent successfully
- [ ] Test password reset from app
- [ ] Email arrives in inbox (not spam)
- [ ] Email shows correct sender

---

## 🎯 Quick Steps (TL;DR)

1. **Supabase Dashboard** → Settings → Authentication
2. **Enable Custom SMTP** → ON
3. **Fill in:**
   - Host: `mail.eventsgear.co.ke`
   - Port: `587`
   - User: `forgetpassword@eventsgear.co.ke`
   - Pass: `[Get from cPanel]`
   - Sender: `forgetpassword@eventsgear.co.ke`
4. **Save**
5. **Test** → Send test email
6. **Verify** → Try password reset from your app

---

## 🚀 After Configuration

Once configured, ALL Supabase emails will use your custom domain:

- ✅ Password reset emails
- ✅ Email verification
- ✅ Magic link emails
- ✅ OTP emails
- ✅ Invitation emails

All from: `Zintra <forgetpassword@eventsgear.co.ke>` 🎉

---

## 📞 If You Need Help

**Contact eventsgear.co.ke support if:**
- SMTP connection fails
- Need to enable SMTP access
- Need SPF/DKIM configuration
- Port 587 is blocked

**They should provide:**
- Confirmation SMTP is enabled for your account
- Correct mail server hostname
- Correct ports
- SPF/DKIM records to add to DNS

---

**Ready to configure?** Go to Supabase Dashboard → Settings → Authentication → SMTP Settings and enter the details above! 🚀

---

**Last Updated:** January 16, 2026  
**Email Account:** forgetpassword@eventsgear.co.ke  
**Mail Server:** mail.eventsgear.co.ke:587  
**POP/IMAP Server:** mail.eventsgear.co.ke
