# Debug: Check Gigs in Database

## Issue
Gigs page shows empty: https://zintra-sandy.vercel.app/careers/gigs

## What the code is looking for
```sql
SELECT *
FROM listings
WHERE type = 'gig' 
  AND status = 'active'
ORDER BY created_at DESC
```

## Likely causes:
1. ❌ No gigs exist in database
2. ❌ Gigs exist but type is NOT 'gig'
3. ❌ Gigs exist and type='gig' but status is NOT 'active'
4. ❌ Gigs exist but employer_id relationship is broken

## SQL to diagnose:

### Check 1: How many listings total?
```sql
SELECT COUNT(*), type, status FROM listings GROUP BY type, status;
```

### Check 2: Show all gigs regardless of status
```sql
SELECT id, title, type, status, employer_id, created_at 
FROM listings 
WHERE type = 'gig'
ORDER BY created_at DESC;
```

### Check 3: Show active gigs
```sql
SELECT id, title, type, status, employer_id, created_at, 
       (SELECT company_name FROM employer_profiles WHERE id = listings.employer_id) as employer_name
FROM listings 
WHERE type = 'gig' AND status = 'active'
ORDER BY created_at DESC;
```

### Check 4: Check employer_profiles exist
```sql
SELECT COUNT(*) FROM employer_profiles;
```

## Expected Result
When vendor posts a gig, it should:
1. Insert into `listings` table
2. Set `type = 'gig'`
3. Set `status = 'active'` (default)
4. Set `employer_id` to the vendor's employer_profile.id
5. Fill in title, description, location, pay_min, start_date, etc.

## Next Steps
Run the SQL checks above to see:
- Are there ANY gigs in the database?
- Are they marked as type='gig'?
- Are they marked as status='active'?
- Is employer_id set correctly?
