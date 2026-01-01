# RFQ Phase 2 Architecture Diagrams

## 1. Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RFQ Form Complete User Journey                  │
└─────────────────────────────────────────────────────────────────────┘

                           START
                             ↓
                    Is user authenticated?
                         ↙         ↘
                       YES          NO
                        ↓            ↓
           ┌────────────────┐   ┌─────────────────┐
           │ Skip auth step │   │ Keep guest mode │
           │ (proceed to 1) │   │ (keep guest: yes)
           └────────────────┘   └─────────────────┘
                    ↓                   ↓
     
        ╔═══════════════════════════════════════╗
        ║  STEP 1: SELECT CATEGORY              ║
        ║  (RfqCategorySelector component)      ║
        ║                                       ║
        ║  Display 20 major categories:         ║
        ║  - Architectural Plans                ║
        ║  - Structural Engineering             ║
        ║  - Site Prep & Excavation             ║
        ║  - General Building & Masonry         ║
        ║  - Roofing & Waterproofing            ║
        ║  - Doors, Windows & Glass             ║
        ║  - [15 more categories]               ║
        ║                                       ║
        ║  User selects → Store in RfqContext   ║
        ╚═══════════════════════════════════════╝
                           ↓
        ╔═══════════════════════════════════════╗
        ║  STEP 2: SELECT JOB TYPE              ║
        ║  (RfqJobTypeSelector component) [NEW] ║
        ║                                       ║
        ║  Show 3-7 job types for selected      ║
        ║  category:                            ║
        ║                                       ║
        ║  For "Architectural Plans":           ║
        ║  - New house design                   ║
        ║  - Extension / renovation             ║
        ║  - Apartments / multi-unit            ║
        ║  - Commercial building                ║
        ║  - Council approvals only             ║
        ║                                       ║
        ║  User selects → Store in RfqContext   ║
        ║  + Load job-specific fields           ║
        ╚═══════════════════════════════════════╝
                           ↓
        ╔═══════════════════════════════════════╗
        ║  STEP 3: JOB-SPECIFIC FIELDS          ║
        ║  (RfqFormRenderer component)          ║
        ║                                       ║
        ║  Render 6-10 fields unique to         ║
        ║  selected job type:                   ║
        ║                                       ║
        ║  For "New house design":              ║
        ║  - Property description               ║
        ║  - Number of floors                   ║
        ║  - Plot size                          ║
        ║  - Existing plans?                    ║
        ║  - Council support needed?            ║
        ║  - 3D renders wanted?                 ║
        ║  - Upload sketches/plans              ║
        ║                                       ║
        ║  ┌─ ACTION: Auto-save every 2 sec ──┐ ║
        ║  │ (useRfqFormPersistence hook)      │ ║
        ║  │ Save to: localStorage             │ ║
        ║  │ Key: rfq_draft_[category]_[type] │ ║
        ║  └──────────────────────────────────┘ ║
        ║                                       ║
        ║  User fills fields → RfqContext       ║
        ╚═══════════════════════════════════════╝
                           ↓
        ╔═══════════════════════════════════════╗
        ║  STEP 4: SHARED GENERAL FIELDS        ║
        ║  (RfqFormRenderer component)          ║
        ║                                       ║
        ║  Render 5 shared fields (same for     ║
        ║  ALL categories):                     ║
        ║                                       ║
        ║  1. Project title (optional)          ║
        ║  2. Location / Area (required)        ║
        ║  3. Property status (optional)        ║
        ║  4. Budget range (optional)           ║
        ║  5. Start date (optional)             ║
        ║  6. Additional notes (optional)       ║
        ║                                       ║
        ║  ┌─ ACTION: Auto-save every 2 sec ──┐ ║
        ║  │ (useRfqFormPersistence hook)      │ ║
        ║  │ Save to: localStorage             │ ║
        ║  └──────────────────────────────────┘ ║
        ║                                       ║
        ║  User fills fields → RfqContext       ║
        ╚═══════════════════════════════════════╝
                           ↓
        ╔═══════════════════════════════════════╗
        ║  STEP 5: AUTHENTICATION & SUBMIT      ║
        ║                                       ║
        ║  Is user authenticated (check context)║
        ╚═══════════════════════════════════════╝
                    ↙              ↘
                  YES               NO
                   ↓                 ↓
     
        ┌──────────────────┐  ┌────────────────────┐
        │ Direct submit    │  │ AuthInterceptor    │
        │ button           │  │ modal appears      │
        │                  │  │                    │
        │ userId attached  │  │ 3 options:         │
        │ Skip auth        │  │ A) Login           │
        └──────────────────┘  │ B) Sign Up         │
                  ↓           │ C) Continue Guest  │
                             │                    │
                             │ Form data          │
                             │ preserved via      │
                             │ RfqContext         │
                             └────────────────────┘
                                      ↓
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                 ↓
            ┌──────────────┐   ┌──────────────┐  ┌────────────┐
            │ Option A:    │   │ Option B:    │  │ Option C:  │
            │ Create       │   │ Login        │  │ Continue   │
            │ Account      │   │              │  │ as Guest   │
            │              │   │ Email/Pass   │  │            │
            │ Email/Pass   │   │ Validate     │  │ Email only │
            │ Signup API   │   │ Login API    │  │ Capture    │
            │              │   │              │  │            │
            │ On success:  │   │ On success:  │  │ On click:  │
            │ Set user     │   │ Set user     │  │ Store      │
            │ authenticated│   │ authenticated│  │ guest_     │
            │              │   │              │  │ email      │
            └──────────────┘   └──────────────┘  └────────────┘
                    ↓                 ↓                 ↓
                    └─────────────────┼─────────────────┘
                                      ↓
                    ┌─────────────────────────────────┐
                    │ Prepare form data:              │
                    │ ├─ category_slug                │
                    │ ├─ job_type_slug                │
                    │ ├─ template_fields              │
                    │ ├─ shared_fields                │
                    │ ├─ user_id (if authenticated)   │
                    │ ├─ guest_email (if guest)       │
                    │ └─ isGuestMode                  │
                    └─────────────────────────────────┘
                                      ↓
                    ┌─────────────────────────────────┐
                    │ POST /api/rfq/create            │
                    │                                 │
                    │ Validate form data              │
                    │ Store in database               │
                    │ Match to vendors                │
                    │ Send notifications              │
                    │ Return rfqId                    │
                    └─────────────────────────────────┘
                                      ↓
                    ┌─────────────────────────────────┐
                    │ SUCCESS: RFQ Created            │
                    │                                 │
                    │ ├─ Clear localStorage draft     │
                    │ ├─ Send user confirmation email │
                    │ ├─ Notify matched vendors       │
                    │ └─ Show rfqId to user           │
                    └─────────────────────────────────┘
                                      ↓
                                    END
```

---

## 2. Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Component Interactions                         │
└─────────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │  RfqProvider │
                          │  (wraps app) │
                          └──────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ↓                         ↓
            ┌──────────────────┐     ┌──────────────────┐
            │   RfqContext     │     │  Page Components  │
            │                  │     │   (use context)   │
            │ ├─ category      │     │                   │
            │ ├─ jobType       │     │ RfqCategorySelector
            │ ├─ templateFields│────→├─ RfqJobTypeSelector
            │ ├─ sharedFields  │     │ RfqFormRenderer
            │ ├─ isGuestMode   │     │ AuthInterceptor
            │ └─ currentStep   │     │
            └──────┬───────────┘     └──────────────────┘
                   │
                   │ shares state
                   │
        ┌──────────┴──────────┬──────────────┐
        │                     │              │
        ↓                     ↓              ↓
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ RfqForm         │  │ RfqJobTypeSelector│  │ AuthInterceptor  │
│ Container       │  │ Component        │  │ Modal            │
│                 │  │                  │  │                  │
│ Manages:        │  │ Displays:        │  │ Shows:           │
│ ├─ Form steps   │  │ ├─ Job options   │  │ ├─ Login tab     │
│ ├─ Field values │  │ ├─ Descriptions  │  │ ├─ Signup tab    │
│ └─ Page flow    │  │ └─ Selection UI  │  │ ├─ Guest option  │
│                 │  │                  │  │ └─ Forms         │
│ Uses:           │  │ Uses:            │  │                  │
│ ├─ RfqContext   │  │ ├─ RfqContext    │  │ Uses:            │
│ ├─ Persistence  │  │ └─ Props         │  │ ├─ RfqContext    │
│ ├─ FormRenderer │  │                  │  │ ├─ Auth APIs     │
│ └─ Interceptor  │  │ Calls:           │  │ └─ State mgmt    │
│                 │  │ └─ onSelect()    │  │                  │
└────────┬────────┘  └──────────────────┘  │ Calls:           │
         │                                 │ ├─ onLoginSuccess │
         │                                 │ ├─ onGuestSubmit  │
         │                                 │ └─ onCancel       │
         │                                 └──────────────────┘
         │
    [Data flow via context]
         │
         └──→ useRfqFormPersistence
              ├─ Auto-save to localStorage
              ├─ Load on mount
              └─ Clear on submit
```

---

## 3. Data Flow: From Fill to Submit

```
┌─────────────────────────────────────────────────────────────────────┐
│               Data Flow: Form Fill → Submit → Success               │
└─────────────────────────────────────────────────────────────────────┘

USER FILLS FORM
    ↓
    ├─ Types in "3-bedroom bungalow"
    ├─ Selects "2 floors"
    ├─ Enters "Ruiru"
    └─ Picks "Mid-range" budget
    
    ↓ [Every field change]
    
RfqContext.updateTemplateField()
RfqContext.updateSharedField()
    ↓
    ├─ Updates state in RfqContext
    └─ Component re-renders with new value
    
    ↓ [After 2-second debounce]
    
useRfqFormPersistence.createAutoSave()
    ↓
    ├─ Captures current field values
    ├─ Creates localStorage key:
    │  "rfq_draft_architectural_arch_new_residential"
    └─ Stores: { templateFields, sharedFields, timestamps }
    
    ↓ [User navigates away or refreshes]
    
Component unmounts
    ↓
    └─ FormData still in localStorage ✓
       (survives page refresh, browser close)
    
    ↓ [User returns / page reloads]
    
Component mounts
    ↓
useRfqFormPersistence.loadFormData()
    ↓
    ├─ Checks localStorage
    ├─ Finds saved draft
    └─ Returns { templateFields, sharedFields }
    
    ↓
RfqContext.initializeRfq()
    ↓
    ├─ restores all field values
    └─ User sees same form with previous data ✓
    
    ↓ [User finishes form and clicks Submit]
    
handleSubmit()
    ↓
    ├─ Check: isGuestMode?
    │   ├─ YES → Show AuthInterceptor modal
    │   └─ NO → Proceed to submission
    │
    ├─ AuthInterceptor: User chooses auth method
    │   ├─ Login → POST /api/auth/login
    │   │          Form data stays in RfqContext
    │   ├─ Signup → POST /api/auth/signup
    │   │           Form data stays in RfqContext
    │   └─ Guest → Capture email in context
    │              Form data stays as-is
    │
    └─ Form data STILL INTACT in context ✓
    
    ↓
RfqContext.getAllFormData()
    ↓
    ├─ Returns complete package:
    │  {
    │    categorySlug: "architectural",
    │    jobTypeSlug: "arch_new_residential",
    │    templateFields: { /* filled fields */ },
    │    sharedFields: { /* filled fields */ },
    │    isGuestMode: false,
    │    userEmail: "user@example.com",
    │    userId: "user-123"
    │  }
    │
    └─ POST /api/rfq/create
       
       ↓ API validates & stores
       ↓ Matches to vendors
       ↓ Returns rfqId
       
    ↓
useRfqFormPersistence.clearFormData()
    ↓
    ├─ Deletes localStorage key
    │  "rfq_draft_architectural_arch_new_residential"
    └─ localStorage cleaned up ✓
    
    ↓
Success!
    ├─ Show rfqId to user
    ├─ Send confirmation email
    ├─ Notify matched vendors
    └─ Form is clean, ready for next RFQ
```

---

## 4. Auth Flow: Guest → User Transition

```
┌─────────────────────────────────────────────────────────────────────┐
│        Authentication Flow: Preserving Data During Login            │
└─────────────────────────────────────────────────────────────────────┘

                    GUEST FILLS FORM
                          ↓
                  Clicks "Submit RFQ"
                          ↓
            RfqContext.isGuestMode === true?
                    ↓ YES
            ┌─────────────────────────────┐
            │  AuthInterceptor Modal       │
            │  appears on screen           │
            │                             │
            │  THREE OPTIONS:             │
            └─────────────────────────────┘
                  ↙        ↓        ↘
        
    OPTION A:           OPTION B:         OPTION C:
    CREATE ACCOUNT      LOGIN            CONTINUE AS GUEST
         ↓               ↓                    ↓
    ┌─────────────┐   ┌──────────┐      ┌──────────────┐
    │ Email field │   │Email     │      │Email capture │
    │ Password    │   │Password  │      │              │
    │ Confirm pwd │   │Validate  │      │Just email    │
    │             │   │Submit    │      │No account    │
    │ POST signup │   │POST login│      │Submit direct │
    └──────┬──────┘   └────┬─────┘      └────┬─────────┘
           │               │                  │
           │ SUCCESS       │ SUCCESS          │ CAPTURE
           │               │                  │
           └───────────┬───┴──────────────────┘
                       ↓
        ┌──────────────────────────────────┐
        │ RfqContext State Update:         │
        │                                  │
        │ setUserAuthenticated({           │
        │   id: "user-123",                │
        │   email: "user@example.com"      │
        │ })                               │
        │                                  │
        │ isGuestMode = false              │
        │ userId = "user-123"              │
        │ userEmail = "user@example.com"   │
        └────────────┬─────────────────────┘
                     ↓
        ┌──────────────────────────────────┐
        │ Form Data Check:                 │
        │                                  │
        │ templateFields: { ... } ✓ INTACT│
        │ sharedFields: { ... }   ✓ INTACT│
        │ No data lost!                    │
        └────────────┬─────────────────────┘
                     ↓
        ┌──────────────────────────────────┐
        │ Submit RFQ:                      │
        │                                  │
        │ POST /api/rfq/create {           │
        │   categorySlug: "...",           │
        │   jobTypeSlug: "...",            │
        │   templateFields: { ... },       │
        │   sharedFields: { ... },         │
        │   userId: "user-123",  ← ADDED   │
        │   isGuestMode: false   ← UPDATED │
        │ }                                │
        └────────────┬─────────────────────┘
                     ↓
                 SUCCESS ✓
                     ↓
        ┌──────────────────────────────────┐
        │ RFQ created with user attached   │
        │ Form data cleared                │
        │ Confirmation email sent          │
        │ Vendors notified                 │
        └──────────────────────────────────┘

KEY INSIGHT: Form data NEVER lost because:
├─ Templates & shared fields stay in RfqContext
├─ RfqContext persists across modal lifecycle
└─ Auth happens IN the same session
```

---

## 5. localStorage Persistence Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│        localStorage Persistence: How Data Survives                  │
└─────────────────────────────────────────────────────────────────────┘

           STEP 3: FILL JOB-SPECIFIC FIELDS
                        ↓
                  User types: "3-bed"
                        ↓
            updateTemplateField() called
                        ↓
            RfqContext state updated ✓
                        ↓
            Component re-renders ✓
                        ↓
          [Wait 2 seconds... no more typing]
                        ↓
        createAutoSave(2000) triggers
                        ↓
    ┌─────────────────────────────────────┐
    │ Save to localStorage:               │
    │                                     │
    │ Key: "rfq_draft_architectural_"     │
    │       "arch_new_residential"        │
    │                                     │
    │ Value: {                            │
    │   categorySlug: "architectural",    │
    │   jobTypeSlug: "arch_new_...",     │
    │   templateFields: {                │
    │     property_description: "3-bed",  │
    │     number_of_floors: "2",          │
    │     plot_size: "50x100",            │
    │     /* ... more fields */           │
    │   },                                │
    │   sharedFields: {                   │
    │     location: "Ruiru",              │
    │     /* ... more fields */           │
    │   },                                │
    │   createdAt: "2025-12-31T18:30Z",   │
    │   lastUpdatedAt: "2025-12-31T18:35Z"│
    │ }                                   │
    └─────────────────────────────────────┘
                        ↓
    ✓ DATA IN BROWSER STORAGE (not server)
    ✓ SURVIVES PAGE REFRESH
    ✓ SURVIVES BROWSER CLOSE
    ✓ SURVIVES RESTART
    ✓ 48-HOUR EXPIRY TRACKING
                        ↓
        [User refreshes page by accident]
                        ↓
           Component mounts again
                        ↓
        useRfqFormPersistence.loadFormData()
                        ↓
    ┌─────────────────────────────────────┐
    │ Load from localStorage:             │
    │                                     │
    │ Check if key exists:                │
    │ "rfq_draft_architectural_..."       │
    │                                     │
    │ YES → Found! Parse JSON             │
    │       Return saved data             │
    │                                     │
    │ NO → Draft doesn't exist            │
    │      Return null                    │
    │      Start with empty form          │
    │                                     │
    │ EXPIRED (>48h)?                     │
    │ Show "draft expired" message        │
    │ Clear old draft                     │
    └─────────────────────────────────────┘
                        ↓
    ✓ PREVIOUS FORM DATA RECOVERED
    ✓ USER SEES SAME VALUES AS BEFORE
    ✓ NO RETYPING NEEDED
                        ↓
        [User continues filling form]
                        ↓
        [Field changes → Auto-save again]
                        ↓
        [Rinse and repeat]
                        ↓
        [User submits form]
                        ↓
        useRfqFormPersistence.clearFormData()
                        ↓
    ┌─────────────────────────────────────┐
    │ Delete from localStorage:           │
    │                                     │
    │ localStorage.removeItem(            │
    │   "rfq_draft_architectural_"        │
    │   "arch_new_residential"            │
    │ )                                   │
    │                                     │
    │ ✓ Draft removed                     │
    │ ✓ Storage cleaned up                │
    │ ✓ User ready for new RFQ            │
    └─────────────────────────────────────┘
```

---

## 6. Context State Tree

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RfqContext State Tree                            │
└─────────────────────────────────────────────────────────────────────┘

                         RfqContext
                              |
            ┌─────────────────┼─────────────────┐
            |                 |                 |
     ┌──────▼─────┐  ┌────────▼────────┐  ┌───▼──────────┐
     │ Selection  │  │   Form Data     │  │  User State  │
     │            │  │                 │  │              │
     ├─ category │  ├─ templateFields  │  ├─ isGuestMode│
     │  (string)  │  │ (object)        │  │ (boolean)    │
     │            │  │  └─ field: val  │  │              │
     ├─ jobType  │  │     field: val   │  ├─ userEmail   │
     │ (string)   │  │     ...         │  │ (string)     │
     │            │  │                 │  │              │
     │            │  ├─ sharedFields   │  ├─ userId      │
     │            │  │ (object)        │  │ (string)     │
     │            │  │  └─ location    │  │              │
     │            │  │     budget      │  │              │
     │            │  │     start_date  │  │              │
     │            │  │     ...         │  │              │
     │            │  │                 │  │              │
     └────────────┘  └─────────────────┘  └──────────────┘
            |                 |                    |
            |    ┌────────────┴────────────┐      |
            |    |                         |      |
     ┌──────▼────▼─────────────────┐  ┌───▼──────────┐
     │      UI State               │  │ Action       │
     │                             │  │ Methods      │
     ├─ currentStep (string)      │  │              │
     │  "category"                 │  ├─ updateT...F │
     │  "jobtype"                  │  │              │
     │  "template"                 │  ├─ updateS...F │
     │  "shared"                   │  │              │
     │  "auth"                     │  ├─ initialize  │
     │                             │  │              │
     ├─ isSubmitting (boolean)    │  ├─ resetRfq    │
     │  true during API calls      │  │              │
     │                             │  ├─ getAllForm  │
     ├─ submitError (string)      │  │              │
     │  error message if submit    │  ├─ setUser...  │
     │  fails                      │  │              │
     │                             │  ├─ submitAsG...│
     │                             │  │              │
     │                             │  ├─ getForm...  │
     │                             │  │              │
     └─────────────────────────────┘  └──────────────┘
```

---

## 7. Component Responsibility Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│            Which Component Does What in the RFQ Form               │
└─────────────────────────────────────────────────────────────────────┘

Component                 Responsibility
────────────────────────────────────────────────────────────────────────

RfqCategorySelector       ├─ Display 20 categories
                          ├─ User selects category
                          ├─ Store in RfqContext
                          └─ Navigate to next step

RfqJobTypeSelector [NEW]  ├─ Display 3-7 job types
                          ├─ User selects job type
                          ├─ Store in RfqContext
                          └─ Load job template fields

RfqFormRenderer           ├─ Display form fields
                          ├─ Handle field changes
                          ├─ Validate field values
                          ├─ Show validation errors
                          └─ Pass data to parent

useRfqFormPersistence     ├─ Auto-save to localStorage
                          ├─ Load drafts on mount
                          ├─ Clear drafts after submit
                          ├─ Debounce saves
                          └─ Handle quota errors

RfqContext                ├─ Store form data
                          ├─ Store selection state
                          ├─ Store user state
                          ├─ Store UI state
                          ├─ Provide state updaters
                          └─ Track form progress

AuthInterceptor           ├─ Show login/signup form
                          ├─ Capture guest email
                          ├─ Call auth APIs
                          ├─ Preserve form data
                          ├─ Handle errors
                          └─ Update RfqContext on auth

/api/rfq/create           ├─ Validate form data
                          ├─ Store in database
                          ├─ Match to vendors
                          ├─ Send notifications
                          ├─ Handle errors
                          └─ Return rfqId
```

---

**Visual diagrams created:** 7  
**Covers:** User journey, component interactions, data flow, auth, localStorage, context, responsibilities  
**Ready for:** Architecture reviews, onboarding, debugging

