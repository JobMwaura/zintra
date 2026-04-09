# 🧪 RFQ System Testing Guide

Complete testing procedure to verify all RFQ system fixes are working end-to-end.

---

## Pre-Test Setup

### Requirements
- Access to vendor profile (e.g., "Narok Cement")
- Ability to send RFQs via DirectRFQPopup
- Browser Developer Tools (F12) for checking console

### Browser Console Setup
1. Open Developer Tools: **F12**
2. Go to **Console** tab
3. Keep it open during testing to catch any errors
4. Clear console before each test: `clear()`

---

## Test Case 1: Form Clearing After Submission

**Objective:** Verify DirectRFQPopup form clears after successful RFQ submission

### Steps

1. **Navigate to vendor profile**
   - Go to Narok Cement profile (or any vendor)
   - Click "Request for Quote" or similar button
   - Modal should open with blank form

2. **Fill in the form**
   ```
   Project Title: "Test Project 1"
   Description: "This is a test RFQ for verifying form clearing"
   Category: "Concrete Work" (or any category)
   Budget: "50,000"
   Location: "Nairobi" (or any county)
   Confirm: Check the checkbox
   ```

3. **Submit the RFQ**
   - Click "Send Request" button
   - Should see: ✅ "Request sent successfully! Redirecting..."
   - Modal should close automatically after ~800ms
   - Check Console: Should be NO error messages

4. **Reopen the modal immediately**
   - Click "Request for Quote" again
   - ✅ **PASS:** Form should be completely blank
   - ❌ **FAIL:** If form still shows "Test Project 1" or previous data

5. **Repeat the test**
   - Fill form with different data
   - Submit again
   - Reopen → should be blank again

### Expected Console Output
```javascript
✅ Request sent successfully! Redirecting...
// No "clearFormData is not defined" errors
// No undefined errors
```

### Success Criteria
- [ ] Form clears after submission
- [ ] No console errors
- [ ] Modal reopens with blank form every time

---

## Test Case 2: RFQ Appears in Vendor Inbox Tab

**Objective:** Verify RFQ sent via DirectRFQPopup appears in vendor's RFQ Inbox Tab

### Setup
- **As Buyer (Your account):** Send RFQ to Narok Cement
- **As Vendor (Narok Cement account):** Check inbox

### Steps

1. **Send RFQ as buyer**
   - Fill DirectRFQPopup with:
     ```
     Title: "New Test Construction RFQ"
     Description: "Testing RFQ inbox visibility"
     Category: "Building Construction"
     ```
   - Submit successfully
   - Note the creation timestamp (should be "just now")

2. **Switch to vendor account** (Narok Cement)
   - Log out of buyer account
   - Log in as Narok Cement vendor
   - Go to vendor dashboard

3. **Check RFQ Inbox Tab**
   - Navigate to vendor profile
   - Look for "RFQ Inbox" or similar tab on left side
   - Click to view inbox

4. **Verify RFQ appears**
   - ✅ **PASS:** Should see the RFQ you just sent
   - ✅ Title should be: "New Test Construction RFQ"
   - ✅ Should show as "Pending" or similar status
   - ✅ Should show current timestamp (or recent time)
   - ❌ **FAIL:** RFQ doesn't appear in inbox

### Detailed Checklist
- [ ] RFQ appears in inbox list
- [ ] RFQ shows correct title
- [ ] RFQ shows correct description
- [ ] RFQ shows correct status (pending)
- [ ] RFQ shows recent timestamp
- [ ] Can click RFQ to view details
- [ ] No console errors when loading inbox

### Expected Data
```javascript
{
  id: "xyz-abc-123",
  title: "New Test Construction RFQ",
  description: "Testing RFQ inbox visibility",
  status: "pending",
  created_at: "2024-01-15T10:30:00Z",
  category: "Building Construction",
  location: "Nairobi"
}
```

---

## Test Case 3: RFQ Appears on Vendor Profile Widget

**Objective:** Verify RFQ appears in the RFQ widget on vendor profile page

### Steps

1. **Send RFQ as buyer** (same as Test Case 2)
   - Submit RFQ to Narok Cement
   - Note the exact title

2. **View vendor profile as buyer**
   - **Important:** Still logged in as buyer
   - Go back to Narok Cement vendor profile
   - Scroll down to find RFQ widget section

3. **Check RFQ Widget Statistics**
   - Should show stats card with:
     - ✅ **Total:** Should be ≥1
     - ✅ **Unread:** Your new RFQ should count here
     - ✅ **Pending:** Should be ≥1
     - ✅ **With Quotes:** 0 (since vendor hasn't quoted yet)

4. **Check Recent RFQs List**
   - Below stats, should see "Recent RFQs" cards
   - ✅ **PASS:** Your RFQ should appear in this list
   - ✅ Should show title, type badge (Direct), timestamp
   - ❌ **FAIL:** Your RFQ doesn't appear in widget

### Expected Widget Display
```
┌─────────────────────────────┐
│  RFQ Activity               │
├─────────────────────────────┤
│ Total: 5  | Unread: 1       │
│ Pending: 2 | With Quotes: 3 │
├─────────────────────────────┤
│ Recent RFQs:                │
│                             │
│ [Direct] New Test Con...    │
│ Jan 15, 2024 • 10:30 AM    │
│                             │
│ [Direct] Roofing Project   │
│ Jan 14, 2024 • 3:45 PM     │
└─────────────────────────────┘
```

### Verification Checklist
- [ ] Stats card shows updated total
- [ ] Stats card shows unread count (1+)
- [ ] Stats card shows pending count (1+)
- [ ] Recent RFQs list includes your RFQ
- [ ] RFQ card shows "Direct" type badge
- [ ] RFQ card shows correct title
- [ ] RFQ card shows recent timestamp
- [ ] Can click RFQ card to view details

---

## Test Case 4: Multiple RFQs to Same Vendor

**Objective:** Verify system correctly handles multiple RFQs

### Steps

1. **Send 3 RFQs to Narok Cement**
   - Test 1: "Concrete Foundation Work"
   - Test 2: "Roof Installation"
   - Test 3: "Foundation Inspection"
   - Submit each one and verify form clears

2. **Check RFQ Inbox as Vendor**
   - Switch to Narok Cement account
   - Go to RFQ Inbox
   - ✅ **PASS:** Should see all 3 RFQs in list
   - ✅ Should be ordered by date (newest first)

3. **Check stats**
   - Total should be 3+ (counting previous RFQs)
   - All 3 new ones should be unread
   - All 3 should be pending

4. **Check profile widget**
   - As buyer, view vendor profile
   - RFQ widget should show updated stats
   - All 3 RFQs should be visible in recent list (or first 3)

### Verification Checklist
- [ ] All 3 RFQs appear in inbox
- [ ] All 3 RFQs appear in stats (or at least in unread/pending count)
- [ ] All 3 show in recent RFQs widget
- [ ] Order is correct (newest first)
- [ ] Each has correct title and info
- [ ] No duplicate entries
- [ ] No missing RFQs

---

## Test Case 5: Error Handling

**Objective:** Verify system gracefully handles errors

### Steps

1. **Try submitting without required fields**
   - Open DirectRFQPopup
   - Leave title blank
   - Click Submit
   - ✅ Should show error: "Please fill in all required fields"
   - ✅ Modal stays open

2. **Try submitting without category**
   - Fill title, description
   - Leave category blank
   - Click Submit
   - ✅ Should show error: "Please select a category"
   - ✅ Modal stays open

3. **Try selecting "Other" without specifying**
   - Select category: "Other"
   - Leave custom category blank
   - Click Submit
   - ✅ Should show error: "Please specify your category"
   - ✅ Modal stays open

4. **Check console for errors**
   - Perform all actions above
   - Open Developer Tools Console
   - ✅ Should see validation messages
   - ❌ Should NOT see JavaScript errors (red text)

### Verification Checklist
- [ ] Required field validation works
- [ ] Category validation works
- [ ] Custom category validation works
- [ ] Modal stays open on errors
- [ ] Form data preserved on validation error
- [ ] No JavaScript errors in console
- [ ] Error messages are clear

---

## Test Case 6: Database Verification

**Objective:** Verify data is correctly stored in Supabase

### Steps (Requires Supabase Access)

1. **After sending test RFQs**
   - Go to Supabase dashboard
   - Go to `rfq_requests` table
   - Verify entries exist with:
     - `vendor_id`: Narok Cement's ID
     - `project_title`: "New Test Construction RFQ"
     - `project_description`: Your description
     - `status`: "pending"
     - `created_at`: Recent timestamp

2. **Check for duplicates**
   - Filter by vendor_id = Narok Cement
   - Count total rows
   - Should match number of RFQs you sent

3. **Verify no orphaned records**
   - All `rfq_requests` should have valid vendor_id
   - All should have created_at timestamp

### SQL to verify
```sql
-- Count RFQs for Narok Cement
SELECT COUNT(*) FROM rfq_requests 
WHERE vendor_id = [narok_cement_id] 
AND created_at > NOW() - INTERVAL '1 day';

-- List recent RFQs
SELECT id, project_title, status, created_at 
FROM rfq_requests 
WHERE vendor_id = [narok_cement_id]
ORDER BY created_at DESC LIMIT 10;
```

---

## Summary Checklist

After completing all tests, verify:

- [ ] **Test 1 PASS:** Form clears after every submission
- [ ] **Test 2 PASS:** RFQs appear in vendor inbox
- [ ] **Test 3 PASS:** RFQs appear in profile widget
- [ ] **Test 4 PASS:** Multiple RFQs handled correctly
- [ ] **Test 5 PASS:** Error handling works
- [ ] **Test 6 PASS:** Data correctly stored in database
- [ ] **Console:** No errors or warnings
- [ ] **Performance:** Page loads quickly
- [ ] **UX:** All buttons responsive
- [ ] **Timestamps:** All dates/times correct

---

## Troubleshooting

### Issue: Form doesn't clear after submission

**Check:**
1. Form state is being reset in handleSubmit success block
2. No exceptions thrown between submission and form clear
3. Modal not being closed before form clears

**File to check:** `components/DirectRFQPopup.js` line 235

---

### Issue: RFQ not appearing in vendor inbox

**Check:**
1. Verify RFQ created in `rfq_requests` table (use Supabase)
2. Vendor_id matches vendor's actual ID
3. RFQInboxTab is querying `rfq_requests` table (not `rfq_recipients`)
4. Vendor logged in to correct account
5. Browser cache cleared (Ctrl+Shift+Del)

**Files to check:**
- `components/vendor-profile/RFQInboxTab.js` line 30-75
- Supabase `rfq_requests` table

---

### Issue: RFQ not appearing in vendor profile widget

**Check:**
1. Same as inbox checks above
2. `app/vendor-profile/[id]/page.js` fetching from `rfq_requests`
3. vendor_id correctly passed to query
4. Stats calculation logic correct

**File to check:** `app/vendor-profile/[id]/page.js` line 391-444

---

### Issue: Console shows JavaScript errors

**Common errors:**
- "clearFormData is not defined" → Check hook import in DirectRFQPopup
- "Cannot read property 'id'" → Check vendor object is defined
- "supabase.from() is not a function" → Check supabase client import

**Fix:**
1. Clear browser cache
2. Hard reload: Ctrl+Shift+R
3. Check browser console for specific error
4. Report error message for debugging

---

## Contact & Support

For issues or questions:
1. Check console for error messages
2. Verify all files were deployed correctly
3. Check recent commit history
4. Clear browser cache and hard reload
5. Try in private/incognito window

---

## Documentation References

- `RFQ_FIXES_COMPLETE_SUMMARY.md` - Overview of all fixes
- `RFQ_INBOX_ROOT_CAUSE_ANALYSIS.md` - Detailed root cause
- `BUG_FIXES_RFQ_ISSUES.md` - Bug fix details
