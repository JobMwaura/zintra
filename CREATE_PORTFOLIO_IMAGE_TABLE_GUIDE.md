# CREATE PORTFOLIO PROJECT IMAGE TABLE

## Problem
The portfolio images endpoint is returning 503 because the `PortfolioProjectImage` table doesn't exist in your Supabase database.

## Solution: Create the table

### Steps:

1. **Go to Supabase Dashboard**
   - https://supabase.com → Open your `zintra` project
   - Click "SQL Editor" in the sidebar

2. **Run the SQL to create the table**
   - Copy the entire contents of `CREATE_PORTFOLIO_PROJECT_IMAGE_TABLE.sql`
   - Paste into the Supabase SQL Editor
   - Click "Run" (or Ctrl+Enter)

3. **Verify it worked**
   - You should see the verification query results showing the new table

4. **Test the feature**
   - Go to https://zintra-sandy.vercel.app
   - Log in as vendor
   - Portfolio → Add Project → Upload images → Click Finish
   - Should work now! ✅

## If Still Failing
- Check Vercel function logs for detailed error
- Share the console error message
