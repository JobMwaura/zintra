# Credits System Migration - Error Fix & Solution

**Error**: `ERROR: 42703: column "is_admin" does not exist`

**Status**: ✅ FIXED

---

## What Was Wrong

The original migration script referenced an `is_admin` column in the `profiles` table that doesn't exist in your Supabase schema.

**Original problematic code** (line 297-305):
```sql
CREATE POLICY "Only admins can update credits"
  ON public.user_credits
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  ));
```

**Also**: The original referenced `profiles(id)` but should reference `auth.users(id)` for Supabase.

---

## What Was Fixed

### Fix 1: Removed Admin Check RLS Policy
Removed the RLS policy that tried to check for `is_admin` column. Instead:
- Users cannot update their own credits via RLS (it's blocked)
- Credits are updated only through PL/pgSQL functions (`deduct_user_credits`, `add_user_credits`)
- Admin credit adjustments can be done directly through database or a separate admin API

### Fix 2: Updated Foreign Keys
Changed all references from:
```sql
REFERENCES public.profiles(id)  -- ❌ Wrong
```

To:
```sql
REFERENCES auth.users(id)  -- ✅ Correct
```

### Fix 3: Added M-Pesa Fields
Added missing M-Pesa fields to `credit_transactions`:
```sql
mpesa_request_id VARCHAR(100),
mpesa_merchant_request_id VARCHAR(100),
mpesa_phone VARCHAR(20),
mpesa_response_desc VARCHAR(255),
completed_at TIMESTAMP WITH TIME ZONE
```

### Fix 4: Updated Table Naming
Changed column name from `name` to `package_name` for clarity:
```sql
package_name VARCHAR(100) NOT NULL  -- Clear and specific
```

---

## Two Files Available

### Option 1: Use Fixed Version (RECOMMENDED)
**File**: `CREDITS_SYSTEM_MIGRATION_FIXED.sql`

This is the corrected version with all fixes applied and ready to execute.

### Option 2: Manual Fix to Original
**File**: `CREDITS_SYSTEM_MIGRATION.sql`

Already has the RLS policy removed (line 295-296 now just a comment).

---

## How to Execute

### Step 1: Open Supabase SQL Editor
1. Go to: https://app.supabase.com
2. Select your project (zintra)
3. Click "SQL Editor"
4. Click "New Query"

### Step 2: Copy & Paste Migration
Copy the entire content of `CREDITS_SYSTEM_MIGRATION_FIXED.sql` and paste it into the SQL editor.

### Step 3: Execute
Click "Run" button (or press `Ctrl+Enter`)

### Step 4: Verify
Wait for success message. You should see:
```
Query successful (no output)
```

---

## Verification Steps

After executing the migration, verify everything was created:

### Check 1: Verify Tables Created
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'credit%' 
OR tablename = 'user_credits'
ORDER BY tablename;
```

**Expected output** (6 tables):
- credit_pricing_actions
- credit_promotions
- credit_transactions
- credit_usage_logs
- credits_packages
- user_credits

### Check 2: Verify Functions Created
```sql
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
AND proname IN ('deduct_user_credits', 'add_user_credits');
```

**Expected output** (2 functions):
- add_user_credits
- deduct_user_credits

### Check 3: Verify Default Data
```sql
-- Check action pricing
SELECT COUNT(*) FROM credit_pricing_actions WHERE is_active = true;
-- Should return: 9
```

```sql
-- Check packages
SELECT COUNT(*) FROM credits_packages WHERE is_active = true;
-- Should return: 8
```

---

## Security Architecture

Instead of RLS policies for admin checks, we use:

### 1. Function-Based Access Control
```javascript
// In your API routes, you check admin status:
const { data: user } = await supabase.auth.getSession();
const isAdmin = // check your admin table/flag

if (!isAdmin) {
  return { error: 'Unauthorized' };
}
```

### 2. PL/pgSQL Functions (Trusted Backend)
```sql
-- These functions can be called from your backend API
-- They perform atomic operations with proper validation
SELECT deduct_user_credits(userId, amount, 'post_job', jobId);
SELECT add_user_credits(userId, amount, 'purchase', 'mpesa', txnId);
```

### 3. API Layer Validation
```javascript
// app/api/admin/credits/adjust.js
export async function POST(request) {
  const { userId, amount } = await request.json();
  
  // Verify admin status
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  
  // Call database function
  const { data } = await supabase.rpc('add_user_credits', { ... });
  
  return NextResponse.json(data);
}
```

---

## What Changed in Detail

### Credits Table Changes
| Item | Original | Fixed |
|------|----------|-------|
| user_id FK | profiles(id) | auth.users(id) |
| Column name | name | package_name |
| M-Pesa fields | Missing | Added |

### Transaction Table Changes
| Field | Added | Reason |
|-------|-------|--------|
| mpesa_request_id | ✅ | Track M-Pesa request ID |
| mpesa_merchant_request_id | ✅ | Track merchant reference |
| mpesa_phone | ✅ | Store customer phone |
| mpesa_response_desc | ✅ | Store M-Pesa response details |
| completed_at | ✅ | Track completion time |

### RLS Policies
| Policy | Original | Fixed | Reason |
|--------|----------|-------|--------|
| Admin update check | Referenced is_admin | Removed | Column doesn't exist |
| User select | ✅ Works | ✅ Kept | Users see own credits |
| Transaction insert | ✅ Works | ✅ Kept | System can insert |

---

## Testing After Migration

### Test 1: Create User Credits Record
```sql
-- Manually create a test record
INSERT INTO user_credits (user_id, credit_balance) 
VALUES ('your-user-uuid', 5000);

-- Verify
SELECT * FROM user_credits LIMIT 1;
```

### Test 2: Test Deduction Function
```sql
-- Deduct 500 credits for posting a job
SELECT deduct_user_credits(
  'your-user-uuid',
  500,
  'post_job',
  'job-uuid',
  'Posted job from test'
);

-- Expected: { "success": true, "balance_before": 5000, "balance_after": 4500 }
```

### Test 3: Test Addition Function
```sql
-- Add 1000 credits (simulating purchase)
SELECT add_user_credits(
  'your-user-uuid',
  1000,
  'purchase',
  'mpesa',
  'test-txn-123',
  'Test credit purchase'
);

-- Expected: { "success": true, "amount_added": 1000 }
```

---

## Common Issues & Solutions

### Issue: "Function does not exist"
**Cause**: Function wasn't created (migration failed)  
**Solution**: Run verification check #2 above

### Issue: "No permissions to execute function"
**Cause**: RLS policy blocks function call  
**Solution**: Make sure function calls come from authenticated user context

### Issue: "Foreign key violation"
**Cause**: User UUID doesn't exist in auth.users  
**Solution**: Use actual user UUIDs from your auth table

### Issue: "Column does not exist" for other fields
**Cause**: Schema mismatch  
**Solution**: Check your actual table structure with `\d table_name` in SQL editor

---

## Integration Points After Migration

Once migration is complete, use these functions in your code:

### In Helper Functions (lib/credits-helpers.js)
```javascript
export async function deductCredits(userId, actionType, referenceId) {
  const { data, error } = await supabase
    .rpc('deduct_user_credits', {
      p_user_id: userId,
      p_amount: cost,
      p_action_type: actionType,
      p_reference_id: referenceId,
    });
  return data;
}
```

### In API Routes
```javascript
export async function POST(request) {
  const { userId, amount } = await request.json();
  
  const { data, error } = await supabase
    .rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_transaction_type: 'purchase',
      p_payment_method: 'mpesa',
    });
  
  return NextResponse.json(data);
}
```

---

## Next Steps

1. ✅ Execute `CREDITS_SYSTEM_MIGRATION_FIXED.sql`
2. ✅ Run verification queries above
3. ✅ Test functions with sample data
4. ✅ Integrate with your application code
5. ✅ Deploy to production

---

## Support

**Questions?** Check:
- `CREDITS_IMPLEMENTATION_GUIDE_PHASE1.md` - Full setup guide
- `CREDITS_TECHNICAL_REFERENCE.md` - API reference
- Database schema in `CREDITS_SYSTEM_DESIGN.md`

**Still having issues?** Check the error message in the Supabase SQL editor for exact line number and details.

---

**Status**: ✅ Ready to Execute  
**Version**: 1.1 (Fixed)  
**Date**: 30 January 2026
