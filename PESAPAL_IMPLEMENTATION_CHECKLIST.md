# ✅ PesaPal Integration Implementation Checklist

**Date:** 4 January 2026  
**Status:** Ready to Implement  
**Estimated Time:** 3-4 hours

---

## 📋 Pre-Implementation Checklist

### Have You Prepared?
- [ ] PesaPal Consumer Key ready
- [ ] PesaPal Consumer Secret ready
- [ ] Understand your business KES pricing
- [ ] Know your production domain
- [ ] Have Supabase admin access
- [ ] Familiar with environment variables

---

## 🔧 Implementation Steps (In Order)

### Step 1: Environment Setup (15 mins)
**Goal:** Configure PesaPal credentials

- [ ] Copy `.env.pesapal.example` content
- [ ] Create/update `.env.local` in project root
- [ ] Add `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY=your_key`
- [ ] Add `PESAPAL_CONSUMER_SECRET=your_secret`
- [ ] Add `NEXT_PUBLIC_PESAPAL_API_URL=https://sandbox.pesapal.com/api/v3`
- [ ] Add `PESAPAL_WEBHOOK_URL=https://localhost:3000/api/webhooks/pesapal` (for testing)
- [ ] Verify `.env.local` is in `.gitignore` ✅
- [ ] Test: `echo $NEXT_PUBLIC_PESAPAL_CONSUMER_KEY` should show your key

### Step 2: Copy PesaPal Client File (5 mins)
**Goal:** Add PesaPal payment client to project

- [ ] File created: `/lib/pesapal/pesapalClient.js` ✅
- [ ] Contains: `pesapalClient` singleton export
- [ ] Contains: Token management
- [ ] Contains: Payment initiation
- [ ] Contains: Status checking
- [ ] Contains: Webhook validation

### Step 3: Add Payment Initiation API (10 mins)
**Goal:** Create endpoint for starting payments

- [ ] File created: `/app/api/payments/pesapal/initiate/route.js` ✅
- [ ] Handles POST requests
- [ ] Validates all required fields
- [ ] Calls `pesapalClient.initiatePayment()`
- [ ] Returns order_id and redirect_url
- [ ] Proper error handling

### Step 4: Add Webhook Handler (10 mins)
**Goal:** Create endpoint for payment notifications

- [ ] File created: `/app/api/webhooks/pesapal/route.js` ✅
- [ ] Handles POST from PesaPal
- [ ] Validates webhook signature
- [ ] Updates subscription status to 'active'
- [ ] Handles COMPLETED, FAILED, CANCELLED statuses
- [ ] Logs payment events
- [ ] Creates payment_logs entries

### Step 5: Database Migration (10 mins)
**Goal:** Add payment tracking fields to database

- [ ] Open Supabase SQL Editor
- [ ] Copy content from `/supabase/migrations/20260104_add_pesapal_payment_tracking.sql`
- [ ] Run the migration
- [ ] Verify columns added: `pesapal_order_id`, `payment_status`, `payment_date`, `transaction_id`
- [ ] Verify tables created: `payment_logs`
- [ ] Verify indexes created (6 new indexes)

**Verification Query:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendor_subscriptions' 
ORDER BY ordinal_position;
```

### Step 6: Update Subscription Page (20 mins)
**Goal:** Integrate payment flow into subscription purchase

**File:** `/app/subscription-plans/page.js`

Changes needed:
- [ ] Import `pesapalClient` at top
- [ ] Update `handleSubscribe` function
- [ ] Create pending subscription with `status: 'pending_payment'`
- [ ] Call `/api/payments/pesapal/initiate` endpoint
- [ ] Redirect user to PesaPal checkout page
- [ ] Store order ID in database

**Code to add:**
```javascript
import { pesapalClient } from '@/lib/pesapal/pesapalClient';

// In handleSubscribe:
const paymentResult = await fetch('/api/payments/pesapal/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vendor_id: vendorData.id,
    user_id: user.id,
    plan_id: planId,
    plan_name: selectedPlan.name,
    amount: selectedPlan.price,
    email: user.email,
    phone_number: user.phone || '254700000000',
    description: `${selectedPlan.name} Subscription`,
  }),
});

const paymentData = await paymentResult.json();

if (!paymentData.success) {
  setMessage(`Payment Error: ${paymentData.error}`);
  return;
}

// Store pending subscription
await supabase
  .from('vendor_subscriptions')
  .insert([{
    vendor_id: vendorData.id,
    user_id: user.id,
    plan_id: planId,
    status: 'pending_payment',
    pesapal_order_id: paymentData.order_id,
  }]);

// Redirect to PesaPal
if (paymentData.iframe_url) {
  window.location.href = paymentData.iframe_url;
}
```

### Step 7: Configure Webhook in PesaPal (10 mins)
**Goal:** Tell PesaPal where to send payment notifications

- [ ] Log into https://developer.pesapal.com/
- [ ] Go to your application settings
- [ ] Find "Webhooks" or "Callback" settings
- [ ] Add webhook URL: `https://yourdomain.com/api/webhooks/pesapal`
- [ ] For local testing with ngrok:
  - [ ] Install ngrok: `brew install ngrok` (macOS)
  - [ ] Run: `ngrok http 3000`
  - [ ] Copy the https URL
  - [ ] Update `PESAPAL_WEBHOOK_URL` in .env.local
- [ ] Enable webhooks/notifications
- [ ] Save settings

### Step 8: Test Locally (30 mins)
**Goal:** Verify payment flow works in development

- [ ] Start dev server: `npm run dev`
- [ ] Go to `http://localhost:3000/subscription-plans`
- [ ] Click "Subscribe Now" on a plan
- [ ] Verify redirects to PesaPal sandbox
- [ ] Use test card: `4242 4242 4242 4242` (Visa)
- [ ] Enter any future expiry date and CVC
- [ ] Complete the "payment"
- [ ] Check Supabase:
  - [ ] `vendor_subscriptions` has status 'active'
  - [ ] `pesapal_order_id` is filled
  - [ ] `payment_date` is set
  - [ ] `payment_status` is 'COMPLETED'
- [ ] Check vendor profile shows active subscription
- [ ] Check logs: `tail -f .next/logs/*` for any errors

### Step 9: Test Failed Payment (15 mins)
**Goal:** Verify failure handling works

- [ ] Go to `/subscription-plans`
- [ ] Click "Subscribe Now"
- [ ] Use declined test card: `4000 0000 0000 0002`
- [ ] Verify redirects back
- [ ] Check Supabase:
  - [ ] `vendor_subscriptions` has status 'payment_failed'
  - [ ] `payment_status` is 'FAILED'
- [ ] Verify user sees error message

### Step 10: Test Webhook Delivery (10 mins)
**Goal:** Ensure webhook is being received

- [ ] Make payment in sandbox
- [ ] Go to Supabase
- [ ] Check `payment_logs` table:
  - [ ] New entry for PAYMENT_COMPLETED
  - [ ] `order_id` matches
  - [ ] `vendor_id` is correct
  - [ ] `status` is 'active'
- [ ] If no logs, check:
  - [ ] Webhook URL is correct in PesaPal dashboard
  - [ ] Webhook URL is reachable (use curl)
  - [ ] Server logs for any errors

---

## 🧪 Testing Checklist

### Sandbox Testing
- [ ] Test successful payment (status 'active')
- [ ] Test failed payment (status 'payment_failed')
- [ ] Test cancelled payment (pending removed)
- [ ] Test webhook delivery
- [ ] Test webhook signature validation
- [ ] Test with different plan amounts
- [ ] Test with different email formats
- [ ] Test database updates correctly

### Error Handling
- [ ] Missing credentials shows error
- [ ] Invalid credentials shows error
- [ ] Network timeout handled gracefully
- [ ] Duplicate webhooks handled (idempotent)
- [ ] Webhook without signature rejected
- [ ] Invalid signature rejected

### Database
- [ ] All payment fields populated
- [ ] Indexes created (verify with `\d payment_logs`)
- [ ] Check constraints enforced
- [ ] Payment logs table populated
- [ ] No orphaned pending subscriptions

---

## 📊 Verification Queries

Run these in Supabase SQL Editor to verify setup:

### Check columns added
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendor_subscriptions' 
AND column_name LIKE 'pesapal_%' OR column_name LIKE 'payment_%';
```

### Check payment_logs table
```sql
SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 10;
```

### Check pending subscriptions (should be empty after successful payment)
```sql
SELECT * FROM vendor_subscriptions WHERE status = 'pending_payment';
```

### Check active subscriptions from payments
```sql
SELECT vs.*, sp.name as plan_name 
FROM vendor_subscriptions vs
JOIN subscription_plans sp ON vs.plan_id = sp.id
WHERE vs.status = 'active' AND vs.payment_method = 'pesapal'
ORDER BY vs.created_at DESC;
```

### Check payment logs
```sql
SELECT event_type, COUNT(*) as count, 
       MAX(created_at) as latest
FROM payment_logs
GROUP BY event_type;
```

---

## 🚀 Moving to Production

### Before Launch
- [ ] Test with all different plan prices
- [ ] Update credentials to production
- [ ] Change API URL to: `https://api.pesapal.com/api/v3`
- [ ] Update webhook URL to production domain
- [ ] Test with real payment (small amount)
- [ ] Verify webhook delivery on production
- [ ] Set up monitoring/alerting
- [ ] Set up email notifications
- [ ] Configure SSL/TLS (should be automatic on Vercel)
- [ ] Test on mobile browsers

### After Launch
- [ ] Monitor payment_logs daily
- [ ] Check for failed payments
- [ ] Verify subscriptions are being activated
- [ ] Monitor webhook delivery rate
- [ ] Check for any error patterns
- [ ] Gather user feedback
- [ ] Track conversion rate

---

## ⚠️ Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid credentials | Check CONSUMER_KEY and CONSUMER_SECRET |
| Webhook not received | Wrong callback URL | Update in PesaPal dashboard |
| "Invalid signature" | Secret mismatch | Verify PESAPAL_CONSUMER_SECRET |
| Subscription not active | Webhook failed | Check server logs, retry webhook |
| Payment page blank | API error | Check browser console, check server logs |
| CORS error | API request from wrong domain | Ensure request from `/api/` route |
| Subscription pending forever | Webhook not configured | Add webhook URL in PesaPal dashboard |

---

## 📞 Support Resources

### PesaPal
- **Developer Dashboard:** https://developer.pesapal.com/
- **API Documentation:** https://developer.pesapal.com/api-docs/
- **Support Email:** developer@pesapal.com
- **Test Cards:** https://developer.pesapal.com/docs/testing/

### Zintra Project
- **Integration Guide:** See PESAPAL_INTEGRATION_GUIDE.md
- **Webhook Documentation:** See webhook handler code comments
- **Database Schema:** See MIGRATION file

---

## ✅ Completion Criteria

**You're done when:**

1. ✅ All environment variables configured
2. ✅ All files created in correct locations
3. ✅ Database migration applied
4. ✅ Subscription page updated
5. ✅ Webhook configured in PesaPal
6. ✅ Payment flow tested end-to-end
7. ✅ Failed payment handled correctly
8. ✅ Payment logs populated
9. ✅ Vendor profile shows active subscription
10. ✅ Ready for production deployment

---

## 📅 Timeline

- **Setup:** 15 minutes
- **Implementation:** 1.5 hours
- **Testing:** 1 hour
- **Documentation:** 30 minutes
- **Total:** 3-4 hours

---

## 🎯 Next Session

After this integration is complete:

1. **Auto-renewal** - Create scheduled function to renew subscriptions
2. **Feature limits** - Enforce RFQ response limits per tier
3. **Email notifications** - Send payment confirmations
4. **Analytics** - Dashboard showing payment metrics
5. **Refunds** - Handle subscription cancellations and refunds

---

**Status:** Ready to implement  
**Difficulty:** Medium  
**Risk:** Low (sandbox testing first)  
**ROI:** High (enables actual payments)

