# Debugging User Verification Badge Issue

## 🔍 What to Check

The issue is that your badge shows "Unverified Buyer" even after verifying your phone. Here are the steps to debug this:

### Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Open the Direct RFQ modal on vendor profile
4. Look for this log message:
   ```
   ✅ User profile fetched: {
     id: "your-user-id",
     phone_verified: true/false,  ← This should be TRUE
     email_verified: true/false,
     phone: "+254...",
     phone_number: "+254..."
   }
   ```

### Step 2: What Each Value Means

| Field | What It Means |
|-------|--------------|
| `phone_verified: true` | ✅ Your phone is verified - badge should be GREEN |
| `phone_verified: false` | ❌ Your phone is NOT verified - badge shows GRAY |
| `phone: null` | Phone number not saved |
| `phone_number: null` | Phone number not saved |

### Step 3: If phone_verified is FALSE

The system thinks your phone is NOT verified. This could be because:

1. **You haven't completed the OTP verification** 
   - Go to User Dashboard
   - Look for "Phone Verification" section
   - Enter your phone number and verify with OTP
   - You should see "Phone Verified" message

2. **The database wasn't updated after OTP verification**
   - Try verifying again
   - Check the console for error messages
   - If you see errors, contact support

3. **You verified during registration but skipped the final step**
   - Complete registration fully
   - Then go to dashboard to verify phone if needed

### Step 4: Manual Database Check (Advanced)

If you have Supabase admin access:

```sql
-- Check your user record
SELECT id, email, phone, phone_number, phone_verified, phone_verified_at
FROM users
WHERE email = 'acylantoi@gmail.com';
```

Expected output if verified:
```
| id | email | phone | phone_number | phone_verified | phone_verified_at |
|----|-------|-------|--------------|----------------|--------------------|
| xyz | acylantoi@gmail.com | +254... | +254... | true | 2025-12-26 ... |
```

---

## 🆘 How to Fix It

### Option 1: Verify from Dashboard (Easiest)

1. Sign in to your account
2. Go to User Dashboard (hamburger menu → Dashboard)
3. Find "Phone Verification" section
4. Enter your phone number (if not pre-filled)
5. Click "Send OTP"
6. Enter the 6-digit code you receive
7. Click "Verify"
8. You should see "✓ Phone verified successfully!"
9. Try the Direct RFQ again - badge should now be GREEN

### Option 2: Complete Registration

1. If you haven't finished registration, complete it with phone OTP verification
2. Fill out all required fields
3. Complete the phone OTP flow during registration

### Option 3: Clear Browser Cache

1. Clear your browser cache and cookies
2. Sign out completely
3. Sign in again
4. Try the Direct RFQ modal again

---

## ✅ Verification Checklist

After fixing, verify by:

1. ✅ Open Direct RFQ modal
2. ✅ Badge should say "Verified Buyer" in GREEN
3. ✅ Console shows `phone_verified: true`
4. ✅ Badge displays immediately (no "Checking status..." message for long)

---

## 📝 Additional Info

**What was fixed in this update:**
- Added loading state while fetching verification status
- Added debug logging to console to help troubleshoot
- Fixed logic to check actual `phone_verified` field from database
- Badge now updates properly when phone is verified

**What to do next:**
1. Check your User Dashboard for phone verification section
2. If not verified, click "Verify Phone" and complete OTP flow
3. Open Direct RFQ again - badge should show "Verified Buyer"
4. If still showing "Unverified", check the console logs (Step 1 above)

---

## 🆘 Need Help?

If you still see "Unverified Buyer" after checking:
1. Take a screenshot of the console logs from Step 1
2. Share the `phone_verified` value in the logs
3. Check if you actually went through phone OTP verification
4. If `phone_verified` is still false, you may need to verify your phone again
