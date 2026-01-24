# 🧪 RFQ Inbox Enhancement - Testing Guide

## ✅ Pre-Deployment Checklist

### Code Verification
- [x] No TypeScript/ESLint errors
- [x] All imports correct
- [x] State variables initialized
- [x] All RFQ types handled in color config
- [x] Filter tabs include all 5 types
- [x] Deduplication logic correct
- [x] Error handling implemented

---

## 🚀 Testing Steps

### Test 1: View RFQ Inbox as Vendor
```
1. Log in as vendor
2. Go to My Profile → RFQ Inbox tab
3. Expected:
   - ✅ Page loads without errors
   - ✅ Stats cards show (Total, Unread, Pending, With Quotes)
   - ✅ Filter tabs visible: All | Direct | Wizard | Matched | Public | Vendor-Request
   - ✅ All tabs show count: e.g., "All (2)" "Direct (1)" "Wizard (1)"
4. Check browser console:
   - ✅ No red errors
   - ✅ See log: "RFQInboxTab Stats:" with counts
```

### Test 2: Send Direct RFQ
```
1. Log in as buyer
2. Find a vendor
3. Click "Request for Quote" on vendor profile
4. Fill form and submit
5. Log in as that vendor
6. Go to RFQ Inbox
7. Expected:
   - ✅ New RFQ appears in list
   - ✅ Direct tab count increases
   - ✅ All tab count increases
   - ✅ RFQ has [Direct RFQ] badge
   - ✅ Blue background color
   - ✅ No errors in console
```

### Test 3: Send Wizard RFQ (if available)
```
1. Log in as buyer
2. Go to Create RFQ → Wizard
3. Select one or more vendors
4. Submit RFQ
5. Log in as selected vendor
6. Go to RFQ Inbox
7. Expected:
   - ✅ New RFQ appears in list
   - ✅ Wizard tab count increases
   - ✅ RFQ has [Wizard] badge
   - ✅ Orange background color
   - ✅ Can see in both "All" and "Wizard" filters
```

### Test 4: Filter by RFQ Type
```
1. Vendor has multiple types of RFQs (2+ different types)
2. Click on each filter tab:
   - All → shows all RFQs
   - Direct → shows only Direct RFQs
   - Wizard → shows only Wizard RFQs
   - Matched → shows Matched RFQs (or empty if none)
   - Public → shows Public RFQs (or empty if none)
   - Vendor-Request → shows Vendor-Request RFQs (or empty if none)
3. Expected:
   - ✅ List filters correctly
   - ✅ Count in button matches displayed items
   - ✅ Selected tab highlighted (amber)
   - ✅ No console errors
```

### Test 5: Unread Indicator
```
1. Vendor receives a new RFQ
2. Go to RFQ Inbox (don't click on RFQ)
3. Expected:
   - ✅ Red dot appears on RFQ card (unread indicator)
   - ✅ Unread stat card shows "1"
4. Click on RFQ to view details
5. Go back to inbox
6. Expected:
   - ✅ Red dot disappears (now marked as viewed)
   - ✅ Unread stat card shows "0"
```

### Test 6: Multiple RFQ Types
```
1. Set up database with multiple RFQ types for one vendor:
   - 2 Direct RFQs (from rfq_requests)
   - 1 Wizard RFQ (from rfq_recipients type='wizard')
   - 1 Matched RFQ (from rfq_recipients type='matched')
   - 1 Public RFQ (from rfq_recipients type='public')
   - 1 Vendor-Request (from rfq_recipients type='vendor-request')
2. Vendor opens RFQ Inbox
3. Expected stats:
   - ✅ Total: 6
   - ✅ Direct: 2
   - ✅ Wizard: 1
   - ✅ Matched: 1
   - ✅ Public: 1
   - ✅ Vendor-Request: 1
4. Expected display:
   - ✅ All (6) | Direct (2) | Wizard (1) | Matched (1) | Public (1) | Vendor-Request (1)
   - ✅ All 6 RFQs visible when "All" selected
   - ✅ Correct RFQs shown when each type filtered
   - ✅ Each has correct color badge
```

### Test 7: Color & Badge Verification
```
For each RFQ type visible, verify:

Direct RFQ:
  - ✅ Background: Light blue (bg-blue-50)
  - ✅ Border: Blue (border-blue-200)
  - ✅ Badge: "Direct RFQ" with blue background

Wizard RFQ:
  - ✅ Background: Light orange (bg-orange-50)
  - ✅ Border: Orange (border-orange-200)
  - ✅ Badge: "Wizard" with orange background

Matched RFQ:
  - ✅ Background: Light purple (bg-purple-50)
  - ✅ Border: Purple (border-purple-200)
  - ✅ Badge: "Admin-Matched" with purple background

Public RFQ:
  - ✅ Background: Light cyan (bg-cyan-50)
  - ✅ Border: Cyan (border-cyan-200)
  - ✅ Badge: "Public RFQ" with cyan background

Vendor-Request RFQ:
  - ✅ Background: Light green (bg-green-50)
  - ✅ Border: Green (border-green-200)
  - ✅ Badge: "Vendor Request" with green background
```

### Test 8: Deduplication
```
1. Create situation where same RFQ appears in both:
   - rfq_requests table
   - rfq_recipients table
2. Vendor opens RFQ Inbox
3. Expected:
   - ✅ RFQ appears only ONCE (not duplicated)
   - ✅ Correct count in stats
   - ✅ Correct count in filter tabs
```

### Test 9: Edge Cases
```
Test with empty inbox:
  - ✅ Shows "No RFQs found" message
  - ✅ All stats show 0
  - ✅ All filter tabs show 0 count

Test with only one type:
  - ✅ That type tab shows count
  - ✅ Other type tabs show 0
  - ✅ Can still click other tabs (shows empty)

Test with null RFQs (orphaned recipients):
  - ✅ System filters them out
  - ✅ No console errors
  - ✅ Accurate count calculation

Test permission/security:
  - ✅ Other users can't view this vendor's inbox
  - ✅ Shows "Only vendors can view..." message
```

### Test 10: Console Logs
```
Open browser DevTools → Console
1. Vendor opens RFQ Inbox
2. Expected to see:
   - ✅ "RFQInboxTab Stats:" with full stats object
   - ✅ Example:
     {
       total: 6,
       unread: 2,
       pending: 1,
       direct: 2,
       matched: 1,
       wizard: 1,
       public: 1,
       'vendor-request': 0
     }
3. No error logs expected
```

---

## 🐛 Debugging Guide

### If counts show 0 for some types:

**Step 1: Check database**
```javascript
// In browser console, check if rfq_recipients table has data
// This requires direct DB access - ask team for help

// Expected:
// - rfq_recipients should have rows with type='wizard'/'matched'/'public'/'vendor-request'
// - rfq_requests should have rows (for direct RFQs)
```

**Step 2: Check logs**
```
- Look for "Error fetching RFQs from recipients:" or "Error fetching direct RFQs:"
- If error shown, check Supabase permissions/RLS policies
```

**Step 3: Verify component loaded**
```
- Check if RFQInboxTab is rendering at all
- Verify currentUser.id === vendor.user_id (permission check)
- Check if vendor.id is defined
```

### If RFQs not appearing:

**Check 1: Query working?**
- Open DevTools → Network tab
- Look for Supabase API calls
- Check if they return 200 status
- Verify response has data

**Check 2: Data mapping?**
- Check console for "RFQInboxTab Stats:"
- If stats show 0 total, data isn't being fetched
- If stats show numbers but nothing displayed, mapping issue

**Check 3: Component rendering?**
- Check if loading spinner shows (briefly)
- Check if "No RFQs found" message appears
- If nothing shows, check console for React errors

### If wrong RFQ type shown:

**Check 1: recipient_type correct?**
- Verify rfq_recipients.recipient_type is one of: 'direct', 'wizard', 'matched', 'public', 'vendor-request'
- If different value, add to color mapping and filter

**Check 2: rfq_type mapping?**
- Verify code maps recipient_type → rfq_type correctly
- Line: `rfq_type: recipient.recipient_type`

**Check 3: Color config?**
- Verify RFQ_TYPE_COLORS has entry for that type
- If missing, add new color configuration

---

## 📋 Regression Testing

After deploying, test to ensure no regressions:

```
- [ ] Vendor profile page still loads
- [ ] Other tabs (About, Reviews, etc.) still work
- [ ] Profile edit functionality works
- [ ] Messaging inbox still works
- [ ] Products/Services/Portfolio tabs work
- [ ] RFQ modal creation still works
- [ ] No new console errors
- [ ] Page performance acceptable (not slow)
- [ ] Mobile responsive works
- [ ] Can still submit quotes on RFQs
```

---

## 📊 Success Criteria

✅ **All tests pass when:**
1. Vendors see ALL 5 RFQ types in inbox
2. Stats show accurate counts for each type
3. Filter tabs work correctly for each type
4. Color badges display correctly
5. Unread count works
6. No console errors
7. No performance issues
8. Backward compatible with rfq_requests
9. Handles edge cases gracefully
10. Deduplication works

---

## 🎯 Known Limitations

**Current limitations (by design):**
1. Quote count not fully implemented (always 0)
   - Could be enhanced later
2. Vendor-Request RFQs may not have data yet
   - Depends on admin system creating them
3. Public RFQs only shown if in rfq_recipients table
   - Could be enhanced to show from rfqs table too

---

## ✅ Sign-Off Checklist

Before marking as production-ready:

- [ ] All tests in this guide completed successfully
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive confirmed
- [ ] Tested with multiple vendors
- [ ] Tested with all 5 RFQ types (or as many as exist)
- [ ] Regression tests passed
- [ ] No new bugs introduced
- [ ] Documentation updated
- [ ] Team aware of change

---

## 📞 Support

If issues found during testing:

1. **Check logs** - DevTools Console for errors
2. **Review code** - See RFQ_INBOX_ENHANCEMENT_COMPLETE.md
3. **Check database** - Verify data in rfq_recipients and rfq_requests
4. **Test in browser** - Try incognito/private mode (clear cache)
5. **Ask team** - Get help from backend/database experts

