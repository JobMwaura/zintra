# PesaPal Invalid Credentials - Root Cause Analysis

**Status:** 🔴 Credentials Being Rejected by PesaPal  
**Date:** January 5, 2026  
**Issue:** Authentication error even with correct syntax

---

## The Error

```json
{
  "error": {
    "error_type": "authentication_error",
    "code": "invalid_api_credentials_provided",
    "message": "Invalid Access Token"
  }
}
```

**What this means:** PesaPal received the request but the consumer_key and consumer_secret don't match any valid merchant account.

---

## Possible Root Causes

### 1. Credentials Are Expired ⏰

PesaPal credentials can expire if:
- Your merchant account was inactive for a period
- Your account was reset/regenerated
- The credentials are very old

**Check:** Log into your PesaPal merchant dashboard. Are there newer credentials available?

### 2. Credentials Are for Different Environment 🌍

**Important question:** Are these credentials for:
- **Sandbox** (testing) - URL: `https://cybqa.pesapal.com/pesapalv3`
- **Live/Production** (real money) - URL: `https://pay.pesapal.com/v3`

Our code currently uses **Sandbox** URL:
```
NEXT_PUBLIC_PESAPAL_API_URL = https://cybqa.pesapal.com/pesapalv3
```

If your credentials are for **Live**, you'll get invalid credentials error when trying Sandbox!

### 3. Credentials Never Been Activated 🔌

Some merchant accounts require activation steps before credentials work.

**Check:** In your PesaPal dashboard, are the API credentials marked as "Active"?

### 4. Credentials Belong to Different Account 👤

Make sure the credentials you're using are from your current merchant account, not an old one.

---

## Diagnostic Steps

### Step 1: Verify Credentials in PesaPal Dashboard

1. Log in to https://dashboard.pesapal.com (or your PesaPal merchant portal)
2. Go to API Settings or Developer Settings
3. Find your Consumer Key and Consumer Secret
4. **Copy them exactly** as they appear (including special characters)
5. Compare with what you gave me:
   ```
   Consumer Key:    GlThzGgd42q6+p3rK54I3tt3wBQrChWK
   Consumer Secret: mnd3ISYKxS7stye7VxsPkhnxpJU=
   ```

### Step 2: Test Credentials with PesaPal Postman

This is the definitive way to check if credentials work:

1. Go to: https://documenter.getpostman.com/view/6715320/UyxepTv1
2. Look for "Auth/RequestToken" endpoint
3. Click "Run in Postman"
4. In Postman, find the RequestToken request
5. Set environment variables:
   - `consumer_key`: GlThzGgd42q6+p3rK54I3tt3wBQrChWK
   - `consumer_secret`: mnd3ISYKxS7stye7VxsPkhnxpJU=
6. Send the request
7. If it works, you'll get a token
8. If it fails with "invalid_api_credentials", the credentials are truly invalid

### Step 3: Verify Environment

1. In your PesaPal dashboard, find your credentials
2. Check which environment they're for:
   - If labeled "Sandbox" → they're for testing
   - If labeled "Live/Production" → they're for real payments

3. Our code uses **Sandbox**. If your creds are for Live, update this line in code:
   ```
   // Change from:
   https://cybqa.pesapal.com/pesapalv3
   
   // To:
   https://pay.pesapal.com/v3
   ```

### Step 4: Check Credential Status

In PesaPal dashboard:
- [ ] Are the credentials marked as "Active"?
- [ ] Have they been "Approved"?
- [ ] Are they "Enabled"?

If any show "Inactive" or "Disabled", they won't work.

---

## Solution Options

### Option A: Use Original Working Credentials

The original credentials were accepted by PesaPal:
```
Consumer Key:    N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC
Consumer Secret: nC8XtQjNgAaoTC2gL6M4bNJzAnY=
```

We can revert to these while you investigate the new ones.

### Option B: Regenerate Credentials

If the new credentials are expired:
1. Log into PesaPal dashboard
2. Go to API settings
3. Regenerate new credentials
4. Copy them exactly
5. Update in Vercel

### Option C: Switch Environment

If new credentials are for Live:
1. Update API URL in Vercel to Live endpoint
2. Or request Sandbox credentials instead

---

## Quick Test Questions

Answer these to help diagnose:

1. **Where did you get these new credentials?**
   - From PesaPal merchant dashboard directly?
   - From someone else?
   - Recently generated or old?

2. **Are they for Sandbox or Live?**
   - Sandbox (testing)
   - Live (real money)

3. **Do you have access to PesaPal dashboard?**
   - Yes
   - No

4. **When were they last used?**
   - Recently
   - Never
   - Long time ago

5. **Can you see them in PesaPal dashboard right now?**
   - Yes
   - No

---

## Recommended Next Step

**Test in PesaPal Postman Collection:**

This will tell us definitively if the credentials are valid or not:

1. Visit: https://documenter.getpostman.com/view/6715320/UyxepTv1
2. Test Auth/RequestToken with your credentials
3. Report the result:
   - ✅ Got token → Credentials are valid (different issue)
   - ❌ Invalid credentials error → Credentials are truly invalid

This is the best way to separate a "credentials invalid" problem from an "integration problem".

---

## If Credentials Are Invalid

Options:
1. Get new credentials from PesaPal (regenerate)
2. Revert to original working credentials for now
3. Contact PesaPal support if unsure

Let me know what the Postman test shows! 🚀

