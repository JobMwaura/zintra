# 6 Tweaks - Implementation Quick Reference

**Status:** Core Implementation COMPLETE ✅  
**Files Modified/Created:** 4 files  
**Time Invested:** Phase 2 Core + Tweaks  
**Ready for:** Phase 2b (Modals, Testing, Deployment)

---

## 📋 What Was Done vs What Remains

### ✅ COMPLETED (Ready Now)

| # | Tweak | What's Done | File |
|-|-|-|-|
| 1 | Templates as Source of Truth | Enforcement rules documented | `RFQ_PHASE2_PRODUCTION_READY.md` |
| 2 | RFQ Type in Draft Key | Hook updated with rfqType parameter | `/hooks/useRfqFormPersistence.js` |
| 3 | Payment Tier Backend | Full API with quota enforcement | `/pages/api/rfq/create.js` |
| 5 | SSR-Safe localStorage | All methods guarded | `/hooks/useRfqFormPersistence.js` |
| 6 | Server Validation & Security | Complete input/field/quota validation | `/pages/api/rfq/create.js` |

### ⏳ SPEC READY (Next Phase)

| # | Tweak | What's Spec'd | File |
|-|-|-|-|
| 4 | Phone OTP Verification | Full flow documented, API logic in place | `RFQ_PHASE2_PRODUCTION_READY.md` |

---

## 🔧 How to Integrate These Changes

### Step 1: Update Your RfqContext
```javascript
import { useRfqFormPersistence } from '@/hooks/useRfqFormPersistence';

export const RfqProvider = ({ children }) => {
  const { loadFormData, saveFormData, isInitialized } = useRfqFormPersistence();
  const [state, setState] = useState({
    rfqType: 'direct', // ADD THIS
    selectedCategory: null,
    selectedJobType: null,
    // ... rest of state
  });

  // Update any save calls to include rfqType:
  const handleSubmit = () => {
    // OLD: saveFormData(categorySlug, jobTypeSlug, fields, shared)
    // NEW:
    saveFormData(state.rfqType, categorySlug, jobTypeSlug, fields, shared);
  };

  // Similarly for load:
  useEffect(() => {
    if (!isInitialized()) return; // SSR Guard
    const saved = loadFormData(state.rfqType, category, jobType);
    // ...
  }, []);
};
```

### Step 2: Update Modals to Pass rfqType
```javascript
// In DirectRFQModal
<RfqContext.Provider value={{ ...contextValue, rfqType: 'direct' }}>
  {/* modal content */}
</RfqContext.Provider>

// In WizardRFQModal
<RfqContext.Provider value={{ ...contextValue, rfqType: 'wizard' }}>
  {/* modal content */}
</RfqContext.Provider>

// In PublicRFQModal
<RfqContext.Provider value={{ ...contextValue, rfqType: 'public' }}>
  {/* modal content */}
</RfqContext.Provider>
```

### Step 3: Update Form Submit to Call API
```javascript
async function handleRfqSubmit() {
  const { getAllFormData } = useRfqContext();
  const allData = getAllFormData();

  const response = await fetch('/api/rfq/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Auth
      userId: user?.id || null,
      guestEmail: isGuest ? email : null,
      guestPhone: isGuest ? phone : null,
      guestPhoneVerifiedAt: isGuest ? phoneVerifiedAt : null,

      // RFQ Info
      rfqType: 'direct', // or 'wizard' or 'public'
      categorySlug: allData.categorySlug,
      jobTypeSlug: allData.jobTypeSlug,
      formData: { ...allData.templateFields, ...allData.sharedFields },

      // Optional
      selectedVendorIds: wizardMode ? vendorIds : null,
    })
  });

  if (response.status === 402) {
    // Payment required
    const { limit, used, tier } = await response.json();
    showUpgradeModal({ tier, limit, used });
    return;
  }

  if (response.ok) {
    const { rfqId } = await response.json();
    showSuccess(`RFQ #${rfqId} created! Vendors notified.`);
  }
}
```

### Step 4: Handle Payment Limit Response
```javascript
function UpgradeModal({ tier, limit, used }) {
  return (
    <Modal>
      <h2>You've reached your limit</h2>
      <p>Tier: {tier} ({used}/{limit} RFQs/month used)</p>
      
      {tier === 'free' && (
        <Button onClick={() => goToPayment('standard')}>
          Upgrade to Standard - KES 500/month (5 RFQs)
        </Button>
      )}

      {tier === 'standard' && (
        <Button onClick={() => goToPayment('premium')}>
          Upgrade to Premium - KES 1,000/month (Unlimited)
        </Button>
      )}

      <Button onClick={() => goBack()}>Later</Button>
    </Modal>
  );
}
```

---

## 🛡️ Security Checklist

Before going to production, ensure:

- [ ] Phone verification in AuthInterceptor (Tweak 4)
- [ ] `/pages/api/auth/send-sms-otp.js` created
- [ ] `/pages/api/auth/verify-sms-otp.js` created
- [ ] RfqContext updated to handle rfqType
- [ ] All modals updated with complete flow
- [ ] Database migrations applied (users + rfqs tables)
- [ ] RLS policies enabled on rfqs table
- [ ] Environment variables set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - SMS API credentials
- [ ] Rate limiting tested (10/hour limit)
- [ ] Payment quota enforced (backend test)
- [ ] E2E tests pass (guest + auth flows)
- [ ] Error tracking enabled (Sentry)
- [ ] Monitoring configured

---

## 🧪 How to Test Each Tweak

### Test Tweak 2 (RFQ Type in Draft Key)
```javascript
// Open DevTools → Application → Local Storage
// You should see keys like:
// rfq_draft_direct_architectural_arch_new_residential
// rfq_draft_wizard_architectural_arch_new_residential
// rfq_draft_public_architectural_arch_new_residential
// (All different for same category/jobType if filled separately)
```

### Test Tweak 3 (Payment Quota)
```javascript
// Method 1: Create 3 RFQs as guest (free tier)
// 4th attempt → 402 Payment Required response

// Method 2: Mock user tier in Supabase
// UPDATE users SET rfq_tier = 'free' WHERE id = '<user-id>';
// Then try to create 4th RFQ → 402 response

// Method 3: Check database
// SELECT COUNT(*) FROM rfqs WHERE guest_email = 'test@example.com' AND created_at >= DATE_TRUNC('month', NOW());
// If >= 3 and tier is 'free', should reject next RFQ
```

### Test Tweak 5 (SSR Safety)
```javascript
// Method: Render component in Next.js SSR environment
// If no crashes on server → Tweak 5 working
// Check server-side logs for no localStorage errors

// Direct test:
const { isInitialized } = useRfqFormPersistence();
console.log(isInitialized()); // true in browser, false on server
```

### Test Tweak 6 (Server Validation)
```javascript
// Test 1: Send form without required field
const response = await fetch('/api/rfq/create', {
  method: 'POST',
  body: JSON.stringify({
    // Missing property_description (required)
    rfqType: 'direct',
    categorySlug: 'architectural',
    jobTypeSlug: 'arch_new_residential',
    formData: { /* incomplete */ },
  })
});
// Should return 400 with: { error: "Field validation failed", details: {...} }

// Test 2: Send invalid field type
// formData: { number_of_floors: "not a number" }
// Should return 400 with: { error: "Field validation failed" }

// Test 3: Send without guest phone verification
// guestEmail: "test@example.com", guestPhoneVerifiedAt: null
// Should return 400 with: { error: "Phone verification required" }

// Test 4: Rate limit (10 in 1 hour from same IP)
// After 10th request from same IP, 11th → 429 Too Many Requests
```

---

## 🚀 Deployment Order

1. **Database First**
   - Run migrations (users + rfqs tables)
   - Enable RLS
   - Create indices

2. **Backend API**
   - Deploy `/pages/api/rfq/create.js`
   - Deploy SMS OTP endpoints (next phase)
   - Test in staging

3. **Frontend Components**
   - Update RfqContext with rfqType
   - Refactor modals
   - Add phone verification flow (next phase)
   - Test integration

4. **Testing & Monitoring**
   - E2E tests
   - Load testing
   - Error tracking
   - Analytics

5. **Staging & Production**
   - Staging deployment
   - UAT with real users
   - Production rollout (gradual)

---

## 📊 Expected Behavior

### Scenario 1: Guest Creates RFQ (3 times, then hits limit)
```
1st RFQ ✅ Success (1/3 used)
2nd RFQ ✅ Success (2/3 used)
3rd RFQ ✅ Success (3/3 used)
4th RFQ ❌ Error 402: "RFQ limit reached"
           → Show upgrade modal
           → User upgrades to Standard
   
2nd month:
5th RFQ ✅ Success (1/3 used again, monthly reset)
```

### Scenario 2: Authenticated User with Standard Tier
```
Created 4 RFQs this month:
5th RFQ ✅ Success (4/5 used)
6th RFQ ❌ Error 402: "RFQ limit reached"
           → Only 5/month on Standard tier
```

### Scenario 3: Phone Verification Required
```
Guest enters email, phone, OTP
  ↓
Fills RFQ form
  ↓
Clicks submit → AuthInterceptor
  ↓
If phone NOT verified:
  ❌ Error: "Phone verification required"
  → Show phone verification step
  → Send OTP
  → User verifies
  → Form submits
```

### Scenario 4: Form Refresh & Recovery (Tweak 2)
```
User fills Direct RFQ in Architectural
  → Form saved to localStorage key:
    rfq_draft_direct_architectural_arch_new_residential

User refreshes page
  → Component loads from localStorage
  → Form data recovered ✅

User switches tab, starts Wizard RFQ same category
  → Form saved to DIFFERENT key:
    rfq_draft_wizard_architectural_arch_new_residential
  → Two separate drafts coexist
  → No collision ✅
```

---

## 🎯 Next Phase (Phase 2b)

| Task | Estimated Time | Dependencies |
|------|---|---|
| Update AuthInterceptor with phone | 2h | Tweak 4 spec |
| Create SMS OTP endpoints | 1h | Existing SMS API |
| Update RfqContext | 1h | Tweak 2 done |
| Refactor 3 modals | 4h | All of above |
| Database migrations | 1h | Schema ready |
| E2E testing | 3h | All components |
| Staging & Production | 2h | Testing complete |
| **TOTAL** | **~14 hours** | **~3-4 days** |

---

## 📞 Support & Rollback

### If Payment Logic Too Strict
- Edit `TIER_LIMITS` in `/pages/api/rfq/create.js`
- Change free: 3 → 5, standard: 5 → 10, etc.
- Redeploy

### If Phone Verification Fails
- Check SMS API integration
- Verify phone format validation (E.164)
- Check `/pages/api/auth/verify-sms-otp.js` logic

### If Rate Limiting Too Aggressive
- Edit `limiter.max` (currently 10/hour)
- Add user whitelist in `skip` function
- Redeploy

### Rollback Plan
1. Keep backup of working API version
2. Database: Revert migrations if needed
3. Frontend: Revert to previous component versions
4. Feature flags: Disable new validation server-side

---

## 🎉 Summary

### What You Have Now
- ✅ 2 documented, 4 implemented tweaks
- ✅ SSR-safe localStorage
- ✅ Payment tier backend
- ✅ Complete server validation
- ✅ Rate limiting
- ✅ Vendor matching

### What's Next
- 📋 Phone OTP integration
- 📋 Modal refactoring
- 📋 E2E testing
- 📋 Production deployment

### Key Files to Review
1. `RFQ_PHASE2_PRODUCTION_READY.md` - Comprehensive spec
2. `RFQ_PHASE2_TWEAKS_SUMMARY.md` - This file's companion
3. `/pages/api/rfq/create.js` - API implementation
4. `/hooks/useRfqFormPersistence.js` - Updated hook

---

**Last Updated:** December 31, 2025  
**Version:** Phase 2 Core + 6 Tweaks  
**Status:** Ready for Phase 2b
