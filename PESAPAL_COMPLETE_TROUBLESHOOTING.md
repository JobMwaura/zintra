# Complete PesaPal Credentials Troubleshooting

**Status:** 🔴 Invalid Credentials - Need Complete Verification  
**Date:** January 5, 2026

---

## Step-by-Step Diagnosis

### STEP 1: Verify Current Vercel Settings (DO THIS FIRST)

Go to **Vercel Dashboard → Settings → Environment Variables**

For **NEXT_PUBLIC_PESAPAL_CONSUMER_KEY**:
1. Click on it
2. Look at the value field
3. **Write down exactly what you see** (screenshot would be helpful)
4. Is it: `GlThzGgd42q6+p3rK54I3tt3wBQrChWK` ?
5. Are there any backticks, spaces, or other characters?

For **PESAPAL_CONSUMER_SECRET**:
1. Click on it
2. Look at the value field
3. **Write down exactly what you see**
4. Is it: `mnd3ISYKxS7stye7VxsPkhnxpJU=` ?
5. Are there any backticks, spaces, or other characters?

---

### STEP 2: Check Your PesaPal Account

**This is critical** - You need to verify these credentials actually exist in PesaPal:

1. **Log into PesaPal merchant dashboard**
2. **Find Settings or API/Developer section**
3. **Look for "Consumer Key" and "Consumer Secret"**
4. **Copy them exactly** (don't type manually)
5. **Tell me what you see**

Are they:
- [ ] `GlThzGgd42q6+p3rK54I3tt3wBQrChWK` and `mnd3ISYKxS7stye7VxsPkhnxpJU=`
- [ ] Different from above (if so, what are they?)
- [ ] Can't find them (need to generate new ones?)

---

### STEP 3: Test Credentials Directly

Use PesaPal's official test tool to verify the credentials work:

1. **Go to:** https://documenter.getpostman.com/view/6715320/UyxepTv1
2. **Find "Auth → RequestToken"**
3. **Click "Try It"**
4. **Enter your Consumer Key** as the value for `consumer_key`
5. **Enter your Consumer Secret** as the value for `consumer_secret`
6. **Click "Send"**

**If it works in Postman:**
- Credentials are valid ✓
- Issue is in our Vercel setup

**If it fails in Postman:**
- Credentials are invalid ✗
- Need new credentials from PesaPal

---

### STEP 4: Simple Option - Use Original Credentials

We know these worked earlier (at least past the authentication stage):

```
Consumer Key:    N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC
Consumer Secret: nC8XtQjNgAaoTC2gL6M4bNJzAnY=
```

Would you like to:
- [ ] **Revert to original credentials** (quick test to confirm system works)
- [ ] **Debug new credentials** (if you need to use these specific ones)

---

## Quickest Path Forward

**Option A: Revert to Original (5 minutes)**

1. Vercel Settings → Environment Variables
2. Change `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY` to: `N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC`
3. Change `PESAPAL_CONSUMER_SECRET` to: `nC8XtQjNgAaoTC2gL6M4bNJzAnY=`
4. Redeploy
5. Hard refresh and test

This will tell us if the system works (it did earlier) or if there's a different issue.

**Option B: Fix New Credentials (varies)**

1. Copy fresh credentials from PesaPal dashboard
2. Paste them in Vercel without any extra characters
3. Make absolutely sure no backticks
4. Redeploy
5. Test in Postman first to verify they work
6. Then test in your app

---

## What I Need From You

To help you effectively, please tell me:

1. **What do you see when you open Vercel Environment Variables?**
   - Screenshot would be best

2. **Do you have access to your PesaPal merchant account?**
   - Can you log in and find the credentials?

3. **Are these new credentials definitely for Sandbox?**
   - Or are they for Live/Production?

4. **Would you like to:**
   - [ ] Revert to original credentials (quick)
   - [ ] Fix the new credentials (if you must use them)

---

## The Most Likely Issue

Given the error, one of these is probably true:

1. **Backticks are included** in the Vercel value
   - ❌ `mnd3ISYKxS7stye7VxsPkhnxpJU=` (with backticks)
   - ✅ mnd3ISYKxS7stye7VxsPkhnxpJU= (without backticks)

2. **Extra spaces** at beginning or end
   - ❌ ` mnd3ISYKxS7stye7VxsPkhnxpJU= ` (spaces around)
   - ✅ mnd3ISYKxS7stye7VxsPkhnxpJU= (no spaces)

3. **Credentials are invalid** in PesaPal
   - Need new ones from PesaPal dashboard

4. **Wrong environment** - Sandbox vs Live
   - Credentials for Live but we use Sandbox URL

---

## Next Action

**Please do this RIGHT NOW:**

1. **Screenshot or tell me exactly what's in Vercel** for both variables
2. **Log into PesaPal** and find the actual credentials there
3. **Tell me if they match**

Then I can give you the exact fix! 🎯

