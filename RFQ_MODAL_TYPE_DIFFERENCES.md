# 📋 RFQ Types - Design & Differences

## Overview

The RFQ Modal maintains **clear visual and functional distinctions** between three RFQ types:

1. **Direct RFQ** - Send to specific vendors only
2. **Wizard RFQ** - Suggest vendors but allow open responses
3. **Public RFQ** - Open to all matching vendors

---

## Visual & Functional Differences

### 1️⃣ DIRECT RFQ

**Header**:
- Title: "Create Direct RFQ"
- Subtitle: "Send directly to specific vendors"

**Step 4: Recipients (Unique)**
```
┌─────────────────────────────────────┐
│ Select Vendors (REQUIRED)           │
├─────────────────────────────────────┤
│ Choose at least one vendor to       │
│ receive your RFQ.                   │
│                                      │
│ ☐ Vendor A (Company Inc)            │
│ ☐ Vendor B (Services Co)            │
│ ☑ Vendor C (Premium Builders)       │
│                                      │
│ [Error if no vendors selected]      │
└─────────────────────────────────────┘
```

**Key Features**:
- ✅ Vendor selection is **REQUIRED**
- ✅ Vendors filtered by **category & county**
- ✅ Only **verified vendors** shown
- ✅ Multiple selection allowed
- ✅ Clear error if none selected
- ✅ NO "open to others" option

**Submission**:
- Only selected vendors receive the RFQ
- Response type: "direct"
- No public visibility

**Use Case**:
- When you know exactly which vendors you want to contact
- Confidential projects
- Pre-qualified vendor lists

---

### 2️⃣ WIZARD RFQ

**Header**:
- Title: "Create Guided RFQ"
- Subtitle: "Suggest vendors but accept open responses"

**Step 4: Recipients (Different)**
```
┌─────────────────────────────────────────┐
│ Vendor Matching (OPTIONAL)              │
├─────────────────────────────────────────┤
│ Pre-suggest vendors (optional)           │
│                                          │
│ ☐ Vendor A                              │
│ ☑ Vendor B                              │
│ ☐ Vendor C                              │
│                                          │
├─────────────────────────────────────────┤
│ ☑ Allow other vendors to respond        │
│                                          │
│ Vendors not suggested above can also    │
│ submit responses.                       │
└─────────────────────────────────────────┘
```

**Key Features**:
- ✅ Vendor pre-suggestions are **OPTIONAL**
- ✅ "Allow other vendors" checkbox **VISIBLE**
- ✅ Checkbox **ENABLED BY DEFAULT**
- ✅ Can pre-suggest vendors for better matches
- ✅ Can disable to allow only suggested vendors
- ✅ More flexible than Direct

**Submission**:
- Selected vendors get notified
- But other vendors can also respond
- Response type: "suggested" for selected, "open" for others
- Mix of matching and organic responses

**Use Case**:
- Want some pre-matched vendors but stay open
- Building in new areas (want suggestions + open)
- Collaborative marketplace approach

---

### 3️⃣ PUBLIC RFQ

**Header**:
- Title: "Create Public RFQ"
- Subtitle: "Open to all matching vendors"

**Step 4: Recipients (Completely Different)**
```
┌──────────────────────────────────────┐
│ RFQ Settings                         │
├──────────────────────────────────────┤
│ Who can see this RFQ?                │
│ [Category ▼]                         │
│ • All vendors in this category       │
│ • Vendors in this county             │
│ • Vendors in this state              │
│ • All vendors nationwide             │
│                                       │
│ How many responses do you want?      │
│ [Up to 5 responses ▼]                │
│ • Up to 5 responses                  │
│ • Up to 10 responses                 │
│ • Up to 25 responses                 │
│ • Up to 50 responses                 │
│ • Unlimited responses                │
│                                       │
│ You'll receive responses in order    │
│ received until the limit is reached. │
└──────────────────────────────────────┘
```

**Key Features**:
- ✅ **NO vendor selection** (automatic matching)
- ✅ **Visibility scope dropdown** (category/county/state/national)
- ✅ **Response limit dropdown** (5/10/25/50/unlimited)
- ✅ Completely different UI from Direct/Wizard
- ✅ Algorithmically matched to vendors
- ✅ High transparency and competition

**Submission**:
- Auto-matched to vendors based on scope
- All matching vendors get notified
- Competitive bidding format
- First X responses received win

**Use Case**:
- Large projects requiring competition
- Transparent marketplace bidding
- Want best price/quality from market
- Public procurement style

---

## Side-by-Side Comparison

| Feature | Direct | Wizard | Public |
|---------|--------|--------|--------|
| **Step 4 Title** | Select Vendors | Vendor Matching | RFQ Settings |
| **Vendor Selection** | REQUIRED | OPTIONAL | NONE (auto) |
| **Select Multiple** | Yes | Yes | No selection |
| **"Allow Others" Option** | ❌ Hidden | ✅ Visible | N/A |
| **Default Open** | ❌ No | ✅ Yes | ✅ Always |
| **Visibility Scope** | ❌ No | ❌ No | ✅ Yes |
| **Response Limit** | ❌ No | ❌ No | ✅ Yes |
| **UI Type** | Checkbox list | Checkbox list | Dropdowns |
| **Filtered By** | Category + County | Category + County | Selection scope |
| **Vendor Count** | Few (targeted) | Few + open | Many (all matching) |
| **Response Type** | Directed | Mixed | Competitive |

---

## Step-by-Step Differences

### Step 1: Category (ALL SAME)
```
All types show category selection + optional job type
No differences
```

### Step 2: Details (ALL SAME)
```
All types show dynamic template fields based on job type
Image upload section available for all
No differences (except image support is same for all)
```

### Step 3: Project (ALL SAME)
```
All types ask for project title, summary, budget, dates
Location (county/town/directions) same
No differences
```

### Step 4: Recipients (DIFFERENT ⭐)
```
DIRECT: Vendor selection list (required)
WIZARD: Vendor selection list (optional) + "allow others" checkbox
PUBLIC: Visibility scope + response limit dropdowns
```

### Step 5: Auth (ALL SAME)
```
All types verify user authentication
No differences
```

### Step 6: Review (ALL DIFFERENT ⭐⭐)
```
DIRECT:
  • Shows selected vendors
  • "X vendors will receive this RFQ"
  
WIZARD:
  • Shows suggested vendors
  • Shows "Allow other vendors: Yes/No"
  • "Suggested vendors + others can respond"
  
PUBLIC:
  • Shows "Open to: Category vendors" (based on scope)
  • Shows "Response limit: X"
  • "All matching vendors can respond"
```

### Step 7: Success (DIFFERENT ⭐)
```
DIRECT:
  "Your RFQ has been sent to X vendors"
  
WIZARD:
  "Your RFQ has been posted. Suggested vendors notified,
   others can also respond."
  
PUBLIC:
  "Your RFQ is live! Vendors are competing for your project.
   First X responses received will be contacted."
```

---

## Validation Rules by Type

### DIRECT
✅ Must select at least 1 vendor
✅ No "allow others" option
✅ Error if trying to submit without vendors

### WIZARD
✅ Can submit with 0 or more vendors (optional)
✅ "Allow others" must be explicitly set
✅ Default is "allow others = true"
✅ Can't uncheck if 0 vendors selected

### PUBLIC
✅ No vendor selection needed
✅ Visibility scope is required
✅ Response limit is required
✅ Auto-validates scope dropdowns

---

## Styling Differences

### Colors & Branding
All use the same **orange primary** (#f97316) for consistency

But text/messaging differs:

**Direct**: Emphasis on "control" and "targeting"
```
"Choose at least one vendor"
"Send directly to specific vendors"
"Your RFQ has been sent to..."
```

**Wizard**: Emphasis on "matching" and "openness"
```
"Pre-suggest vendors (optional)"
"Allow other vendors to respond"
"Suggested vendors notified, others can also respond"
```

**Public**: Emphasis on "marketplace" and "competition"
```
"Who can see this RFQ?"
"How many responses do you want?"
"All matching vendors can compete"
"First X responses received will be contacted"
```

---

## Key Differences Checklist

### Step 4 (Recipients) - MAIN VISUAL DIFFERENCE
```
✅ DIRECT: Vendor list only, required selection, no toggles
✅ WIZARD: Vendor list optional, + "allow others" toggle
✅ PUBLIC: Dropdowns only, no vendor selection
```

### Step 6 (Review) - SECONDARY VISUAL DIFFERENCE
```
✅ DIRECT: "Sending to X vendors"
✅ WIZARD: "Suggesting X vendors, allowing open responses"
✅ PUBLIC: "Open to category/county/state/national, limit X"
```

### Step 7 (Success) - MESSAGING DIFFERENCE
```
✅ DIRECT: Confirmation + vendor count
✅ WIZARD: Confirmation + notification status
✅ PUBLIC: Confirmation + marketplace messaging
```

---

## Components That Check RFQ Type

### RFQModal.jsx
```javascript
// Determines which validation rules to apply
if (rfqType === 'direct') { require vendors }
if (rfqType === 'wizard') { vendors optional }
if (rfqType === 'public') { ignore vendors }
```

### StepRecipients.jsx
```javascript
// Different UI for each type
{rfqType === 'direct' && <DirectVendorSelection />}
{rfqType === 'wizard' && <WizardVendorSelection />}
{rfqType === 'public' && <PublicSettings />}
```

### StepReview.jsx
```javascript
// Different review displays
{rfqType === 'direct' && <DirectReview vendors={selectedVendors} />}
{rfqType === 'wizard' && <WizardReview vendors={selectedVendors} />}
{rfqType === 'public' && <PublicReview scope={visibilityScope} />}
```

### StepSuccess.jsx
```javascript
// Different success messages
const messages = {
  direct: `RFQ sent to ${vendorCount} vendors`,
  wizard: `RFQ posted with suggestions and open responses`,
  public: `RFQ is live and visible to matching vendors`
}
```

### ModalHeader.jsx
```javascript
// Different header for each type
const titles = {
  direct: 'Create Direct RFQ',
  wizard: 'Create Guided RFQ',
  public: 'Create Public RFQ'
}
```

---

## Database Differences

### RFQ Record
```json
{
  "id": "uuid",
  "rfq_type": "direct" | "wizard" | "public",
  "visibility": "private" | "matching" | "public",
  
  // DIRECT only
  "selected_vendors": ["vendor_id_1", "vendor_id_2"],
  "allow_other_vendors": false,
  
  // WIZARD only
  "selected_vendors": ["vendor_id_1"],
  "allow_other_vendors": true,
  
  // PUBLIC only
  "visibility_scope": "category" | "county" | "state" | "national",
  "response_limit": 5 | 10 | 25 | 50 | 999
}
```

### Recipients Table
```sql
-- DIRECT: Explicitly created recipients
INSERT INTO rfq_recipients (rfq_id, vendor_id, recipient_type)
VALUES (rfq_id, vendor_id, 'direct');

-- WIZARD: Suggested recipients + algorithm finds open
INSERT INTO rfq_recipients (rfq_id, vendor_id, recipient_type)
VALUES (rfq_id, vendor_id, 'suggested');
-- Other vendors auto-matched by algorithm

-- PUBLIC: Auto-matched based on visibility_scope
-- Algorithm finds all vendors in scope
```

---

## User Communication

### When Opening Modal

**Direct RFQ Trigger**:
> "Send RFQ to vendors you already know. You select which vendors to contact directly."

**Wizard RFQ Trigger**:
> "Get smart vendor suggestions and stay open to other options. Suggested vendors get priority."

**Public RFQ Trigger**:
> "Post your project publicly. All matching vendors can compete for your business."

---

## Design Principles Maintained

✅ **Clarity**: Each type's purpose is immediately obvious  
✅ **Consistency**: Similar questions asked at same steps  
✅ **Distinction**: Different workflows are visually different  
✅ **Logic**: UI follows the business logic  
✅ **Simplicity**: Users only see relevant options  
✅ **Validation**: Each type validates its specific needs  

---

## Future Enhancement Ideas

### Direct
- [ ] Bulk vendor upload (CSV)
- [ ] Vendor groups/favorites
- [ ] Save vendor lists as templates

### Wizard
- [ ] Custom matching algorithm
- [ ] Weight vendor scores
- [ ] Auto-suggest top vendors

### Public
- [ ] Featured placement option
- [ ] Bidding wars (auto-increase responses)
- [ ] Transparency score
- [ ] Public vendor ranking

---

## Testing Checklist

### Direct RFQ
- [ ] Vendor selection required
- [ ] Error if no vendors selected
- [ ] Can select multiple vendors
- [ ] "Allow others" toggle NOT visible
- [ ] Review shows selected vendors
- [ ] Success message shows vendor count

### Wizard RFQ
- [ ] Vendor selection optional (can skip)
- [ ] "Allow others" toggle VISIBLE
- [ ] "Allow others" checked by default
- [ ] Can disable "allow others"
- [ ] Review shows vendors and toggle state
- [ ] Success message mentions open responses

### Public RFQ
- [ ] No vendor selection (hidden entirely)
- [ ] Visibility scope dropdown visible
- [ ] Response limit dropdown visible
- [ ] Both dropdowns required
- [ ] Review shows scope and limit
- [ ] Success message uses marketplace language

---

**Status**: ✅ **All type differences implemented and maintained**

Each RFQ type maintains its own distinct user experience while sharing common questions and data structure.

---

*Last Updated: January 2, 2026*
*Maintained by: Design System*
*Version: 1.0*
