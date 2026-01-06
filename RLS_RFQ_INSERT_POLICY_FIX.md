# Fix RLS Policies for RFQ Creation with SERVICE_ROLE

The issue is that the RLS policies on the `rfqs` table don't properly handle INSERT operations when using SERVICE_ROLE_KEY.

## Current Policies

```sql
-- This requires user authentication - blocks SERVICE_ROLE insert
CREATE POLICY "rfqs_insert" ON public.rfqs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- This allows SERVICE_ROLE but uses USING (not WITH CHECK)
CREATE POLICY "rfqs_service_role" ON public.rfqs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

## The Problem

- `rfqs_insert` policy requires `auth.uid() = user_id` which fails for SERVICE_ROLE
- `rfqs_service_role` policy has `USING` clause but not `WITH CHECK`
- For INSERT operations, Supabase evaluates the `WITH CHECK` clause
- If `WITH CHECK` is missing, the insert might be blocked

## The Solution

Replace the SERVICE_ROLE policy to include proper WITH CHECK for INSERT:

```sql
-- Drop old policy
DROP POLICY "rfqs_service_role" ON public.rfqs;

-- Create new policy with WITH CHECK for INSERT
CREATE POLICY "rfqs_service_role" ON public.rfqs 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

This ensures SERVICE_ROLE can insert without being blocked by the user authentication check.

## Alternative Fix (Simpler)

Create a separate INSERT policy for SERVICE_ROLE:

```sql
CREATE POLICY "rfqs_insert_service_role" ON public.rfqs 
  FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

## Run This SQL in Supabase

Execute in Supabase SQL Editor to fix the issue:

```sql
-- Fix RLS policy for RFQ insertion with SERVICE_ROLE
DROP POLICY IF EXISTS "rfqs_service_role" ON public.rfqs;

CREATE POLICY "rfqs_service_role" ON public.rfqs 
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

This will allow the API (which uses SERVICE_ROLE_KEY) to insert RFQs successfully.
