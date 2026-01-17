# Fix: Missing Columns in employer_profiles

## Errors
```
Could not find the 'location' column of 'employer_profiles' in the schema cache
Could not find the 'user_id' column of 'employer_profiles' in the schema cache
```

## Root Cause
The `employer_profiles` table is missing two columns:
1. **user_id** - Required to link employer profiles to auth users
2. **location** - Required to store and auto-fill the employer's business location

When a vendor enables their employer role, the code attempts to set both columns, but they don't exist in the table schema.

## Solution
Run this SQL in Supabase SQL Editor to add the missing column.

## Steps to Fix

### 1. Open Supabase SQL Editor
- Go to [https://app.supabase.com](https://app.supabase.com)
- Select your Zintra project
- Click **SQL Editor** in the left sidebar
- Click **New Query**

### ⚠️ IMPORTANT: Do NOT run the full DATABASE_SCHEMA.sql
The `DATABASE_SCHEMA.sql` file contains RLS policies and other tables that may already exist. Running the full file will cause errors like:
```
ERROR: 42710: policy "users_read_own_profile" for table "profiles" already exists
```

### 2. Copy and Run ONLY the FIX migration
**Copy ONLY these 4 lines of SQL** (from `FIX_EMPLOYER_LOCATION_COLUMN.sql`):

```sql
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS location TEXT;
CREATE INDEX IF NOT EXISTS idx_employer_profiles_user_id ON employer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_location ON employer_profiles(location);
```

Paste these exactly into the SQL editor.

### 3. Click **Run**
The migration will execute and add the `location` column to `employer_profiles`.

### 4. Verify Success
You should see a success message. The onboarding flow will now work for vendors enabling their employer role.

## What This Fixes
✅ Vendors can now enable their employer role from the onboarding page
✅ Their location and user_id from the vendor profile auto-fills correctly
✅ The employer_profiles table schema matches the application code
✅ User queries by user_id work correctly

## Schema After Fix
The `employer_profiles` table will now have:
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID) ← **NEW**
- `company_name` (TEXT)
- `company_registration` (TEXT)
- `verification_level` (TEXT)
- `company_phone` (TEXT)
- `company_email` (TEXT)
- `county` (TEXT)
- `location` (TEXT) ← **NEW**
- `company_logo_url` (TEXT)
- `company_description` (TEXT)
- `jobs_posted` (INT)
- `gigs_posted` (INT)
- `total_hires` (INT)
- `rating` (DECIMAL)
- `vendor_id` (UUID) - from VENDOR_INTEGRATION_SCHEMA
- `is_vendor_employer` (BOOLEAN) - from VENDOR_INTEGRATION_SCHEMA
- `updated_at` (TIMESTAMP)

## Related Files
- `/app/actions/vendor-zcc.js` - Uses this column in `enableEmployerRole()` function
- `/app/careers/onboarding/page.js` - Triggers the error when vendor enables employer role
- `/DATABASE_SCHEMA.sql` - Original schema definition (should be updated to include location)
