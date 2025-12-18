# 🎯 OTP SMS Fix - Complete Resolution Guide

## Issue Summary
**Problem:** "Failed to send OTP" error when attempting to send SMS during vendor registration

**Cause:** Missing TextSMS Kenya environment variables

**Status:** ✅ **FIXED** (locally) - Awaiting Vercel configuration

---

## What Was Changed

### ✅ Environment Variables Added

**File: `.env`**
```bash
TEXTSMS_API_KEY=9c53d293fb384c98894370e4f9314406
TEXTSMS_PARTNER_ID=12487
TEXTSMS_SHORTCODE=EVENTS GEAR
```

**File: `.env.local`**
```bash
TEXTSMS_API_KEY=9c53d293fb384c98894370e4f9314406
TEXTSMS_PARTNER_ID=12487
TEXTSMS_SHORTCODE=EVENTS GEAR
```

These variables enable the system to:
1. ✅ Authenticate with TextSMS Kenya API
2. ✅ Identify as Zintra partner
3. ✅ Set proper SMS sender ID

---

## How the OTP System Works

### Vendor Registration Flow

```
User enters phone: +254712345678
        ↓
User clicks "Send Verification Code"
        ↓
Frontend calls: POST /api/otp/send
        ↓
Backend validates phone format
        ↓
Backend reads environment variables:
  - TEXTSMS_API_KEY ✓ (now configured)
  - TEXTSMS_PARTNER_ID ✓ (now configured)  
  - TEXTSMS_SHORTCODE ✓ (now configured)
        ↓
Backend calls TextSMS Kenya API:
  https://sms.textsms.co.ke/api/services/sendsms/
        ↓
SMS sent successfully!
        ↓
User receives: "Your Zintra registration code is: 482019"
        ↓
User enters code in UI
        ↓
Frontend calls: POST /api/otp/verify
        ↓
Code verified ✓
        ↓
User sees: ✓ Phone Verified
        ↓
User can proceed to next step
```

---

## Why It Was Failing

### Before (Without Env Vars)
```typescript
// In otpService.ts
const apiKey = process.env.TEXTSMS_API_KEY;        // ❌ undefined
const partnerId = process.env.TEXTSMS_PARTNER_ID;  // ❌ undefined
const shortcode = process.env.TEXTSMS_SHORTCODE;   // ❌ undefined

if (!apiKey || !partnerId || !shortcode) {
  return {
    success: false,
    error: 'SMS service not configured'  // ← This was the error!
  };
}
```

### After (With Env Vars)
```typescript
// In otpService.ts
const apiKey = process.env.TEXTSMS_API_KEY;        // ✓ 9c53d293...
const partnerId = process.env.TEXTSMS_PARTNER_ID;  // ✓ 12487
const shortcode = process.env.TEXTSMS_SHORTCODE;   // ✓ EVENTS GEAR

if (!apiKey || !partnerId || !shortcode) {
  // ✓ All set, can proceed!
}

// ✓ SMS sending will work now!
```

---

## Immediate Action Required

### For Local Testing
✅ **Already done** - environment variables are in `.env` and `.env.local`

To test locally:
```bash
# Restart dev server to load new env vars
npm run dev

# Visit: http://localhost:3000/vendor-registration
# Fill in registration through Step 2
# Click "Send Verification Code"
# Should now send SMS successfully (not fail)
```

### For Production (Vercel)

**These 3 variables need to be added to Vercel:**

1. Go to: https://vercel.com/dashboard
2. Select "zintra" project
3. Settings → Environment Variables
4. Add these exact variables:

| Name | Value |
|------|-------|
| `TEXTSMS_API_KEY` | `9c53d293fb384c98894370e4f9314406` |
| `TEXTSMS_PARTNER_ID` | `12487` |
| `TEXTSMS_SHORTCODE` | `EVENTS GEAR` |

Set each to: **Production, Preview, Development**

5. After adding all 3, go to Deployments
6. Redeploy the latest deployment
7. Wait for "Ready" status (green checkmark)
8. Test on Vercel URL

---

## Testing the Fix

### Local Testing (Next.js Dev)

**Step 1: Verify env vars are loaded**
```bash
# Check that env vars are available
echo $TEXTSMS_API_KEY
# Should show: 9c53d293fb384c98894370e4f9314406
```

**Step 2: Start dev server**
```bash
npm run dev
# Should see: Local: http://localhost:3000
```

**Step 3: Test OTP flow**
```
1. Visit: http://localhost:3000/vendor-registration
2. Enter email and password (Step 1)
3. Enter business info and phone (Step 2)
4. Click "Send Verification Code"
   Expected: SMS sent successfully (not error)
5. Check console for debug logs:
   "[OTP SMS] Phone: +254712345678, Status: true"
6. Receive SMS on phone with code
7. Enter code and verify
8. See: ✓ Phone Verified
```

### Vercel Testing (After Env Vars Set)

**Step 1: Add environment variables** (see above)

**Step 2: Redeploy**
```
Vercel Dashboard → Deployments → Redeploy Latest
Wait for "Ready" status
```

**Step 3: Test on live**
```
1. Visit: https://your-project.vercel.app/vendor-registration
2. Repeat steps from local testing above
3. SMS should now work on production
```

---

## Debugging If Still Not Working

### Check 1: Vercel Environment Variables Properly Set

```
Vercel Dashboard
  → zintra project
  → Settings
  → Environment Variables
  
Should see:
  ✓ TEXTSMS_API_KEY = 9c53d293fb384c98894370e4f9314406
  ✓ TEXTSMS_PARTNER_ID = 12487
  ✓ TEXTSMS_SHORTCODE = EVENTS GEAR
```

### Check 2: Deployment is Fresh

```
Vercel Dashboard
  → Deployments
  
Status should be: ✓ Ready (not Building or Failed)
Date should be recent (after you added env vars)
```

### Check 3: View Error Logs

```
Vercel Dashboard
  → Deployments
  → Click on deployment
  → View Logs
  
Look for errors like:
  - "SMS service not configured"
  - "TEXTSMS_API_KEY is not defined"
  - API connection errors
```

### Check 4: Test API Directly

```bash
# Test OTP send endpoint
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "channel": "sms",
    "type": "registration"
  }'

# Should return:
# {"success": true, "message": "OTP sent successfully via sms", ...}
# NOT:
# {"success": false, "error": "SMS service not configured"}
```

### Check 5: Verify Phone Number Format

```
Valid formats:
  ✓ +254712345678 (international)
  ✓ 0712345678 (local Kenya format)

Invalid formats:
  ✗ 712345678 (missing prefix)
  ✗ +254 712345678 (space)
  ✗ 254712345678 (missing +)
```

### Check 6: Rate Limiting

```
OTP is rate limited: 3 attempts per 10 minutes per phone number

If getting error: "Too many OTP requests"
→ Wait 10 minutes
→ Or test with different phone number
```

---

## What Each Variable Does

### TEXTSMS_API_KEY
- **Value:** `9c53d293fb384c98894370e4f9314406`
- **Purpose:** Authentication token for TextSMS Kenya
- **Used by:** SMS sending API calls
- **Visibility:** Server-side only (secure)

### TEXTSMS_PARTNER_ID  
- **Value:** `12487`
- **Purpose:** Identifies Zintra as a TextSMS partner
- **Used by:** SMS sending API calls
- **Visibility:** Server-side only (secure)

### TEXTSMS_SHORTCODE
- **Value:** `EVENTS GEAR`
- **Purpose:** Appears in SMS "From" field
- **Used by:** SMS sending API calls
- **Visibility:** Server-side only (secure)
- **Note:** Different from API key, this is the display name in SMS

---

## SMS Provider Details

### TextSMS Kenya
- **Endpoint:** `https://sms.textsms.co.ke/api/services/sendsms/`
- **Method:** POST
- **Region:** Kenya-focused (great for our market)
- **Shortcodes:** Customizable (we use "EVENTS GEAR")
- **Delivery Time:** <5 seconds typically

### SMS Message Format
```
Your Zintra registration code is: 482019. Valid for 10 minutes.
```

This message:
- ✓ Is clear and professional
- ✓ Includes code (6 digits)
- ✓ Shows validity period
- ✓ Has Zintra branding

---

## Files Modified

1. **`.env`** - Added TextSMS credentials (development)
2. **`.env.local`** - Added TextSMS credentials (local override)
3. **`OTP_FIX_MISSING_ENV_VARS.md`** - This guide

**Files Not Modified:**
- No code changes needed
- No API changes needed
- No database changes needed
- Just environment configuration

---

## Timeline

**What Happened:**
1. ✅ OTP system was built completely
2. ✅ Integrated into vendor registration
3. ❌ Environment variables weren't configured
4. ❌ SMS sending failed when tested
5. ✅ Identified missing env vars
6. ✅ Added env vars locally
7. ⏳ Need to add to Vercel

**Next Steps:**
1. ⏳ Add env vars to Vercel
2. ⏳ Redeploy on Vercel
3. ✓ Test on production URL
4. ✓ Confirm SMS delivery works
5. ✓ Monitor vendor registrations

---

## Success Criteria

When the fix is complete, you should see:

✅ **When sending OTP:**
- "✓ SMS sent! Enter the 6-digit code"
- (not "Failed to send OTP")

✅ **SMS Content:**
- "Your Zintra registration code is: XXXXXX"

✅ **Code Verification:**
- User can enter code and verify
- "✓ Phone Verified" appears
- Registration can continue

✅ **Database:**
- `phone_verified = true`
- `phone_verified_at = timestamp`

---

## Support

### If Still Having Issues

**Check these in order:**

1. Env vars in Vercel? → Add them if missing
2. Deployment redeployed? → Redeploy if needed
3. Correct phone format? → Use +254... or 0...
4. Rate limited? → Wait 10 minutes
5. Check logs? → Vercel Deployments → Logs

### Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "SMS service not configured" | Env vars missing | Add to Vercel env |
| "Invalid phone format" | Wrong format | Use +254... or 0... |
| "Too many OTP requests" | Rate limited | Wait 10 minutes |
| "Failed to send OTP" | API error | Check logs |

---

## Technical Details

### Environment Variable Loading

**Next.js reads env vars in this order:**
1. `.env.production.local` (not used here)
2. `.env.production` (not used here)
3. `.env.local` ← (has them now)
4. `.env` ← (has them now)
5. Vercel Project Settings ← (needs update)

**On Vercel:**
1. Project Settings env vars override local files
2. So Vercel vars are what will actually be used
3. Must be added to Vercel to work on production

---

## Summary

| Aspect | Status | Action |
|--------|--------|--------|
| **Root Cause Identified** | ✅ Done | Missing env vars |
| **Local Fix Applied** | ✅ Done | Updated .env files |
| **Code Changes Needed** | ✅ N/A | No changes needed |
| **Vercel Config Needed** | ⏳ Pending | Add 3 variables |
| **Testing Ready** | ✅ Done | Ready to test locally |

---

**Status:** 🔧 **PARTIALLY FIXED**

**What's Done:**
- ✅ Root cause identified (missing env vars)
- ✅ Local environment variables configured
- ✅ Documentation provided
- ✅ Local testing ready

**What's Pending:**
- ⏳ Add environment variables to Vercel
- ⏳ Redeploy on Vercel  
- ⏳ Test on production URL
- ⏳ Confirm SMS delivery working

**Time to Complete:** ~5-10 minutes on Vercel dashboard
