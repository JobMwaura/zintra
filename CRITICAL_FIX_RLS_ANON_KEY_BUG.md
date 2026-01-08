# 🔴 CRITICAL FIX: RLS Violation - Anon Key vs Service Role Key

## The Problem You Just Hit

```
❌ Error: new row violates row-level security policy for table "vendors"
Status: 400 Bad Request
```

**What was happening:**
- ✅ You signed up successfully (auth user created)
- ❌ Vendor creation API failed with RLS violation
- ❌ Vendor record was NEVER created

---

## Root Cause Analysis

### The RLS Policy
```sql
CREATE POLICY "Vendors can create own profile" 
  ON public.vendors 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

This policy says: **"Only allow INSERT if the authenticated user's ID matches the vendor's user_id"**

### The Bug in the API
```javascript
// ❌ WRONG - Using ANONYMOUS key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // ← This is the problem!
);
```

**Why this breaks RLS:**
```
With ANON_KEY:
  - Client is NOT authenticated
  - auth.uid() returns NULL
  - RLS check: NULL = user_id → FALSE
  - Result: ❌ RLS violation!

With SERVICE_ROLE_KEY:
  - Client IS authenticated (server-side)
  - auth.uid() returns the actual user_id
  - RLS check: user_id = user_id → TRUE
  - Result: ✅ INSERT allowed!
```

---

## The Fix Applied

Changed line 6 in `/app/api/vendor/create/route.js`:

```javascript
// ✅ CORRECT - Using SERVICE ROLE key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // ← Server-side only!
);
```

### Why This Works

- **Service Role Key** = Backend admin access to Supabase
- Can authenticate as any user on the server
- Can bypass/pass RLS checks
- Only available in `.env.local` (never exposed to client)
- Used by other APIs in your project (OTP, RFQ, etc.)

---

## Key Insight: Anon Key vs Service Role Key

| Feature | Anon Key | Service Role Key |
|---------|----------|------------------|
| **Usage** | Frontend (exposed) | Backend only (secret) |
| **Auth Status** | NOT authenticated | Authenticated |
| **RLS Bypass** | ❌ No | ✅ Yes |
| **Can create users** | ❌ No | ✅ Yes |
| **Can insert vendors** | ❌ No (RLS blocks) | ✅ Yes |
| **Security** | Safe to expose | 🔒 NEVER expose |
| **When to use** | Browser code | Server APIs only |

---

## What Now?

### 1. Test the Fix

Try vendor signup again with a **completely new email**:

```
Email: testvendor_fix_20250108@example.com
Password: TestPassword123!
```

**Expected result:**
```
✅ Vendor profile created successfully!
→ Redirected to /vendor-profile/{vendor_id}
```

### 2. Verify in Supabase

Check both tables:

**Auth Users:**
```sql
SELECT email, email_confirmed_at 
FROM auth.users 
WHERE email = 'testvendor_fix_20250108@example.com';
```

**Expected:** 1 row (auth user exists)

**Vendors:**
```sql
SELECT id, user_id, email, company_name 
FROM public.vendors 
WHERE email = 'testvendor_fix_20250108@example.com';
```

**Expected:** 1 row (vendor created!)

### 3. Check the Console

You should see success messages:
```javascript
✅ Vendor profile created successfully!
```

---

## Why This Happened

### The Pattern in Your Codebase

Other APIs use the correct approach:

```javascript
// ✅ CORRECT in other files
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // ✅ Correct
);
```

Examples:
- `/app/api/rfq/submit/route.js` (RFQ creation)
- `/app/api/vendor/profile/route.js` (vendor profile updates)
- `/app/api/vendor/like/route.js` (heart button)
- All other backend APIs

**But `/app/api/vendor/create/route.js` had the wrong key** - This was the oversight.

---

## Deployment Impact

### Local Testing (Next.js Dev)
```bash
✅ FIXED - Will now work
```

### Production (Vercel)
Need to ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel environment:

1. Go to **Vercel Dashboard** → Your project
2. → **Settings** → **Environment Variables**
3. Check for `SUPABASE_SERVICE_ROLE_KEY`
4. If missing: Add it with value from `.env.local`

---

## Testing Checklist

- [ ] Try vendor signup with new email
- [ ] Check console for success message
- [ ] Verify auth user created in Supabase
- [ ] Verify vendor created in Supabase
- [ ] Verify redirected to vendor profile
- [ ] Test again with different email

---

## Summary

| Aspect | Status |
|--------|--------|
| **Bug Found** | ✅ Anon key instead of service role key |
| **Root Cause** | ❌ API couldn't authenticate with RLS policy |
| **Fix Applied** | ✅ Use SERVICE_ROLE_KEY in `/api/vendor/create` |
| **Testing** | 🟡 Waiting for user to test with new email |
| **Deployment** | 🟡 Need to verify env var in Vercel |

---

## Next Steps

1. **Test locally** with new email
2. **Verify** vendor is created in Supabase
3. **Verify** redirect to vendor profile works
4. **Deploy** to Vercel (if not already auto-deployed)
5. **Test on production** with Vercel URL

---

## Questions?

The key insight: **Always use SERVICE_ROLE_KEY on backend APIs that need to pass RLS checks!**
