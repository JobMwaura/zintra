# 🔍 Add Product Button Debug Guide

## Problem Summary
- ✅ "Add Service" button works correctly
- ❌ "Add Product" button does not work
- Both buttons and modals are wired correctly in code

## Troubleshooting Steps

### Step 1: Check if the Modal Opens

**In your browser:**
1. Login as a vendor
2. Go to vendor profile
3. Click the "Add Product" button on the Products tab
4. Look for the modal dialog to appear

**What to check:**
- Do you see a modal pop-up with "Add Product" title?
- If YES → Go to Step 2
- If NO → Modal is not opening (check console)

### Step 2: Check Browser Console for Errors

**In your browser:**
1. Press `F12` to open Developer Tools
2. Go to **Console** tab
3. Click "Add Product" button
4. Look for any red error messages

**Likely errors and solutions:**

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot read property 'id' of undefined` | `vendor` prop is null/undefined | Check vendor data loaded |
| `Failed to save product` | Database error | Check Supabase permissions |
| `Image upload error` | Storage bucket doesn't exist | Create `vendor-assets` bucket |
| `400 Bad Request` | Missing required field | Check form validation |

### Step 3: Try Adding a Product WITHOUT Image

**In the modal:**
1. Fill in: **Product Name** (required)
2. Fill in: **Price** (required)
3. Leave **Image** empty
4. Click "Add Product"

**Why?** If it works without image but fails with image, the issue is image upload to Supabase storage.

### Step 4: Check Supabase Bucket

**In Supabase Dashboard:**
1. Go to **Storage**
2. Look for a bucket called `vendor-assets`
3. If it doesn't exist → **CREATE IT**:
   - Click "New Bucket"
   - Name: `vendor-assets`
   - Make it **Public**
   - Create

### Step 5: Check RLS Policies

**In Supabase:**
1. Go to **Storage** → `vendor-assets` bucket
2. Click **Policies**
3. Check if there's a policy allowing INSERT

**If missing, add this policy:**
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vendor-assets' AND auth.role() = 'authenticated');
```

### Step 6: Monitor Network Requests

**In your browser:**
1. Press `F12` → **Network** tab
2. Click "Add Product"
3. Fill the form and submit
4. Look for requests that failed (red text)

**Common failures:**
- `POST /api/storage/upload` - Image upload failed
- `POST /vendor_products` - Database insert failed

---

## Enhanced Error Output

The ProductUploadModal now has **detailed logging**. Check the browser console for:

```
📸 Uploading image: filename.jpg
❌ Image upload error: [detailed error message]
✅ Image uploaded: products/vendor-id/product-xxx.jpg
📎 Image URL: https://...
💾 Saving product to database: {...}
❌ Database save error: [detailed error message]
✅ Product saved: {...}
```

---

## Quick Fixes Checklist

- [ ] Vendor is logged in and editing their own profile
- [ ] `vendor-assets` storage bucket exists in Supabase
- [ ] `vendor-assets` bucket is set to PUBLIC
- [ ] RLS policies allow authenticated uploads to `vendor-assets`
- [ ] `vendor_products` table exists with all required columns
- [ ] No errors in browser console when clicking "Add Product"
- [ ] Form validation passed (name and price filled)

---

## If Still Not Working

**Share this information when debugging:**

1. Open browser console (F12 → Console)
2. Click "Add Product"
3. Fill in: Name = "Test Product", Price = "100"
4. Click "Add Product"
5. Copy the entire console output
6. Share what error messages appear

---

## Code Structure Overview

**File:** `components/vendor-profile/ProductUploadModal.js`
- Renders modal form
- Handles image upload to Supabase storage
- Inserts product data to `vendor_products` table
- Includes detailed error logging

**File:** `app/vendor-profile/[id]/page.js`
- Shows/hides ProductUploadModal based on `showProductModal` state
- Button onClick: `setShowProductModal(true)`
- Modal onSuccess: refreshes products list

**Database:** `vendor_products` table
```
Columns: id, vendor_id, name, description, price, 
         category, unit, image_url, status, sale_price, 
         offer_label, created_at
```

---

## Why Service Works but Product Doesn't?

**ServiceUploadModal:**
- Simple: only saves name + description
- No image upload
- No storage interaction
- Fewer failure points ✅

**ProductUploadModal:**
- Complex: handles image upload first
- Uploads to Supabase storage bucket
- Then saves to database
- More failure points ❌

The image upload step is likely where it's failing.

---

## Next Actions

1. **Create `vendor-assets` bucket** in Supabase (if not exist)
2. **Try adding product without image** to isolate the issue
3. **Check browser console** for specific error messages
4. **Share error message** from console if you're still stuck
