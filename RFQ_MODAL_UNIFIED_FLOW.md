# Unified RFQ Modal Flow Design

**Date:** January 1, 2026  
**Version:** 1.0  
**Status:** Design Document  
**Scope:** All three RFQ types (Direct, Wizard, Public)

---

## Executive Summary

All three RFQ types (Direct, Wizard, Public) follow a **single 7-step modal flow** with type-specific customization at **Step 4: Recipients**. This document defines the shared engine and the three divergence points.

### Key Principle

> One modal, seven shared steps, three different Step 4 implementations.

---

## 1. Shared Modal Structure

### Entry Points

User clicks button → State Change:
```javascript
{
  isOpen: true,
  rfqType: 'direct' | 'wizard' | 'public',
  currentStep: 'category'
}
```

### Modal Container

**Mobile:** Full-screen overlay  
**Desktop:** Centered panel (600px width, 80vh max-height)

### Modal Header (All Steps)

```
┌─────────────────────────────────────────┐
│ [←] Title (dynamic)    [×] (close)      │
│     Subtitle (1-line explanation)       │
│     Step X of 7 • Category / Details... │
└─────────────────────────────────────────┘
```

**Title by RFQ Type:**
- Direct: "Send Direct RFQ"
- Wizard: "Smart RFQ (Let Zintra Match Vendors)"
- Public: "Post Public RFQ"

**Subtitle by RFQ Type:**
- Direct: "Select specific vendors you trust"
- Wizard: "We'll find the right vendors for you"
- Public: "Post your project and let vendors find you"

### Step Indicator

```
Step 1 of 7 • Category → Details → Project → Recipients → Auth → Review → Success
```

Visual: Progress bar with step labels

---

## 2. Step-by-Step Flow

### STEP 1: Category & Job Type Selection

**Goal:** Choose what kind of work this RFQ is for.

**Header:**
```
What kind of work do you need?
Select a category and specific job type.
```

#### UI: Category Grid

```
┌─────────────────┬─────────────────┬─────────────────┐
│ 🏛️ Architectural│ 🏗️ Building &   │ 🏠 Roofing &    │
│ & Design        │ Masonry         │ Waterproofing   │
└─────────────────┴─────────────────┴─────────────────┘
┌─────────────────┬─────────────────┬─────────────────┐
│ 🪟 Doors,      │ 🟫 Flooring &   │ 🚿 Plumbing &   │
│ Windows & Glass │ Wall Finishes   │ Drainage        │
└─────────────────┴─────────────────┴─────────────────┘
... (20 categories total in responsive grid)
```

**Card Styling:**
- Clickable card with icon, title
- On hover: light shadow
- On select: orange border, highlight
- On select: description appears below grid

**Description (after selection):**
```
Roofing & Waterproofing – for new roofs, re-roofing, leak 
repairs, waterproofing slabs and damp walls.
```

#### UI: Job Type Selection

**Appears once category is selected:**
```
Now, what's your specific job type?

○ New roof for a building
○ Re-roofing / replacement
○ Leak repair & small fixes
○ Waterproofing a slab/roof only
○ Other (describe below)
```

**Styling:** Radio buttons in card list format

#### Validation

- ✅ Proceed: Both category & jobType selected
- ❌ Block: Either missing

#### Navigation

| Button | Action | Next Step |
|--------|--------|-----------|
| Back | Disabled | — |
| Next | Load template, advance | 'template' |

---

### STEP 2: Template-Specific Questions

**Goal:** Ask category-specific questions relevant to the chosen job type.

**Header:**
```
Tell us more about your [jobType label]
```

**Example (Roofing: "New roof for a building"):**

```
┌────────────────────────────────────────┐
│ TYPE OF JOB (select)                   │
│ [Dropdown: New roof, Re-roofing, ...]  │
│                                        │
│ ROOF TYPE (select)                     │
│ [Dropdown: Tiles, Mabati, Shingles...] │
│                                        │
│ APPROX ROOF SIZE (text)                │
│ [Input: "e.g. 10m × 12m, 3-bed house"] │
│                                        │
│ EXISTING SITUATION (select)            │
│ [Dropdown: No roof, Old roof in place] │
│                                        │
│ VISIBLE ISSUES (textarea)              │
│ [Long text: "Leaks, ceiling stains..."]│
│                                        │
│ MATERIAL/BRAND PREFERENCE (textarea)   │
│ [Long text]                            │
└────────────────────────────────────────┘
```

#### Field Rendering Rules

**From template JSON, each field has:**
- `name` – field ID
- `label` – display label
- `type` – text, textarea, select, radio, number, date, email, checkbox
- `placeholder` – hint text
- `options` – for select/radio
- `required` – boolean
- `help` – optional explanation (future: info icon)

#### Validation

- Show error inline only after "Next" is clicked
- Required fields are marked with `*`
- Error message below field: "This field is required"

#### Navigation

| Button | Action | Next Step |
|--------|--------|-----------|
| Back | Keep data, go back | 'category' |
| Next | Validate template fields | 'general' |

---

### STEP 3: General Project Info

**Goal:** Capture universal project details (location, budget, timing).

**Header:**
```
Tell us about your project
```

#### Section 1: Project Basics

```
PROJECT TITLE (optional)
[Text input: "e.g., Kitchen Renovation, New Fence"]

PROJECT SUMMARY (textarea)
[Rephrase or expand on the category-specific info]
[Placeholder: "In a few sentences, describe your project..."]
```

#### Section 2: Location

```
COUNTY *
[Dropdown: Nairobi, Mombasa, Kisumu, ...]

TOWN / ESTATE *
[Text input: "e.g., Westlands, Athi River"]

DIRECTIONS / NEARBY LANDMARK (optional)
[Textarea: "e.g., Near the shopping center on Ngong Road"]
```

#### Section 3: Budget & Timing

```
BUDGET RANGE *
[Number input] KES  to  [Number input] KES

BUDGET LEVEL (optional)
○ Budget-conscious (≤KES 50k)
○ Mid-range (KES 50k–500k)
○ Premium (>KES 500k)

DESIRED START DATE (optional)
[Select or text:]
○ ASAP
○ Within 1 month
○ Within 3 months
○ Date picker: [date]
```

#### Validation

- Required fields: county, town (location), budget_min, budget_max
- budget_min < budget_max (error: "Min must be less than max")

#### Navigation

| Button | Action | Next Step |
|--------|--------|-----------|
| Back | Keep data | 'template' |
| Next | Validate general fields | 'recipients' |

---

### STEP 4: Recipients Step (Type-Specific)

**Goal:** Vary based on RFQ type (Direct, Wizard, Public).

---

#### 4A. DIRECT RFQ: Choose Vendors

**Header:**
```
Choose vendors to send this RFQ to
Select vendors you'd like to request quotes from.
```

**UI: Vendor Search & Filter**

```
[Search input: "Search vendors, location..."]
Chips: [Nearby] [Top Rated] [Verified]
```

**Vendor List:**

```
┌──────────────────────────────────────────┐
│ ☑ Vendor 1                               │
│   📍 Westlands, Nairobi                  │
│   ⭐⭐⭐⭐⭐ (4.8) | Verified  │
│   Categories: Roofing, Electrical        │
├──────────────────────────────────────────┤
│ ☐ Vendor 2                               │
│   📍 Industrial Area, Nairobi             │
│   ⭐⭐⭐⭐☆ (4.2)                          │
│   Categories: Building, Masonry          │
└──────────────────────────────────────────┘
```

**Info Banner:**
```
You can send this RFQ to up to 10 vendors.
Currently selected: 3 vendor(s).
```

**Validation:**
- At least 1 vendor required

#### Navigation

| Button | Action | Next Step |
|--------|--------|-----------|
| Back | Keep selection | 'general' |
| Next | Validate (≥1 vendor) | 'auth' |

---

#### 4B. WIZARD RFQ: Confirm Matched Vendors

**Header:**
```
We'll match you to the right vendors
Based on your project, here are recommended vendors.
```

**Pre-Filtering Logic:**
```javascript
filteredVendors = vendors.filter(v => 
  v.categories.includes(selectedCategory) &&
  v.location === selectedCounty // or nearby
)
```

**UI: Matched Vendors**

```
┌──────────────────────────────────────────┐
│ ☑ Vendor A                               │
│   📍 Same county as your project         │
│   ⭐⭐⭐⭐⭐ (4.9) | Verified  │
│   Categories: Roofing (match)            │
├──────────────────────────────────────────┤
│ ☑ Vendor B                               │
│   📍 Same county                         │
│   ⭐⭐⭐⭐☆ (4.3) | Verified  │
│   Categories: Roofing, Waterproofing     │
└──────────────────────────────────────────┘

[ ] Also allow other vetted vendors in this 
    category to respond (widens the pool)
```

**Info Banner:**
```
We recommend these vendors based on your 
project type, location, and ratings.
```

**Validation:**
- At least 1 vendor checked OR "allow others" toggle on
- Error: "Select at least one vendor or allow others to respond"

#### Navigation

| Button | Action | Next Step |
|--------|--------|-----------|
| Back | Keep selection | 'general' |
| Next | Validate (vendor or allow_others) | 'auth' |

---

#### 4C. PUBLIC RFQ: Visibility & Response Limits

**Header:**
```
Public RFQ visibility
Your project will be posted where vendors can discover it.
```

**Info Banner:**
```
Your RFQ will be visible to all relevant vendors 
in this category. Vendors can respond if they are interested.
```

**UI: Options**

```
VISIBILITY SCOPE

○ Category only (default)
  Vendors in [Roofing & Waterproofing] category
  
○ Category + nearby counties
  [Roofing & Waterproofing] in Nairobi, Kiambu, 
  Kajiado, Muranga


RESPONSE LIMIT

How many quotes would you like?

○ Up to 5
○ Up to 10
○ No limit
```

**Info Banner (Response Limit):**
```
We'll help manage vendor responses so you're 
not overwhelmed. You can always request more later.
```

**Validation:**
- Visibility scope selected (default: category only)
- Response limit selected (default: up to 5)

#### Navigation

| Button | Action | Next Step |
|--------|--------|-----------|
| Back | Keep settings | 'general' |
| Next | No validation needed | 'auth' |

---

### STEP 5: Auth & RFQ Limits

**Goal:** Authenticate user and enforce free RFQ limits.

**Logic:**

```javascript
if (user.isLoggedIn && user.rfqsThisMonth < 3) {
  // Skip to review
  setCurrentStep('review')
} else {
  // Show auth block
}
```

#### Case 1: Not Logged In

**Header:**
```
Create an account or log in
Your RFQ will be tied to your account.
```

**UI: Tabs**

```
[Log In] [Create Account] [Continue as Guest]

TAB: Log In
[Email input]
[Password input]
[Button: "Log In"]
[Link: "Forgot password?"]

TAB: Create Account
[Email input]
[Password input]
[Phone input] (optional, for OTP later)
[Checkbox: "I agree to Terms..."]
[Button: "Create Account"]

TAB: Continue as Guest
[Email input]
[Phone input] (for contact)
[Info: "Your RFQ will be sent but responses 
go to your email. Create an account anytime 
to see all your RFQs in one place."]
[Button: "Continue"]
```

#### Case 2: Over Free RFQ Limit

**Header:**
```
You've used your free RFQs
Continue with a payment or save for later.
```

**Summary Box:**
```
RFQ Type: Direct
Category: Roofing & Waterproofing
Job Type: New roof
Location: Nairobi, Westlands
Vendor(s): 3
─────────────────────────────
Cost: KES 300
Total RFQs this month: 3 / 3 (free limit reached)
```

**UI: Payment or Save**

```
[Button: "Pay KES 300 & Send RFQ"]
(Opens payment modal later)

OR

[Button: "Save Draft"] (for later)
[Button: "Cancel"]
```

#### Navigation

| State | Button | Action | Next Step |
|-------|--------|--------|-----------|
| Logged in, under limit | — | (skip this step) | 'review' |
| Not logged in | Continue | Validate & create/login | 'review' |
| Over limit | Pay | Process payment | 'review' |
| Over limit | Save | Save draft, close modal | — |

---

### STEP 6: Review & Confirm

**Goal:** Let user verify all details before sending.

**Header:**
```
Review your RFQ before sending
Everything looks good?
```

**Layout: 2-column (desktop) / stacked (mobile)**

#### Left Column: Project Summary

```
PROJECT SUMMARY
┌────────────────────────────────────────┐
│ Title: Kitchen Renovation               │
│ Category: Kitchens & Wardrobes          │
│ Job Type: New kitchen                   │
│ Location: Westlands, Nairobi            │
│ Budget: KES 100k – 500k                │
│ Timeline: Within 1 month                │
│                                        │
│ KEY DETAILS                            │
│ • Material preference: Solid wood       │
│ • Countertop: Granite                  │
│ • Layout: L-shaped kitchen             │
└────────────────────────────────────────┘
```

#### Right Column: Recipients

**For Direct RFQ:**
```
RECIPIENTS (3 vendors)
┌────────────────────────────────────────┐
│ • Vendor A (Roofing expert)            │
│ • Vendor B (Kitchen specialist)        │
│ • Vendor C (Design firm)               │
│                                        │
│ These vendors will be notified via     │
│ email and in their Zintra account.     │
└────────────────────────────────────────┘
```

**For Wizard RFQ:**
```
RECIPIENTS (Matched + open)
┌────────────────────────────────────────┐
│ Recommended: Vendor A, Vendor B        │
│                                        │
│ ✓ Open to other qualified vendors     │
│   in this category                     │
│                                        │
│ Vendors matching your project will    │
│ be notified and can respond.          │
└────────────────────────────────────────┘
```

**For Public RFQ:**
```
RECIPIENTS (Public posting)
┌────────────────────────────────────────┐
│ Scope: Roofing & Waterproofing         │
│ Location: Nairobi, Kiambu              │
│ Limit: Up to 5 vendor responses        │
│                                        │
│ Your RFQ will be visible to all       │
│ vendors in this category. Interested  │
│ vendors will respond directly.        │
└────────────────────────────────────────┘
```

#### Info Notice

```
You'll receive responses by email and 
inside your Zintra account (Inbox section).
```

#### Navigation

| Button | Action | Next Step |
|--------|--------|-----------|
| Back | Keep data | 'auth' |
| Send RFQ | POST /api/rfq/create | 'success' |

**On Send Click:**
- Disable button, show "Sending..."
- Create RFQ record in DB
- Create rfq_recipients entries
- Notify vendors (async email)
- Advance to success

---

### STEP 7: Success Screen

**Header:**
```
🎉 Your RFQ has been sent!
```

**Content:**

**For Direct RFQ:**
```
Your RFQ has been sent to 3 vendor(s).

You'll be notified when they respond with quotes.
Check your email and Zintra inbox for updates.

Your RFQ ID: rfq_abc123
```

**For Wizard RFQ:**
```
Your RFQ is now live on Zintra.

Vendors matching your project will be notified.
You'll receive their responses in your inbox.

Your RFQ ID: rfq_abc123
```

**For Public RFQ:**
```
Your RFQ is now posted publicly.

Vendors in this category can discover and 
respond to your project. You'll see all 
responses in your Zintra inbox.

Your RFQ ID: rfq_abc123
```

#### Navigation Buttons

```
[View RFQ Details] → Navigate to /rfq/[id], close modal
[Close Modal] → Just close
[Back to Home] → Navigate to /, close modal
```

---

## 3. Complete Flow Diagram

```
START
  ↓
┌─────────────────────────────────────────┐
│ STEP 1: Category & Job Type             │
│ (All RFQ types identical)               │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ STEP 2: Template-Specific Questions     │
│ (All RFQ types identical)               │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ STEP 3: General Project Info            │
│ (All RFQ types identical)               │
└─────────────────────────────────────────┘
  ↓
┌──────────┬──────────┬──────────┐
│  DIRECT  │  WIZARD  │  PUBLIC  │
├──────────┼──────────┼──────────┤
│ STEP 4A: │ STEP 4B: │ STEP 4C: │
│ Choose   │ Confirm  │ Visibility
│ Vendors  │ Matched  │ Settings │
│          │ + Allow  │          │
└──────────┴──────────┴──────────┘
  ↓
┌─────────────────────────────────────────┐
│ STEP 5: Auth & RFQ Limits               │
│ (All RFQ types identical)               │
│ (Skip if logged in + under limit)       │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ STEP 6: Review & Confirm                │
│ (Varies slightly by RFQ type)           │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ STEP 7: Success Screen                  │
│ (Varies by RFQ type)                    │
└─────────────────────────────────────────┘
  ↓
END (User navigates to /rfq/[id] or closes)
```

---

## 4. Data Structure

### Modal State

```javascript
{
  isOpen: boolean,
  rfqType: 'direct' | 'wizard' | 'public',
  currentStep: 'category' | 'template' | 'general' | 
               'recipients' | 'auth' | 'review' | 'success',
  
  // Step 1: Category & Job Type
  selectedCategory: string,
  selectedJobType: string,
  
  // Step 2: Template Fields
  templateFields: {
    [fieldName]: value,
    ...
  },
  
  // Step 3: General Project Info
  projectTitle: string,
  projectSummary: string,
  county: string,
  town: string,
  directions: string,
  budgetMin: number,
  budgetMax: number,
  budgetLevel: string,
  desiredStartDate: string,
  
  // Step 4: Recipients (varies by type)
  // Direct:
  selectedVendors: string[], // vendor IDs
  
  // Wizard:
  selectedVendors: string[],
  allowOtherVendors: boolean,
  
  // Public:
  visibilityScope: 'category' | 'category_nearby',
  responseLimit: 5 | 10 | 999, // 999 = no limit
  
  // Step 5: Auth
  user: { id, email, phone },
  
  // Step 6: Submitted RFQ
  rfqId: string,
}
```

### RFQ Database Record

```javascript
{
  id: "rfq_xxx",
  user_id: "user_xxx",
  buyer_id: "user_xxx",
  title: "Kitchen Renovation",
  description: "Project summary",
  category: "Kitchens & Wardrobes",
  job_type: "New kitchen",
  location: "Westlands",
  county: "Nairobi",
  budget_min: 100000,
  budget_max: 500000,
  timeline: "1 month",
  rfq_type: "direct" | "wizard" | "public",
  visibility: "private" (for direct), "matching" (for wizard), "public",
  status: "open",
  details: { // template field responses
    material_preference: "Solid wood",
    countertop: "Granite",
    ...
  },
  response_limit: 5 | 10 | 999 | null,
  created_at: timestamp,
  published_at: timestamp,
}
```

### RFQ Recipients Record

```javascript
{
  id: "rfq_rec_xxx",
  rfq_id: "rfq_xxx",
  vendor_id: "vendor_xxx",
  recipient_type: "direct" | "suggested" | "public",
  status: "pending" | "seen" | "quoted" | "rejected",
  created_at: timestamp,
}
```

---

## 5. Implementation Roadmap

### Phase 1: Modal Shell & Navigation
- [ ] Create `RFQModal.jsx` (container)
- [ ] Build step indicator component
- [ ] Create navigation logic (next/back/skip)
- [ ] Modal styling (mobile-responsive)

### Phase 2: Shared Steps (1, 2, 3)
- [ ] Step 1: Category & Job Type picker
- [ ] Step 2: Template field renderer
- [ ] Step 3: General project form
- [ ] State management for shared data

### Phase 3: Type-Specific Steps (4A, 4B, 4C)
- [ ] Step 4A: Direct vendor selection
- [ ] Step 4B: Wizard vendor matching + toggle
- [ ] Step 4C: Public visibility settings

### Phase 4: Auth & Review
- [ ] Step 5: Auth logic & RFQ limit checks
- [ ] Step 6: Review screen (all variants)
- [ ] Step 7: Success screen

### Phase 5: Backend Integration
- [ ] API endpoint: POST /api/rfq/create
- [ ] Vendor notifications
- [ ] Email templates

### Phase 6: Testing & Refinement
- [ ] E2E testing all three flows
- [ ] Mobile responsiveness
- [ ] Error handling & edge cases
- [ ] Performance optimization

---

## 6. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| One modal, three types | Reduces code duplication, consistent UX |
| Step divergence at #4 only | Steps 1-3 identical for all, 5-7 mostly identical |
| Template fields in Step 2 | Category context fresh, improves data quality |
| Skip auth if logged in | Faster experience for returning users |
| Response limits for public | Prevents vendor spam, manageable inbox |
| Cards for category picker | Better UX than dropdown, visual distinction |
| Radio buttons for job type | Prominent choices, typical for 3-5 options |

---

## 7. Future Enhancements

1. **Conditional fields** – Show/hide template fields based on previous answers
2. **Draft saving** – Save incomplete RFQs, resume later
3. **Template uploads** – Let users upload images/documents in Step 2
4. **Smart matching** – ML-based vendor recommendations for Wizard
5. **AI suggestions** – Auto-fill fields based on category + location
6. **Multi-language** – Support Swahili, other languages
7. **Analytics** – Track which categories, fields, vendors perform best

---

## 8. Success Criteria

✅ All three RFQ types share common Steps 1-3  
✅ Type-specific logic isolated to Step 4  
✅ Modal responsive on mobile & desktop  
✅ Less code duplication vs. three separate pages  
✅ Single entry point (trigger button) for all types  
✅ Fast user experience (< 10 clicks to send)  
✅ Clear instructions at each step  
✅ Error handling & validation consistent across all types  

---

## Appendix: Field Type Examples

### Text Input
```jsx
<input 
  type="text"
  placeholder="e.g., Kitchen Renovation"
  value={value}
  onChange={(e) => onChange(e.target.value)}
/>
```

### Textarea
```jsx
<textarea 
  placeholder="Describe your project in detail..."
  value={value}
  onChange={(e) => onChange(e.target.value)}
  rows={4}
/>
```

### Select Dropdown
```jsx
<select value={value} onChange={(e) => onChange(e.target.value)}>
  <option>Choose an option</option>
  {options.map(opt => <option key={opt}>{opt}</option>)}
</select>
```

### Radio Buttons
```jsx
{options.map(opt => (
  <label key={opt}>
    <input 
      type="radio" 
      name={fieldName}
      value={opt}
      checked={value === opt}
      onChange={(e) => onChange(e.target.value)}
    />
    {opt}
  </label>
))}
```

### Date Picker
```jsx
<input 
  type="date"
  value={value}
  onChange={(e) => onChange(e.target.value)}
/>
```

---

**Document Status:** ✅ Ready for Development  
**Next Step:** Build modal shell and implement shared Step 1-3  
**Estimated Dev Time:** 3-4 days (Phase 1-4)

