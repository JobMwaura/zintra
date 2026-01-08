# 🧪 Quick Test Guide - Vendor Signup

## What Changed?

Two critical fixes applied:

1. **RLS Bug Fixed** - API now uses SERVICE_ROLE_KEY (not ANON_KEY)
   - File: `/app/api/vendor/create/route.js`
   
2. **UX Fixed** - Step 4 now shows contextual messages
   - File: `/app/vendor-registration/page.js`

---

## Test Steps (5 minutes)

### Step 1: New Email
```
Open vendor signup page
Email: testvendor_final_20250108@example.com
(Use brand NEW email - not tried before)
```

### Step 2: Fill Form
```
Step 1: Email + Password + Confirm
Step 2: Business info (name, description, etc.)
Step 3: Select categories
Step 4: 
  - If no extra fields needed → See "Profile Complete!"
  - If services/products needed → See form (fill them)
Step 5: Choose a plan
Step 6: Complete registration
```

### Step 3: Watch For Success
```
Console should show:
✅ Vendor profile created successfully!

Browser should show:
→ Redirected to /vendor-profile/[vendor-id]
```

### Step 4: Verify Database

**Check auth user exists:**
```sql
SELECT email FROM auth.users 
WHERE email = 'testvendor_final_20250108@example.com';
```
Expected: 1 row ✅

**Check vendor created:**
```sql
SELECT id, user_id, email, company_name FROM public.vendors 
WHERE email = 'testvendor_final_20250108@example.com';
```
Expected: 1 row ✅

---

## Expected Results

✅ **Success Scenario:**
```
Form submitted
→ Auth user created
→ Vendor record created (RLS allows it!)
→ Redirected to vendor profile page
→ Can see vendor details on profile
```

❌ **If Still Failing:**
```
Check console logs for:
- Exact error message
- Status code (400, 401, 403, 500?)
- Response from API
```

---

## What Was The Bug?

**Before Fix:**
```
User signup → Auth user created ✅
Vendor creation API → Uses ANON_KEY ❌
RLS policy check → auth.uid() = NULL (not authenticated)
Result: RLS blocks INSERT → Error 400
```

**After Fix:**
```
User signup → Auth user created ✅
Vendor creation API → Uses SERVICE_ROLE_KEY ✅
RLS policy check → auth.uid() = user_id (authenticated!)
Result: RLS allows INSERT → Vendor created ✅
```

---

## Key Points

🔴 **Never Skip This Test!**
- Must use completely NEW email
- Old emails have orphaned auth users
- Will get "user already registered" error

🟢 **What to Look For**
- Success message in console
- Vendor ID returned from API
- Redirect URL has vendor ID
- Both auth user AND vendor in database

🟡 **If Something's Wrong**
- Check browser console (F12)
- Look for exact error message
- Check Supabase tables
- Report error message + status code

---

## Questions During Test?

If you see an error:
1. Note the exact error message
2. Check status code (400, 401, 403, 500?)
3. Look in Supabase tables
4. Let me know what you see!

---

## Timeline
- Test execution: ~5 minutes
- Database check: ~2 minutes
- Report back: anytime

**Ready? Test now and let me know how it goes!** 🚀
