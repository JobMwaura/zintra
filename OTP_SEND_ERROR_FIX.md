# 🔧 OTP Send 500 Error - Diagnosis & Solution

## What's Happening

The `/api/otp/send` endpoint is returning HTTP 500 when SMS OTP fails because:

1. **TextSMS environment variables are NOT configured in Vercel**
   - `TEXTSMS_API_KEY` - Missing
   - `TEXTSMS_PARTNER_ID` - Missing
   - `TEXTSMS_SHORTCODE` - Missing

2. User tries to send SMS OTP → SMS fails → No email provided → Returns 500 error

## ✅ What's Fixed

I've improved the code to:
- ✅ Fall back to email if SMS fails
- ✅ Provide better error messages
- ✅ Add debug endpoint to check what's configured
- ✅ Log detailed error information for debugging

## 🔍 How to Diagnose

Visit this endpoint to check what's configured:
```
GET /api/debug/otp-config
```

Response will show:
```json
{
  "otp": {
    "sms": {
      "configured": false,
      "hasApiKey": false,
      "hasPartnerId": false,
      "hasShortcode": false,
      "allRequired": "MISSING - Need all 3: TEXTSMS_API_KEY, TEXTSMS_PARTNER_ID, TEXTSMS_SHORTCODE"
    },
    "email": {
      "configured": false,
      "status": "SIMULATION (no real emails sent)"
    }
  }
}
```

## 🚀 Solutions

### Option 1: Add TextSMS Credentials (Recommended for SMS)

If you want SMS to work:

1. Get your TextSMS Kenya credentials:
   - API Key
   - Partner ID
   - Shortcode

2. Add to Vercel Environment Variables:
   - `TEXTSMS_API_KEY` = [your API key]
   - `TEXTSMS_PARTNER_ID` = [your partner ID]
   - `TEXTSMS_SHORTCODE` = [your shortcode]

3. Wait for Vercel redeploy (2-3 minutes)

4. Check `/api/debug/otp-config` - SMS should show `configured: true`

### Option 2: Use Email OTP (Works Now Without Setup)

If you don't have TextSMS credentials yet:

1. Email OTP is already working in simulation mode
2. When user requests email OTP, they'll get a simulated email (logged to console)
3. Works for testing immediately without credentials

### Option 3: Set EventsGear Email Password (Production Email)

For real emails instead of simulated:

1. Get your EventsGear SMTP password
2. Add to Vercel: `EVENTSGEAR_EMAIL_PASSWORD` = [your password]
3. Real emails will be sent via EventsGear SMTP

## 🔄 How It Works Now

**When user tries to send OTP:**

```
User requests SMS OTP
↓
App tries to send SMS via TextSMS
↓
If SMS credentials missing → SMS fails
↓
App automatically tries Email as fallback
↓
If email provided → Send email OTP ✅
↓
If no email provided → Return error
```

**Benefits:**
- SMS works when credentials available
- Email works as fallback when SMS fails
- In simulation mode, email works immediately for testing
- Users can choose either channel

## 📋 Current State

| Channel | Status | Notes |
|---------|--------|-------|
| **SMS** | ❌ Not configured | Needs TextSMS credentials in Vercel |
| **Email** | ✅ Simulation mode | Works for testing, ready for production |
| **Fallback** | ✅ Enabled | If SMS fails, tries email |

## 🧪 Testing

### Test SMS OTP
```
POST /api/otp/send
{
  "phoneNumber": "+254712345678",
  "channel": "sms",
  "type": "registration"
}
```

**Expected:**
- With credentials: SMS sent ✅
- Without credentials: Falls back to email

### Test Email OTP
```
POST /api/otp/send
{
  "email": "user@example.com",
  "channel": "email",
  "type": "registration"
}
```

**Expected:**
- Simulation mode: Logged to console ✅
- Production mode: Real email sent

### Check Configuration
```
GET /api/debug/otp-config
```

Returns full configuration status

## 🎯 Next Steps

### Immediate (Works Now)
- ✅ Email OTP in simulation mode (for testing)
- ✅ Fallback from SMS to email when SMS fails
- ✅ Better error messages

### Short Term (5 minutes to add credentials)
- Add TextSMS credentials to Vercel
- SMS OTP will work
- Both channels fully operational

### Optional (For Production Email)
- Add EventsGear password to Vercel
- Real emails instead of simulated
- Full production readiness

## 🔐 Credentials Needed

If TextSMS isn't working, check:
1. Are TextSMS credentials saved in your account?
2. Is your account active with TextSMS Kenya?
3. Do you have SMS credits/balance?
4. Are the credentials correct?

If EventsGear isn't working, check:
1. Is the SMTP password correct?
2. Is it set in Vercel?
3. Has Vercel redeployed (2-3 minutes)?

## ✅ Verification

After setting up credentials:

1. Check `/api/debug/otp-config`
2. SMS and/or Email should show `configured: true`
3. Test OTP send - should work
4. Check Vercel logs for detailed error info

---

**Status:** ✅ Code improved with fallback and better error handling
**Next:** Add TextSMS credentials to Vercel for full SMS functionality
**Or:** Use email OTP which works immediately in simulation mode
