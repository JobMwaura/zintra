# 🔍 VENDOR PROFILE TESTING - LIVE SITE

## Test URL
**https://zintra-sandy.vercel.app/vendor-profile/f089b49d-77e3-4549-b76d-4568d6cc4f94**

---

## 📋 ELEMENTS TO TEST ON THIS PAGE

### 🟢 PUBLIC PROFILE (Anyone Can View)

#### Top Section - Vendor Header
- [ ] Vendor name displays
- [ ] Vendor logo/image displays
- [ ] Rating stars display (e.g., 4.9)
- [ ] Number of reviews displays
- [ ] Number of likes displays  
- [ ] Number of views displays
- [ ] Plan type displays (e.g., "Plan: Professional")
- [ ] Response time displays (e.g., "24 hrs")
- [ ] "Message" button visible
- [ ] "Direct RFQ" button visible
- [ ] "Like" button visible (heart icon)
- [ ] "Save" button visible (bookmark icon)

#### Tab Navigation
- [ ] "Overview" tab clickable
- [ ] "Services & Expertise" tab clickable
- [ ] "Products" tab clickable
- [ ] "Services" tab clickable
- [ ] "Reviews" tab clickable

#### Overview Tab Content
- [ ] "About" section displays description
- [ ] Featured products display (if any)
- [ ] Featured services display (if any)
- [ ] Business updates preview (if any)

#### Services & Expertise Tab
- [ ] Primary category displays
- [ ] Secondary categories display (if any)
- [ ] Category badges show correctly

#### Products Tab
- [ ] Product cards display with image, name, price, status
- [ ] Grid layout looks good
- [ ] "Add Product" button hidden (not vendor)

#### Services Tab
- [ ] Service cards display with name and description
- [ ] Checkmarks display for each service
- [ ] "Add Service" button hidden (not vendor)

#### Reviews Tab
- [ ] Star rating system displays
- [ ] Existing reviews display with:
  - Reviewer name
  - Rating (stars)
  - Comment text
  - Date posted
- [ ] "Write a Review" button visible
- [ ] Average rating displays at top

#### Right Sidebar - Business Info
- [ ] "Business Information" section visible with:
  - Categories/specializations
  - Contact info (phone, email, WhatsApp)
- [ ] "Business Locations" section visible (if data exists):
  - Location addresses
  - "Manage" button hidden (not vendor)
- [ ] "Business Hours" section visible (if data exists):
  - Days and hours
  - "Edit" button hidden (not vendor)
- [ ] "Highlights" section visible (if data exists):
  - Bullet points with checkmarks
  - "Edit" button hidden (not vendor)
- [ ] "Certifications" section visible (if data exists):
  - Certification names
  - Issuer and date (if available)
  - "Manage" button hidden (not vendor)
- [ ] "Subscription" section visible:
  - Plan name and price
  - Days remaining (if active)
  - Progress bar
  - "Manage Subscription" button hidden (not vendor)

---

### 🔐 VENDOR-ONLY FEATURES (If Logged In as Vendor)

#### Additional Tabs (if owner)
- [ ] "Categories" tab visible
- [ ] "Updates" tab visible
- [ ] "RFQ Inbox" tab visible

#### Categories Tab
- [ ] Primary category selector visible
- [ ] Secondary categories multi-select visible
- [ ] Category save button works
- [ ] Success message displays after save
- [ ] Data persists on page reload

#### Updates Tab
- [ ] "+ Share Update" button visible
- [ ] Existing updates display with:
  - Update text
  - Like count
  - Date posted
  - Delete option
- [ ] Status update modal opens when clicking button
- [ ] Can create new update
- [ ] Can delete updates

#### RFQ Inbox Tab
- [ ] RFQ inbox widget visible in sidebar (if vendor)
- [ ] Stats display (Total, Unread, Pending, With Quotes)
- [ ] Recent RFQs list displays
- [ ] RFQ cards show type badge, title, category, county
- [ ] View All RFQs button works

#### Edit Buttons in Sidebar
- [ ] Business Hours "Edit" button opens modal
- [ ] Locations "Manage" button opens modal
- [ ] Certifications "Manage" button opens modal
- [ ] Highlights "Edit" button opens modal

#### Modals (when opened)
- [ ] Business Hours Editor:
  - Can edit each day
  - Save button works
  - Changes persist
- [ ] Locations Manager:
  - Can add/edit/delete locations
  - Save button works
  - Changes persist
- [ ] Certifications Manager:
  - Can add/edit/delete certifications
  - Save button works
  - Changes persist
- [ ] Highlights Manager:
  - Can add/edit/delete highlights
  - Save button works
  - Changes persist

#### Subscription Panel
- [ ] Can open via "Manage Subscription" button (if active)
- [ ] Or "View Plans" button (if no active subscription)
- [ ] Shows subscription details
- [ ] Can navigate to subscribe page

---

## 🐛 KNOWN ISSUES TO CHECK

### Issue 1: Category Table Reference
**Status:** FIXED (updated vendor_profiles → vendors)
- [x] CategoryManagement API uses correct table
- [x] Vendor profile page uses correct table for refresh

### Issue 2: Subscription Price Display
**Status:** NEEDS VERIFICATION
- [ ] Subscription section shows correct price
- [ ] Price field exists in vendor_subscriptions table

### Issue 3: Business Hours Display
**Status:** NEEDS VERIFICATION
- [ ] Hours display correctly if data exists
- [ ] Hours don't display if no data (but edit option available)

### Issue 4: Highlights Display
**Status:** NEEDS VERIFICATION
- [ ] Highlights display correctly if data exists
- [ ] Default highlights show if no data exists

---

## 📝 DETAILED BUTTON TESTS

### Message Button
- [ ] Clicking opens messaging modal
- [ ] Can type and send message
- [ ] Message appears in conversation thread
- [ ] Modal closes properly

### Direct RFQ Button
- [ ] Clicking opens RFQ creation modal
- [ ] Can fill RFQ details
- [ ] Can submit RFQ
- [ ] Vendor receives notification
- [ ] Modal closes properly

### Like Button (Heart Icon)
- [ ] Click heart to like vendor
- [ ] Count increases
- [ ] Heart fills with color
- [ ] Click again to unlike
- [ ] Count decreases

### Save Button (Bookmark Icon)
- [ ] Click bookmark to save vendor
- [ ] Bookmark fills with color
- [ ] Click again to unsave
- [ ] Bookmark empties

### Write Review Button
- [ ] Opens review submission form
- [ ] Can select star rating (1-5)
- [ ] Can type review text
- [ ] Can submit review
- [ ] Review appears in reviews list
- [ ] Review count increases

### Add Product Button
- [ ] Opens product upload modal
- [ ] Can fill product details (name, price, image)
- [ ] Can upload image from computer
- [ ] Can submit
- [ ] Product appears in products list
- [ ] Modal closes

### Add Service Button
- [ ] Opens service upload modal
- [ ] Can fill service details (name, description)
- [ ] Can submit
- [ ] Service appears in services list
- [ ] Modal closes

### Share Update Button (Vendor)
- [ ] Opens status update modal
- [ ] Can type update text
- [ ] Can optionally add image
- [ ] Can submit
- [ ] Update appears in Overview tab
- [ ] Update appears in Updates tab
- [ ] Like count shows (0 initially)

### Subscribe to Plan Button
- [ ] Opens subscription plans page
- [ ] Can select a plan
- [ ] Can complete payment
- [ ] Subscription displays in sidebar
- [ ] Days remaining shows correctly

---

## ⚠️ PRIORITY FIXES

### P1 - CRITICAL (Must Work)
- [ ] Category management save works
- [ ] Subscription display works
- [ ] All CRUD buttons for vendor data (products, services, updates)
- [ ] Message and Direct RFQ buttons work

### P2 - HIGH (Should Work)
- [ ] Business Hours editing and display
- [ ] Locations editing and display
- [ ] Certifications editing and display
- [ ] Highlights editing and display
- [ ] Review submission

### P3 - MEDIUM (Nice to Have)
- [ ] Like/Save functionality
- [ ] Status update likes
- [ ] View counts
- [ ] All animations and transitions

---

## 📸 SCREENSHOTS/OBSERVATIONS

After testing, note:
- [ ] What displays correctly
- [ ] What's broken or missing
- [ ] What needs to be styled
- [ ] What buttons don't work
- [ ] Any console errors

---

## 🚀 NEXT STEPS AFTER TESTING

1. Document all broken buttons
2. Fix critical issues first
3. Test each fix immediately on live site
4. Commit working fixes
5. Create final checklist of all working features

