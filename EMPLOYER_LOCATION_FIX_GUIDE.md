# Fix: Missing 'location' Column in employer_profiles

## Error
```
Could not find the 'location' column of 'employer_profiles' in the schema cache
https://zintra-sandy.vercel.app/careers/onboarding
```

## Root Cause
The `employer_profiles` table is missing the `location` column that the `enableEmployerRole()` server action in `/app/actions/vendor-zcc.js` tries to insert.

When a vendor enables their employer role, the code attempts to set:
```javascript
location: companyData?.location || vendor?.location || '',
```

But the `location` column doesn't exist in the `employer_profiles` table schema.

## Solution
Run this SQL in Supabase SQL Editor to add the missing column:

```sql
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS location TEXT;
CREATE INDEX IF NOT EXISTS idx_employer_profiles_location ON employer_profiles(location);
```

## Steps to Fix

### 1. Open Supabase SQL Editor
- Go to [https://app.supabase.com](https://app.supabase.com)
- Select your Zintra project
- Click **SQL Editor** in the left sidebar
- Click **New Query**

### 2. Copy and Run the SQL
Copy the entire content from `FIX_EMPLOYER_LOCATION_COLUMN.sql` and paste it into the SQL editor.

### 3. Click **Run**
The migration will execute and add the `location` column to `employer_profiles`.

### 4. Verify Success
You should see output confirming the column was added. The onboarding flow will now work for vendors enabling their employer role.

## What This Fixes
✅ Vendors can now enable their employer role from the onboarding page
✅ Their location from the vendor profile auto-fills
✅ The employer_profiles table schema matches the application code

## Schema After Fix
The `employer_profiles` table will now have:
- `id` (UUID)
- `user_id` (UUID)
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
