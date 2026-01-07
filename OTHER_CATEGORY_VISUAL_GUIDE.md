# "Other" Category Feature - Visual Guide

## 📋 User Creating RFQ with "Other" Category

```
┌─────────────────────────────────────────────────────────┐
│  DIRECT RFQ FORM                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📌 RFQ Details                                         │
│  Title: [Flooring Restoration Project]                 │
│  Description: [Need to restore 1950s tile floors...]   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Category Dropdown                               │  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │ Carpentry                                 │   │  │
│  │  │ Electrical                                │   │  │
│  │  │ Plumbing                                  │   │  │
│  │  │ Flooring                                  │   │  │
│  │  │ Roofing                                   │   │  │
│  │  │ ... (more predefined)                     │   │  │
│  │  │ [Other (Please specify)] ← USER CLICKS    │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ✨ NEW FIELDS APPEAR (highlighted in blue)           │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 📝 Please specify your category                 │  │
│  │ [Flooring Restoration] ← REQUIRED FIELD         │  │
│  │                                                 │  │
│  │ 📝 Additional details (optional)                │  │
│  │ ┌───────────────────────────────────────────┐  │  │
│  │ │ Terracotta floor tiles, original 1950s    │  │  │
│  │ │ patterns, must preserve authenticity      │  │  │
│  │ │ Estimate 200 sqm coverage                 │  │  │
│  │ └───────────────────────────────────────────┘  │  │
│  │                                                 │  │
│  │ ℹ️  This helps vendors better understand      │  │
│  │     your specific needs                       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Budget Range: [500,000 – 1,000,000 ▼]               │
│  Location: [Nairobi ▼]                               │
│                                                         │
│         [SEND REQUEST] [CANCEL]                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 👨‍💼 Vendor Viewing the Custom RFQ

```
┌─────────────────────────────────────────────────────────┐
│  RFQ SUMMARY FOR VENDOR                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏆 Flooring Restoration Project                        │
│  Need to restore 1950s tile floors...                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Budget          │  Expires In    │  Category     │  │
│  │  500,000 - 1M    │  7 days        │  Flooring     │  │
│  │  KES            │                │  Restoration  │  │
│  │                 │                │  [Custom] 🏷️  │  │
│  │                 │                │                │  │
│  │                 │                │  Type         │  │
│  │                 │                │  Direct       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  📋 ADDITIONAL SPECIFICATIONS                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Terracotta floor tiles, original 1950s patterns │  │
│  │ must preserve authenticity                      │  │
│  │ Estimate 200 sqm coverage                       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│         [SUBMIT QUOTE] [BACK]                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🗄️ Database View

```
RFQs Table
┌─────┬──────────┬──────────────────┬──────────────┬───────────────┐
│ ID  │ Category │ is_custom_cat...  │ custom_detai │ Status        │
├─────┼──────────┼──────────────────┼──────────────┼───────────────┤
│ 1   │ Carpentry│ false            │ NULL         │ open          │
│ 2   │ Plumbing │ false            │ NULL         │ open          │
│ 3   │ Flooring │ true ✅          │ "Terracotta │ open          │
│     │ Restora..│                  │ tiles, 1950s│               │
│     │          │                  │ patterns..." │               │
│ 4   │ Roofing  │ false            │ NULL         │ closed        │
└─────┴──────────┴──────────────────┴──────────────┴───────────────┘

Key Points:
• is_custom_category = true: User specified via "Other"
• is_custom_category = false: Standard predefined category
• custom_details stored regardless of is_custom_category
• Backward compatible: existing RFQs have false/NULL
```

## 🔄 Form Data Flow

```
STEP 1: User Selects "Other"
┌────────────────────────┐
│ category: "other"      │  Form state updated
│ custom_category: ""    │  New fields shown
│ custom_details: ""     │
└────────────────────────┘
          ↓
STEP 2: User Fills Custom Fields
┌────────────────────────────────────────┐
│ category: "other"                      │  Form validates
│ custom_category: "Flooring Restoration"│  Custom cat required
│ custom_details: "Terracotta tiles..."  │  Details optional
└────────────────────────────────────────┘
          ↓
STEP 3: Validation Passes
┌────────────────────────────────────────┐
│ ✓ Category selected                    │  All checks pass
│ ✓ Custom category provided             │  Ready to submit
│ ✓ Custom details (optional)            │
└────────────────────────────────────────┘
          ↓
STEP 4: RFQ Submitted to Database
┌──────────────────────────────────────────┐
│ {                                        │  Saved as:
│   category: "Flooring Restoration",      │  - Standard field
│   is_custom_category: true,              │  - Custom flag
│   custom_details: "Terracotta tiles...", │  - Details
│   title: "Flooring Restoration Project", │
│   description: "Need to restore...",     │
│   ...                                    │
│ }                                        │
└──────────────────────────────────────────┘
          ↓
STEP 5: Vendor Views RFQ
┌─────────────────────────────────────────┐
│ Category: Flooring Restoration [Custom] │  Badge shown
│                                         │  Custom flag
│ ADDITIONAL SPECIFICATIONS:              │  Details displayed
│ Terracotta tiles, original 1950s...    │
└─────────────────────────────────────────┘
```

## 🎯 Feature Comparison

```
PREDEFINED CATEGORY vs CUSTOM CATEGORY

┌──────────────────────────────────────────────────────┐
│ Predefined Categories                                │
├──────────────────────────────────────────────────────┤
│ Examples: Carpentry, Plumbing, Electrical, etc.     │
│ Selection: Pick from dropdown                        │
│ Customization: None                                 │
│ Database: is_custom_category = false                │
│ Badge: None                                         │
│ Use Case: Standard construction projects            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ Custom Categories (via "Other")                      │
├──────────────────────────────────────────────────────┤
│ Examples: "Flooring Restoration", "Tile Work", etc. │
│ Selection: Type custom name                         │
│ Customization: Include detailed specs               │
│ Database: is_custom_category = true                 │
│ Badge: [Custom] shown to vendors                    │
│ Use Case: Specialized or unique projects           │
└──────────────────────────────────────────────────────┘
```

## 📊 User Journey

```
BUYER CREATES RFQ
│
├─ Selects predefined category
│  └─ RFQ created normally
│     └─ Vendor sees standard RFQ
│        └─ Quote normally
│
└─ Selects "Other" category
   ├─ Enters custom category name (required)
   ├─ Enters custom details (optional)
   │
   └─ RFQ created with custom flag
      └─ Database: is_custom_category = true
         └─ Vendor sees custom badge
            ├─ Vendor sees additional specifications
            └─ Vendor quotes with context
```

## 🔍 Search & Filter

```
FINDING RFQs WITH CUSTOM CATEGORIES

All RFQs:
├─ Predefined: Carpentry (10)
├─ Predefined: Plumbing (8)
├─ Custom: Flooring Restoration (3) ← New type
├─ Custom: Tile Work (2) ← New type
└─ Predefined: Roofing (5)

Filter by custom:
└─ is_custom_category = true
   ├─ Flooring Restoration (3)
   └─ Tile Work (2)

Search by custom category name:
└─ "Flooring" → finds "Flooring Restoration" RFQs
```

## 🚀 Technical Stack

```
Frontend Component Layer
│
├─ DirectRFQPopup.js
│  ├─ Category dropdown
│  ├─ "Other" option
│  ├─ Conditional custom fields
│  └─ Form validation
│
└─ RFQ Response Page
   ├─ RFQ summary card
   ├─ Custom badge
   └─ Additional specs section

Data Layer
│
├─ Supabase Client
│  ├─ Insert RFQ with custom fields
│  ├─ Query by is_custom_category
│  └─ Fetch custom_details
│
└─ RFQs Table
   ├─ category (standard or custom)
   ├─ is_custom_category (flag)
   ├─ custom_details (specs)
   └─ Indexes for performance
```

## ✅ Validation Rules

```
Form Submission Checklist

Required Fields:
 ☑ Title
 ☑ Description
 ☑ Category (predefined OR custom)
 ☑ If category="Other":
    ☑ Custom category name (must not be empty)

Optional Fields:
 ☐ Custom details (encouraged but not required)
 ☐ Budget
 ☐ Location

Validation Logic:
1. User selects category
2. If "Other" selected:
   → Show custom category field
   → Make it required
   → Validate before submission
3. If predefined selected:
   → Hide custom fields
   → Normal validation
4. Submit only if all requirements met
```

## 📱 User-Friendly Messages

```
STEP 1: Category Selection
"Please select a category"
└─ [Category dropdown ▼]
   └─ Plumbing
      Electrical
      ...
      Other (Please specify)

STEP 2: User Clicks "Other"
"Please specify your category"
└─ [Text input for custom category]
   └─ "e.g., Plumbing, Roofing, Electrical, etc."

STEP 3: Optional Details
"Additional details (optional)"
└─ [Textarea for specs]
   └─ "e.g., floor types, roofing materials, specific requirements"
   └─ "ℹ️ This helps vendors better understand your specific needs"

STEP 4: Validation Error
"❌ Please specify your category"
└─ Custom category field is required when "Other" is selected

STEP 5: Success
"✅ Request sent successfully!"
└─ RFQ created with custom category
```

---

**For more details, see:**
- `OTHER_CATEGORY_FEATURE.md` - Complete documentation
- `SETUP_OTHER_CATEGORY.md` - Migration guide
- Code: `components/DirectRFQPopup.js` and vendor respond page
