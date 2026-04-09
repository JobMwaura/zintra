# 🎯 ZCC Architecture - FINAL (Phase 2)

**Date:** January 17, 2026  
**Status:** ✅ RESTRUCTURED - Proper routing implemented  

---

## **Core Principle**

**One person = unlimited roles**

A user can be:
- ✅ Candidate (looking for work)
- ✅ Vendor (existing marketplace seller)
- ✅ Employer (hiring on ZCC)
- ✅ Any combination simultaneously

---

## **User Flow (No Isolation)**

```
┌─────────────────────────────────────┐
│  User NOT Logged In                 │
│  /careers (public landing)          │
│  - Browse jobs                      │
│  - No personalization               │
│  - Sign up / Login CTAs             │
└────────────┬────────────────────────┘
             │ Login / Signup
             ▼
┌─────────────────────────────────────┐
│  User Logged In, NO Roles Enabled   │
│  /careers/onboarding                │
│  - Role selection: Candidate?       │
│  - Role selection: Employer?        │
│  - Vendor status auto-detected      │
│  - Employer form prefilled if vendor│
└──────┬─────────────────────┬────────┘
       │                     │
  Enable Candidate      Enable Employer
       │                     │
       ▼                     ▼
┌──────────────┐    ┌──────────────────┐
│ /careers/me  │    │ /careers/employer│
│ Profile Form │    │ /dashboard       │
│              │    │                  │
│ Must complete│    │ Can post jobs    │
│ before using │    │ Can manage apps  │
└──────────────┘    └──────────────────┘
```

---

## **Key Routing Rules**

| URL | Who Can Access | What Happens |
|-----|--------|-------|
| `/careers` | Everyone | Public landing + personalized CTAs |
| `/careers/onboarding` | Logged in | Choose roles: Candidate &/or Employer |
| `/careers/me` | Candidate enabled | Complete candidate profile |
| `/careers/me/employer` | Employer enabled | Edit company info |
| `/careers/employer/dashboard` | Employer enabled | View stats, jobs, applications |
| `/careers/employer/post-job` | Employer enabled | Create job listing |
| `/careers/employer/buy-credits` | Employer enabled | Purchase credits |

---

## **Server Actions (Lazy-Load Pattern)**

```javascript
// Get user's current role status
const status = await getUserRoleStatus(userId)
// Returns: { candidate: true/false, employer: true/false, vendor: true/false }

// Enable candidate (creates profile)
await enableCandidateRole(userId)

// Enable employer (creates profile, auto-prefills if vendor, gives 100 free credits)
await enableEmployerRole(userId, companyData)
```

---

## **Data Model**

### When User Enables Employer Role:

```sql
-- Check: Is user a vendor?
SELECT * FROM vendors WHERE user_id = ?

-- Auto-prefill from vendor data
IF vendor_exists:
  company_name ← vendor.name
  company_email ← vendor.email
  company_phone ← vendor.phone
  location ← vendor.location
  verification_level ← 'verified'
  is_vendor_employer ← true
  vendor_id ← vendor.id

-- Create employer profile
INSERT INTO employer_profiles (...)

-- Create free subscription
INSERT INTO subscriptions 
  (employer_id, plan='free', status='active')

-- Give welcome credits
INSERT INTO credits_ledger 
  (employer_id, amount=100, credit_type='plan_allocation')
```

---

## **Vendor → Employer Onboarding (Specific Flow)**

```
Vendor logs in
  ↓
Sees onboarding page
  ↓
Sees "Enable Employer" card with 💡 "Verified Vendor" badge
  ↓
Clicks "Enable Now"
  ↓
System:
  - Detects vendor_id from vendors table
  - Prefills company name, email, phone, location
  - Creates employer_profiles with is_vendor_employer=true
  - Creates free subscription
  - Adds 100 free credits
  ↓
Redirects to /careers/employer/dashboard
  ↓
Vendor can immediately post jobs (100 credits = ~1 job posting)
```

---

## **Candidate Path (Unchanged from Week 1)**

```
User logs in
  ↓
/careers/onboarding shows "Find Work" card
  ↓
Clicks "Enable Now"
  ↓
System creates candidate_profiles entry
  ↓
Redirects to /careers/me to complete profile
  ↓
Can apply to jobs
```

---

## **Payment & Credits**

**When employer posts job:**
```
1. Check credits balance (from credits_ledger calculation)
2. Deduct 1000 KES from credits
3. INSERT INTO credits_ledger (amount=-1000, credit_type='job_posting')
4. UPDATE employer_spending (posting_spent += 1000)
5. CREATE listing
```

**Buy credits flow (not yet built):**
```
User: /careers/employer/buy-credits
  ↓
Payment gateway (M-Pesa, Stripe, Pesapal)
  ↓
INSERT INTO employer_payments (status='pending')
  ↓
[Webhook when payment confirmed]
  ↓
INSERT INTO credits_ledger (amount=CREDITS, credit_type='purchase')
UPDATE employer_payments (status='completed')
  ↓
Dashboard shows updated balance
```

---

## **Files Built (Phase 2)**

| File | Purpose |
|------|---------|
| `/app/actions/vendor-zcc.js` | Server actions for role management + stats |
| `/app/careers/onboarding/page.js` | Role selection (candidate + employer toggles) |
| `/app/careers/employer/dashboard/page.js` | Main employer hub |

---

## **What's Next (Phase 2 Remaining)**

1. **Post Job Page** (`/careers/employer/post-job`)
   - Form with title, description, pay, location
   - Validates credits available
   - Deducts credits on submit

2. **Buy Credits Page** (`/careers/employer/buy-credits`)
   - Credit packages (100/500/1000/5000)
   - M-Pesa / Card / Pesapal payment buttons
   - Creates employer_payments record

3. **Job Management** (`/careers/employer/jobs/[id]`)
   - View job details
   - Edit / pause / close job
   - View applications

4. **Navbar Integration**
   - Detect user roles
   - Show appropriate menu items:
     - Candidate: "Browse Jobs" / "My Profile"
     - Employer: "Dashboard" / "Post Job"
     - Vendor: Badge indicating employer access

---

## **Testing Checklist**

- [ ] Non-vendor can enable employer role (manual company entry)
- [ ] Vendor can enable employer role (auto-prefilled from vendor data)
- [ ] Employer gets 100 free credits on first activation
- [ ] Free subscription created on activation
- [ ] Onboarding page redirects to /me if candidate enabled
- [ ] Onboarding page redirects to dashboard if employer enabled
- [ ] Dashboard loads stats from employer_dashboard_stats view
- [ ] Recent jobs show in dashboard
- [ ] Recent applications show in dashboard
- [ ] User can enable both roles simultaneously
- [ ] User cannot access dashboard without employer role enabled

---

## **Key Differences from Old "Phase 1" Approach**

| Old (Isolated) | New (Unified) |
|---|---|
| "Phase 1: Fresh signup only" | "All users, lazy-load roles" |
| Vendor → separate /vendor page | Vendor → /careers/onboarding with badge |
| Vendor forced into payment | Vendor gets 100 free credits to try |
| Isolated "vendor experience" | Same UX for all employers |
| Forced profile completion | Auto-prefill + no vendor re-entry |
| Role: either candidate OR employer | Role: candidate AND/OR employer |

---

**Status:** ✅ Phase 2 Foundation Complete  
**Next Build:** Post Job + Buy Credits  
**Deployment:** Auto-pushed to Vercel
