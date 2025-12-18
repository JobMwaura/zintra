# 🔧 OTP Fix: Missing Environment Variables

## Problem
The OTP (SMS) feature was failing with "Failed to send OTP" because the TextSMS Kenya credentials were not configured in environment variables.

## Root Cause
Three environment variables were missing:
- `TEXTSMS_API_KEY`
- `TEXTSMS_PARTNER_ID`
- `TEXTSMS_SHORTCODE`

Without these, the SMS service can't authenticate with TextSMS Kenya.

---

## Solution Applied

### ✅ Local Environment (Done)
Updated `.env` and `.env.local` with TextSMS credentials:

```bash
TEXTSMS_API_KEY=9c53d293fb384c98894370e4f9314406
TEXTSMS_PARTNER_ID=12487
TEXTSMS_SHORTCODE=EVENTS GEAR
```

### ⏳ Vercel Environment (Action Required - See Below)

---

## How to Update Vercel Environment Variables

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select the "zintra" project
3. Go to **Settings** tab

### Step 2: Navigate to Environment Variables
1. Click **Environment Variables** (left sidebar)
2. You should see existing variables like:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - etc.

### Step 3: Add New Environment Variables
Add these 3 new variables (click "Add" button for each):

**Variable 1:**
```
Name: TEXTSMS_API_KEY
Value: 9c53d293fb384c98894370e4f9314406
Environment: Production, Preview, Development
```

**Variable 2:**
```
Name: TEXTSMS_PARTNER_ID
Value: 12487
Environment: Production, Preview, Development
```

**Variable 3:**
```
Name: TEXTSMS_SHORTCODE
Value: EVENTS GEAR
Environment: Production, Preview, Development
```

### Step 4: Save and Redeploy
1. Click "Save" after adding each variable
2. Go to **Deployments** tab
3. Find the latest deployment
4. Click the three-dot menu and select "Redeploy"
5. Wait for redeployment to complete

---

## Testing the Fix

### Test Locally (Next.js Dev Server)
```bash
# Make sure you have the latest .env variables
npm run dev

# Visit: http://localhost:3000/vendor-registration
# Try the registration flow with OTP
```

### Test on Vercel (After Redeployment)
```bash
# After redeploying with env vars, test on:
# https://your-project.vercel.app/vendor-registration
```

---

## What Should Happen Now

### Before (With Missing Env Vars)
1. User enters phone number
2. Clicks "Send Verification Code"
3. SMS sending code tries to run but fails
4. Shows error: "Failed to send OTP"
5. User is stuck, can't proceed

### After (With Env Vars)
1. User enters phone number
2. Clicks "Send Verification Code"
3. System calls TextSMS Kenya API
4. SMS is sent successfully
5. Shows: "✓ SMS sent! Enter the 6-digit code"
6. User receives SMS: "Your Zintra registration code is: XXXXXX"
7. User enters code and verifies
8. Proceeds to next step

---

## Troubleshooting

### "Failed to send OTP" Still Showing After Fix

**Check 1: Are Vercel env vars deployed?**
```
✓ Go to Vercel Project Settings → Environment Variables
✓ Confirm all 3 TextSMS variables are there
✓ Redeploy the project
```

**Check 2: Did you wait for redeployment?**
```
✓ Go to Vercel Deployments tab
✓ Wait for status to change from "Building..." to "Ready"
✓ Then test again
```

**Check 3: Check server logs**
```
✓ In Vercel: Go to Deployments → Select latest → View Logs
✓ Look for errors like "TextSMS Kenya credentials not configured"
```

**Check 4: Verify TextSMS Credentials**
```
✓ API Key: 9c53d293fb384c98894370e4f9314406 ✓
✓ Partner ID: 12487 ✓
✓ Shortcode: EVENTS GEAR ✓
✓ (These are correct and pre-configured)
```

### SMS Not Arriving

**Check Phone Format:**
```
Valid formats:
✓ +254712345678 (international format)
✓ 0712345678 (local format)

Invalid formats:
✗ 712345678 (missing country/local code)
✗ +254 712345678 (space in number)
```

**Check Rate Limiting:**
```
✓ Limited to 3 OTP requests per phone number per 10 minutes
✓ If you've tried 3+ times, wait 10 minutes before retrying
```

---

## Environment Variables Reference

### TextSMS Kenya Configuration

| Variable | Value | Purpose |
|----------|-------|---------|
| `TEXTSMS_API_KEY` | 9c53d293fb384c98894370e4f9314406 | Authentication with TextSMS API |
| `TEXTSMS_PARTNER_ID` | 12487 | Partner identification for Zintra |
| `TEXTSMS_SHORTCODE` | EVENTS GEAR | SMS sender ID (shows in SMS "from" field) |

### Where These Are Used
- `/lib/services/otpService.ts` - Reads these to send SMS
- `/app/api/otp/send/route.ts` - Passes to service layer
- Used only server-side (safe to include in Vercel)

---

## Files Changed

1. ✅ `.env.local` - Updated with TextSMS credentials
2. ✅ `.env` - Updated with TextSMS credentials
3. ⏳ Vercel Project Settings - **You need to add these**

---

## Summary

**What was wrong:** OTP endpoints couldn't send SMS because TextSMS credentials weren't configured.

**What's fixed:** Added missing environment variables.

**What you need to do:** 
1. Add the 3 TextSMS variables to Vercel Project Settings
2. Redeploy the project
3. Test vendor registration with phone verification

**Time to fix:** ~5 minutes in Vercel dashboard

---

## Quick Checklist

- [ ] Go to Vercel Project Settings
- [ ] Click "Environment Variables"
- [ ] Add `TEXTSMS_API_KEY=9c53d293fb384c98894370e4f9314406`
- [ ] Add `TEXTSMS_PARTNER_ID=12487`
- [ ] Add `TEXTSMS_SHORTCODE=EVENTS GEAR`
- [ ] Set all to Production, Preview, Development
- [ ] Go to Deployments tab
- [ ] Click redeploy on latest deployment
- [ ] Wait for redeployment to finish (green "Ready" status)
- [ ] Test vendor registration with OTP
- [ ] Verify SMS arrives on phone

---

**Status:** ✅ Fix Applied Locally, ⏳ Awaiting Vercel Configuration
