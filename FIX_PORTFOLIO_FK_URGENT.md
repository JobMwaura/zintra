# URGENT: Fix Portfolio Foreign Key Error (400 Bad Request)

## Problem
Portfolio project creation is failing with:
```
insert or update on table "PortfolioProject" violates foreign key constraint "PortfolioProject_vendorProfileId_fkey"
```

## Root Cause
- App uses `vendors.id` as the vendor identifier
- `PortfolioProject` foreign key references `VendorProfile` table
- These IDs don't match → constraint violation

## Solution: Fix Database Foreign Key

### Option 1: Using Supabase Dashboard (Recommended)

1. **Log in to Supabase Dashboard**
   - Go to https://supabase.com
   - Open your `zintra` project
   - Click "SQL Editor"

2. **Run the fix SQL**
   - Open `FIX_PORTFOLIO_FK_CONSTRAINT.sql` from this repo
   - Copy all the SQL code
   - Paste into Supabase SQL Editor
   - Click "Run"

3. **Verify it worked**
   - The constraint should now reference `vendors(id)` instead of `VendorProfile(id)`

### Option 2: Quick Fix (Drop constraint only)

If you just want to delete the constraint without recreating it:

```sql
ALTER TABLE public."PortfolioProject"
DROP CONSTRAINT IF EXISTS "PortfolioProject_vendorProfileId_fkey";
```

Run this in Supabase SQL Editor, then try uploading again.

## Test After Fix
1. Go to https://zintra-sandy.vercel.app
2. Log in as vendor
3. Go to Portfolio → Add Project
4. Upload images
5. Click "Finish" 
6. Should succeed ✅

## If Still Failing
Check browser console for detailed error message and share it.
