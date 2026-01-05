# Vercel Environment Variable Fix - CRITICAL

**Status:** 🔴 ISSUE FOUND  
**Date:** January 5, 2026

---

## The Problem

From your screenshot, I can see:

```
PESAPAL_CONSUMER_SECRET
All Environments
```

**This is the issue!** ❌

It's set to **"All Environments"** which means:
- ✅ It's available in Preview deployments
- ✅ It's available in Development deployments
- ❌ **It's NOT available in Production** (where your app actually runs)

---

## The Solution

You need to change **each PESAPAL variable** to be scoped to **"Production"** only.

### Step-by-Step Fix:

#### Step 1: Edit PESAPAL_CONSUMER_SECRET

1. Click on the `PESAPAL_CONSUMER_SECRET` variable in your screenshot
2. Look for the environment selector (it currently shows "All Environments")
3. Click to change it
4. **Uncheck:** "Preview" and "Development"
5. **Check:** "Production" ONLY
6. Click "Save"

Expected result:
```
PESAPAL_CONSUMER_SECRET
Production  ✓
```

#### Step 2: Repeat for the other 3 variables

Do the **exact same thing** for:
- `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY`
- `NEXT_PUBLIC_PESAPAL_API_URL`
- `PESAPAL_WEBHOOK_URL`

Each should end up with:
```
Variable Name
Production  ✓
```

---

## Why This Matters

**Vercel Environment Scoping:**

| Scope | Meaning | Available To |
|-------|---------|--------------|
| Production | ✅ Live app | https://zintra-sandy.vercel.app |
| Preview | 📋 Pull request previews | https://zintra-xxxx.vercel.app |
| Development | 💻 Local development | `npm run dev` on your computer |
| All Environments | 🌍 All of the above | Everywhere |

Your PesaPal API requires:
- `PESAPAL_CONSUMER_SECRET` only in **Production** (server-side, never in Preview/Dev)
- `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY` can be **Production** (it's public anyway)
- `NEXT_PUBLIC_PESAPAL_API_URL` can be **Production**
- `PESAPAL_WEBHOOK_URL` should be **Production** (your live webhook URL)

---

## Visual Guide

### Current (WRONG) ❌
```
Environment Variables page shows:
┌─────────────────────────────────────────┐
│ PESAPAL_CONSUMER_SECRET                 │
│ All Environments                    ← WRONG
│ 'nC8XtQjNgAaoTC2gL6M4bNJzAnY='         │
└─────────────────────────────────────────┘
```

### After Fix (CORRECT) ✅
```
Environment Variables page shows:
┌─────────────────────────────────────────┐
│ PESAPAL_CONSUMER_SECRET                 │
│ Production                          ← CORRECT
│ 'nC8XtQjNgAaoTC2gL6M4bNJzAnY='         │
└─────────────────────────────────────────┘
```

---

## Quick Checklist

- [ ] Click `PESAPAL_CONSUMER_SECRET` variable
- [ ] Change from "All Environments" to "Production"
- [ ] Save
- [ ] Click `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY` variable
- [ ] Change from "All Environments" to "Production"
- [ ] Save
- [ ] Click `NEXT_PUBLIC_PESAPAL_API_URL` variable
- [ ] Change from "All Environments" to "Production"
- [ ] Save
- [ ] Click `PESAPAL_WEBHOOK_URL` variable
- [ ] Change from "All Environments" to "Production"
- [ ] Save

---

## After Saving Variables

Once you've updated all 4 variables to "Production":

### Step 1: Trigger a redeploy
1. Go to Vercel Dashboard → Deployments
2. Find the latest deployment
3. Click the "..." menu → "Redeploy"
4. Confirm the redeploy

### Step 2: Wait for deployment
- The redeploy will take 2-3 minutes
- Watch the logs to ensure it completes successfully

### Step 3: Clear browser cache
- Open https://zintra-sandy.vercel.app/subscription-plans
- Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to hard refresh
- This clears the browser cache and forces a fresh page load

### Step 4: Test the payment flow
1. Click "Subscribe Now" button
2. You should now see the PesaPal payment page (not an error)
3. Check Vercel function logs to see detailed credential status

---

## Verifying the Fix in Logs

After redeploy, test the payment and check Vercel logs:

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments" → latest → "Functions" tab
4. Click on the `POST /api/payments/pesapal/initiate` function
5. Look for log output that shows:

**Good (Fixed) ✅:**
```
PESAPAL_CONSUMER_SECRET: ✓ Set (nC8Xt...)
NEXT_PUBLIC_PESAPAL_CONSUMER_KEY: ✓ Set (N+hSP...)
NEXT_PUBLIC_PESAPAL_API_URL: ✓ Set (https://cyber...)
```

**Bad (Still Broken) ❌:**
```
PESAPAL_CONSUMER_SECRET: ❌ Not set
NEXT_PUBLIC_PESAPAL_CONSUMER_KEY: ❌ Not set
```

---

## Why This Happened

Vercel defaults new environment variables to **"All Environments"** for convenience. This works fine for public keys, but secret keys need to be restricted to Production for security.

Your code is already correct - it reads from `process.env.PESAPAL_CONSUMER_SECRET` which only exists in the Production environment (the server-side runtime where your API routes run).

---

## Expected Result After Fix

Once the variables are scoped to Production:

1. **Next.js** loads the variables from Vercel during deployment
2. **API route** (`/api/payments/pesapal/initiate`) receives the request
3. **getCredentials()** reads `process.env.PESAPAL_CONSUMER_SECRET` ✓ Found
4. **getAccessToken()** generates signature and gets bearer token ✓
5. **initiatePayment()** creates payment order at PesaPal ✓
6. **Browser** redirects to PesaPal payment page ✓
7. **Customer** can proceed with payment ✓

---

## Need Help?

If variables still don't appear after redeploy:

1. Try "Settings" → "Build Cache" → "Clear Cache"
2. Delete and re-add each variable from scratch
3. Ensure you're NOT using any template variables (no ${} syntax)
4. Check that values don't have accidental spaces at the beginning/end

---

## Summary

**Your issue is:** Environment variables scoped to "All Environments" instead of "Production"  
**The fix:** Change each variable to "Production" scope → Redeploy → Test  
**Expected time:** 5 minutes  
**Success indicator:** PesaPal payment page loads instead of error  

Let me know once you've made these changes and tested! 🚀

