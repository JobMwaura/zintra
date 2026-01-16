# 🔍 Vendor Profile Image Change Not Working - Diagnostic Guide

**Issue:** Cannot see or click the "Change" button to update vendor profile logo

---

## 🎯 Quick Diagnosis

The "Change" button only appears when **you own the vendor profile**. Let's check if the system recognizes you as the owner.

---

## 🔐 How Ownership Works

The system checks if you can edit the vendor profile using this logic:

```javascript
const canEdit = 
  currentUser EXISTS
  AND 
  (vendor.user_id === currentUser.id OR vendor.email === currentUser.email)
```

**Translation:**
1. ✅ You must be logged in
2. ✅ Your user ID must match the vendor's user_id
   OR your email must match the vendor's email

---

## 🐛 Common Issues

### **Issue 1: Not Logged In**

**Symptom:** No "Change" button visible

**Check:**
1. Look for profile icon/menu in top-right corner
2. If you see "Login" or "Sign Up", you're not logged in

**Solution:**
```
1. Click "Login" in top-right
2. Log in with your credentials
3. Navigate back to your vendor profile
4. "Change" button should now appear
```

---

### **Issue 2: Wrong Account**

**Symptom:** Logged in but no "Change" button

**Check:**
1. You're viewing someone else's vendor profile
2. You're logged in with different account than one that created vendor

**Solution:**
```
1. Click profile icon in top-right
2. Check which email is shown
3. Is this the email you used to create the vendor?
4. If NO: Log out and log in with correct account
5. If YES: Continue to Issue 3
```

---

### **Issue 3: User ID Mismatch**

**Symptom:** Logged in with correct email but still no "Change" button

**Cause:** The vendor's `user_id` field doesn't match your current user ID

**This happens when:**
- Vendor was created before user registration system
- Vendor was migrated from old database
- User account was recreated

**Solution:** Check browser console for debugging info

---

## 🔍 How to Debug

### **Step 1: Open Browser Console**

**On Mac:**
- Chrome/Edge: `Cmd + Option + J`
- Safari: `Cmd + Option + C` (enable Developer menu first)
- Firefox: `Cmd + Option + K`

**On Windows:**
- Press `F12` or `Ctrl + Shift + J`

---

### **Step 2: Look for "canEdit check" Log**

After opening console, refresh the page. Look for a log like this:

```javascript
🔐 canEdit check: {
  currentUser: "abc123-def456-...",      // Your user ID
  currentUserEmail: "you@example.com",   // Your email
  vendorUserId: "xyz789-...",            // Vendor's user_id
  vendorEmail: "vendor@example.com",     // Vendor's email  
  canEdit: false                         // The result
}
```

---

### **Step 3: Analyze the Output**

#### **Scenario A: currentUser is null/undefined**
```javascript
🔐 canEdit check: {
  currentUser: null,
  currentUserEmail: undefined,
  // ...
  canEdit: false
}
```

**Problem:** You're not logged in or session expired

**Solution:**
1. Log out completely
2. Clear browser cache
3. Log in again
4. Refresh vendor profile page

---

#### **Scenario B: vendorUserId doesn't match currentUser**
```javascript
🔐 canEdit check: {
  currentUser: "user-123",
  vendorUserId: "user-456",  // ⚠️ DIFFERENT!
  canEdit: false
}
```

**Problem:** User ID mismatch

**Solutions:**
- **If vendor was created by you:** Database needs update (contact support)
- **If vendor belongs to someone else:** You don't own this vendor
- **If you have multiple accounts:** Log in with the account that created the vendor

---

#### **Scenario C: vendorUserId is null, emails don't match**
```javascript
🔐 canEdit check: {
  currentUser: "user-123",
  currentUserEmail: "you@example.com",
  vendorUserId: null,              // ⚠️ No user_id
  vendorEmail: "other@example.com", // ⚠️ Different email
  canEdit: false
}
```

**Problem:** Vendor has no user_id and email doesn't match

**Solution:** Database update needed - vendor.user_id should be set to your user ID

---

#### **Scenario D: Everything matches but canEdit is still false**
```javascript
🔐 canEdit check: {
  currentUser: "user-123",
  currentUserEmail: "you@example.com",
  vendorUserId: "user-123",        // ✅ Matches!
  vendorEmail: "you@example.com",  // ✅ Matches!
  canEdit: false                   // ❌ Still false??
}
```

**Problem:** Logic error in canEdit calculation

**Solution:** This is a bug - report to development team with screenshot

---

## 🔧 Technical Fix (For Developers)

### **Fix Missing user_id**

If vendor has no `user_id` but you know the owner's email:

```sql
-- Find the user_id for the email
SELECT id FROM auth.users WHERE email = 'owner@example.com';

-- Update the vendor with the user_id
UPDATE vendors 
SET user_id = 'abc-123-user-id'
WHERE email = 'owner@example.com';
```

### **Fix Incorrect user_id**

If vendor has wrong `user_id`:

```sql
-- Update vendor's user_id to match current owner
UPDATE vendors 
SET user_id = 'correct-user-id'
WHERE id = 'vendor-id';
```

---

## 📋 Diagnostic Checklist

Run through this checklist in order:

- [ ] **I am logged in** (check top-right corner for profile icon)
- [ ] **I'm viewing MY vendor profile** (not someone else's)
- [ ] **My email matches vendor email** (check in database or profile settings)
- [ ] **Browser console shows canEdit = true** (refresh page and check)
- [ ] **"Change" button is visible** (below the logo/image)
- [ ] **"Change" button is clickable** (not disabled)

If ALL checked but still not working → Report as bug

---

## 🛠️ Step-by-Step Troubleshooting

### **Step 1: Verify You're Logged In**

```
1. Look at top-right corner of page
2. Do you see:
   ✅ Profile icon/name → You're logged in
   ❌ "Login" button → You're NOT logged in
3. If not logged in: Click "Login" and sign in
```

### **Step 2: Verify You're on YOUR Profile**

```
1. Check the URL: /vendor-profile/[id]
2. Check the company name shown
3. Is this your company?
   ✅ YES → Continue to Step 3
   ❌ NO → Navigate to YOUR vendor profile
```

### **Step 3: Check Browser Console**

```
1. Open browser console (F12 or Cmd+Option+J)
2. Refresh the page
3. Look for "🔐 canEdit check" log
4. Take screenshot of the log
5. Check values match your account
```

### **Step 4: Verify Database (Advanced)**

```sql
-- Check your user ID
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Check vendor record
SELECT id, user_id, email, company_name 
FROM vendors 
WHERE email = 'your@email.com' OR id = 'your-vendor-id';

-- Values should match!
```

### **Step 5: Test File Input**

If button appears but file picker doesn't open:

```
1. Right-click on page → Inspect
2. Find the hidden file input:
   <input type="file" accept="image/*" class="hidden" />
3. Remove the "hidden" class temporarily
4. Try clicking the visible input
5. If file picker opens → Button click handler issue
```

---

## 🎯 Common Solutions

### **Solution 1: Clear Cache and Re-login**

```bash
# On Mac
1. Open browser
2. Press Cmd + Shift + Delete
3. Select "All time" 
4. Check "Cached images and files"
5. Clear data
6. Go to zintra.com
7. Log out if logged in
8. Log in again
9. Navigate to vendor profile
```

### **Solution 2: Try Different Browser**

```
1. Open Chrome/Firefox/Safari (different from current)
2. Go to zintra.com
3. Log in
4. Navigate to your vendor profile
5. Check if "Change" button appears
6. If YES → Original browser has cache issue
7. If NO → Server-side issue
```

### **Solution 3: Check Network Tab**

```
1. Open browser DevTools (F12)
2. Go to "Network" tab
3. Refresh page
4. Look for vendor fetch request
5. Click on the request
6. Check "Response" tab
7. Verify user_id in vendor data matches your user
```

---

## 📞 When to Contact Support

Contact support if:

- ✅ You're logged in with correct account
- ✅ Browser console shows your user ID
- ✅ Vendor email matches your email
- ✅ But canEdit is still false
- ✅ Or button doesn't appear

**Include in support request:**
1. Screenshot of browser console showing "canEdit check" log
2. Your email address
3. Vendor profile URL
4. Browser and version
5. Steps you've already tried

---

## 🔍 Expected Behavior

When everything is working correctly:

```
1. Navigate to YOUR vendor profile
2. You're logged in
3. Below the logo/image, you see: [Change] button
4. Button is white/light background, not disabled
5. Click button → File picker opens
6. Select image → Upload starts
7. Button shows "..." during upload
8. Image updates on page
9. Button returns to "Change"
```

---

## 📊 Debug Output Examples

### **✅ WORKING (canEdit = true)**

```javascript
🔐 canEdit check: {
  currentUser: "a1b2c3d4-...",
  currentUserEmail: "john@example.com",
  vendorUserId: "a1b2c3d4-...",        // ✅ MATCHES
  vendorEmail: "john@example.com",      // ✅ MATCHES
  canEdit: true                         // ✅ SUCCESS
}
```
**Result:** "Change" button appears ✅

---

### **❌ NOT WORKING (not logged in)**

```javascript
🔐 canEdit check: {
  currentUser: null,                    // ❌ NOT LOGGED IN
  currentUserEmail: undefined,
  vendorUserId: "a1b2c3d4-...",
  vendorEmail: "john@example.com",
  canEdit: false
}
```
**Solution:** Log in

---

### **❌ NOT WORKING (wrong account)**

```javascript
🔐 canEdit check: {
  currentUser: "xyz789-...",            // ❌ DIFFERENT USER
  currentUserEmail: "jane@example.com", // ❌ DIFFERENT EMAIL
  vendorUserId: "a1b2c3d4-...",
  vendorEmail: "john@example.com",
  canEdit: false
}
```
**Solution:** Log in with john@example.com

---

### **❌ NOT WORKING (user_id mismatch - database issue)**

```javascript
🔐 canEdit check: {
  currentUser: "a1b2c3d4-...",
  currentUserEmail: "john@example.com",
  vendorUserId: "old-user-id-xyz",      // ❌ OLD/WRONG ID
  vendorEmail: "john@example.com",      // ✅ Email matches
  canEdit: false                        // ❌ user_id takes precedence
}
```
**Solution:** Database needs update - vendor.user_id should be "a1b2c3d4-..."

---

## 🎉 Summary

**The "Change" button appears when:**
1. ✅ You're logged in
2. ✅ Your user ID matches vendor.user_id
3. ✅ OR your email matches vendor.email (if user_id is null)

**To debug:**
1. Open browser console
2. Refresh page
3. Check "🔐 canEdit check" log
4. Compare values
5. Follow solutions above

**Most common issue:** Not logged in or viewing someone else's profile

---

**Last Updated:** January 16, 2026  
**Added:** Debug logging to help diagnose ownership issues
