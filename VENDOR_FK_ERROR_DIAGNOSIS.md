# 🔧 VENDOR_ID FOREIGN KEY ERROR - DIAGNOSIS & FIX

## The Error You're Getting
```
insert or update on table "rfq_requests" violates foreign key constraint "rfq_requests_vendor_id_fkey"
```

## What This Means
The `vendor_id` value you're trying to insert (usually `vendor.id` from the vendors table) doesn't exist in the table that the foreign key references.

## Root Cause - Most Likely Scenario
The foreign key constraint on `rfq_requests.vendor_id` is pointing to the **wrong table**. It might be pointing to:
- ❌ `auth.users.id` (which would require a user ID)
- ❌ Some other table that doesn't have the vendor's ID

But it **should point to**:
- ✅ `public.vendors.id` (the vendor's profile ID)

---

## STEP-BY-STEP FIX

### Step 1: Diagnose the Current Constraint
Copy and run this in Supabase SQL Editor:

```sql
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public' 
  AND table_name = 'rfq_requests';
```

**Look for**: Lines with `vendor_id` or `rfq_requests_vendor_id_fkey`

---

### Step 2: See What the Constraint References
Copy and run this:

```sql
SELECT 
  tc.constraint_name,
  kcu.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'rfq_requests'
  AND tc.constraint_type = 'FOREIGN KEY';
```

**Look for**:
- If it shows `vendors | id` → ✅ CORRECT (no fix needed)
- If it shows `auth.users | id` → ❌ WRONG (needs fixing)
- If it shows something else → ❌ WRONG (needs fixing)

---

### Step 3: If It's Wrong, Run This Fix

**Option A: Simple Replace**
```sql
-- Drop the wrong constraint
ALTER TABLE public.rfq_requests
DROP CONSTRAINT IF EXISTS rfq_requests_vendor_id_fkey;

-- Add the correct constraint
ALTER TABLE public.rfq_requests
ADD CONSTRAINT rfq_requests_vendor_id_fkey
FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;
```

**Option B: If Constraint Has Different Name**
Replace `rfq_requests_vendor_id_fkey` with the actual constraint name from Step 1:
```sql
ALTER TABLE public.rfq_requests
DROP CONSTRAINT IF EXISTS [YOUR_CONSTRAINT_NAME];

ALTER TABLE public.rfq_requests
ADD CONSTRAINT rfq_requests_vendor_id_fkey
FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;
```

---

### Step 4: Verify the Fix
```sql
SELECT 
  tc.constraint_name,
  kcu.table_name,
  kcu.column_name,
  ccu.table_name AS references,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'rfq_requests';
```

**Expected Output**:
- vendor_id should reference `vendors | id` ✅

---

## Alternative: If vendors Table Doesn't Exist

If Step 1 shows the vendors table doesn't exist, run:

```sql
-- Create vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  email text,
  phone text,
  location text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);

-- Then add the foreign key
ALTER TABLE public.rfq_requests
ADD CONSTRAINT rfq_requests_vendor_id_fkey
FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;
```

---

## Testing the Fix

After applying the SQL:

1. Go to vendor profile
2. Click "Request Quote"
3. Fill in the form
4. Click Submit
5. Should see ✅ **"Request sent successfully!"** instead of the FK error

---

## Still Having Issues?

1. **Run the diagnostic SQL from Step 2** - Copy the full output
2. **Check that vendors table has data** - Run: `SELECT COUNT(*) FROM public.vendors;`
3. **Verify the vendor_id value exists** - Get a vendor ID from: `SELECT id FROM public.vendors LIMIT 1;`
4. **Try inserting directly** - Test if FK works: `INSERT INTO rfq_requests (rfq_id, vendor_id, user_id) VALUES (...)`
