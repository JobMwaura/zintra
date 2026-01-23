# 🔍 RFQ Data Flow - Diagnostic Guide

Your RFQ was just created with ID: `22fe030d-836b-41a9-987f-1be378ec863d`

Let's verify where it went and where to find it.

---

## 📊 Data Flow After RFQ Creation

```
1. You (Buyer) filled DirectRFQPopup form
   ↓
2. Form submitted to DirectRFQPopup component (components/DirectRFQPopup.js)
   ↓
3. RFQ inserted into TWO tables:
   
   a) rfqs table (main RFQ record)
      - title, description, category, budget_range, location
      - user_id = your ID
      - status = 'submitted'
      
   b) rfq_requests table (direct request to vendor)
      - vendor_id = [vendor you sent it to]
      - project_title = title
      - project_description = description
      - status = 'pending'
      - created_at = now
   ↓
4. Success message shown with RFQ ID
   ↓
5. Page redirects to /my-rfqs (YOUR RFQs, as buyer)
   ↓
6. Form clears
```

---

## 🎯 Where to Find Your RFQ

### As Buyer (You)
**Location:** `/my-rfqs` page
**What you see:** All RFQs you created
**Table:** `rfqs` table with `user_id = your_id`
**Action:** After submission, you're redirected here

### As Vendor (Who received it)
**Location:** Vendor profile page → RFQ Inbox tab OR RFQ Widget
**What they see:** RFQs sent to them
**Table:** `rfq_requests` table with `vendor_id = [their_id]`
**Action:** They need to go to their profile to see it

---

## ✅ Checklist: Where Should the RFQ Appear?

### 1. **Your RFQs Page** (/my-rfqs)
- [ ] You're currently viewing this after submission (redirected)
- [ ] RFQ should appear in your list with title you entered
- [ ] Status should be "Submitted" or similar

### 2. **Vendor's Profile - RFQ Inbox Tab**
- [ ] Go to vendor profile (whoever you sent it to)
- [ ] Look for "RFQ Inbox" tab on left side
- [ ] RFQ should appear in the inbox list
- [ ] Status should be "Pending"

### 3. **Vendor's Profile - RFQ Widget**
- [ ] Same vendor profile page
- [ ] Scroll down to RFQ Activity widget
- [ ] Should show stats updated (total: +1, unread: +1, pending: +1)
- [ ] Recent RFQs should show your new RFQ

---

## 🔧 Database Verification (If Issues Arise)

### Check if RFQ was created in buyer's table (rfqs)
```sql
SELECT id, title, user_id, status, created_at 
FROM rfqs 
WHERE id = '22fe030d-836b-41a9-987f-1be378ec863d';
```
**Expected:** 1 row with your data ✅

### Check if direct request was created (rfq_requests)
```sql
SELECT id, rfq_id, vendor_id, project_title, status, created_at 
FROM rfq_requests 
WHERE rfq_id = '22fe030d-836b-41a9-987f-1be378ec863d';
```
**Expected:** 1 row with vendor_id = [vendor you sent to] ✅

### List all RFQs for a specific vendor
```sql
SELECT id, project_title, vendor_id, status, created_at 
FROM rfq_requests 
WHERE vendor_id = '[VENDOR_ID_HERE]'
ORDER BY created_at DESC LIMIT 10;
```
**Expected:** Your new RFQ should appear in this list ✅

---

## 🚨 Troubleshooting

### Issue: RFQ appears on /my-rfqs but not on vendor's profile

**Cause:** Vendor's profile not fetching from `rfq_requests` table

**Check:**
1. Go to vendor profile
2. Open DevTools (F12) → Console
3. Look for errors mentioning "RFQ" or "fetch"
4. Check if you're viewing the CORRECT vendor's profile
   - The one you sent the RFQ to must be the same

**Fix:**
- Hard reload: Ctrl+Shift+R
- Clear browser cache: Ctrl+Shift+Del
- Try another vendor's profile to verify widget works

---

### Issue: RFQ doesn't appear on /my-rfqs

**Cause:** Buyer profile not fetching from `rfqs` table or redirect failed

**Check:**
1. You should be on `/my-rfqs` page after submission
2. If redirect to `/my-rfqs` failed, you might still be on vendor profile
3. Manually navigate to `/my-rfqs` if needed

**Fix:**
- Manually go to `/my-rfqs`
- Hard reload page
- Check console for errors

---

### Issue: No errors but RFQ still not appearing

**Diagnostic Steps:**

1. **Check the status message**
   - Did it say "✅ Request sent successfully!"?
   - If it said error, check console for details

2. **Verify you sent it to a vendor**
   - DirectRFQPopup should only work on vendor profiles
   - Check you clicked from vendor profile, not elsewhere

3. **Check vendor ID**
   - What vendor did you send it to?
   - Is their profile accessible to you?
   - Do they have a valid ID?

4. **Run database query**
   - Search `rfq_requests` table for your RFQ ID
   - Verify vendor_id is correct
   - Verify created_at is recent

5. **Check browser console**
   - F12 → Console
   - Any red errors?
   - Any warnings about RFQ?

---

## 📍 Exact Steps to Verify

### Step 1: Confirm RFQ was created (as buyer)
1. After submission, you should be on `/my-rfqs`
2. Look for RFQ with ID `22fe030d-836b-41a9-987f-1be378ec863d`
3. ✅ **PASS:** Found in your RFQs list
4. ❌ **FAIL:** Not in list → See troubleshooting

### Step 2: Confirm vendor can see it (as vendor)
1. Switch to vendor account (whoever you sent to)
2. Go to their profile page
3. Look for RFQ Inbox tab on left side
4. Click to view inbox
5. ✅ **PASS:** See the RFQ you just sent
6. ❌ **FAIL:** Not in inbox → See troubleshooting

### Step 3: Confirm stats updated
1. Same vendor profile, scroll to RFQ Widget
2. Check stats card shows updated numbers
3. ✅ **PASS:** Total, Unread, Pending all increased by 1
4. ❌ **FAIL:** Stats not updated → See troubleshooting

---

## 🔄 Expected Data Structure

### What's in rfqs table (Your RFQ as buyer)
```javascript
{
  id: "22fe030d-836b-41a9-987f-1be378ec863d",
  title: "Your project title",
  description: "Your description",
  category: "Category you selected",
  budget_range: "Your budget",
  location: "Your location",
  user_id: "[YOUR_USER_ID]",
  status: "submitted",
  created_at: "2026-01-23T..."
}
```

### What's in rfq_requests table (Vendor's inbox)
```javascript
{
  id: "[some-uuid]",
  rfq_id: "22fe030d-836b-41a9-987f-1be378ec863d",
  vendor_id: "[VENDOR_YOU_SENT_TO]",
  project_title: "Your project title",
  project_description: "Your description",
  status: "pending",
  created_at: "2026-01-23T..."
}
```

---

## 🎯 Summary

| Where | What | Status |
|-------|------|--------|
| `/my-rfqs` | RFQ appears in buyer's list | ✅ Should show immediately |
| Vendor's RFQ Inbox Tab | RFQ in direct requests | ✅ Should show immediately |
| Vendor's Profile Widget | Stats updated, RFQ in recent | ✅ Should show immediately |

All three should work after submission completes successfully. If any don't appear, check the troubleshooting section above.

---

## Questions to Answer

1. **Which vendor did you send the RFQ to?**
   - Get their ID from URL when viewing their profile

2. **Can you see the RFQ on your `/my-rfqs` page?**
   - If yes → data insertion worked for buyer side
   - If no → something failed in RFQ creation

3. **Can the vendor see it in their inbox?**
   - If yes → everything working ✅
   - If no → vendor profile fetch issue or wrong vendor ID

4. **Any errors in console?**
   - Open F12 → Console
   - Share any red error messages

---

Report back with answers to the questions above, and I can help debug! 🚀
