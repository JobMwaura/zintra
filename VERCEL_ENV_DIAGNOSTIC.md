# 🔧 DIAGNOSTIC: Environment Variable Verification

**Issue:** Credentials set in Vercel but not being loaded by the API

---

## ✅ Verification Checklist

### In Vercel Dashboard, Check These Exactly:

1. **Go to:** https://vercel.com/dashboard
2. **Select project:** zintra-sandy
3. **Go to:** Settings → Environment Variables

### You Should See 4 Variables Listed:

```
✓ NEXT_PUBLIC_PESAPAL_CONSUMER_KEY = N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC
✓ PESAPAL_CONSUMER_SECRET = nC8XtQjNgAaoTC2gL6M4bNJzAnY=
✓ NEXT_PUBLIC_PESAPAL_API_URL = https://sandbox.pesapal.com/api/v3
✓ PESAPAL_WEBHOOK_URL = https://zintra-sandy.vercel.app/api/webhooks/pesapal
```

### Check the Environment Column

Each variable should have:
- ✅ `Production` checked (or at least one environment selected)

If they're greyed out or not checked, that's the problem!

---

## 🔍 Common Issues

### Issue 1: Environment Not Selected
**Problem:** Variable saved but `Production` not checked
**Fix:** 
1. Click variable
2. Make sure `Production` is checked
3. Click Save

### Issue 2: Variable Syntax
**Problem:** Extra spaces or typos
**Fix:**
1. Delete the variable
2. Re-add it carefully
3. Copy-paste from below (no extra spaces!)

```
NEXT_PUBLIC_PESAPAL_CONSUMER_KEY
PESAPAL_CONSUMER_SECRET
NEXT_PUBLIC_PESAPAL_API_URL
PESAPAL_WEBHOOK_URL
```

### Issue 3: Not Redeployed After Adding
**Problem:** Variables added but deployment not redeployed
**Fix:**
1. Go to Deployments
2. Click latest deployment
3. Click "Redeploy"
4. Wait for green checkmark

### Issue 4: Vercel Cache
**Problem:** Old deployment cached
**Fix:**
1. Go to Settings
2. Scroll to "Build Cache"
3. Click "Clear Build Cache"
4. Redeploy

---

## 🚀 Complete Reset Process

If still not working, do this:

### Step 1: Clear Everything
```
Settings → Build Cache → Clear Build Cache
```

### Step 2: Remove Old Variables
```
Settings → Environment Variables
Delete all PESAPAL* variables
```

### Step 3: Re-Add Fresh
```
Add each variable one by one:
1. NEXT_PUBLIC_PESAPAL_CONSUMER_KEY
2. PESAPAL_CONSUMER_SECRET  
3. NEXT_PUBLIC_PESAPAL_API_URL
4. PESAPAL_WEBHOOK_URL

Make sure each has "Production" checked
```

### Step 4: Redeploy
```
Deployments → Click latest → Redeploy
Wait 3-5 minutes for green checkmark
```

### Step 5: Hard Refresh
```
https://zintra-sandy.vercel.app/subscription-plans
Press: Ctrl+Shift+R (or Cmd+Shift+R)
Test: Click Subscribe Now
```

---

## 📸 Screenshot Guide

**Settings → Environment Variables should look like:**

```
┌─────────────────────────────────────────────────────┐
│ Name                           Value         Env    │
├─────────────────────────────────────────────────────┤
│ NEXT_PUBLIC_SUPABASE_URL       https://...   ✓ Prod │
│ NEXT_PUBLIC_SUPABASE_ANON_KEY  eyJ...        ✓ Prod │
│ SUPABASE_SERVICE_ROLE_KEY      eyJ...        ✓ Prod │
│ NEXT_PUBLIC_PESAPAL_CONSUMER_KEY N+hSP...   ✓ Prod │
│ PESAPAL_CONSUMER_SECRET        nC8X...       ✓ Prod │
│ NEXT_PUBLIC_PESAPAL_API_URL    https://...   ✓ Prod │
│ PESAPAL_WEBHOOK_URL            https://...   ✓ Prod │
└─────────────────────────────────────────────────────┘
```

Each row should have a checkmark in the Env (Environment) column!

---

## 🆘 If Still Broken

Tell me:
1. Can you see the 4 PESAPAL variables in Settings?
2. Are they marked as `Production`?
3. Can you see the values (not blank)?
4. Have you redeployed since adding them?

---

**Complete the reset above and let me know!** ✅

