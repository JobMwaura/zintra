# Week 1 Testing - Quick Start Guide

## Prerequisites ✅
- Supabase project created
- DATABASE_SCHEMA.sql executed in Supabase
- Next.js app running locally
- Supabase Auth configured

---

## Phase 1: Schema Verification (5 minutes)

### Step 1: Verify Tables Exist
```
1. Open Supabase Dashboard
2. Go to "Table Editor"
3. Verify these 12 tables exist:
   ✓ profiles
   ✓ candidate_profiles
   ✓ employer_profiles
   ✓ listings
   ✓ applications
   ✓ subscriptions
   ✓ listing_boosts
   ✓ credits_ledger
   ✓ contact_unlocks
   ✓ conversations
   ✓ messages
   ✓ ratings
```

### Step 2: Verify RLS Enabled
```
1. In Table Editor, click "profiles"
2. Right sidebar → "RLS" toggle
3. Should say "RLS is enabled"
4. Click to see policies (should see 2+)
```

### Step 3: Verify Indexes
```sql
-- Run in SQL Editor
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('profiles', 'listings', 'listing_boosts') 
ORDER BY indexname;

-- Should return 15+ indexes
```

---

## Phase 2: Auth + Role Selection (10 minutes)

### Test Case 1: Candidate Signup
```
1. Open app: http://localhost:3000
2. Click "Sign Up"
3. Enter email: candidate@example.com
4. Enter password: Test@1234
5. Click "Sign Up"
6. Should redirect to role selector (/careers/auth/role-selector)
```

### Test Case 2: Select Candidate Role
```
1. On role selector page
2. Click "I'm Looking for Work" card
3. Should show "Setting up..." text
4. Should redirect to /careers/me
5. Profile form should load
```

### Test Case 3: Fill Candidate Profile
```
1. Enter Full Name: "John Doe"
2. Enter Phone: "+254712345678"
3. Select Location: "Nairobi"
4. Add Skills: type "Masonry", press Enter
5. Add Skills: type "Carpentry", press Enter
6. Select Availability: "Available now"
7. Enter Rate: "1500"
8. Enter Bio: "Experienced mason with 5+ years"
9. Set Experience: "5"
10. Click "Save Profile"
11. Should show "✓ Profile saved successfully!"
```

### Verify Candidate Profile Saved
```sql
-- In Supabase SQL Editor
SELECT * FROM profiles WHERE email = 'candidate@example.com';
-- Should show: is_candidate = TRUE, is_employer = FALSE

SELECT * FROM candidate_profiles WHERE id = (
  SELECT id FROM profiles WHERE email = 'candidate@example.com'
);
-- Should show: skills array, availability, rate_per_day
```

### Test Case 4: Employer Signup
```
1. Sign out (top right → logout)
2. Click "Sign Up"
3. Enter email: employer@example.com
4. Enter password: Test@1234
5. Click "Sign Up"
6. Should redirect to role selector
```

### Test Case 5: Select Employer Role
```
1. Click "I'm Hiring" card
2. Should show "Setting up..." text
3. Should redirect to /careers/me/employer
4. Employer form should load
```

### Test Case 6: Fill Employer Profile
```
1. Enter Full Name: "Jane Smith"
2. Enter Phone: "+254712987654"
3. Enter Company Name: "BuildRight Ltd"
4. Enter KRA PIN: "A001234567ABC"
5. Select County: "Nairobi"
6. Enter Company Email: "info@buildright.com"
7. Enter Company Phone: "+254712987654"
8. Enter Description: "We're a construction company looking for skilled workers"
9. Click "Save Profile"
10. Should show "✓ Employer profile saved successfully!"
```

### Verify Employer Profile Saved
```sql
-- In Supabase SQL Editor
SELECT * FROM profiles WHERE email = 'employer@example.com';
-- Should show: is_candidate = FALSE, is_employer = TRUE

SELECT * FROM employer_profiles WHERE id = (
  SELECT id FROM profiles WHERE email = 'employer@example.com'
);
-- Should show: company_name, company_registration, county
```

---

## Phase 3: RLS & Security (10 minutes)

### Test Case 7: RLS Security
```
1. Sign in as candidate@example.com
2. Go to: http://localhost:3000/careers/me
3. Should show ONLY your profile (John Doe)
4. Try manually accessing employer@example.com's profile
5. Should get 401 Unauthorized or empty result
```

### Test Case 8: Update Own Profile
```
1. Sign in as candidate@example.com
2. Go to /careers/me
3. Change rate to "2000"
4. Click "Save Profile"
5. Should succeed with checkmark
6. Refresh page
7. Should show updated rate "2000"
```

### Test Case 9: Cannot View Other Profiles
```
1. Still signed in as candidate
2. Open browser console (F12)
3. Try this query:
   await supabase.from('profiles').select('*')
4. Should return ONLY your profile (RLS blocking others)
```

---

## Phase 4: Capabilities Resolver (10 minutes)

### Test Case 10: Free Plan Capabilities
```
1. Sign in as employer@example.com
2. In browser console, run:

import { getEmployerCapabilities } from '@/lib/capabilities/resolver';
const caps = await getEmployerCapabilities('EMPLOYER_ID_HERE');
console.log(caps);

// Should output:
{
  plan: 'free',
  max_active_listings: 2,
  contact_unlocks_included: 0,
  can_use_filters: false,
  can_shortlist: false,
  can_bulk_outreach: false,
  can_invite_to_apply: false,
  can_view_analytics: false,
  can_team_accounts: false
}
```

### Test Case 11: Check Listing Limit
```
1. In browser console:

import { canCreateListing } from '@/lib/capabilities/resolver';
const can_create = await canCreateListing('EMPLOYER_ID_HERE');
console.log(can_create); // Should be TRUE initially

// To test limit, insert fake listings:
await supabase.from('listings').insert([
  { employer_id: 'EMPLOYER_ID_HERE', type: 'job', title: 'Test 1', location: 'Nairobi', status: 'active' },
  { employer_id: 'EMPLOYER_ID_HERE', type: 'job', title: 'Test 2', location: 'Nairobi', status: 'active' }
]);

// Now check again - should be FALSE
const can_create = await canCreateListing('EMPLOYER_ID_HERE');
console.log(can_create); // FALSE (limit reached)
```

---

## Phase 5: Credits System (10 minutes)

### Test Case 12: Check Credits Balance
```
1. In browser console:

import { getCreditsBalance } from '@/lib/monetization/credits';
const balance = await getCreditsBalance('EMPLOYER_ID_HERE');
console.log(balance); // Should be 0 (no purchases yet)
```

### Test Case 13: Add Credits
```
1. In browser console:

import { addCredits } from '@/lib/monetization/credits';
const result = await addCredits(
  'EMPLOYER_ID_HERE',
  1000,
  'purchase'
);
console.log(result); // Should be { success: true, new_balance: 1000 }
```

### Test Case 14: Get Credits Summary
```
1. In browser console:

import { getCreditsSummary } from '@/lib/monetization/credits';
const summary = await getCreditsSummary('EMPLOYER_ID_HERE');
console.log(summary);

// Should show:
{
  current_balance: 1000,
  total_purchased: 1000,
  total_spent: 0,
  spending_breakdown: {}
}
```

---

## Phase 6: Boosts Mechanics (5 minutes)

### Test Case 15: Apply Boost
```
1. First create a listing (insert via SQL or UI later)

INSERT INTO listings (employer_id, type, title, location, status)
VALUES ('EMPLOYER_ID_HERE', 'job', 'Test Job', 'Nairobi', 'active')
RETURNING id;

// Note the listing_id returned

2. In browser console:

import { applyBoost } from '@/lib/monetization/boosts';
const result = await applyBoost(
  'EMPLOYER_ID_HERE',
  'LISTING_ID_HERE',
  'featured',
  1000 // credits available
);
console.log(result);

// Should show: { success: true, message: 'Boost applied for 7 days!', boost: {...} }
```

### Test Case 16: Get Boost Multiplier
```
1. In browser console:

import { getListingBoosts, getBoostMultiplier } from '@/lib/monetization/boosts';
const boosts = await getListingBoosts('LISTING_ID_HERE');
const multiplier = getBoostMultiplier(boosts);
console.log(multiplier); // Should be > 1.0 (2.5 for featured)
```

---

## Phase 7: Contact Unlocks (5 minutes)

### Test Case 17: Check Contact Access
```
1. In browser console:

import { hasContactAccess } from '@/lib/monetization/contact-unlocks';
const has_access = await hasContactAccess(
  'EMPLOYER_ID_HERE',
  'CANDIDATE_ID_HERE'
);
console.log(has_access); // Should be FALSE initially
```

### Test Case 18: Unlock Contact
```
1. First add credits (from Test 13)

2. In browser console:

import { unlockContact } from '@/lib/monetization/contact-unlocks';
const result = await unlockContact(
  'EMPLOYER_ID_HERE',
  'CANDIDATE_ID_HERE',
  1000 // credits available
);
console.log(result);

// Should show: { success: true, message: 'Contact information unlocked!' }
```

### Test Case 19: Verify Contact Unlocked
```
1. In browser console:

import { hasContactAccess } from '@/lib/monetization/contact-unlocks';
const has_access = await hasContactAccess(
  'EMPLOYER_ID_HERE',
  'CANDIDATE_ID_HERE'
);
console.log(has_access); // Should be TRUE now
```

---

## Troubleshooting

### Error: "useSearchParams should be wrapped in Suspense"
**Solution:** Already fixed. Make sure using latest code.

### Error: "RLS policy prevents select"
**Solution:** This is expected if RLS is working. Check you're authenticated as the right user.

### Error: "Function not found"
**Solution:** Make sure all imports use correct paths:
- `@/lib/capabilities/resolver`
- `@/lib/monetization/boosts`
- `@/lib/monetization/credits`
- etc

### Error: "profiles table doesn't exist"
**Solution:** Make sure DATABASE_SCHEMA.sql was executed in Supabase SQL Editor.

### Profile form shows "Loading..." forever
**Solution:** Check:
1. Supabase connection (check .env variables)
2. User is authenticated
3. RLS policies allow read on profiles table

---

## Success Criteria

### All Tests Pass ✅
- [x] 12 tables exist
- [x] RLS is enabled
- [x] Candidate can signup and create profile
- [x] Employer can signup and create profile
- [x] Profile data saved to database
- [x] RLS prevents viewing other profiles
- [x] Capabilities resolver works
- [x] Listing limit enforced
- [x] Credits can be added
- [x] Boosts can be applied
- [x] Contact can be unlocked

### No Errors ❌→✅
- [x] No console errors
- [x] No SQL errors
- [x] All forms validate
- [x] All API calls successful
- [x] All RLS policies working

---

## Quick Test Checklist

Copy/paste this to verify everything:

```bash
# 1. Schema check
# Go to Supabase → Table Editor → See 12 tables? ✓

# 2. Auth signup
# Sign up as candidate@test.com, select role, fill profile ✓

# 3. Auth signup
# Sign up as employer@test.com, select role, fill profile ✓

# 4. Profile verification
# SELECT COUNT(*) FROM profiles; -- Should be 2 ✓

# 5. RLS check
# As candidate, can you see employer profile? (NO = working) ✓

# 6. Capabilities check
# import { getEmployerCapabilities } from '@/lib/capabilities/resolver';
# Check free plan has 2 listings limit ✓

# 7. Credits check
# import { getCreditsBalance } from '@/lib/monetization/credits';
# Balance should be 0 ✓

# 8. Boost check
# Add 1000 credits, apply boost to listing, verify multiplier ✓

# 9. Unlock check
# Add 1000 credits, unlock candidate contact, verify access ✓
```

---

## Next Steps

After all tests pass:

1. **Commit:** `git add . && git commit -m "Week 1: Database schema + types + monetization foundation + profile UI"`
2. **Push:** `git push origin main`
3. **Deploy:** Vercel auto-deploys
4. **Start Week 2:** Build listings CRUD

---

## Timeline

| Phase | Time | Status |
|-------|------|--------|
| Schema verification | 5 min | ⏳ Ready |
| Auth + role selection | 10 min | ⏳ Ready |
| RLS & security | 10 min | ⏳ Ready |
| Capabilities resolver | 10 min | ⏳ Ready |
| Credits system | 10 min | ⏳ Ready |
| Boosts mechanics | 5 min | ⏳ Ready |
| Contact unlocks | 5 min | ⏳ Ready |
| **TOTAL** | **~55 min** | **Ready** |

**Status: READY TO TEST** 🧪
