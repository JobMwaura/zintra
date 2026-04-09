# Credits System Implementation Guide - Phase 1

**Status**: 🟢 Phase 1 Implementation Ready  
**Created**: 2024  
**Purpose**: Complete backend and API implementation for pre-paid credits system

## Table of Contents

1. [Files Created](#files-created)
2. [Environment Variables](#environment-variables)
3. [Database Execution](#database-execution)
4. [Integration Points](#integration-points)
5. [API Reference](#api-reference)
6. [Component Usage](#component-usage)
7. [Testing Guide](#testing-guide)
8. [Deployment Checklist](#deployment-checklist)

---

## Files Created

### Helper Libraries

**1. `lib/credits-helpers.js`** - Core Credit Operations
- `getUserCreditsBalance(userId)` - Get current balance
- `getActionCost(actionType)` - Get cost of action
- `checkSufficientCredits(userId, actionType)` - Verify user can afford action
- `deductCredits(userId, actionType, referenceId)` - Deduct credits
- `addCredits(userId, amount, transactionType, paymentMethod, mpesaTransactionId)` - Add credits
- `refundCredits(userId, amount, reason, referenceId)` - Process refund
- `getTransactionHistory(userId, limit)` - Get past transactions
- `getCreditPackages(userType)` - Get available packages
- `validatePromoCode(code)` - Verify promo code
- `getCreditStatistics(userId)` - Get usage stats
- `checkRateLimit(userId, actionType)` - Prevent abuse

**2. `lib/payments/mpesa-service.js`** - M-Pesa Integration
- `initiateMpesaPayment(phoneNumber, amount, description, userId)` - Start payment
- `checkMpesaStatus(checkoutRequestId)` - Check payment status
- `formatPhoneForMpesa(phoneNumber)` - Phone formatting
- `isValidMpesaPhone(phoneNumber)` - Phone validation
- `processMpesaCallback(callbackData, supabase)` - Handle M-Pesa webhook
- `getMpesaTransactions(supabase, userId, limit)` - Get M-Pesa history
- `retryMpesaPayment(transactionId)` - Retry failed payment

### React Components

**3. `components/credits/CreditsBalance.js`** - Balance Widget
- Display user's current credits
- Compact (navbar) and full (page) variants
- Auto-refresh every 30 seconds
- Statistics: purchased, used, refunded
- Link to buy credits

**4. `components/credits/BuyCreditsModal.js`** - Credit Purchase
- Display available packages with pricing
- Promo code support
- M-Pesa phone number input
- Order summary before payment
- Real-time payment processing status
- Success/error handling

**5. `components/credits/CreditCheck.js`** - Pre-Action Validation
- Modal that appears before posting/applying
- Shows cost vs. balance
- Insufficient credits → redirect to buy
- Sufficient credits → confirm and proceed

### API Routes

**6. `app/api/payments/mpesa/initiate/route.js`** - Payment Initiation
- Validates input (phone, amount, userId)
- Gets M-Pesa access token
- Creates transaction record
- Initiates STK Push
- Returns checkout request ID
- Handles M-Pesa errors gracefully

**7. `app/api/payments/mpesa/callback/route.js`** - Payment Callback
- Receives M-Pesa webhooks
- Extracts payment details (amount, receipt, date)
- Updates transaction status
- Credits user account via `add_user_credits()` function
- Logs all transactions for audit

**8. `app/api/payments/mpesa/status/route.js`** - Status Check
- Query M-Pesa for transaction status
- Returns: pending, completed, or failed
- Used for polling payment progress

---

## Environment Variables

Add these to your `.env.local` file:

```bash
# M-Pesa (Sandbox for development, Production for live)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379  # Your till/business shortcode
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503b6053e494d077a332de88d9d913c77d6dd0
MPESA_CALLBACK_URL=https://zintra-sandy.vercel.app/api/payments/mpesa/callback

# Database (already configured in Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### How to Get M-Pesa Credentials

1. **Register as M-Pesa Developer**
   - Go to: https://developer.safaricom.co.ke/
   - Sign up and create an app
   - Get Consumer Key & Consumer Secret
   - Use shortcode 174379 (sandbox test account)
   - Use passkey: `bfb279f9aa9bdbcf158e97dd1a503b6053e494d077a332de88d9d913c77d6dd0`

2. **For Production**
   - Safaricom will provide your actual till/business shortcode
   - Register your callback URL with Safaricom
   - Switch from sandbox to production endpoints

---

## Database Execution

The database schema should already be created from `CREDITS_SYSTEM_MIGRATION.sql`. Verify by checking Supabase:

### Verify Tables Exist

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'credit%' 
OR tablename = 'user_credits';
```

Expected tables:
- ✅ `credits_packages` - Pricing packages
- ✅ `user_credits` - User balances
- ✅ `credit_transactions` - Payment history
- ✅ `credit_usage_logs` - Action logs
- ✅ `credit_promotions` - Promo codes
- ✅ `credit_pricing_actions` - Action costs

### Verify Functions Exist

```sql
-- Check if functions exist
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace 
AND proname IN ('deduct_user_credits', 'add_user_credits');
```

Expected functions:
- ✅ `deduct_user_credits()` - Subtract credits
- ✅ `add_user_credits()` - Add credits

### Default Data

Verify default data was inserted:

```sql
-- Check packages
SELECT * FROM credits_packages LIMIT 5;

-- Check action pricing
SELECT * FROM credit_pricing_actions WHERE is_active = true;

-- Should show: post_job (500), post_gig (250), apply_job (50), apply_gig (25), etc.
```

---

## Integration Points

### 1. Post Job Flow

Update `app/employers/post-job/page.js`:

```javascript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreditCheck from '@/components/credits/CreditCheck';
import { deductCredits } from '@/lib/credits-helpers';
import { useAuth } from '@/hooks/useAuth';

export default function PostJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showCreditCheck, setShowCreditCheck] = useState(false);
  const [jobData, setJobData] = useState(null);

  const handleSubmit = async (data) => {
    // Set job data and show credit check
    setJobData(data);
    setShowCreditCheck(true);
  };

  const handleCreditCheckProceed = async () => {
    try {
      // Deduct credits
      const result = await deductCredits(user.id, 'post_job', null);

      if (!result.success) {
        alert(result.error);
        return;
      }

      // Create job in database
      const jobId = await createJobInDatabase(jobData);

      // Redirect to job posted confirmation
      router.push(`/jobs/${jobId}/confirmation`);
    } catch (error) {
      alert('Error posting job: ' + error.message);
    }
  };

  return (
    <>
      {showCreditCheck && (
        <CreditCheck
          userId={user.id}
          actionType="post_job"
          actionLabel="post a job"
          onProceed={handleCreditCheckProceed}
          onCancel={() => setShowCreditCheck(false)}
        />
      )}
      
      {/* Post Job Form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(new FormData(e.target));
      }}>
        {/* Form fields... */}
      </form>
    </>
  );
}
```

### 2. Apply to Job Flow

Update `components/careers/JobCard.js`:

```javascript
'use client';

import CreditCheck from '@/components/credits/CreditCheck';
import { deductCredits } from '@/lib/credits-helpers';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function JobCard({ job, userId }) {
  const [showCreditCheck, setShowCreditCheck] = useState(false);

  const handleApplyClick = () => {
    if (userId) {
      setShowCreditCheck(true);
    } else {
      // Redirect to login
      router.push('/user-registration');
    }
  };

  const handleCreditCheckProceed = async () => {
    try {
      const result = await deductCredits(userId, 'apply_job', job.id);

      if (!result.success) {
        alert(result.error);
        return;
      }

      // Create application
      await createApplication(userId, job.id);
      alert('Application submitted successfully!');
      setShowCreditCheck(false);
    } catch (error) {
      alert('Error applying: ' + error.message);
    }
  };

  return (
    <>
      {showCreditCheck && (
        <CreditCheck
          userId={userId}
          actionType="apply_job"
          actionLabel="apply to this job"
          onProceed={handleCreditCheckProceed}
          onCancel={() => setShowCreditCheck(false)}
        />
      )}

      <div className="job-card">
        {/* Card content... */}
        <button onClick={handleApplyClick}>Apply Now</button>
      </div>
    </>
  );
}
```

### 3. Add to Navigation

Update `components/layout/Navbar.js`:

```javascript
import CreditsBalance from '@/components/credits/CreditsBalance';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav>
      {/* ... other nav items ... */}
      {user && <CreditsBalance userId={user.id} variant="compact" />}
    </nav>
  );
}
```

### 4. Employer Dashboard

Create `app/employer/dashboard/page.js`:

```javascript
'use client';

import CreditsBalance from '@/components/credits/CreditsBalance';
import BuyCreditsModal from '@/components/credits/BuyCreditsModal';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [showBuyModal, setShowBuyModal] = useState(false);

  return (
    <div className="dashboard">
      <div className="sidebar">
        <CreditsBalance userId={user.id} variant="full" />
      </div>
      
      {showBuyModal && (
        <BuyCreditsModal
          userId={user.id}
          userType="employer"
          onClose={() => setShowBuyModal(false)}
        />
      )}
    </div>
  );
}
```

---

## API Reference

### POST /api/payments/mpesa/initiate

**Request:**
```json
{
  "phoneNumber": "254712345678",
  "amount": 500,
  "description": "Credit purchase",
  "userId": "user-uuid"
}
```

**Response (Success):**
```json
{
  "success": true,
  "checkoutRequestId": "ws_CO_030323101434abc123",
  "merchantRequestId": "17853113212",
  "transactionId": "txn-uuid"
}
```

**Response (Error):**
```json
{
  "error": "Insufficient funds",
  "success": false
}
```

### POST /api/payments/mpesa/status

**Request:**
```json
{
  "checkoutRequestId": "ws_CO_030323101434abc123"
}
```

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "resultCode": "0",
  "resultDesc": "The service request has been accepted for processing",
  "amount": 500
}
```

---

## Component Usage

### CreditsBalance

```javascript
// Compact (navbar)
<CreditsBalance userId={userId} variant="compact" />

// Full (page/sidebar)
<CreditsBalance userId={userId} variant="full" />
```

### BuyCreditsModal

```javascript
<BuyCreditsModal
  userId={userId}
  userType="employer" // or "worker"
  onClose={() => setShowModal(false)}
/>
```

### CreditCheck

```javascript
<CreditCheck
  userId={userId}
  actionType="post_job" // or "post_gig", "apply_job", "apply_gig"
  actionLabel="post a job"
  onProceed={() => { /* handle proceed */ }}
  onCancel={() => { /* handle cancel */ }}
/>
```

---

## Testing Guide

### 1. Test M-Pesa Payment (Sandbox)

Use test phone number: `254708374149`

Steps:
1. Click "Buy Credits"
2. Select a package
3. Enter phone: `254708374149`
4. Click "Pay"
5. Watch for M-Pesa prompt
6. Check Supabase `credit_transactions` table for entry

### 2. Test Credit Deduction

```javascript
// In browser console
const result = await deductCredits(userId, 'post_job');
console.log(result);
// Should log: { success: true, balanceBefore: 1000, balanceAfter: 500 }
```

### 3. Test Insufficient Credits

```javascript
// First deduct all credits
while (balance > 0) {
  await deductCredits(userId, 'apply_job'); // 50 KES each
}

// Then try to post job (500 KES)
await deductCredits(userId, 'post_job');
// Should return: { success: false, error: "Insufficient credits" }
```

### 4. Manual Database Tests

```sql
-- Check user's balance
SELECT * FROM user_credits WHERE user_id = 'user-uuid';

-- Check transaction history
SELECT * FROM credit_transactions 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC;

-- Check usage logs
SELECT * FROM credit_usage_logs 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC;
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database migration executed (`CREDITS_SYSTEM_MIGRATION.sql`)
- [ ] All 6 new tables created and verified
- [ ] Default pricing data inserted
- [ ] Default packages inserted
- [ ] M-Pesa functions created and tested
- [ ] Environment variables configured
- [ ] M-Pesa credentials verified

### Code Deployment

- [ ] All 5 components created and tested locally
- [ ] All 3 API routes created and tested
- [ ] All 2 helper libraries created
- [ ] No TypeScript errors
- [ ] No import/export issues
- [ ] Components responsive on mobile
- [ ] Form validation working

### M-Pesa Configuration

- [ ] Register at https://developer.safaricom.co.ke/
- [ ] Get Consumer Key & Secret
- [ ] Callback URL registered with Safaricom
- [ ] Test with sandbox credentials first
- [ ] Test payment flow end-to-end
- [ ] Verify callback processing

### Post-Deployment

- [ ] Monitor error logs for first 24 hours
- [ ] Test real M-Pesa payment (if live)
- [ ] Verify credits added to user accounts
- [ ] Test credit deduction on actions
- [ ] Test insufficient credits modal
- [ ] Test promo codes
- [ ] Monitor transaction success rate

---

## Next Steps

After Phase 1 is deployed:

1. **Phase 2 - Advanced Features** (1-2 weeks)
   - Admin dashboard for viewing transactions
   - Promo code management
   - Credit analytics
   - Refund processing UI
   - Rate limiting implementation

2. **Phase 3 - Optimization** (1 week)
   - Add Flutterwave for card payments
   - Implement caching for balance display
   - Add email notifications for transactions
   - Create export function for transaction reports

3. **Phase 4 - Monitoring** (Ongoing)
   - Set up alerts for failed payments
   - Monitor M-Pesa API errors
   - Track credit usage patterns
   - Generate revenue analytics

---

## Troubleshooting

### Common Issues

**"Failed to authenticate with M-Pesa"**
- Check MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET
- Verify app is registered at developer.safaricom.co.ke

**"STK Push not appearing on phone"**
- Verify phone number format (254XXXXXXXXX)
- Check that you're using sandbox test phone: 254708374149
- Verify callback URL is accessible

**"Credits not added after payment"**
- Check callback URL is being called
- Verify `processMpesaCallback()` logs in server
- Check if `add_user_credits()` function exists
- Verify RLS policies allow credit table writes

**"User can't see balance widget"**
- Check user is authenticated
- Verify userId is being passed correctly
- Check Supabase connection string
- Check user_credits table has entry for user

---

## Support & Documentation

- **M-Pesa API Docs**: https://developer.safaricom.co.ke/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction
- **Environment Variables**: https://nextjs.org/docs/basic-features/environment-variables
