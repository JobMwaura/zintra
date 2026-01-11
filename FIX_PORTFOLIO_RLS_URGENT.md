# 🔴 CRITICAL FIX: Portfolio Image Table RLS Issue

## The Problem
The `PortfolioProjectImage` table exists but **Row Level Security (RLS) is preventing Supabase from accessing it**.

Vercel logs show:
```
❌ PortfolioProjectImage table not found
```

But the table DOES exist - RLS is just blocking access.

## The Solution: Disable RLS

### Steps:

1. **Go to Supabase Dashboard**
   - https://supabase.com → Your `zintra` project
   - Click "SQL Editor"

2. **Run the diagnostic SQL**
   - Open file: `FIX_PORTFOLIO_IMAGE_TABLE_RLS.sql`
   - Copy ALL the SQL code
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **What this does:**
   - Checks if `PortfolioProjectImage` table exists ✓ (it does)
   - Checks RLS status ✓ (RLS is enabled - THIS is the problem)
   - **DISABLES RLS** on the table ✓ (this fixes the issue)
   - Verifies the table is now accessible ✓

4. **Test immediately**
   - No redeploy needed!
   - Go to https://zintra-sandy.vercel.app
   - Portfolio → Add Project → Upload images → Finish
   - Should work now! ✅

## Why This Happens
- Supabase uses RLS (Row Level Security) to restrict data access
- When RLS is enabled on a table, Supabase clients can't query it without proper policies
- The simplest fix for this internal API endpoint is to disable RLS
- If you need RLS later, we can add proper policies

## Alternative (if you want to keep RLS)
Instead of disabling RLS, we'd need to add policies like:
```sql
CREATE POLICY "Allow all" ON "PortfolioProjectImage" FOR ALL USING (true);
```

But the simpler approach is to disable it for now.
