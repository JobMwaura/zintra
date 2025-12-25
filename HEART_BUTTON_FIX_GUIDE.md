# Heart Button Fix - Vendor Profile Likes RLS Issue

## Problem
Users got "new row violates row-level security" error when clicking the heart button on vendor profiles.

## Solution

### 1. Created API Endpoint (/api/vendor/like)
- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS checks
- Validates user JWT token from Authorization header
- Safely inserts/deletes likes on backend
- Handles like and unlike operations

### 2. Updated Frontend (vendor-profile/[id]/page.js)
- Changed from direct Supabase calls to API endpoint
- Properly passes bearer token in Authorization header
- Better error handling

### 3. Fixed SQL Migrations
- Added `DROP POLICY IF EXISTS` statements to VENDOR_PROFILE_LIKES_AND_VIEWS.sql
- Allows SQL to be re-run without conflicts

## How to Run Migrations

### Option A: Use the CLEAN version (Recommended)
```sql
-- Run this in Supabase SQL Editor:
-- /supabase/sql/VENDOR_PROFILE_LIKES_AND_VIEWS_CLEAN.sql
```
This will:
- Drop existing tables and functions
- Recreate everything fresh
- No policy conflicts

### Option B: Use the regular version
```sql
-- Run this in Supabase SQL Editor:
-- /supabase/sql/VENDOR_PROFILE_LIKES_AND_VIEWS.sql
```
This will:
- Drop and recreate policies
- Keep existing data
- Requires that DROP POLICY IF EXISTS statements work

## Testing the Fix

1. Log in as a regular user (not vendor)
2. Browse vendors
3. Click the heart button on a vendor profile
4. Should toggle like/unlike without errors

## Commits
- 99b44a5: Create /api/vendor/like endpoint
- 91d6467: Add DROP POLICY IF EXISTS statements

## Files Modified
- ✅ app/api/vendor/like/route.js (NEW - 121 lines)
- ✅ app/vendor-profile/[id]/page.js (updated handleLikeProfile)
- ✅ supabase/sql/VENDOR_PROFILE_LIKES_AND_VIEWS.sql (added DROP statements)
