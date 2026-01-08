# ⚡ URGENT ACTION: RLS Policy Verification

## RIGHT NOW - Do This in 2 Minutes

### Step 1: Go to Supabase
```
https://app.supabase.com
→ Select your "Zintra" project
→ Click "SQL Editor" (left sidebar)
```

### Step 2: Run This Query
```sql
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;
```

### Step 3: Look at Results

**You should see policies like:**
- `See approved vendors`
- `Vendors can create own profile` ← **THIS ONE MUST EXIST**
- `Vendors see own profile`
- `Vendors update own profile`

**If you DON'T see "Vendors can create own profile":**
- This is 100% your problem
- Go to Step 4 immediately

### Step 4: Create the Missing Policy

Copy & paste this into SQL Editor:

```sql
CREATE POLICY "Vendors can create own profile" 
  ON public.vendors FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

Click **Run** (Ctrl+Enter)

You should see: `CREATE POLICY` ✅

### Step 5: Verify It Worked

Run the query from Step 2 again.

Now you should see "Vendors can create own profile" in the results ✅

---

## Then - Test Signup

### Use a NEW Email (Critical!)
```
Email: testvendor_[todaysdate]@example.com
Example: testvendor_jan08@example.com

Password: TestPassword123!
```

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for logs starting with:
   - `🔹 VENDOR SIGNUP DEBUG:`
   - `✅ Validation passed:`
   - `📡 Supabase response:`

### Expected Console Logs
```
🔹 VENDOR SIGNUP DEBUG: {
  email: "testvendor_jan08@example.com",
  emailLength: 26,
  hasAtSign: true,
  hasDot: true,
  passwordLength: 14,
  confirmPasswordMatches: true
}

✅ Validation passed, calling auth.signUp()...

📡 Supabase response: {
  hasError: false,
  errorMessage: undefined,
  hasData: true,
  userId: "abc-123-def-456"  ← Should see a user ID here
}
```

### If You See Success
- Vendor form completes
- Redirects to `/vendor-profile/{id}`
- Check Supabase vendors table
- Vendor record should exist! ✅

### If Still Getting Error
- Note the exact error message
- Tell me what you see in console
- We'll debug from there

---

## Why This Fixes It

```
Before (RLS policy missing):
  Auth user created ✅
  Vendor INSERT attempt → RLS blocks it ❌
  Vendor not created ❌
  User stuck ❌

After (RLS policy exists):
  Auth user created ✅
  Vendor INSERT attempt → RLS allows it ✅
  Vendor created ✅
  User redirected to profile ✅
```

---

## Do This NOW

⏱️ **Expected time: 2 minutes**

1. Open Supabase SQL Editor
2. Run the SELECT query to check policies
3. If "Vendors can create own profile" missing:
   - Run the CREATE POLICY SQL
4. Test vendor signup with new email
5. Check console logs
6. Come back and tell me if it worked!

**This is the most likely cause of your issue.** 🎯
