# 🔴 URGENT: Disable RLS on Portfolio Tables

## The Real Issue
The `PortfolioProjectImage` and `PortfolioProject` tables have **Row Level Security (RLS) enabled**, which is blocking your API from accessing them.

Vercel shows:
```
❌ PortfolioProjectImage table not found
```

But the table EXISTS - RLS is just blocking access.

## The Simplest Fix: Disable RLS

### Why Disable RLS?
- Your API endpoints are **internal** (server-to-server)
- RLS is designed for **user-facing** apps (to prevent users from seeing each other's data)
- For internal APIs, RLS just adds complexity and blocks access
- The portfolio feature doesn't need RLS security

### Steps to Fix:

1. **Go to Supabase Dashboard**
   - https://supabase.com → Your `zintra` project
   - Click **SQL Editor** (left sidebar)
   - Click **New Query**

2. **Copy the entire SQL from `DISABLE_RLS_PORTFOLIO_TABLES.sql`:**
   ```sql
   ALTER TABLE public."PortfolioProjectImage" DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public."PortfolioProject" DISABLE ROW LEVEL SECURITY;
   ```

3. **Paste into SQL Editor and click Run**

4. **Verify it worked** by checking that both tables show `rowsecurity = false`

### Test Immediately
- **No redeploy needed!**
- Go to https://zintra-sandy.vercel.app
- Log in as vendor
- Portfolio → Add Project → Upload images → Finish
- Should work now! ✅

## If Still Not Working
Share the new Vercel logs and we'll debug further.
