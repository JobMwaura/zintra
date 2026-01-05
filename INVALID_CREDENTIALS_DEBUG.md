# PesaPal Invalid Credentials - Diagnostic Guide

**Status:** 🔴 Authentication Working, But Credentials Invalid  
**Date:** January 5, 2026  
**Error:** `invalid_api_credentials_provided`

---

## What This Error Means

```json
{
  "error": {
    "error_type": "authentication_error",
    "code": "invalid_api_credentials_provided",
    "message": "Invalid Access Token"
  }
}
```

**Translation:** PesaPal received our token request, but the credentials you provided are not valid in PesaPal's system.

---

## Possible Causes

### 1. Typo in Credentials ❌

When you entered the new credentials, there might be a typo:

```
Provided:
Consumer Key:    GlThzGgd42q6+p3rK54I3tt3wBQrChWK
Consumer Secret: mnd3ISYKxS7stye7VxsPkhnxpJU=

Check:
- No extra spaces at beginning/end
- Capitalization is correct
- All special characters (+, =, etc.) are correct
- No accidental character replacements
```

### 2. Credentials Are Expired ⏰

PesaPal credentials can expire if:
- Your merchant account is inactive
- Your account was reset
- The credentials were generated long ago

### 3. Wrong Credentials ❌

The credentials might be:
- From a different PesaPal account
- From a different environment (Live vs Sandbox)
- Not yet activated in PesaPal

### 4. Credentials for Wrong Environment 🌍

**Important:** Are these credentials for:
- **Sandbox?** (https://cybqa.pesapal.com/pesapalv3) - For testing
- **Live/Production?** (https://pay.pesapal.com/v3) - For real payments

Our code is currently set to use **Sandbox**. If your new credentials are for **Live**, they won't work!

---

## Verification Steps

### Step 1: Double-Check Your Credentials

Go back to wherever you got these credentials and verify:

```
GlThzGgd42q6+p3rK54I3tt3wBQrChWK
mnd3ISYKxS7stye7VxsPkhnxpJU=
```

Are these exactly correct? Copy them again character-by-character.

### Step 2: Verify in Vercel

1. Vercel Dashboard → Settings → Environment Variables
2. Click on `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY`
3. Check the value shows: `GlThzGgd42q6+p3rK54I3tt3wBQrChWK`
4. Look for any extra spaces before/after

5. Click on `PESAPAL_CONSUMER_SECRET`
6. Check the value shows: `mnd3ISYKxS7stye7VxsPkhnxpJU=`
7. Look for any extra spaces before/after

### Step 3: Check PesaPal Dashboard

1. Log in to your PesaPal merchant dashboard
2. Go to API settings/credentials section
3. Find your Consumer Key and Consumer Secret
4. Verify they match what you provided to us

### Step 4: Verify Environment

1. In PesaPal dashboard, which environment are the credentials for?
   - [ ] Sandbox (test environment)
   - [ ] Live/Production (real money)

2. Our code uses:
   ```
   NEXT_PUBLIC_PESAPAL_API_URL = https://cybqa.pesapal.com/pesapalv3
   ```
   This is **Sandbox**. If your credentials are for Live, they won't work!

---

## What To Do

### Option A: Use Original Working Credentials

If the original credentials were working, we can switch back:

```
Consumer Key:    N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC
Consumer Secret: nC8XtQjNgAaoTC2gL6M4bNJzAnY=
```

These were confirmed working earlier.

### Option B: Fix New Credentials

1. **Get correct credentials** from PesaPal dashboard
2. **Copy carefully** - no extra spaces
3. **Update in Vercel** - one character at a time if needed
4. **Verify they match** your PesaPal account
5. **Ensure they're for Sandbox** if using sandbox API URL

### Option C: Test Credentials with PesaPal

If you have the credentials but aren't sure if they work:

1. Go to PesaPal's Postman collection: https://documenter.getpostman.com/view/6715320/UyxepTv1
2. Test the Auth/RequestToken endpoint directly with your credentials
3. If it works in Postman, the credentials are valid
4. If it fails in Postman, the credentials are invalid

---

## Quick Verification Checklist

- [ ] Copied credentials exactly from PesaPal dashboard
- [ ] No extra spaces before/after the values
- [ ] Credentials are for **Sandbox** environment
- [ ] Updated both variables in Vercel
- [ ] Each variable shows "Production" environment in Vercel
- [ ] Redeployed the latest deployment
- [ ] Hard refreshed browser (Cmd+Shift+R)

---

## If You Want to Proceed with Original Credentials

The original credentials were working up until the API call. They're not expired. 

**Original:**
```
Consumer Key:    N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC
Consumer Secret: nC8XtQjNgAaoTC2gL6M4bNJzAnY=
```

If you want to revert:

1. Vercel Settings → Environment Variables
2. Update `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY` back to: `N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC`
3. Update `PESAPAL_CONSUMER_SECRET` back to: `nC8XtQjNgAaoTC2gL6M4bNJzAnY=`
4. Redeploy
5. Hard refresh and test

---

## Next Steps

Please verify:

1. **Are the credentials exactly as shown?** (copy/paste to confirm)
2. **Are they for Sandbox?** (or Live?)
3. **Do they work in PesaPal's Postman collection?**

Once you confirm these, we can either:
- Fix the credentials if there's a typo
- Update the API URL if they're Live credentials
- Use the original credentials if the new ones are invalid

Let me know! 🚀

