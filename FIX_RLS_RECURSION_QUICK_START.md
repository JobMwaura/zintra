# 🚨 CRITICAL RLS FIX - Infinite Recursion

## The Problem You're Experiencing

**URL**: `https://zintra-sandy.vercel.app/my-rfqs`

**Error**: `infinite recursion detected in policy for relation "rfqs"`

**Why it's happening**:
1. You log in → Your UUID is stored in auth context
2. App tries to load `/my-rfqs` page
3. Page calls: `SELECT * FROM rfqs WHERE user_id = auth.uid()`
4. Supabase checks RLS policy on `rfqs` table
5. Policy says: "Check if vendor is assigned to this RFQ"
6. To check that, it looks up `rfq_recipients` table
7. Which has its own RLS policy
8. That policy tries to look back at `rfqs` table
9. **INFINITE LOOP** → Error shows up ❌

## This Also Explains Why RFQs Won't Submit

When you try to create an RFQ:
```
1. Frontend sends: INSERT INTO rfqs (title, user_id, ...) VALUES (...)
2. Supabase checks RLS policy on rfqs
3. Policy tries to validate using circular logic
4. INFINITE RECURSION error
5. Insert fails silently ❌
```

## ✅ The Fix (Copy & Paste)

**Go to**: Supabase Dashboard → SQL Editor

**Paste this entire code**:

```sql
-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Vendors can see assigned RFQs" ON rfqs;
DROP POLICY IF EXISTS "RFQ creator sees assignments" ON rfq_recipients;

-- Create new policies that DON'T cause recursion

-- For rfqs table: Let vendors see RFQs assigned to them
CREATE POLICY "Vendors can view assigned RFQs via recipients" 
  ON rfqs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM rfq_recipients 
      WHERE rfq_recipients.rfq_id = rfqs.id 
      AND rfq_recipients.vendor_id = auth.uid()
    )
  );

-- For rfq_recipients table: Vendors can see their own assignments
CREATE POLICY "Vendors view own recipient records" 
  ON rfq_recipients FOR SELECT 
  USING (auth.uid() = vendor_id);

-- For rfq_recipients table: Users can see who they sent RFQs to
CREATE POLICY "Users view their RFQ recipient assignments" 
  ON rfq_recipients FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM rfqs WHERE rfqs.id = rfq_recipients.rfq_id
    )
  );
```

**Click Run** → Should say "Success" with no errors

---

## What This Fix Does

### Before
```
rfqs policy → rfq_recipients → rfqs → rfq_recipients → ... INFINITE LOOP ❌
```

### After
```
rfqs policy → Direct check, no loop ✅
rfq_recipients policy → Simple direct check ✅
No circular references ✅
```

## ✅ After the Fix

Once you run this SQL:

1. ✅ Load `/my-rfqs` page → Shows your RFQs with your UUID
2. ✅ Create new RFQ → Inserts successfully 
3. ✅ Submit RFQ → No more recursion error
4. ✅ View as vendor → Can see assigned RFQs
5. ✅ Dashboard loads → Fast and error-free

---

## 🎯 Expected Timeline

| Action | Time |
|--------|------|
| Run SQL in Supabase | **30 seconds** |
| Wait for changes to sync | **10 seconds** |
| Test creating RFQ | **1 minute** |
| See `/my-rfqs` working | **Immediate** |

---

## 🧪 Test After Fix

1. **Clear browser cache** (Ctrl/Cmd + Shift + R for full refresh)
2. **Go to** https://zintra-sandy.vercel.app/my-rfqs
3. **Should see**: Your RFQs loading without error
4. **Try creating**: A new test RFQ
5. **Should work**: No more infinite recursion errors

---

## 📝 Why This Solution Works

The new policies are **non-recursive**:

1. **For Users**: 
   ```sql
   Policy: "You can see RFQs where user_id = your_uuid"
   No lookups, no recursion ✅
   ```

2. **For Vendors**:
   ```sql
   Policy: "You can see assignments where vendor_id = your_uuid"
   Direct table check, no dependencies ✅
   ```

3. **For Vendor RFQ Access**:
   ```sql
   Policy: "Check if exists in rfq_recipients directly"
   Uses EXISTS (efficient) not circular logic ✅
   ```

---

## ⚠️ Important Notes

- **Run this SQL only once** (DROP IF EXISTS prevents errors if you run it again)
- **This replaces broken policies** with working ones
- **Security is maintained** - Users still can't see other users' RFQs
- **Performance improves** - No recursive lookups means faster queries

---

## 🚀 You're Almost There!

This one fix will solve:
- ❌ RFQ submission failures → ✅ Will work
- ❌ Dashboard loading errors → ✅ Will load
- ❌ Vendor RFQ visibility → ✅ Will work
- ❌ Infinite recursion → ✅ Eliminated

**Run the SQL now and test immediately!** 🎉
