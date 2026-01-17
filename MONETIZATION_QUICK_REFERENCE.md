# Monetization System - Quick Reference

## Overview
Complete monetization system with 4 layers, built into the database, types, and utility functions. Ready for UI implementation.

---

## Layer 1: Boosted Listings (FASTEST TO MONETIZE)

### What It Is
Employers pay to boost their listings to the top of search results.

### Pricing
- **Featured:** 1,000 KES for 7 days (1.5x ranking multiplier)
- **Urgent:** 500 KES for 3 days (1.2x ranking multiplier)  
- **Extra Reach:** 300 KES for 7 days (1.1x ranking multiplier)

### How to Implement

**1. User applies boost:**
```javascript
import { applyBoost } from '@/lib/monetization/boosts';

const result = await applyBoost(employerId, listingId, 'featured', creditsAvailable);
if (result.success) {
  // Show confirmation
} else {
  // Show "Not enough credits" error
}
```

**2. Get active boosts for a listing:**
```javascript
import { getListingBoosts, getBoostMultiplier } from '@/lib/monetization/boosts';

const boosts = await getListingBoosts(listingId);
const multiplier = getBoostMultiplier(boosts); // 1.0, 2.5, 1.8, etc
```

**3. Ranking algorithm uses multiplier:**
```javascript
// In listing search/sort
const rankingScore = (recency_score * freshness_weight) * boost_multiplier;
```

### Database Tables
- `listing_boosts` - Boost records (id, listing_id, boost_type, starts_at, ends_at, cost_kes)
- `credits_ledger` - Tracks deduction (credit_type: 'boost', amount: -1000)

### UI Components to Build
- [ ] "Boost Listing" button in employer dashboard
- [ ] Boost type selector (featured/urgent/extra_reach)
- [ ] Boost confirmation dialog (show duration + cost)
- [ ] Boost history view (spent amount, days active)

---

## Layer 2: Employer Plans (FEATURE GATING)

### What It Is
Three subscription tiers unlock different features and capabilities.

### Plans

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| **Max Listings** | 2 | 10 | Unlimited |
| **Contact Unlocks/Month** | 0 | 5 | 50 |
| **Advanced Filters** | ✗ | ✓ | ✓ |
| **Shortlist Candidates** | ✗ | ✓ | ✓ |
| **Bulk Outreach** | ✗ | ✗ | ✓ |
| **Invite to Apply** | ✗ | ✓ | ✓ |
| **Analytics** | ✗ | ✗ | ✓ |
| **Team Accounts** | ✗ | ✗ | ✓ |

### How to Implement

**1. Check if feature available:**
```javascript
import { getEmployerCapabilities, canCreateListing } from '@/lib/capabilities/resolver';

const caps = await getEmployerCapabilities(employerId);
if (!caps.can_shortlist) {
  // Show "Upgrade to Pro" button
}

const can_create = await canCreateListing(employerId);
if (!can_create) {
  // Show "Max listings reached. Upgrade or close a listing"
}
```

**2. Determine employer's plan:**
```javascript
// In capabilities resolver:
// Fetches current subscription and returns plan-specific capabilities
const caps = await getEmployerCapabilities(employerId);
console.log(caps.plan); // 'free' | 'pro' | 'premium'
```

### Database Tables
- `subscriptions` - One per employer (id, employer_id, plan: 'free'|'pro'|'premium', status, started_at, ends_at)
- `credits_ledger` - Tracks plan allocation (credit_type: 'plan_allocation')

### UI Components to Build
- [ ] Plan selector on signup (show 3-tier comparison)
- [ ] Upgrade modal (triggered when hitting feature limit)
- [ ] Plan management page (current plan, upgrade/downgrade)
- [ ] Feature lock icons (show what plan unlocks this)

---

## Layer 3: Contact Unlocks (STEADY REVENUE)

### What It Is
Employers pay to reveal a candidate's contact information (phone, email).

### Pricing
- **200 KES per unlock** (one-time, permanent for that employer)
- Included unlocks in Pro (5/month) and Premium (50/month) plans

### How It Works
1. Employer shortlists candidate → conversation initiated
2. Employer clicks "Unlock Contact" → costs 200 KES
3. Candidate's phone/email revealed
4. Messaging UI becomes available
5. Both can message freely from then on

### How to Implement

**1. Check if employer has access:**
```javascript
import { canContactCandidate } from '@/lib/capabilities/resolver';

const { can_contact, reason } = await canContactCandidate(employerId, candidateId);
if (reason === 'needs_purchase_or_unlock') {
  // Show "Unlock Contact (200 KES)" button
} else if (reason === 'already_unlocked') {
  // Show contact info + messaging UI
}
```

**2. Unlock a candidate:**
```javascript
import { unlockContact } from '@/lib/monetization/contact-unlocks';

const result = await unlockContact(employerId, candidateId, creditsAvailable);
if (result.success) {
  // Reveal phone/email
  // Show messaging UI
} else {
  // "Insufficient credits" or "Already unlocked"
}
```

**3. Send outreach message (with rate limiting):**
```javascript
import { sendOutreachMessage } from '@/lib/monetization/contact-unlocks';

const result = await sendOutreachMessage(
  employerId,
  candidateId,
  messageBody,
  creditsAvailable,
  planOutreachIncluded
);
```

### Database Tables
- `contact_unlocks` - (id, employer_id, candidate_id, unlocked_at)
- `conversations` - (id, employer_id, candidate_id, initiated_at)
- `messages` - (id, conversation_id, sender_id, body, read, created_at)
- `credits_ledger` - Tracks deduction (credit_type: 'contact_unlock')

### UI Components to Build
- [ ] "Unlock Contact" button in talent directory
- [ ] Unlock cost indicator (200 KES)
- [ ] Messaging UI (only show after unlock)
- [ ] Unlocked candidates list (view all revealed contacts)

---

## Layer 4: Candidate Premium (AFTER SUPPLY READY)

### What It Is
Optional paid tier for candidates to get priority visibility.

### Features
- ✓ Priority ranking in talent directory
- ✓ Verification bundle (ID + references)
- ✓ CV/profile review
- ✓ Training access
- ✓ Premium badge

### Pricing
- Suggested: 500 KES/month or 4,000 KES/year (50% annual discount)

### When to Build
- After candidate supply is strong (1000+ verified candidates)
- Focuses on candidate retention/monetization

### Database Ready
- `candidate_profiles` has `verified_id`, `verified_references` flags
- Can add `has_premium`, `premium_until` fields when building

---

## Credits System (Backbone)

### What It Is
Virtual credits that employers purchase and spend on boosts, unlocks, messages.

### Packages (Pricing in KES)
| Credits | Price | Bonus | Recommended for |
|---------|-------|-------|-----------------|
| 100 | 500 KES | — | Testing |
| 500 | 2,000 KES | 10% | Small employers |
| 1,000 | 3,500 KES | 17% | Growing companies |
| 5,000 | 15,000 KES | 25% | High-volume hiring |

### How to Implement

**1. Get current balance:**
```javascript
import { getCreditsBalance } from '@/lib/monetization/credits';

const balance = await getCreditsBalance(employerId); // Number in KES
```

**2. Purchase credits:**
```javascript
import { addCredits } from '@/lib/monetization/credits';

const result = await addCredits(
  employerId,
  500, // amount
  'purchase' // type
);
// In real implementation, this would be triggered after Stripe/M-Pesa payment
```

**3. View spending breakdown:**
```javascript
import { getCreditsSummary, getMonthlySpending } from '@/lib/monetization/credits';

const summary = await getCreditsSummary(employerId);
console.log(summary); // {
  // current_balance: 2000,
  // total_purchased: 5000,
  // total_spent: 3000,
  // spending_breakdown: {
  //   boost: 2500,
  //   contact_unlock: 500
  // }
// }

const monthly = await getMonthlySpending(employerId);
console.log(monthly); // 500 KES spent this month
```

**4. View transaction history:**
```javascript
import { getCreditsLedger } from '@/lib/monetization/credits';

const { entries, total } = await getCreditsLedger(employerId, limit=20, offset=0);
entries.forEach(entry => {
  console.log(`${entry.credit_type}: ${entry.amount} credits`);
});
```

### Database Tables
- `credits_ledger` - (id, employer_id, credit_type, amount, balance_before, balance_after, reference_id, created_at)

### UI Components to Build
- [ ] Credits display (header showing balance)
- [ ] Purchase dialog (select package size)
- [ ] Top-up button (quick buy most popular)
- [ ] Spending dashboard (history + breakdown)

---

## Implementation Roadmap

### Week 1 (DONE) ✅
- [x] Database schema (12 tables)
- [x] Types (40+ interfaces)
- [x] Capabilities resolver
- [x] Boosts mechanics
- [x] Contact unlock mechanics
- [x] Credits system
- [x] Profile creation flows

### Week 2 (NEXT)
- [ ] Listings CRUD
- [ ] Listing detail pages
- [ ] Add boost UI (apply boost button)
- [ ] Add credits UI (balance + purchase)

### Week 3
- [ ] Employer dashboard
- [ ] Talent directory
- [ ] Add shortlist UI (unlock contact button)
- [ ] Add messaging UI

### Week 4-5
- [ ] Plan upgrade UI
- [ ] Payment integration (Stripe/M-Pesa)
- [ ] Analytics dashboard
- [ ] Candidate premium signup

---

## Key Functions by Module

### `lib/capabilities/resolver.ts`
- `getEmployerCapabilities(employerId)` → EmployerCapabilities
- `canCreateListing(employerId)` → boolean
- `canContactCandidate(employerId, candidateId)` → { can_contact, reason }
- `canUseFilters(employerId)` → boolean
- `canShortlist(employerId)` → boolean
- `getCandidateCapabilities(candidateId)` → CandidateCapabilities
- `hasFeature(userId, featureName, userType)` → boolean

### `lib/monetization/boosts.ts`
- `applyBoost(employerId, listingId, boostType, creditsAvailable)` → result
- `getListingBoosts(listingId)` → ListingBoost[]
- `getBoostMultiplier(boosts)` → number
- `getBoostHistory(employerId, limit)` → { boosts, total_spent }
- `cancelBoost(boostId, employerId)` → result (pro-rata refund)
- `expireBoosts()` → { expired_count } (cron job)

### `lib/monetization/contact-unlocks.ts`
- `unlockContact(employerId, candidateId, creditsAvailable)` → result
- `hasContactAccess(employerId, candidateId)` → boolean
- `getUnlockedCandidates(employerId, limit, offset)` → { candidates, total }
- `getUnlockStats(employerId)` → { total_unlocked, unlocked_this_month, total_spent }
- `sendOutreachMessage(employerId, candidateId, messageBody, ...)` → result

### `lib/monetization/credits.ts`
- `getCreditsBalance(employerId)` → number
- `addCredits(employerId, amount, creditType, referenceId)` → result
- `deductCredits(employerId, amount, creditType, referenceId)` → result
- `getCreditsSummary(employerId)` → { balance, total_purchased, total_spent, breakdown }
- `getCreditsLedger(employerId, limit, offset)` → { entries, total }
- `getMonthlySpending(employerId)` → number
- `allocateCreditsForPlan(employerId, planCredits, month)` → result
- `expireMonthlyCredits(employerId, previousMonth)` → result

---

## Testing Checklist

- [ ] Free plan: Can create 2 listings, cannot shortlist
- [ ] Pro plan: Can create 10 listings, can shortlist, has 5 unlocks/month
- [ ] Premium plan: Unlimited listings, 50 unlocks/month
- [ ] Boost applied: Listing multiplier increases
- [ ] Boost expired: Multiplier resets
- [ ] Contact unlocked: Candidate phone/email visible to employer
- [ ] Contact unlock rate limit: Can only send 5 messages/day to same candidate
- [ ] Credits deducted: Ledger entry created with proper balance_before/after
- [ ] Credits insufficient: Error message shows required vs available

---

## Notes

- All pricing in **KES** (Kenyan Shillings)
- All timestamps in **ISO 8601** format (UTC)
- All IDs are **UUID** v4
- All amounts use **DECIMAL(10, 2)** for money fields
- RLS policies prevent cross-employer data access
- Ledger is immutable (creates new entries, never updates)
