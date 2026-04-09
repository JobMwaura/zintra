# 📋 RFQ Types - Complete Overview

We have **5 types of RFQs** in the system:

---

## 1️⃣ **Direct RFQ** (`'direct'`)

**What it is:**
- Sent directly to a specific vendor from their profile
- One-to-one RFQ request
- Buyer selects one vendor and sends RFQ directly

**How it's created:**
- Via `DirectRFQPopup` component on vendor profile
- User clicks "Request for Quote" on vendor card
- Fills form and submits

**Where it appears:**
- In vendor's RFQ Inbox tab (marked as "Direct RFQ")
- In vendor's profile RFQ widget
- Only the selected vendor sees it

**Database:**
- Table: `rfqs` + `rfq_requests`
- Type: `'direct'`
- Recipient type: `recipient_type = 'direct'` (in rfq_recipients if using new system)

**Components:**
- `components/DirectRFQPopup.js` - The form for sending
- `components/RFQModal/RFQModal.jsx` - Alternative form (RFQType='direct')

---

## 2️⃣ **Wizard RFQ** (`'wizard'`)

**What it is:**
- Multi-step form wizard for RFQ creation
- Buyer can select multiple vendors at once OR
- Let the system auto-match vendors based on category/location

**How it's created:**
- Via `RFQModal` component with `rfqType="wizard"`
- Step-by-step form with multiple pages
- Buyer fills in RFQ details and selects vendors
- System shows matching vendors OR buyer manually selects

**Where it appears:**
- In all selected vendors' RFQ Inbox tabs (marked as "Wizard RFQ")
- In their profile RFQ widgets
- Multiple vendors see it if multiple selected

**Database:**
- Table: `rfqs` + `rfq_recipients`
- Type: `'wizard'`
- Recipient type: `recipient_type = 'wizard'` (in rfq_recipients)

**Components:**
- `components/RFQModal/RFQModal.jsx` - Main wizard component
- Has multiple steps (General, Details, Vendors, Review, etc.)

---

## 3️⃣ **Public RFQ** (`'public'`)

**What it is:**
- Open RFQ visible to all vendors
- Broadcast to entire vendor marketplace
- Any vendor can find and quote on it

**How it's created:**
- Via `RFQModal` with `rfqType="public"`
- Simple form without vendor selection
- Visibility set to `'public'`

**Where it appears:**
- On marketplace/public RFQ listings page
- In homepage feed of available RFQs
- Any vendor can search and find it
- Appears in all vendors' "Available RFQs" section

**Database:**
- Table: `rfqs`
- Type: `'public'`
- Visibility: `visibility = 'public'`
- Recipient type: `recipient_type = NULL` or `'public'`

**Components:**
- `components/RFQModal/RFQModal.jsx` - Public form
- `app/page.js` - Shows public RFQs in marketplace

---

## 4️⃣ **Matched RFQ** (`'matched'`)

**What it is:**
- Admin-matched RFQ
- Admin system automatically matches vendors based on:
  - Category expertise
  - Location/service area
  - Vendor ratings/experience
- Vendor receives RFQ from admin matching system

**How it's created:**
- Via admin matching algorithm (not user-initiated)
- Admin panel or automated process matches vendors
- System inserts to `rfq_recipients` with `recipient_type = 'matched'`

**Where it appears:**
- In matched vendors' RFQ Inbox tabs (marked as "Admin-Matched RFQ")
- In their profile RFQ widgets
- Different color/badge in UI (orange)

**Database:**
- Table: `rfqs` + `rfq_recipients`
- Type: `'matched'`
- Recipient type: `recipient_type = 'matched'` (in rfq_recipients)

**Components:**
- Admin matching logic (backend)
- `components/vendor-profile/RFQInboxTab.js` - Displays matched RFQs
- RFQInboxTab filters by type

---

## 5️⃣ **Vendor-Request RFQ** (`'vendor-request'`)

**What it is:**
- Vendor-specific request (less common)
- Might be initiated by vendor or for vendor-specific workflow
- Currently has less documentation

**How it's created:**
- Via `RFQModal` with `rfqType="vendor-request"`
- Less frequently used

**Where it appears:**
- Vendor-specific inbox
- Might be RFQ workflow specific

**Database:**
- Table: `rfqs`
- Type: `'vendor-request'`

**Components:**
- `components/RFQModal/RFQModal.jsx` - Conditional handling

---

## 🎨 Visual Representation in UI

### RFQInboxTab Type Colors

```javascript
const RFQ_TYPE_COLORS = {
  direct: { 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    badge: 'bg-blue-100 text-blue-800', 
    label: 'Direct' 
  },
  matched: { 
    bg: 'bg-green-50', 
    border: 'border-green-200', 
    badge: 'bg-green-100 text-green-800', 
    label: 'Matched' 
  },
  wizard: { 
    bg: 'bg-orange-50', 
    border: 'border-orange-200', 
    badge: 'bg-orange-100 text-orange-800', 
    label: 'Wizard' 
  },
  public: { 
    bg: 'bg-purple-50', 
    border: 'border-purple-200', 
    badge: 'bg-purple-100 text-purple-800', 
    label: 'Public' 
  }
};
```

---

## 📊 Quick Comparison Table

| Type | Visibility | Vendors | Created By | DB Table | Recipient Type |
|------|-----------|---------|-----------|----------|-----------------|
| Direct | Private | 1 specific | Buyer | rfq_requests | direct |
| Wizard | Private | Multiple | Buyer | rfq_recipients | wizard |
| Public | Public | All | Buyer | rfqs | public/NULL |
| Matched | Private | Auto-selected | Admin | rfq_recipients | matched |
| Vendor-Request | Private | Specific | Various | rfqs | vendor-request |

---

## 🔄 Data Flow by Type

### Direct RFQ Flow
```
DirectRFQPopup Form
  ↓
INSERT rfqs table
  ↓
INSERT rfq_requests table (vendor_id specified)
  ↓
Vendor sees in RFQ Inbox
```

### Wizard RFQ Flow
```
RFQModal (wizard mode)
  ↓
User selects vendors (or auto-matched)
  ↓
INSERT rfqs table
  ↓
INSERT rfq_recipients table (x multiple vendors, recipient_type='wizard')
  ↓
All selected vendors see in inbox
```

### Public RFQ Flow
```
RFQModal (public mode)
  ↓
No vendor selection
  ↓
INSERT rfqs table (visibility='public')
  ↓
Available in public marketplace
  ↓
Any vendor can search/find/quote
```

### Matched RFQ Flow
```
Admin system/algorithm
  ↓
Calculate matching vendors (category, location, ratings)
  ↓
INSERT rfqs table
  ↓
INSERT rfq_recipients (for each matched vendor, recipient_type='matched')
  ↓
Matched vendors see in inbox
```

---

## 🚀 Current Focus

**We're working on Direct RFQ** (`DirectRFQPopup`)
- The one currently failing (vendor not seeing RFQ in inbox)
- Should create entry in both `rfqs` AND `rfq_requests` tables
- Issue: `vendor_id` might be wrong type/value

---

## 📍 Key Files by RFQ Type

**Direct:**
- `components/DirectRFQPopup.js`
- `components/vendor-profile/RFQInboxTab.js`
- `app/vendor-profile/[id]/page.js`

**Wizard:**
- `components/RFQModal/RFQModal.jsx`
- `components/RFQModal/Steps/*` (multiple step files)

**Public:**
- `components/RFQModal/RFQModal.jsx`
- `app/page.js` (marketplace listing)

**Matched:**
- Admin backend logic
- `components/vendor-profile/RFQInboxTab.js` (display)

---

## 🔧 SQL Constraint

All RFQ types are validated by this database constraint:

```sql
ADD CONSTRAINT rfqs_type_check 
CHECK (type IN ('direct', 'matched', 'public', 'wizard', 'vendor-request'));
```

This ensures only valid types can be inserted.

---

## Summary

- **5 types total:** Direct, Wizard, Public, Matched, Vendor-Request
- **2 main flows:** 
  - Private (Direct, Wizard, Matched) - specific vendors see
  - Public - all vendors can see
- **Current issue:** Direct RFQ not appearing in vendor inbox
- **Root cause:** Likely `vendor_id` foreign key mismatch

See `RFQ_FRESH_START_GUIDE.md` for testing and next steps!
