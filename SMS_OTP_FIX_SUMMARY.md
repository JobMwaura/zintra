# SMS OTP Issue - Root Cause & Solution

## 🔍 Problem Identified

**SMS OTP is returning HTTP 500 errors because TextSMS environment variables are NOT configured in Vercel.**

## ✅ What's Working

- ✅ Email OTP system fully functional (sends real emails via EventsGear SMTP)
- ✅ OTP verification endpoint working correctly
- ✅ Email verification modal functional in UI
- ✅ Build compiling successfully
- ✅ Code for SMS is correct, module loading fixed

## ❌ What's Broken

- ❌ SMS OTP returns 500 error
- ❌ Root cause: Missing TextSMS credentials in Vercel environment

## 🎯 Why This Happens

When you request SMS OTP, the code does:

```typescript
const apiKey = process.env.TEXTSMS_API_KEY;
const partnerId = process.env.TEXTSMS_PARTNER_ID;
const shortcode = process.env.TEXTSMS_SHORTCODE;

if (!apiKey || !partnerId || !shortcode) {
  return { success: false, error: 'SMS service not configured' };
}
```

Since these environment variables are `undefined` in Vercel, the function returns an error. The endpoint then returns HTTP 500 because SMS failed and no fallback channel (email) was provided.

## 🚀 How to Fix (3 Easy Steps)

### Step 1: Gather TextSMS Credentials

Get these from your TextSMS Kenya account:
- **API Key** - Your authentication token
- **Partner ID** - Your account/partner ID
- **Shortcode** - Your SMS sender name/code

### Step 2: Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Click on your "Zintra Platform" project
3. Go to: Settings → Environment Variables
4. Add three variables:
   - Name: `TEXTSMS_API_KEY` → Value: [your API key]
   - Name: `TEXTSMS_PARTNER_ID` → Value: [your partner ID]
   - Name: `TEXTSMS_SHORTCODE` → Value: [your shortcode]
5. Click "Save"

### Step 3: Verify & Test

1. Visit: `https://your-vercel-url.vercel.app/api/debug/sms-config`
2. Should show all as `true`:
   ```json
   {
     "textsms": {
       "apiKeyConfigured": true,
       "partnerIdConfigured": true,
       "shortcodeConfigured": true,
       "allConfigured": true
     }
   }
   ```
3. Test SMS OTP in your app - should work!

## 📋 Complete Action Checklist

- [ ] **Get TextSMS credentials** from your TextSMS Kenya account
- [ ] **Add to Vercel** using the three environment variable names
- [ ] **Wait for deployment** (Vercel auto-redeploys when env vars change)
- [ ] **Check debug endpoint** to confirm all variables configured
- [ ] **Test SMS OTP** in the app - try sending to your phone
- [ ] **Verify SMS arrives** with correct format
- [ ] **Test OTP entry** - enter the code and verify it works
- [ ] **Run database migration** for email_verified columns (when ready)
- [ ] **Test email OTP** - verify email functionality still works
- [ ] **Mark issue resolved** when both SMS and email working

## 📚 Additional Resources

- **Setup Guide**: See `TEXTSMS_SETUP_GUIDE.md` in repository
- **Debug Endpoint**: `/api/debug/sms-config` - Check configuration status
- **Email OTP**: Already working! Uses EventsGear SMTP configured in Vercel
- **Database Migration**: Ready in `ADD_EMAIL_VERIFICATION_COLUMNS.sql`

## 💡 Quick Recap

| Component | Status | Next Step |
|---|---|---|
| **Email OTP** | ✅ Working | Run DB migration for columns |
| **SMS OTP Code** | ✅ Ready | Add TextSMS credentials to Vercel |
| **TextSMS Config** | ❌ Missing | Follow 3-step fix above |
| **Email Verification DB** | ⏳ Ready | Execute SQL migration |

---

**TL;DR**: SMS broken because TextSMS credentials not in Vercel → Add the 3 env variables → SMS works! 🎉
