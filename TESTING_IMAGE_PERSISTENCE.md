# Testing Image Persistence - Quick Guide

**Status**: ✅ READY FOR TESTING  
**Deployment**: Main branch - Commit `518c216`

---

## What Was Fixed

✅ Images now stay accessible for **365 days** instead of expiring after 1 hour  
✅ Images persist across page refreshes indefinitely  
✅ No more "Image Error" messages on refresh

---

## Quick Test (5 Minutes)

### Step 1: Create an Update with Images

1. Go to vendor profile page
2. Click "Add Business Update"
3. Write some text (e.g., "Testing image persistence fix")
4. Click the image icon
5. Select 1-2 images (any JPG/PNG under 5MB)
6. Wait for upload to complete
7. Click "Post Update"
8. ✅ Should see update with images in carousel

### Step 2: Test Page Refresh

1. **Hard refresh** the page (Cmd+Shift+R on Mac)
2. ✅ Updates should still be there
3. ✅ Images should display (no error)
4. Hard refresh again
5. ✅ Same result

### Step 3: Create Another Update (Multiple Images)

1. Create another update with **2-3 images**
2. Verify all images appear
3. Hard refresh 3 times
4. ✅ All images should still work
5. ✅ No errors, no broken images

---

## Expected Results ✅

| Test | Expected Outcome |
|------|------------------|
| Create update with image | Image appears in carousel |
| Refresh page | Image still displays |
| Multiple refreshes | Image continues to work |
| Create multiple updates | All images display |
| Thumbnail preview in carousel | Works without error |
| Click image to enlarge | Displays full resolution |

---

## If Something Goes Wrong 🚨

### Images Still Show Error

1. **Check browser console** (F12)
   - Look for 403 errors → permission issue
   - Look for CORS errors → S3 bucket CORS issue
   - Look for network errors → connectivity issue

2. **Check if images are in database**
   - Go to Supabase dashboard
   - Table: `vendor_status_updates`
   - Find your update
   - Check `images` column
   - Should contain file keys (not empty)

3. **Check if fresh URLs are being generated**
   - Open browser Network tab (F12 → Network)
   - Refresh page
   - Look for `GET /api/status-updates?vendorId=...`
   - Response should have image URLs with signatures

### Images Don't Persist on Refresh

1. **Check useEffect in page.js**
   - File: `/app/vendor-profile/[id]/page.js`
   - Should have useEffect that calls GET /api/status-updates
   - Check browser Network tab to see if fetch is happening

2. **Check if updates exist in database**
   - Supabase → vendor_status_updates table
   - Filter by your vendor_id
   - Should show your created updates

---

## Success Criteria ✅

All of these must be true:

1. ✅ Can create update with text
2. ✅ Can upload images during update creation
3. ✅ Images appear in carousel on same page
4. ✅ Hard refresh (Cmd+Shift+R) keeps updates visible
5. ✅ Images still display after refresh (no error)
6. ✅ Multiple images work
7. ✅ Multiple refreshes work
8. ✅ Image preview doesn't show error

---

## Technical Details (If Needed)

### What Changed

**Before:**
```
Upload image → Store presigned URL (1-hour expiry) in database
Refresh page → URL expired → Image shows 403 error
```

**After:**
```
Upload image → Store FILE KEY in database
Refresh page → Generate fresh 365-day presigned URL from key
Fresh URL = works indefinitely
```

### Where Code Lives

- **Upload logic**: `/components/vendor-profile/StatusUpdateModal.js`
- **Fetch logic**: `/app/vendor-profile/[id]/page.js` (useEffect)
- **URL generation**: `/app/api/status-updates/route.js` (GET handler)
- **Long-lived URLs**: `/lib/aws-s3.js` (GET_URL_EXPIRY = 365 days)

---

## Rollback Plan (If Needed)

If images still don't work and you need to revert:

```bash
git revert 081a5c1  # Revert image persistence fix
git push origin main
```

This will go back to the previous approach (if you want to debug further).

---

## Questions?

If images still show errors after testing:

1. Check the `IMAGE_PERSISTENCE_FIX.md` file for architectural details
2. Check browser console for specific error messages
3. Check `/app/api/status-updates/route.js` logs in terminal (if running locally)
4. Verify AWS S3 credentials are set correctly in `.env.local`

---

## Timeline

- **Created**: January 12, 2026
- **Deployed**: Commit `081a5c1` → `518c216`
- **Expected Duration**: All day before images work
- **Verification**: Test now and report results

Happy testing! 🎉
