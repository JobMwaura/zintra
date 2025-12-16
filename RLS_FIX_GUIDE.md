# Fix: RLS Policy Error for Quote Submission

## Problem
When vendors try to submit quotes, they get this error:
```
❌ Error submitting quote: new row violates row-level security policy for table "rfq_responses"
```

## Root Cause
The `rfq_responses` table has Row Level Security (RLS) enabled in your Supabase database, but there are no policies that allow vendors to insert their own quote responses. RLS blocks all operations by default unless a policy explicitly allows them.

## Solution
We need to create RLS policies that:
1. ✅ Allow vendors to **INSERT** their own quote responses
2. ✅ Allow vendors to **VIEW** their own responses
3. ✅ Allow vendors to **UPDATE** their own responses
4. ✅ Allow RFQ creators to **VIEW** all responses to their RFQs

## Implementation Steps

### Step 1: Open Supabase Dashboard
Go to https://app.supabase.com → Select your project → SQL Editor

### Step 2: Run the RLS Policy Fix
Open the file: `supabase/sql/FIX_RFQ_RESPONSES_RLS.sql`

Copy the entire SQL script and paste it into Supabase SQL Editor, then run it.

**What this script does:**
- Enables RLS on `rfq_responses` table
- Drops any existing policies (to avoid conflicts)
- Creates 4 new policies:
  - `Vendors can insert their own responses` - Allows INSERT
  - `Vendors can view their own responses` - Allows SELECT for own responses
  - `Vendors can update their own responses` - Allows UPDATE for own responses
  - `RFQ creators can view responses to their RFQs` - Allows RFQ creators to see all responses

### Step 3: Verify the Fix
After running the script, verify the policies were created:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'rfq_responses';

-- Check policies exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'rfq_responses';
```

Expected output:
```
rowsecurity = true
policyname = "Vendors can insert their own responses"
policyname = "Vendors can view their own responses"
policyname = "Vendors can update their own responses"
policyname = "RFQ creators can view responses to their RFQs"
```

### Step 4: Test Quote Submission
1. Log in as a vendor
2. Go to `/post-rfq` marketplace
3. Click "View & Quote" on any public RFQ
4. Fill out the quote form and submit
5. Should see ✅ "Quote submitted successfully"

## Policy Details

### Policy 1: Insert Policy
```sql
EXISTS (
  SELECT 1 FROM public.vendors
  WHERE vendors.id = rfq_responses.vendor_id
  AND vendors.user_id = auth.uid()
)
```
- Checks that the `vendor_id` belongs to the current logged-in user
- Only allows inserting responses for their own vendor profile

### Policy 2 & 3: SELECT/UPDATE Policies  
Vendors can:
- See and edit their own responses
- RFQ creators can see all responses to their RFQs (via separate policy)

## Security Notes
✅ **Secure by default** - Vendors can only insert/edit their own responses
✅ **No data leakage** - Vendors can't see other vendors' responses
✅ **Creator visibility** - RFQ creators can see all responses to review them
✅ **Attribute-based access** - Uses `auth.uid()` and vendor ownership checks

## If You Still Get Errors

If you still see RLS errors after running the script, check:

1. **Is the vendor profile created?**
   ```sql
   SELECT id, user_id, company_name FROM public.vendors WHERE user_id = auth.uid();
   ```
   If empty, the vendor needs to complete vendor registration first.

2. **Is auth.uid() working?**
   The Supabase client must be authenticated and passing the user session correctly.

3. **Clear browser cache**
   - Log out
   - Clear cookies/cache
   - Log back in
   - Try again

## Next Steps
Once RLS is fixed, quotes should submit successfully and appear in the RFQ details page when we build it.
