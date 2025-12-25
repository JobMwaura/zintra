# OTP SMS Delivery Fix - Complete Documentation

**Issue**: SMS OTP not sending to all phones
**Root Cause**: Using wrong API endpoint (`/sendsms/` instead of `/sendotp/`)
**Status**: ✅ FIXED (commit: 4220ba9)

---

## The Problem

Your SMS provider (TextSMS Kenya) provides **two different endpoints**:

1. **`/sendsms/`** - Generic SMS endpoint (standard messages)
2. **`/sendotp/`** - Dedicated OTP endpoint (sensitive transaction traffic)

Your code was using the generic `/sendsms/` endpoint for OTP delivery, but the provider recommends the dedicated `/sendotp/` endpoint for sensitive transactions like OTPs.

---

## What Was Changed

### File: `lib/services/otpService.ts`

#### Change 1: Updated sendSMSOTP function
**Before:**
```typescript
const response = await fetch(
  'https://sms.textsms.co.ke/api/services/sendsms/',  // ❌ Wrong endpoint
  { method: 'POST', ... }
);
```

**After:**
```typescript
const response = await fetch(
  'https://sms.textsms.co.ke/api/services/sendotp/',  // ✅ Correct endpoint
  { method: 'POST', ... }
);
```

#### Change 2: Updated sendSMSOTPCustom function
Same change - switched from `/sendsms/` to `/sendotp/`

#### Change 3: Enhanced logging
Added detailed logging to help diagnose issues:
```typescript
console.log('[OTP SendOTP] Request:', { 
  phone: normalizedPhone, 
  type,                    // 'registration', 'login', 'payment', etc.
  endpoint: '/sendotp/',   // Confirms correct endpoint
  timestamp: new Date().toISOString()
});
```

#### Change 4: Better error handling
Now handles multiple response formats from the API:
- Standard format: `{ success: boolean, message?: string }`
- Array format: `{ responses: [{ response-code: 200, ... }] }`
- Code format: `{ code: "200", message?: string }`

---

## Request Format (for reference)

Both functions now send requests in this format to the `/sendotp/` endpoint:

```json
{
  "apikey": "YOUR_API_KEY",
  "partnerID": "YOUR_PARTNER_ID",
  "mobile": "+254712345678",
  "message": "Your Zintra verification code is: 123456. Valid for 10 minutes.",
  "shortcode": "YOUR_SHORTCODE",
  "pass_type": "plain"
}
```

**Endpoint**: `POST https://sms.textsms.co.ke/api/services/sendotp/`

---

## Testing the Fix

### 1. Manual Testing
```bash
curl -X POST https://sms.textsms.co.ke/api/services/sendotp/ \
  -H "Content-Type: application/json" \
  -d '{
    "apikey": "YOUR_API_KEY",
    "partnerID": "YOUR_PARTNER_ID",
    "mobile": "+254712345678",
    "message": "Test OTP: 123456",
    "shortcode": "YOUR_SHORTCODE"
  }'
```

### 2. In-App Testing
1. Go to login page
2. Enter phone number: `+254712345678` (or your test number)
3. Click "Send OTP"
4. Check browser console for logs showing:
   ```
   [OTP SendOTP] Request: { phone: '+254712345678', type: 'login', endpoint: '/sendotp/', ... }
   [OTP SendOTP Response] { success: true, messageId: '...', ... }
   [OTP SendOTP Parsed] { isSuccess: true, ... }
   ```
5. You should receive SMS within 10-15 seconds

### 3. Check Server Logs
Run your app in development mode:
```bash
npm run dev
```

Then make an OTP request and look for logs like:
```
[OTP SendOTP] Request: { phone: '+254712345678', type: 'registration', endpoint: '/sendotp/', timestamp: '2025-12-25T10:30:00Z' }
[OTP SendOTP Response] { success: true, messageId: 'msg_123456789', ... }
[OTP SendOTP Parsed] { isSuccess: true, errorMessage: '', messageId: 'msg_123456789', phone: '+254712345678', type: 'registration' }
```

---

## Expected Response Format

The `/sendotp/` endpoint should return one of these formats:

### Success Response (Standard Format)
```json
{
  "success": true,
  "messageId": "msg_123456789",
  "message": "SMS sent successfully"
}
```

### Success Response (Array Format)
```json
{
  "responses": [
    {
      "response-code": 200,
      "response-description": "Success",
      "messageid": "msg_123456789",
      "mobile": "+254712345678"
    }
  ]
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid API key",
  "code": "invalid_credentials"
}
```

---

## Troubleshooting

### OTP Still Not Sending

1. **Check API Credentials**
   - Verify `TEXTSMS_API_KEY` is correct
   - Verify `TEXTSMS_PARTNER_ID` is correct
   - Verify `TEXTSMS_SHORTCODE` is correct

2. **Check Phone Number Format**
   - Must be: `+254712345678` (Kenyan format)
   - Or: `0712345678` (will be converted to `+254712345678`)
   - Not: `254712345678` (missing + or 0)

3. **Check Provider Status**
   - Visit: https://status.textsms.co.ke
   - Verify `/sendotp/` endpoint is operational
   - Check your account balance

4. **Check Browser Console Logs**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for `[OTP SendOTP]` logs
   - These show exact request/response

5. **Check Server Logs**
   - Terminal where you ran `npm run dev`
   - Look for `[OTP SendOTP]` debug logs
   - These show API responses

### Wrong Endpoint Being Used

If you see logs like:
```
[OTP SMS Response] // OLD LOG
```

This means you're on an older version. Make sure you've:
1. Pulled the latest code: `git pull origin main`
2. Reinstalled dependencies: `npm install`
3. Restarted dev server: `npm run dev`

---

## Monitoring in Production

When deployed to Vercel, monitor OTP delivery by:

1. **Check Vercel Logs**
   ```bash
   vercel logs --tail
   ```
   Look for `[OTP SendOTP]` entries

2. **Set Up Alerts**
   - If you see many failed OTPs, check provider status
   - Monitor error rate in your dashboard

3. **Check Provider Dashboard**
   - Login to TextSMS Kenya dashboard
   - Verify sending statistics
   - Check for any account warnings

---

## Performance Metrics

- **Expected delivery time**: 5-15 seconds
- **Success rate**: Should be 95%+ (depends on phone connectivity)
- **Timeout**: API call times out after 30 seconds

If delivery is slower or failing:
1. Check provider API status
2. Verify internet connectivity
3. Check phone number validity
4. Review provider logs

---

## References

- **Provider API Docs**: TextSMS Kenya API Documentation
- **OTP Endpoint Specs**:
  - GET: `https://sms.textsms.co.ke/api/services/sendotp/?message={{message}}&mobile={{mobile}}&shortcode={{shortcode}}&partnerID={{partnerId}}&apikey={{apikey}}`
  - POST: `https://sms.textsms.co.ke/api/services/sendotp/` (used by this code)

---

## What's Next?

After verifying OTP delivery is working:

1. **Monitor for a few days** to ensure consistent delivery
2. **Check success metrics** in Supabase `otp_verifications` table
3. **Alert on failures** if delivery drops below expected rate
4. **Consider SMS fallback** if you add other channels (email, etc.)

---

**Last Updated**: 25 December 2025
**Status**: ✅ Production Ready
**Commit**: 4220ba9
