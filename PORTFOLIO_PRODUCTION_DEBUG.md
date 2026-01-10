# 🔍 Portfolio Production Debug Guide

**Status:** Production app still showing 503 errors even after SQL migration

## Problem Analysis

Your Vercel app (zintra-sandy.vercel.app) is still getting:
```
POST https://zintra-sandy.vercel.app/api/portfolio/projects 503 (Service Unavailable)
Error: Portfolio feature is being set up. Please run the database migration: npx prisma migrate deploy
```

This means the **production database** (the one Vercel is connected to) doesn't have the `PortfolioProject` table yet.

---

## Root Cause

You likely ran the SQL migration in **one Supabase project**, but Vercel is connected to a **different Supabase project** (or the same one but needs a cache clear).

---

## Solution: Verify Vercel's Database Connection

### Step 1: Check Vercel Environment Variables

1. Go to **https://vercel.com/dashboard**
2. Select your **zintra** project
3. Click **Settings** → **Environment Variables**
4. Look for these variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Should be `https://zeomgqlnztcdqtespsjx.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` - Should be set
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Should be set

**If any are missing:**
- [ ] Copy them from your `.env.local` file
- [ ] Add them to Vercel Settings → Environment Variables
- [ ] Redeploy your app

### Step 2: Verify Vercel is using correct Supabase

The Vercel environment variables should point to: `zeomgqlnztcdqtespsjx.supabase.co`

Check your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://zeomgqlnztcdqtespsjx.supabase.co
```

**Is this the same project where you ran the SQL migration?** ✅ YES / ❌ NO

---

## Step 3: If Vercel is correct, Force Redeploy

1. Go to **https://vercel.com/dashboard**
2. Select **zintra** project
3. Click **Deployments**
4. Find the latest deployment (usually at top)
5. Click the **three dots menu** (...)
6. Click **Redeploy**
7. Wait for deployment to complete
8. Test the feature again

---

## Step 4: If Still Not Working - Manual Fix

If Vercel still shows 503 error:

### Option A: Direct Supabase Check (Recommended)

1. Go to **https://app.supabase.com**
2. Select your **zintra** project
3. Click **SQL Editor**
4. Run this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('PortfolioProject', 'PortfolioProjectImage');
```

**If tables exist:** 
- Your migrations ran successfully
- Issue is with Vercel caching or cold start
- Try: Hard refresh browser (Cmd+Shift+R) or redeploy

**If tables DON'T exist:**
- [ ] You ran migration in wrong Supabase project
- [ ] Copy `PORTFOLIO_MIGRATION_SAFE.sql` contents
- [ ] Paste in this project's SQL Editor
- [ ] Run it
- [ ] Redeploy Vercel

### Option B: Check API Logs in Vercel

1. Go to **https://vercel.com/dashboard**
2. Select **zintra** project
3. Click **Logs**
4. Submit a portfolio project
5. Look for error messages in logs
6. Check what database it's trying to connect to

---

## Step 5: Test Again

After redeploy:
1. Go to your vendor profile
2. Click **Portfolio** tab
3. Click **+ Add Project**
4. Fill in form and submit
5. Should save successfully ✅

---

## Quick Checklist

- [ ] Vercel environment variables include `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Vercel environment variables include `SUPABASE_SERVICE_ROLE_KEY`
- [ ] URL points to `zeomgqlnztcdqtespsjx.supabase.co`
- [ ] Verified tables exist in that Supabase project
- [ ] Vercel app redeployed after setting env vars
- [ ] Browser cache cleared (Cmd+Shift+R)
- [ ] Tables still don't exist - ran migration SQL again

---

## Most Likely Cause & Fix

**Most likely:** Vercel environment variables are missing or outdated.

**Quick fix:**
1. Copy all Supabase keys from `.env.local`
2. Add them to Vercel Settings → Environment Variables
3. Click "Redeploy" on latest deployment
4. Test again

---

## Still Stuck?

If you've done all steps above and still getting errors:

1. Check Vercel logs for actual error message
2. Verify table structure in Supabase:
   ```sql
   \d "PortfolioProject"
   ```
3. Confirm Vercel is using correct Supabase project URL
4. Make sure `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)

---

## Reference

| File | Purpose |
|------|---------|
| `.env.local` | Local development database config |
| Vercel Settings → Env Vars | Production database config |
| `PORTFOLIO_MIGRATION_SAFE.sql` | SQL to create tables |
| `api/portfolio/projects/route.js` | Backend checking for tables |
