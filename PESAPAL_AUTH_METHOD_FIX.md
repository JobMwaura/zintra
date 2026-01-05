# 🔥 SECOND CRITICAL BUG FIX - Authentication Method

**Status:** 🔴 BUG FOUND & FIXED  
**Date:** January 5, 2026  
**Severity:** CRITICAL - Root cause of "Internal Server Error"

---

## The Real Problem

The `RequestToken` endpoint was using **GET** instead of **POST**!

### What PesaPal Actually Requires

From the official PesaPal API 3.0 documentation:

```
Endpoint: POST https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken
Method: POST (not GET)
Headers:
  Accept: application/json
  Content-Type: application/json

Body (JSON):
{
  "consumer_key": "your_key",
  "consumer_secret": "your_secret"
}
```

### What We Were Doing (WRONG)

```javascript
// ❌ WRONG - Using GET
const response = await fetch(`${url}/api/Auth/RequestToken`, {
  method: 'GET',  // ← WRONG!
  headers: {
    Authorization: `Bearer ${key}:${signature}:${timestamp}`,  // ← WRONG!
  },
});
```

**Why this failed:**
- PesaPal doesn't accept GET requests for this endpoint
- PesaPal doesn't accept signature-based auth for token requests
- It expects a simple POST with credentials in the body

### What We're Doing Now (CORRECT)

```javascript
// ✅ CORRECT - Using POST with JSON body
const response = await fetch(`${url}/api/Auth/RequestToken`, {
  method: 'POST',  // ← CORRECT!
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    consumer_key: key,
    consumer_secret: secret,  // ← CORRECT!
  }),
});
```

---

## What I Fixed

### File 1: `/app/api/payments/pesapal/initiate/route.js`

**Lines 51-81: getAccessToken() function**

Changed from:
- GET request with signature-based auth
- Authorization header with Bearer token format

To:
- POST request with JSON body
- Headers: Content-Type and Accept only
- Body contains consumer_key and consumer_secret

### File 2: `/app/api/webhooks/pesapal/route.js`

**Lines 44-71: getAccessToken() function**

Same changes applied:
- GET → POST
- Signature removal
- JSON body with credentials

---

## Why This Is The Real Issue

PesaPal has **two different authentication patterns**:

### Pattern 1: Token Request (Simple)
```
POST /api/Auth/RequestToken
Body: { consumer_key, consumer_secret }  ← Simple, no crypto
```

### Pattern 2: Other Endpoints (Complex)
```
GET /api/Transactions/GetTransactionStatus?orderTrackingId=...
Headers: Authorization: Bearer {token}  ← Uses token from Pattern 1
```

Our code was trying to use Pattern 2 (complex) for Pattern 1 (simple), which PesaPal rejected with "Internal Server Error".

---

## What Happens Now

### Before (WRONG) ❌
```
Browser: Click "Subscribe Now"
  ↓
API: Try GET /api/Auth/RequestToken with signature
  ↓
PesaPal: "What? No, that's wrong. I don't understand this request."
  ↓
Error: "Internal Server Error"
```

### After (CORRECT) ✅
```
Browser: Click "Subscribe Now"
  ↓
API: POST /api/Auth/RequestToken with { consumer_key, consumer_secret }
  ↓
PesaPal: "Great! Here's your token."
  ↓
API: Use token for other requests
  ↓
Success: Redirect to payment page
```

---

## What To Do Now

### Step 1: Wait for Deploy
Fix is already committed and pushed. Vercel will deploy within 1-2 minutes.

### Step 2: Hard Refresh
```
Cmd+Shift+R  (Mac)
Ctrl+Shift+R (Windows)
```

### Step 3: Test Payment Again
1. Go to subscription page
2. Click "Subscribe Now"
3. Expected results:
   - ✅ **BEST:** Redirect to PesaPal payment page
   - 🟡 **OK:** Different error (progress!)
   - ❌ **BAD:** Same "Internal Server Error"

### Step 4: Check Vercel Logs
If still getting error:
1. Vercel Dashboard → Deployments → Latest
2. Functions tab → POST /api/payments/pesapal/initiate
3. Look for our debug logs:
   - "🔐 PesaPal Credentials Check:" shows credentials loaded
   - "❌ PesaPal token request failed:" shows the actual error from PesaPal

---

## Debug Output You'll See

### If Token Request Succeeds ✅
```
🔐 PesaPal Credentials Check:
  - API URL: ✓ Set (https://cybqa...)
  - Consumer Key: ✓ Set (N+hSPBc...)
  - Consumer Secret: ✓ Set (length: 24)

✅ PesaPal token received
📋 Payment initiation request: { vendor_id, plan_name, amount, email }
✅ PesaPal order created: { redirect_url: "https://cybqa.pesapal.com/..." }
```

### If Token Request Still Fails ❌
```
🔐 PesaPal Credentials Check:
  - API URL: ✓ Set
  - Consumer Key: ✓ Set
  - Consumer Secret: ✓ Set

🔴 PesaPal token request failed: {
  status: 400,
  statusText: "Bad Request",
  error: "invalid_credentials"
}
```

If you see this, it means credentials are wrong (different issue).

---

## Timeline

| Step | Time |
|------|------|
| Fix deployed | Now - 1-2 min |
| You test | 1-2 min after deploy |
| We see logs | 1-2 min after test |
| Next action | Based on logs |

---

## Expected Success

When this is fixed, you should see:

1. Click "Subscribe Now" button ✓
2. Brief loading... ✓
3. Redirect to: `https://cybqa.pesapal.com/pesapaliframe/...` ✓
4. PesaPal payment page loads with payment methods ✓
5. You can select payment method and complete payment ✓

---

## Summary

| Issue | Was | Now |
|-------|-----|-----|
| HTTP Method | GET | POST ✅ |
| Auth Type | Signature-based | Direct credentials ✅ |
| Body | None | { consumer_key, consumer_secret } ✅ |
| Headers | Authorization: Bearer | Accept, Content-Type ✅ |
| Error | "Internal Server Error" | Should resolve ✅ |

---

## Test Now!

1. Hard refresh: `Cmd+Shift+R`
2. Go to: https://zintra-sandy.vercel.app/subscription-plans
3. Click: "Subscribe Now"
4. Tell me what happens!

🚀 This should be the final fix!

