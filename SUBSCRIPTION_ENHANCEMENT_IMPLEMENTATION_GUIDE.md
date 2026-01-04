# Subscription Model Enhancement Implementation Guide

**Priority:** HIGH - Features needed for production  
**Estimated Time:** 4-6 hours  
**Status:** Ready to implement

---

## 🎯 Quick Implementation Roadmap

### Phase 1: Auto-Renewal Logic ⏰ (1-2 hours)
- Create Supabase scheduled function
- Check for expiring subscriptions daily
- Auto-create new subscriptions

### Phase 2: Expiry Detection & Enforcement 📋 (1 hour)
- Check expiry in vendor profile load
- Show expiry notifications
- Disable features if expired

### Phase 3: Feature Limits Enforcement 🔒 (2-3 hours)
- Track RFQ responses per month
- Check limits before allowing operations
- Show upgrade prompts

---

## Implementation Details

### 1. Auto-Renewal Function

**File to create:** `/supabase/functions/auto-renew-subscriptions/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    // Get subscriptions expiring in next 24 hours
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    
    const { data: expiringSubscriptions, error: fetchError } = await supabase
      .from('vendor_subscriptions')
      .select('id, vendor_id, user_id, plan_id, auto_renew, end_date')
      .eq('status', 'active')
      .eq('auto_renew', true)
      .lte('end_date', tomorrow.toISOString())
    
    if (fetchError) throw fetchError
    
    let renewalCount = 0
    
    for (const sub of expiringSubscriptions || []) {
      const newStartDate = new Date(sub.end_date)
      const newEndDate = new Date(newStartDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      // Create new subscription
      const { error: insertError } = await supabase
        .from('vendor_subscriptions')
        .insert([{
          vendor_id: sub.vendor_id,
          user_id: sub.user_id,
          plan_id: sub.plan_id,
          start_date: newStartDate.toISOString(),
          end_date: newEndDate.toISOString(),
          status: 'active',
          auto_renew: true
        }])
      
      if (!insertError) {
        renewalCount++
        
        // TODO: Send renewal confirmation email
        console.log(`Renewed subscription for vendor ${sub.vendor_id}`)
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: `Auto-renewed ${renewalCount} subscriptions`,
        count: renewalCount 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Auto-renewal error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

**Setup:**
```bash
# Deploy function to Supabase
supabase functions deploy auto-renew-subscriptions

# Schedule to run daily at 2 AM UTC
# In Supabase dashboard → Functions → Settings → Add schedule
# Cron: 0 2 * * * (daily at 2 AM UTC)
```

---

### 2. Expiry Detection in Vendor Profile

**File to modify:** `/app/vendor-profile/[id]/page.js`

```javascript
// Add this helper function
const calculateDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const isSubscriptionExpired = (subscription) => {
  if (!subscription) return false;
  return new Date(subscription.end_date) < new Date();
};

// In the return/render section where subscription shows:
{/* Subscription Info */}
{subscription && (
  <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-base font-semibold text-slate-900">Subscription</h4>
      {canEdit && (
        <button
          onClick={() => setShowSubscriptionPanel(true)}
          className="text-xs font-semibold text-amber-700 hover:text-amber-800"
        >
          Manage
        </button>
      )}
    </div>

    {/* Expiry Alert */}
    {isSubscriptionExpired(subscription) && (
      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700 font-medium">
          ⚠️ Your subscription expired on {new Date(subscription.end_date).toLocaleDateString()}
        </p>
        {canEdit && (
          <button
            onClick={() => router.push('/subscription-plans')}
            className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700 underline"
          >
            Renew subscription →
          </button>
        )}
      </div>
    )}

    {/* Active subscription display */}
    {!isSubscriptionExpired(subscription) && (
      <div className="text-sm text-slate-700 space-y-1">
        <p>
          <strong>Plan:</strong> {subscription.plan_type || 'N/A'}
        </p>
        <p>
          <strong>Price:</strong> KES {subscription.price || 'N/A'}/month
        </p>
        {daysRemaining && (
          <p className={`font-medium ${
            daysRemaining <= 7 ? 'text-orange-600' : 'text-emerald-600'
          }`}>
            {daysRemaining <= 0 
              ? 'Expires today' 
              : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
            }
          </p>
        )}
      </div>
    )}
  </section>
)}
```

---

### 3. Feature Limits Enforcement

**Create new file:** `/lib/subscriptionLimits.js`

```javascript
/**
 * Subscription feature limits configuration
 * Maps subscription tiers to feature limits
 */

export const SUBSCRIPTION_LIMITS = {
  free: {
    rfqResponsesPerMonth: 5,
    portfolioImages: 10,
    certificationsAllowed: 3,
    highlightsAllowed: 3,
    profileBadge: false,
    analyticsAccess: false,
  },
  basic: {
    rfqResponsesPerMonth: 50,
    portfolioImages: 50,
    certificationsAllowed: 10,
    highlightsAllowed: 5,
    profileBadge: true,
    analyticsAccess: false,
  },
  professional: {
    rfqResponsesPerMonth: 200,
    portfolioImages: 500,
    certificationsAllowed: 'unlimited',
    highlightsAllowed: 10,
    profileBadge: true,
    analyticsAccess: true,
  },
  premium: {
    rfqResponsesPerMonth: 'unlimited',
    portfolioImages: 'unlimited',
    certificationsAllowed: 'unlimited',
    highlightsAllowed: 'unlimited',
    profileBadge: true,
    analyticsAccess: true,
  },
};

/**
 * Get subscription tier from plan
 */
export const getPlanTier = (planName) => {
  const name = planName?.toLowerCase() || 'free';
  if (name.includes('premium')) return 'premium';
  if (name.includes('professional')) return 'professional';
  if (name.includes('basic')) return 'basic';
  return 'free';
};

/**
 * Get limit for a feature
 */
export const getFeatureLimit = (planName, feature) => {
  const tier = getPlanTier(planName);
  return SUBSCRIPTION_LIMITS[tier]?.[feature] || SUBSCRIPTION_LIMITS.free[feature];
};

/**
 * Check if vendor can perform action
 */
export const canPerformAction = (planName, action, currentCount = 0) => {
  const tier = getPlanTier(planName);
  const limit = SUBSCRIPTION_LIMITS[tier]?.[action];
  
  if (limit === 'unlimited') return true;
  if (typeof limit === 'number') return currentCount < limit;
  return false;
};

/**
 * Get remaining quota
 */
export const getRemainingQuota = (planName, action, currentCount = 0) => {
  const tier = getPlanTier(planName);
  const limit = SUBSCRIPTION_LIMITS[tier]?.[action];
  
  if (limit === 'unlimited') return 'unlimited';
  if (typeof limit === 'number') return Math.max(0, limit - currentCount);
  return 0;
};
```

**Usage in components:**

```javascript
import { canPerformAction, getRemainingQuota } from '@/lib/subscriptionLimits';

// When vendor tries to respond to RFQ
const handleRFQResponse = async () => {
  const { data: responsesThisMonth } = await supabase
    .from('rfq_responses')
    .select('id', { count: 'exact' })
    .eq('vendor_id', vendor.id)
    .gte('created_at', firstDayOfMonth.toISOString());
  
  const canRespond = canPerformAction(
    subscription.plan_type,
    'rfqResponsesPerMonth',
    responsesThisMonth?.count || 0
  );
  
  if (!canRespond) {
    setError(`You've reached your monthly RFQ response limit. Upgrade your plan to continue.`);
    return;
  }
  
  // Proceed with response
};

// Show remaining quota
const remaining = getRemainingQuota(
  subscription.plan_type,
  'rfqResponsesPerMonth',
  responsesThisMonth?.count || 0
);

{remaining !== 'unlimited' && (
  <p className="text-xs text-gray-600">
    {remaining} RFQ responses remaining this month
  </p>
)}
```

---

## Testing Checklist

### Phase 1: Auto-Renewal
- [ ] Create test subscription ending tomorrow
- [ ] Verify function runs at scheduled time
- [ ] Check new subscription created
- [ ] Verify old subscription not deleted
- [ ] Test with `auto_renew = false` (should not renew)

### Phase 2: Expiry Detection
- [ ] Create expired subscription
- [ ] Load vendor profile
- [ ] Verify expiry alert shows
- [ ] Verify "Renew" button works
- [ ] Test with active subscription (no alert)

### Phase 3: Feature Limits
- [ ] Test RFQ response limit
- [ ] Test with different subscription tiers
- [ ] Verify upgrade prompt shows
- [ ] Test unlimited tier (no limits)

---

## Database Queries for Testing

```sql
-- Create test subscription ending tomorrow
INSERT INTO vendor_subscriptions (vendor_id, user_id, plan_id, start_date, end_date, status, auto_renew)
VALUES (
  'test-vendor-id',
  'test-user-id',
  'test-plan-id',
  NOW(),
  NOW() + INTERVAL '1 day',
  'active',
  true
);

-- Check subscriptions ending in 24 hours
SELECT * FROM vendor_subscriptions
WHERE end_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
  AND status = 'active'
  AND auto_renew = true;

-- Count RFQ responses this month
SELECT COUNT(*) FROM rfq_responses
WHERE vendor_id = 'test-vendor-id'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE);
```

---

## Success Criteria

✅ **Phase 1 Complete When:**
- Auto-renewal function deployed
- Subscriptions auto-renew before expiry
- Emails sent on renewal

✅ **Phase 2 Complete When:**
- Expiry alerts show in vendor profile
- Expired subscriptions prevent access to features
- Renewal is easy (1-click from alert)

✅ **Phase 3 Complete When:**
- Feature limits enforced
- Users see remaining quota
- Upgrade prompts appear at limits

---

## Rollback Plan

If issues occur:

1. **Disable auto-renewal:** Set all `auto_renew` to `false`
2. **Remove expiry checks:** Comment out expiry alert code
3. **Disable limits:** Return `true` from `canPerformAction()`
4. **Revert:** `git revert <commit-hash>`

---

## Next Steps

1. **Immediate:** Review this guide with team
2. **This week:** Implement Phase 1 (auto-renewal)
3. **Next week:** Implement Phase 2 & 3
4. **Testing:** Comprehensive QA before launch
5. **Deployment:** Roll out to production

---

