# SOLUTION: Fix Gigs That Were Created With Wrong Type

## The Problem
Your gigs were probably created BEFORE we fixed the code. At that time, the form was saving `type: 'job'` for everything, even when you selected "Gig".

## Solution 1: Update Existing Gigs in Database (RECOMMENDED)

If your gigs exist in the database but have `type = 'job'`, update them to `type = 'gig'`:

```sql
-- Update existing gigs to have correct type
UPDATE listings
SET type = 'gig'
WHERE job_type = 'gig' 
  AND type = 'job'
  AND status = 'active'
  AND employer_id IN (
    SELECT id FROM employer_profiles 
    WHERE company_name ILIKE '%narok%' OR company_name ILIKE '%cement%'
  );
```

After running this SQL:
- Go to https://zintra-sandy.vercel.app/careers/gigs
- Refresh the page (Ctrl+Shift+R for hard refresh)
- Your gigs should appear!

## Solution 2: Repost the Gigs (ALTERNATIVE)

If you want to post them again fresh:

1. Go to https://zintra-sandy.vercel.app/careers/employer/post-job
2. Click "Post a Job or Gig"
3. Fill in the details for the Plumber gig
4. For "Job Type", select **"Gig"** (important!)
5. Click Submit
6. Repeat for the Carpenter gig

With the code fix we made, they will now save with `type = 'gig'` and appear on the gigs page.

## Verification

After either solution, your gigs should:
- ✅ Appear on https://zintra-sandy.vercel.app/careers/gigs
- ✅ Appear on https://zintra-sandy.vercel.app/careers (ZCC home page)
- ✅ Appear on https://zintra-sandy.vercel.app/careers/employer/gigs (your dashboard)

## Why This Happens

The code had a bug:
```javascript
// BEFORE (WRONG)
type: 'job', // Always job for everything

// AFTER (FIXED)
type: formData.jobType === 'gig' ? 'gig' : 'job', // Correct type based on selection
```

This meant:
- User selects "Gig" for job type
- Form saves it with `type = 'job'` (WRONG)
- Gigs page queries for `type = 'gig'` (CORRECT)
- Gigs don't appear because types don't match

Now it's fixed, but old gigs need to be either updated in the database or reposted.
