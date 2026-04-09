# 🖼️ How to Change Vendor Profile Image (Logo)

**Quick Guide for Uploading/Changing Your Vendor Profile Logo**

---

## 🎯 Simple Answer

**To change your vendor profile image:**

1. Go to your vendor profile page
2. Look for the logo/image at the top of the profile
3. Click the **"Change"** button below the image
4. Select a new image file from your computer
5. Wait for upload to complete (button shows "...")
6. ✅ Done! Image updates automatically

---

## 📸 Step-by-Step Guide

### **Step 1: Navigate to Your Profile**

```
1. Log in to Zintra
2. Click on your profile/vendor name
3. You should see your current logo/image at the top
```

### **Step 2: Click "Change" Button**

The "Change" button is located:
- **Below your logo/profile image**
- In the header section of your profile
- Next to your company name and verification badge

### **Step 3: Select Image**

A file picker will open:
- Select image from your computer
- Supported formats: **JPEG, PNG, WebP, GIF**
- Maximum size: **10MB**
- Recommended: Square images work best (e.g., 500x500px)

### **Step 4: Wait for Upload**

- Button changes to "..." while uploading
- Takes 2-10 seconds depending on file size
- **Don't close the page** while uploading

### **Step 5: Verify**

- Logo updates automatically on the page
- Refresh page if needed
- New logo appears immediately for all visitors

---

## ✅ Supported Image Formats

| Format | Extension | Best For | Max Size |
|--------|-----------|----------|----------|
| **PNG** | .png | Logos with transparency | 10MB |
| **JPEG** | .jpg/.jpeg | Photos | 10MB |
| **WebP** | .webp | Modern web format | 10MB |
| **GIF** | .gif | Simple graphics | 10MB |

---

## 💡 Best Practices

### **Image Requirements:**

✅ **Recommended Size:** 500x500px to 1000x1000px (square)  
✅ **Format:** PNG with transparent background (for logos)  
✅ **File Size:** Under 2MB for fast loading  
✅ **Quality:** High resolution, clear and professional  

### **What Makes a Good Profile Image:**

✅ **Clear Logo** - Your company logo on transparent/white background  
✅ **Simple Design** - Easy to recognize at small sizes  
✅ **Professional** - Represents your brand well  
✅ **Consistent** - Matches your branding across platforms  

### **Avoid:**

❌ Blurry or low-resolution images  
❌ Images with text (text should be in company name)  
❌ Photos with complex backgrounds  
❌ Files over 5MB (slow to load)  

---

## 🔧 Technical Details

### **Upload Process:**

```javascript
// How it works behind the scenes:
1. User clicks "Change" button
2. File picker opens (accept="image/*")
3. User selects image file
4. File validation (size, type)
5. Upload to server via FormData
6. Server uploads to AWS S3
7. S3 URL saved to database
8. Image updates on page
```

### **Where Is It Stored?**

- **Storage:** AWS S3 bucket (`zintra-images-prod`)
- **Path:** `vendor-profiles/{vendorId}/logo-{timestamp}.{extension}`
- **Database:** URL saved in `vendors.logo_url` column
- **Access:** Public (anyone can view)

### **File Validation:**

```javascript
// Server-side checks:
✅ File size ≤ 10MB
✅ File type in [JPEG, PNG, WebP, GIF]
✅ User is authenticated
✅ User owns the vendor profile
```

---

## 🐛 Troubleshooting

### **"Upload failed" Error**

**Possible causes:**
- ❌ File too large (over 10MB)
- ❌ Wrong file format (e.g., PDF, SVG)
- ❌ Not logged in
- ❌ Don't own this vendor profile
- ❌ Network connection issue

**Solutions:**
1. Check file size (right-click → Get Info on Mac)
2. Convert to JPEG or PNG if needed
3. Log out and log back in
4. Make sure you're on YOUR vendor profile
5. Try again with stable internet connection

### **"Button Shows '...' Forever"**

**Cause:** Upload stuck or failed silently

**Solution:**
1. Refresh the page
2. Try uploading a smaller file
3. Try a different image format
4. Check browser console for errors (F12 → Console tab)

### **"Image Doesn't Update"**

**Cause:** Browser cache showing old image

**Solution:**
1. Hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
2. Clear browser cache
3. Try in incognito/private window
4. Check if upload actually succeeded (button went back to "Change")

### **"PNG Files Not Uploading"**

**Status:** ✅ **FIXED** as of Jan 16, 2026 (commit 75e4eed)

Previously PNG files were converted to JPEG. Now:
- ✅ PNG format preserved
- ✅ Transparency supported
- ✅ Higher quality compression (95%)

---

## 🎨 Image Optimization Tips

### **Before Uploading:**

1. **Resize your image:**
   ```
   Recommended: 800x800px
   Maximum: 2000x2000px
   ```

2. **Compress the file:**
   - Use tools like TinyPNG, ImageOptim, or Squoosh
   - Target: Under 500KB for fast loading
   - Keep quality at 85-95%

3. **Remove background (PNG only):**
   - Use remove.bg or Photoshop
   - Transparent background looks professional
   - Works well on any page background

### **Mac Users:**

```bash
# Using Preview to resize:
1. Open image in Preview
2. Tools → Adjust Size
3. Set width to 800px (height auto-adjusts)
4. Resolution: 72 DPI
5. File → Export → Save as PNG/JPEG
```

### **Online Tools:**

- **Resize:** iloveimg.com/resize-image
- **Remove Background:** remove.bg
- **Compress:** tinypng.com
- **Convert Format:** cloudconvert.com

---

## 📋 Quick Checklist

Before uploading your vendor profile image:

- [ ] Image is square (or nearly square)
- [ ] File size under 5MB (ideally under 500KB)
- [ ] Format is PNG or JPEG
- [ ] Image is clear and professional
- [ ] Represents your brand well
- [ ] No text (use company name field instead)
- [ ] Background is transparent (PNG) or clean (JPEG)
- [ ] Resolution is at least 500x500px
- [ ] You're logged in to correct account
- [ ] You're on YOUR vendor profile page

---

## 🚀 Pro Tips

### **For Best Results:**

1. **Use PNG for logos:**
   - Transparent background
   - Sharp edges and text
   - Professional appearance

2. **Use JPEG for photos:**
   - Smaller file size
   - Good for photographs
   - No transparency needed

3. **Test on different backgrounds:**
   - View your profile in light/dark mode
   - Ensure logo is visible
   - Check on mobile devices

4. **Update regularly:**
   - Rebrand? Update your logo
   - Keep consistent with your website
   - Seasonal variations (e.g., holiday themes)

---

## 🔗 Related Documentation

- `PNG_UPLOAD_FIX.md` - PNG format support details
- `AWS_S3_SETUP_GUIDE.md` - Image storage infrastructure
- `S3_SERVER_SIDE_UPLOAD_COMPLETE.md` - Upload implementation

---

## 📞 Need Help?

**If you're still having trouble:**

1. Check file meets requirements (10MB, JPEG/PNG/WebP/GIF)
2. Try a different image
3. Clear browser cache and try again
4. Check browser console for specific error
5. Contact support with error details

---

## 🎉 Summary

**Changing your vendor profile image is easy:**

1. Click "Change" button below current logo
2. Select new image (PNG/JPEG, under 10MB)
3. Wait for upload (2-10 seconds)
4. ✅ Done!

**The image will:**
- Upload to AWS S3
- Update instantly on your profile
- Be visible to all visitors
- Work on all devices

---

**Last Updated:** January 16, 2026  
**Current Status:** ✅ Working perfectly (PNG support added)
