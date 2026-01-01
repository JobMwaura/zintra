# Unified RFQ Modal - Visual Diagrams

**Date:** January 1, 2026  
**Version:** 1.0  
**Purpose:** ASCII diagrams and visual references for the unified flow

---

## 1. Main Flow Diagram

```
USER ACTION
    │
    ├─→ [Send Direct RFQ] button → RFQModal({ rfqType: 'direct' })
    ├─→ [Smart RFQ] button       → RFQModal({ rfqType: 'wizard' })
    └─→ [Public RFQ] button      → RFQModal({ rfqType: 'public' })

MODAL OPENS
    │
    ↓ (all three types start here)

┌──────────────────────────────────────────┐
│ STEP 1: Category & Job Type              │
│ ┌──────────────────────────────────────┐ │
│ │ Grid of 20 categories                │ │
│ │ [🏛️] [🏗️] [🏠] [🪟] [🟫] [🚿] ...  │ │
│ │                                      │ │
│ │ Select category → Job types appear  │ │
│ │ ○ Job type 1                        │ │
│ │ ○ Job type 2                        │ │
│ │ ○ Job type 3                        │ │
│ └──────────────────────────────────────┘ │
│ [← Back] [Next →]                        │
└──────────────────────────────────────────┘
    │
    ↓

┌──────────────────────────────────────────┐
│ STEP 2: Template Fields                  │
│ ┌──────────────────────────────────────┐ │
│ │ Tell us about your [Job Type]        │ │
│ │                                      │ │
│ │ [Field 1: Select]    ▼               │ │
│ │ [Field 2: Text]      [__________]    │ │
│ │ [Field 3: Radio]     ○ ○ ○           │ │
│ │ [Field 4: Textarea]  [_________]    │ │
│ │                      [_________]    │ │
│ │ [Field 5: Number]    [__________]    │ │
│ └──────────────────────────────────────┘ │
│ [← Back] [Next →]                        │
└──────────────────────────────────────────┘
    │
    ↓

┌──────────────────────────────────────────┐
│ STEP 3: General Project Info             │
│ ┌──────────────────────────────────────┐ │
│ │ Project Title: [__________________]  │ │
│ │ Summary: [_______________________]  │ │
│ │          [_______________________]  │ │
│ │                                      │ │
│ │ County: [Dropdown ▼]                │ │
│ │ Town: [__________________]          │ │
│ │                                      │ │
│ │ Budget: KES [________] - [________] │ │
│ │ Start: [Date picker ▼]             │ │
│ └──────────────────────────────────────┘ │
│ [← Back] [Next →]                        │
└──────────────────────────────────────────┘
    │
    ↓ DIVERGENCE POINT >>>>>>>>>>>>>>>>>>>>>>>
    │
    ├─────────────────────┬──────────────────┬──────────────────┐
    │                     │                  │                  │
    ↓ rfqType=direct     ↓ rfqType=wizard   ↓ rfqType=public   │
                                                                  │
┌─────────────────────┐ ┌─────────────────┐ ┌────────────────┐  │
│ STEP 4A: Direct     │ │ STEP 4B: Wizard │ │ STEP 4C: Public│  │
│ Vendors             │ │ Matching        │ │ Visibility     │  │
├─────────────────────┤ ├─────────────────┤ ├────────────────┤  │
│ [Search box]        │ │ [Auto-matched]  │ │ Scope:         │  │
│                     │ │                 │ │ ○ Category     │  │
│ ☑ Vendor A          │ │ ☑ Vendor A      │ │ ○ Nearby       │  │
│ ☐ Vendor B          │ │ ☑ Vendor B      │ │                │  │
│ ☑ Vendor C          │ │ ☐ Vendor C      │ │ Limit:         │  │
│ ☐ Vendor D          │ │                 │ │ ○ 5            │  │
│ ☐ Vendor E          │ │ [ ] Allow       │ │ ○ 10           │  │
│                     │ │     others?     │ │ ○ No limit     │  │
│ 3 selected          │ │                 │ │                │  │
└─────────────────────┘ │ 2 selected +    │ └────────────────┘  │
                        │ others allowed  │                     │
                        └─────────────────┘                     │
                                                                  │
    ┌───────────────────┬───────────────────┬──────────────────┐
    │                   │                   │                  │
    └─→ Next           └─→ Next            └─→ Next           │
                                                                  │
                           ↓ (all three converge again)         │
                                                                  │
                    ┌──────────────────────────┐               │
                    │ STEP 5: Auth & Limits    │               │
                    ├──────────────────────────┤               │
                    │                          │               │
                    │ If logged in +           │               │
                    │ under limit:             │               │
                    │ → SKIP to Step 6         │               │
                    │                          │               │
                    │ Else:                    │               │
                    │ [Log In] [Sign Up]       │               │
                    │ Or [Pay KES 300]         │               │
                    └──────────────────────────┘               │
                           │                                     │
                           ↓                                     │
                                                                  │
                    ┌──────────────────────────┐               │
                    │ STEP 6: Review           │               │
                    ├──────────────────────────┤               │
                    │                          │               │
                    │ [Project Summary]        │               │
                    │ Title: Kitchen...        │               │
                    │ Budget: KES 100k-500k   │               │
                    │ ...                      │               │
                    │                          │               │
                    │ [Recipients - varies]    │               │
                    │ Direct: "3 vendors"      │               │
                    │ Wizard: "Matched + open" │               │
                    │ Public: "Public posting" │               │
                    └──────────────────────────┘               │
                           │                                     │
                           ↓ [Send RFQ]                         │
                                                                  │
                    ┌──────────────────────────┐               │
                    │ STEP 7: Success          │               │
                    ├──────────────────────────┤               │
                    │                          │               │
                    │ ✓ RFQ Sent/Posted!      │               │
                    │                          │               │
                    │ Direct:                  │               │
                    │ "Sent to 3 vendors"      │               │
                    │                          │               │
                    │ Wizard:                  │               │
                    │ "Matching in progress"   │               │
                    │                          │               │
                    │ Public:                  │               │
                    │ "Now publicly visible"   │               │
                    │                          │               │
                    │ [View Details] [Close]   │               │
                    └──────────────────────────┘               │
                           │                                     │
                           ↓                                     │
                        END                                      │
```

---

## 2. Step 4 Divergence Detail

```
STEP 4: RECIPIENTS (THE ONLY TRUE DIVERGENCE)

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  DIRECT RFQ                WIZARD RFQ            PUBLIC RFQ │
│  ═══════════════════════════════════════════════════════════ │
│                                                             │
│  "Choose vendors to         "Matched                "Set     │
│   send this to"              vendors"               visibility"
│                                                             │
│  APPROACH:                  APPROACH:              APPROACH: │
│  User manually picks        System suggests        No vendor │
│  vendors from list          vendors, user         selection  │
│                             confirms              Visibility │
│  Control: HIGH              Control: MEDIUM       scope only │
│  Effort: MORE               Effort: LESS          Control:   │
│                                                   LOW        │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│ │ [Search: ____]   │ │ Based on:        │ │ Category:    │ │
│ │                  │ │ • Category       │ │ ○ Only       │ │
│ │ ☑ Vendor 1       │ │ • Location       │ │ ○ +Nearby    │ │
│ │ ☐ Vendor 2       │ │ • Rating         │ │              │ │
│ │ ☑ Vendor 3       │ │                  │ │ Response:    │ │
│ │ ☐ Vendor 4       │ │ [Pre-checked]     │ │ ○ 5          │ │
│ │ ☑ Vendor 5       │ │ ☑ Vendor A       │ │ ○ 10         │ │
│ │ ☐ Vendor 6       │ │ ☑ Vendor B       │ │ ○ No limit   │ │
│ │                  │ │ ☐ Vendor C       │ │              │ │
│ │ 3 selected       │ │                  │ │ No vendor    │ │
│ │ (max 10)         │ │ [ ] Also allow   │ │ selection    │ │
│ │                  │ │     other        │ │ needed       │ │
│ │ Validation:      │ │     qualified    │ │              │ │
│ │ ≥1 vendor        │ │     vendors      │ │ Validation:  │ │
│ │                  │ │                  │ │ ≥1 option    │ │
│ │                  │ │ Validation:      │ │ selected     │ │
│ │                  │ │ ≥1 selected      │ │              │ │
│ │                  │ │ OR allow_others  │ │              │ │
│ └──────────────────┘ └──────────────────┘ └──────────────┘ │
│                                                             │
│ NEXT:                       NEXT:                  NEXT:    │
│ Create recipient records    Create recipient       No        │
│ for each selected vendor    records for selected,  recipient │
│ (explicit)                  rest matched auto      records   │
│                             (mixed)                (public)  │
│                                                             │
│ API PAYLOAD:                API PAYLOAD:           API PAYLOAD: │
│ selectedVendors:            selectedVendors:       visibilityScope: │
│ ['v1', 'v3', 'v5']          ['v1', 'v2']           'category_nearby' │
│                             allowOtherVendors:     responseLimit: 5   │
│                             true                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. State Flow Diagram

```
FORM STATE LIFECYCLE

Initial State:
{
  selectedCategory: '',
  selectedJobType: '',
  templateFields: {},
  projectTitle: '',
  county: '',
  town: '',
  budgetMin: '',
  budgetMax: '',
  selectedVendors: [],       // Shared by Direct & Wizard
  allowOtherVendors: false,  // Wizard only
  visibilityScope: '',       // Public only
  responseLimit: 5,          // Public only
}

Step 1: Category & Job Type
  │
  ├─→ selectedCategory = "Roofing & Waterproofing"
  ├─→ selectedJobType = "New roof"
  └─→ Load template fields

Step 2: Template Questions
  │
  └─→ templateFields = {
       roof_type: "Tiles",
       area: "150 m²",
       situation: "Old roof in place",
       issues: "Leaky in corners",
       preference: "Quality tiles"
     }

Step 3: General Project Info
  │
  ├─→ projectTitle = "Home Roofing"
  ├─→ county = "Nairobi"
  ├─→ town = "Westlands"
  ├─→ budgetMin = 100000
  ├─→ budgetMax = 500000
  └─→ BRANCH BASED ON rfqType

  ┌───────────────┬──────────────┬───────────────┐
  │               │              │               │
  ↓ Direct       ↓ Wizard       ↓ Public        │
                                                 │
Step 4A:        Step 4B:         Step 4C:        │
selectedVendors selectedVendors  visibilityScope │
= ['v1','v3']   = ['v1','v2']    = 'category'   │
                allowOthers      responseLimit   │
                = true           = 5             │
                                                 │
  └───────────────┴──────────────┴───────────────┘
  │
  ↓ All converge

Step 5: Auth
  │
  └─→ user = { id, email, phone }

Step 6: Review (data snapshot)
  │
  └─→ All form data ready for final confirmation

Step 7: Success
  │
  └─→ rfqId = "rfq_abc123"
```

---

## 4. Validation Rules Matrix

```
VALIDATION BY STEP & TYPE

STEP 1: Category & Job Type (ALL SAME)
┌──────────────────────────────────┐
│ selectedCategory: required        │
│ selectedJobType: required         │
└──────────────────────────────────┘

STEP 2: Template Fields (ALL SAME)
┌──────────────────────────────────┐
│ For each field.required === true: │
│   • field value must be filled    │
│   • Show error inline if missing  │
└──────────────────────────────────┘

STEP 3: General Project Info (ALL SAME)
┌──────────────────────────────────┐
│ county: required                  │
│ town: required                    │
│ budgetMin: required               │
│ budgetMax: required               │
│ budgetMin < budgetMax: required   │
└──────────────────────────────────┘

STEP 4: Recipients (TYPE-SPECIFIC) ←← DIVERGENCE
┌────────────────────┬────────────────────┬──────────────────┐
│ DIRECT             │ WIZARD             │ PUBLIC           │
├────────────────────┼────────────────────┼──────────────────┤
│ selectedVendors    │ selectedVendors    │ visibilityScope  │
│ .length >= 1       │ .length >= 1       │ required         │
│                    │ OR                 │                  │
│ Error:             │ allowOtherVendors  │ responseLimit    │
│ "Select ≥1 vendor" │ === true           │ required         │
│                    │                    │                  │
│                    │ Error:             │ Error:           │
│                    │ "Select vendors    │ "Set visibility  │
│                    │ or allow others"   │ and limit"       │
└────────────────────┴────────────────────┴──────────────────┘

STEP 5: Auth (ALL SAME)
┌──────────────────────────────────┐
│ user: required                    │
│ If over RFQ limit: payment        │
│   confirmation required           │
└──────────────────────────────────┘

STEP 6: Review (ALL SAME)
┌──────────────────────────────────┐
│ No validation                     │
│ (data already validated)          │
└──────────────────────────────────┘

STEP 7: Success (ALL SAME)
┌──────────────────────────────────┐
│ No validation                     │
│ (RFQ already created)             │
└──────────────────────────────────┘
```

---

## 5. Component Composition

```
RFQModal
│
├─ ModalHeader
│  ├─ Title (dynamic by rfqType)
│  ├─ Subtitle (dynamic by rfqType)
│  └─ Close button
│
├─ StepIndicator
│  ├─ Step 1 (Category)
│  ├─ Step 2 (Details)
│  ├─ Step 3 (Project)
│  ├─ Step 4 (Recipients)
│  ├─ Step 5 (Auth)
│  ├─ Step 6 (Review)
│  └─ Step 7 (Success)
│
├─ StepContent (conditional)
│  │
│  ├─ Step 1: StepCategory
│  │  ├─ CategoryGrid (20 cards)
│  │  └─ JobTypeList (radio list)
│  │
│  ├─ Step 2: StepTemplate
│  │  └─ TemplateFieldRenderer (×N fields)
│  │     ├─ TextInput
│  │     ├─ Textarea
│  │     ├─ Select
│  │     ├─ RadioGroup
│  │     ├─ NumberInput
│  │     ├─ DatePicker
│  │     ├─ EmailInput
│  │     ├─ Checkbox
│  │     └─ FileUpload
│  │
│  ├─ Step 3: StepGeneral
│  │  ├─ ProjectBasicsSection
│  │  ├─ LocationSection
│  │  └─ BudgetSection
│  │
│  ├─ Step 4: StepRecipients
│  │  │
│  │  ├─ DirectRecipients (if rfqType === 'direct')
│  │  │  ├─ VendorSearchBar
│  │  │  ├─ VendorList
│  │  │  └─ SelectCount
│  │  │
│  │  ├─ WizardRecipients (if rfqType === 'wizard')
│  │  │  ├─ RecommendedVendorList
│  │  │  └─ AllowOthersToggle
│  │  │
│  │  └─ PublicRecipients (if rfqType === 'public')
│  │     ├─ ScopeSelector
│  │     └─ LimitSelector
│  │
│  ├─ Step 5: StepAuth
│  │  ├─ AuthTabs
│  │  │  ├─ LoginForm
│  │  │  ├─ SignupForm
│  │  │  └─ GuestForm
│  │  │
│  │  └─ PaymentUI (if over limit)
│  │
│  ├─ Step 6: StepReview
│  │  ├─ ProjectSummary
│  │  │  ├─ BasicInfo
│  │  │  ├─ TemplateFieldsSummary
│  │  │  └─ LocationBudget
│  │  │
│  │  └─ RecipientsSummary (varies by type)
│  │     ├─ DirectVendorsList
│  │     ├─ WizardMatchingSummary
│  │     └─ PublicPostingSummary
│  │
│  └─ Step 7: StepSuccess
│     ├─ SuccessIcon
│     ├─ SuccessMessage (varies by type)
│     ├─ RFQDetails
│     └─ ActionButtons
│        ├─ ViewDetails
│        ├─ Close
│        └─ BackHome
│
└─ ModalFooter
   ├─ BackButton (disabled on step 1)
   └─ NextButton OR SendButton
```

---

## 6. Data Flow Diagram

```
USER INPUT
    │
    ↓
formData {
  selectedCategory,
  selectedJobType,
  templateFields,
  projectTitle,
  county, town,
  budgetMin, budgetMax,
  selectedVendors,        ← Direct/Wizard
  allowOtherVendors,      ← Wizard
  visibilityScope,        ← Public
  responseLimit           ← Public
}
    │
    ↓ validate()
    │
    ├─→ if (invalid) → showErrors() → stop
    │
    └─→ if (valid) → nextStep()
         │
         ↓ (on final step)
    
    handleSubmit()
         │
         ├─→ Prepare API payload
         │   {
         │     rfqType,
         │     category, jobType,
         │     details: templateFields,
         │     county, town, budget*,
         │     ...rfqType-specific fields
         │   }
         │
         ├─→ POST /api/rfq/create
         │
         └─→ Backend:
              ├─→ Create rfq record
              │   {
              │     rfqType,
              │     visibility,
              │     details: JSON,
              │     ...type-specific fields
              │   }
              │
              ├─→ If Direct/Wizard:
              │   Create rfq_recipient records
              │   { rfq_id, vendor_id, recipient_type }
              │
              ├─→ If Public:
              │   Index in search (no recipients)
              │
              └─→ Return rfq_id

    Success:
         │
         ├─→ Show step 7 (success screen)
         ├─→ Display rfqId, recipient count
         └─→ Offer navigation options
```

---

## 7. Mobile vs Desktop Layout

```
DESKTOP (600px modal)
┌────────────────────────────────────┐
│                                    │
│ ╔════════════════════════════════╗ │
│ ║ Title              [close]     ║ │
│ ║ Subtitle                       ║ │
│ ║ ─────────────────────────────── ║ │
│ ║ Step 1  Step 2  Step 3  ...     ║ │
│ ╚════════════════════════════════╝ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ [Step Content - scrollable]    │ │
│ │ • Form fields                  │ │
│ │ • Input areas                  │ │
│ │ • Vendor list (Step 4)         │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ [← Back]        [Next →]       │ │
│ └────────────────────────────────┘ │
│                                    │
└────────────────────────────────────┘


MOBILE (full-screen)
┌──────────────────┐
│                  │
│ ╔════════════════╗ │
│ ║ [<] Title [×] ║ │
│ ║ Subtitle      ║ │
│ ║ ──────────────║ │
│ ║ Step ...      ║ │
│ ╚════════════════╝ │
│                  │
│ ┌────────────────┐ │
│ │ [Content -    │ │
│ │  scrollable]  │ │
│ │              │ │
│ │ • Field 1    │ │
│ │ • Field 2    │ │
│ │ • Field 3    │ │
│ │              │ │
│ │ • Vendor A   │ │
│ │ • Vendor B   │ │
│ │ • Vendor C   │ │
│ │              │ │
│ └────────────────┘ │
│                  │
│ ┌────────────────┐ │
│ │ [Back]         │ │
│ └────────────────┘ │
│ ┌────────────────┐ │
│ │ [Next] / [Send]│ │
│ └────────────────┘ │
│                  │
└──────────────────┘
```

---

## 8. Step 4 Side-by-Side UI Comparison

```
DIRECT (4A)                    WIZARD (4B)                    PUBLIC (4C)
═════════════════════════════════════════════════════════════════════════

Header:                        Header:                        Header:
"Choose vendors to             "We'll match you to            "Public RFQ
 send this to"                  the right vendors"             visibility"

Subtitle:                      Subtitle:                      Subtitle:
"Select vendors you            "Based on your project,        "Configure where
 trust"                         here are recommended           your RFQ appears"
                                vendors"

UI Section 1:                  UI Section 1:                  UI Section 1:
[Search box]                   [Info banner]                  [Scope options]
[Filter chips]                 "These vendors match           ○ Category only
                                your project."                ○ + Nearby counties

UI Section 2:                  UI Section 2:                  UI Section 2:
Vendor List:                   Vendor List:                   [Response limit]
☑ Vendor 1                     ☑ Vendor A (pre-checked)       ○ Up to 5
☐ Vendor 2                     ☑ Vendor B (pre-checked)       ○ Up to 10
☑ Vendor 3                     ☐ Vendor C                     ○ No limit
☐ Vendor 4                     ☐ Vendor D
☑ Vendor 5                     Info:
☐ Vendor 6                     "Recommended based on
                                category, location,
Info:                          rating"
"Currently selected: 3         
 (max 10 allowed)"             UI Section 3:
                               [ ] Also allow other
Action:                            qualified vendors
[Search by name/location]           to respond?

Validation:                    Validation:                    Validation:
≥1 vendor selected             ≥1 vendor selected OR          Both fields
                               "allow others" = true          selected

Next action:                   Next action:                   Next action:
Go to Step 5 (Auth)           Go to Step 5 (Auth)            Go to Step 5 (Auth)

API sends:                     API sends:                     API sends:
selectedVendors:              selectedVendors:               visibilityScope,
['v1', 'v3', 'v5']           ['v1', 'v2']                   responseLimit
                              allowOtherVendors: true
```

---

## 9. Error State Example

```
STEP 4 (Direct) - Validation Error

┌─────────────────────────────────────┐
│ [<] Choose vendors to send this to  │
│                                     │
│ [Search vendors...]                 │
│                                     │
│ ☐ Vendor 1                          │
│ ☐ Vendor 2                          │
│ ☐ Vendor 3                          │
│ ☐ Vendor 4                          │
│ ☐ Vendor 5                          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠ Select at least one vendor    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 0 vendors selected                  │
│                                     │
├─────────────────────────────────────┤
│ [← Back] [Next - DISABLED]          │
└─────────────────────────────────────┘

After selecting vendor:

┌─────────────────────────────────────┐
│ [<] Choose vendors to send this to  │
│                                     │
│ [Search vendors...]                 │
│                                     │
│ ☑ Vendor 1                          │
│ ☐ Vendor 2                          │
│ ☐ Vendor 3                          │
│ ☐ Vendor 4                          │
│ ☐ Vendor 5                          │
│                                     │
│ ✓ 1 vendor selected                 │
│                                     │
├─────────────────────────────────────┤
│ [← Back] [Next →]                   │ ← Now enabled
└─────────────────────────────────────┘
```

---

## 10. Success Screen Variations

```
DIRECT SUCCESS                 WIZARD SUCCESS              PUBLIC SUCCESS
═══════════════════════════════════════════════════════════════════════

╔═════════════════════╗       ╔═════════════════════╗     ╔═════════════════╗
║ 🎉 Your RFQ sent!   ║       ║ 🎉 RFQ is live!     ║     ║ 🎉 RFQ posted! ║
╚═════════════════════╝       ╚═════════════════════╝     ╚═════════════════╝

Your RFQ has been        Your RFQ is now live      Your RFQ is now
sent to 3 vendor(s).     on Zintra.                publicly visible.

You'll be notified       Vendors matching your     Vendors can discover
when they respond.       project will be           and respond when
                         notified.                 interested.
Check email & inbox      
for responses.           Check email & inbox       Check email & inbox
                         for responses.            for responses.

RFQ ID:                  RFQ ID:                   RFQ ID:
rfq_abc123               rfq_abc123                rfq_abc123

[View Details]           [View Details]            [View Details]
[Close Modal]            [Close Modal]             [Close Modal]
[Back to Home]           [Back to Home]            [Back to Home]
```

---

## 11. Vendor List State Diagram (Direct RFQ Step 4A)

```
INITIAL STATE
(all unchecked, no selection)
    │
    ├─→ User types in search: "Excel"
    │   │
    │   └─→ FILTER STATE
    │       ☑ Excel Builders
    │       ☐ Other vendors hidden
    │
    ├─→ User clicks checkbox
    │   │
    │   └─→ SELECTION STATE
    │       ☑ Vendor 1 (CHECKED)
    │       ☐ Vendor 2
    │       ☐ Vendor 3
    │       "1 vendor selected"
    │
    ├─→ User clicks another checkbox
    │   │
    │   └─→ MULTI-SELECT STATE
    │       ☑ Vendor 1 (CHECKED)
    │       ☐ Vendor 2
    │       ☑ Vendor 3 (CHECKED)
    │       ☐ Vendor 4
    │       "2 vendors selected"
    │
    ├─→ User unchecks Vendor 1
    │   │
    │   └─→ PARTIAL-SELECT STATE
    │       ☐ Vendor 1
    │       ☐ Vendor 2
    │       ☑ Vendor 3 (CHECKED)
    │       ☐ Vendor 4
    │       "1 vendor selected"
    │
    ├─→ User tries to check > 10 vendors
    │   │
    │   └─→ LIMIT-REACHED STATE
    │       ⚠ "Max 10 vendors allowed"
    │       Checkboxes disabled for rest
    │
    └─→ User clicks Next
        │
        └─→ CREATE RECIPIENTS
            POST /api/rfq/create
            selectedVendors: ['v1', 'v3', ...]
```

---

**Document Status:** ✅ Complete Visual Reference  
**Audience:** All developers (visual learners)  
**Last Updated:** January 1, 2026

