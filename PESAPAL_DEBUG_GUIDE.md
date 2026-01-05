# PesaPal Environment Variables Not Loading - Comprehensive Debug Guide

**Status:** 🔴 CREDENTIALS STILL NOT LOADING  
**Date:** January 5, 2026  
**Error:** "Server not configured: PesaPal credentials missing"

---

## Diagnosis Steps

### Step 1: Check the Debug Endpoint

I've created a debug endpoint that will show us exactly what environment variables your Vercel deployment can see.

1. **Visit this URL in your browser:**
   ```
   https://zintra-sandy.vercel.app/api/debug/pesapal-env
   ```

2. **You'll see a JSON response showing:**
   - Which PESAPAL variables are present
   - Their values (safely masked)
   - Which ones are missing
   - Total environment variable count

3. **Copy the entire JSON response and share it with me**

This will tell us definitively whether Vercel is loading the variables or not.

---

## Parallel Verification: Check Vercel Dashboard Again

While visiting the debug endpoint, also verify in Vercel dashboard:

### In Vercel Settings → Environment Variables

**Checklist:**

1. ✓ `PESAPAL_CONSUMER_SECRET`
   - [ ] Visible in the list
   - [ ] Click on it - what does the Environment column show?
   - [ ] Should show "Production" (not "All Environments", not "Preview", not "Development")

2. ✓ `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY`
   - [ ] Visible in the list
   - [ ] Environment: ____________ (write down what you see)

3. ✓ `NEXT_PUBLIC_PESAPAL_API_URL`
   - [ ] Visible in the list
   - [ ] Environment: ____________

4. ✓ `PESAPAL_WEBHOOK_URL`
   - [ ] Visible in the list
   - [ ] Environment: ____________

### Key Questions:

- Are all 4 variables visible?
- Do any of them still say "All Environments"?
- Do any show only "Preview" or "Development"?
- Do any appear grayed out or disabled?

---

## Possible Issues & Solutions

### Issue 1: Variables Still Set to "All Environments" ❌

**Symptom:** Dashboard shows "All Environments" instead of "Production"

**Fix:**
1. For each variable, click on it
2. Click the environment dropdown
3. Uncheck everything EXCEPT "Production"
4. Save
5. Redeploy

### Issue 2: Values Are Truncated or Hidden 🔒

**What You Might See:**
```
PESAPAL_CONSUMER_SECRET
Production
'nC8Xt...'  ← Hidden for security
```

**This is NORMAL** - Vercel hides secret values for security. The important thing is:
- The variable name appears
- It shows "Production"
- It shows as "Added" or similar status

### Issue 3: Variables Missing Entirely ❌

**What You Might See:**
```
Search results: No variables found
```

**If this happens:**
- Your variables weren't saved properly
- You need to re-add them from scratch

**Steps to re-add:**

1. Go to Settings → Environment Variables
2. Click "Add New" for each variable:

```
Variable: PESAPAL_CONSUMER_SECRET
Value: nC8XtQjNgAaoTC2gL6M4bNJzAnY=
Environment: Production ← IMPORTANT
```

```
Variable: NEXT_PUBLIC_PESAPAL_CONSUMER_KEY
Value: N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC
Environment: Production
```

```
Variable: NEXT_PUBLIC_PESAPAL_API_URL
Value: https://cybqa.pesapal.com/pesapalv3
Environment: Production
```

```
Variable: PESAPAL_WEBHOOK_URL
Value: https://zintra-sandy.vercel.app/api/webhooks/pesapal
Environment: Production
```

After adding each, click "Save".

### Issue 4: Vercel Project Settings Are Confusing

**Alternative: Use Vercel CLI**

If the dashboard is confusing, you can set variables via command line:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to your Vercel account
vercel login

# Set environment variables (you'll be prompted for project)
vercel env add PESAPAL_CONSUMER_SECRET
vercel env add NEXT_PUBLIC_PESAPAL_CONSUMER_KEY
vercel env add NEXT_PUBLIC_PESAPAL_API_URL
vercel env add PESAPAL_WEBHOOK_URL
```

### Issue 5: Deployment Not Using New Variables

**Symptoms:**
- Variables are in dashboard
- But API still says "credentials missing"

**Solution: Force a new deployment**

1. Go to Vercel Dashboard → Deployments
2. Find your latest deployment
3. Click the three dots (...) next to it
4. Click "Redeploy" (not "Promote")
5. Wait 2-3 minutes for the new deployment to complete
6. Hard refresh your browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### Issue 6: Build Cache Preventing Variable Loading

**Symptoms:**
- Variables are set correctly
- Deployment completes but variables still not available

**Solution: Clear build cache**

1. Vercel Dashboard → Settings → Build Cache
2. Click "Clear Build Cache"
3. Go to Deployments → Redeploy latest deployment
4. Wait for rebuild to complete

---

## Vercel Logs Inspection

To see what the actual error is in Vercel's runtime:

1. **Vercel Dashboard → Deployments → Latest Deployment**
2. **Click on "Functions" tab** (next to "Overview")
3. **Find:** `POST /api/payments/pesapal/initiate`
4. **Click on it**
5. **Look at the Logs section**

You should see our debug output:

```
🔐 PesaPal Credentials Check:
  - API URL: ✓ Set (https://cybqa...)
  - Consumer Key: ✓ Set (N+hSPBc...)
  - Consumer Secret: ✓ Set (length: 24)

🔍 All PESAPAL env vars: ['NEXT_PUBLIC_PESAPAL_CONSUMER_KEY', 'PESAPAL_CONSUMER_SECRET', ...]
✅ Credentials verified
```

**If you see "❌ Not set"** → The variable isn't reaching the deployment

---

## What the Debug Endpoint Will Show

When you visit `/api/debug/pesapal-env`, you'll see:

**Good (Working) ✅:**
```json
{
  "expectedVars": {
    "NEXT_PUBLIC_PESAPAL_CONSUMER_KEY": {
      "present": true,
      "preview": "N+hSPBc..."
    },
    "PESAPAL_CONSUMER_SECRET": {
      "present": true,
      "preview": "SET (length: 24)"
    },
    "NEXT_PUBLIC_PESAPAL_API_URL": {
      "present": true,
      "preview": "https://cybqa..."
    },
    "PESAPAL_WEBHOOK_URL": {
      "present": true,
      "preview": "https://zintra-sandy..."
    }
  },
  "debugInfo": {
    "allPresent": true
  }
}
```

**Bad (Missing) ❌:**
```json
{
  "expectedVars": {
    "PESAPAL_CONSUMER_SECRET": {
      "present": false,
      "preview": "NOT SET"
    }
  },
  "debugInfo": {
    "allPresent": false
  }
}
```

---

## Systematic Troubleshooting Flowchart

```
1. Visit /api/debug/pesapal-env
   ├─ All variables present?
   │  ├─ YES → Go to Step 2
   │  └─ NO → Variables not in dashboard or wrong environment
   │          Fix: Re-add with "Production" scope
   │          Then: Redeploy & test again
   │
2. Check Vercel Dashboard Environment Variables
   ├─ All 4 variables visible?
   │  ├─ NO → Add missing variables
   │  └─ YES → Go to Step 3
   │
3. Check environment scope
   ├─ All set to "Production"?
   │  ├─ NO → Change environment scope to Production
   │  └─ YES → Go to Step 4
   │
4. Check for syntax errors
   ├─ Variables have correct values?
   ├─ No extra spaces or quotes?
   │  ├─ NO → Fix and re-save
   │  └─ YES → Go to Step 5
   │
5. Redeploy
   ├─ Latest deployment is selected
   ├─ Click "Redeploy"
   ├─ Wait 2-3 minutes
   ├─ Hard refresh browser (Cmd+Shift+R)
   └─ Test payment flow again
```

---

## Quick Test Checklist

Once you think you've fixed it:

- [ ] Visited debug endpoint `/api/debug/pesapal-env`
- [ ] All 4 PESAPAL variables show `"present": true`
- [ ] Vercel dashboard shows all 4 variables with "Production" scope
- [ ] Redeployed latest deployment (last 5 minutes)
- [ ] Hard refreshed browser (Cmd+Shift+R)
- [ ] Tried subscribing to a plan
- [ ] No more "credentials missing" error

---

## What To Do Next

1. **First:** Visit `/api/debug/pesapal-env` and check the output
2. **Second:** Share the debug JSON output with me
3. **Third:** Tell me what you see in Vercel dashboard for each variable
4. **Then:** I can pinpoint the exact issue and provide a specific fix

---

## Common Vercel Gotchas

### Gotcha 1: Environment Selection

```
❌ WRONG: "All Environments" (default)
❌ WRONG: Only "Preview"
❌ WRONG: Only "Development"

✅ CORRECT: "Production" (what you need for live app)
```

### Gotcha 2: Variable Naming

```
❌ WRONG: pesapal_consumer_key (lowercase with underscore)
✅ CORRECT: NEXT_PUBLIC_PESAPAL_CONSUMER_KEY (exact name)
```

### Gotcha 3: Spaces in Values

```
❌ WRONG: " nC8XtQjNgAaoTC2gL6M4bNJzAnY= " (spaces around value)
✅ CORRECT: "nC8XtQjNgAaoTC2gL6M4bNJzAnY=" (no spaces)
```

### Gotcha 4: Missing Redeploy

```
❌ WRONG: Add variables, don't redeploy, expect them to work
✅ CORRECT: Add variables, redeploy, then they're available
```

### Gotcha 5: Browser Cache

```
❌ WRONG: Refresh normally (F5 or Cmd+R)
✅ CORRECT: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
```

---

## Next Steps

1. **Check debug endpoint** at `/api/debug/pesapal-env`
2. **Report what you see** - send me the JSON output
3. **Tell me** what the environment settings show in Vercel dashboard
4. **I'll provide** the specific fix based on your findings

We're very close - this should be solved within the hour! 🚀

