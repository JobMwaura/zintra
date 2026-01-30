# Credits System - Technical Reference

**Status**: Complete Phase 1  
**Purpose**: Quick lookup reference for developers

## Quick API Reference

### Credit Operations

```javascript
// Check balance
const balance = await getUserCreditsBalance(userId);
// Returns: { credit_balance, total_purchased, total_used, total_refunded }

// Check if can afford action
const check = await checkSufficientCredits(userId, 'post_job');
// Returns: { hasSufficient: true/false, balance: 1000, cost: 500 }

// Deduct credits
const result = await deductCredits(userId, 'post_job', referenceId);
// Returns: { success: true, balanceBefore: 1000, balanceAfter: 500 }

// Add credits
const result = await addCredits(userId, 5000, 'purchase', 'mpesa', txnId);
// Returns: { success: true, message: '...', amountAdded: 5000 }

// Get history
const transactions = await getTransactionHistory(userId, 20);
// Returns: Array of { id, amount, status, created_at, ... }

// Get packages
const packages = await getCreditPackages('employer');
// Returns: Array of { id, package_name, credit_amount, price_ksh, ... }
```

### Payment Operations

```javascript
// Initiate M-Pesa payment
const result = await initiateMpesaPayment(
  '254712345678',
  500,
  'Credit purchase',
  userId
);
// Returns: { success: true, checkoutRequestId: 'xxx', merchantRequestId: 'yyy' }

// Check payment status
const status = await checkMpesaStatus(checkoutRequestId);
// Returns: { success: true, status: 'completed'|'pending'|'failed' }

// Format phone number
const formatted = formatPhoneForMpesa('0712345678');
// Returns: '254712345678'

// Validate phone
const isValid = isValidMpesaPhone('254712345678');
// Returns: true/false
```

## Database Schema Quick Reference

### user_credits
```sql
-- User's credit balance and statistics
id (UUID)
user_id (UUID) -- Foreign key to auth.users
credit_balance (INT) -- Current balance
total_purchased (INT) -- Lifetime purchased
total_used (INT) -- Lifetime spent
total_refunded (INT) -- Lifetime refunded
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### credit_transactions
```sql
-- Full payment transaction history
id (UUID)
user_id (UUID)
transaction_type (TEXT) -- 'purchase', 'refund', 'admin_adjustment'
amount (DECIMAL)
payment_method (TEXT) -- 'mpesa', 'card', 'manual'
status (TEXT) -- 'pending', 'completed', 'failed', 'cancelled'
description (TEXT)
mpesa_phone (TEXT)
mpesa_request_id (TEXT)
mpesa_merchant_request_id (TEXT)
mpesa_transaction_id (TEXT)
mpesa_response_code (TEXT)
mpesa_response_desc (TEXT)
completed_at (TIMESTAMP)
created_at (TIMESTAMP)
```

### credit_usage_logs
```sql
-- Log of every credit action
id (UUID)
user_id (UUID)
action_type (TEXT) -- 'post_job', 'apply_gig', 'post_job', etc
credits_deducted (INT)
reference_id (UUID) -- Job ID, Gig ID, Application ID
reason (TEXT)
created_at (TIMESTAMP)
```

### credit_pricing_actions
```sql
-- Flexible pricing per action
id (UUID)
action_type (TEXT) -- 'post_job', 'apply_job', etc
cost_ksh (INT)
is_active (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### credits_packages
```sql
-- Predefined credit packages
id (UUID)
user_type (TEXT) -- 'employer', 'worker'
package_name (TEXT)
credit_amount (INT)
price_ksh (INT)
discount_percentage (INT)
description (TEXT)
is_active (BOOLEAN)
position (INT) -- Display order
created_at (TIMESTAMP)
```

### credit_promotions
```sql
-- Promo codes for discounts
id (UUID)
code (TEXT) -- Unique promo code
discount_percentage (INT)
credit_bonus (INT)
valid_from (TIMESTAMP)
valid_until (TIMESTAMP)
usage_limit (INT)
used_count (INT)
created_at (TIMESTAMP)
```

## Component Props Reference

### CreditsBalance

```javascript
<CreditsBalance
  userId="string (required)" // User UUID
  variant="'compact'|'full'" // Default: 'compact'
/>

// Returns:
// - Compact: Balance with "Buy" button in navbar
// - Full: Full widget with stats and purchase button
```

### BuyCreditsModal

```javascript
<BuyCreditsModal
  userId="string (required)"
  userType="'employer'|'worker' (required)"
  onClose="function (required)" // Called when modal should close
/>

// Displays:
// - Package grid with pricing
// - M-Pesa phone input
// - Promo code field
// - Order summary
// - Payment status
```

### CreditCheck

```javascript
<CreditCheck
  userId="string (required)"
  actionType="string (required)" // 'post_job', 'apply_job', etc
  actionLabel="string (required)" // 'post a job', 'apply for this job'
  onProceed="function (required)" // Called if user confirms
  onCancel="function (required)" // Called if user cancels
/>

// Modals:
// - If sufficient: Confirmation with cost breakdown
// - If insufficient: Error with "Buy Credits" link
```

## Action Types & Costs

```javascript
// Employer Actions
'post_job'        // 500 KES
'post_gig'        // 250 KES
'renew_job'       // 250 KES
'boost_job'       // 200 KES
'featured_job'    // 1000 KES

// Worker Actions
'apply_job'       // 50 KES
'apply_gig'       // 25 KES
'send_message'    // 100 KES
'save_job'        // 0 KES (free)

// Note: Actual costs in CREDIT_PRICING_ACTIONS table
// Can be updated without code changes
```

## Environment Variables

```bash
# Required for functionality
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MPESA_CONSUMER_KEY=xxx
MPESA_CONSUMER_SECRET=xxx
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279...
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
```

## Error Codes

### M-Pesa Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Payment completed |
| 1 | Insufficient funds | Retry or select smaller amount |
| 2 | Less amount | Increase amount |
| 1032 | User cancelled | Show retry option |
| 2001 | Unable to lock subscriber | Retry later |
| 9001 | Headers are missing | Check headers |

### Custom Error Messages

```javascript
// Insufficient credits
'Insufficient credits. Still need X more.'

// Invalid phone number
'Invalid phone number. Please use format: 0712345678'

// Network error
'Network error initiating payment'

// Rate limited
'Too many requests. Please try again later.'

// Expired promo code
'Invalid or expired promo code'
```

## Common Integration Patterns

### Pattern 1: Post Action with Credit Check

```javascript
const handlePostJob = async (jobData) => {
  // 1. Show credit check modal
  setShowCreditCheck(true);
  
  // 2. If confirmed, deduct credits
  const deductResult = await deductCredits(userId, 'post_job');
  if (!deductResult.success) {
    alert(deductResult.error);
    return;
  }
  
  // 3. Create job in database
  const jobId = await createJob(jobData);
  
  // 4. Redirect
  router.push(`/jobs/${jobId}`);
};
```

### Pattern 2: Buy Credits Flow

```javascript
const handleBuyCredits = async (phoneNumber, packageId) => {
  // 1. Initiate M-Pesa payment
  const result = await initiateMpesaPayment(
    phoneNumber,
    package.price,
    'Credit purchase',
    userId
  );
  
  if (!result.success) {
    alert(result.error);
    return;
  }
  
  // 2. Store checkout ID for polling
  setCheckoutId(result.checkoutRequestId);
  
  // 3. Poll for status (optional - callback handles this)
  const timer = setInterval(async () => {
    const status = await checkMpesaStatus(result.checkoutRequestId);
    if (status.status === 'completed') {
      clearInterval(timer);
      // Credits already added by callback
      alert('Payment successful!');
    }
  }, 2000);
};
```

### Pattern 3: Display Balance in Header

```javascript
export default function Navbar({ userId }) {
  const [balance, setBalance] = useState(null);
  
  useEffect(() => {
    const refresh = async () => {
      const data = await getUserCreditsBalance(userId);
      setBalance(data?.credit_balance);
    };
    
    refresh();
    const interval = setInterval(refresh, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [userId]);
  
  return (
    <nav>
      <span className="balance">{balance} credits</span>
      <Link href="/credits/buy">Buy</Link>
    </nav>
  );
}
```

## Testing Checklist

```javascript
// Test 1: Get balance
✓ getUserCreditsBalance() returns correct balance
✓ Balance includes purchased, used, refunded

// Test 2: Check sufficiency
✓ checkSufficientCredits() returns true when balance >= cost
✓ checkSufficientCredits() returns false when balance < cost

// Test 3: Deduct credits
✓ deductCredits() decrements balance
✓ deductCredits() logs transaction
✓ deductCredits() prevents overdraft
✓ deductCredits() handles rate limits

// Test 4: M-Pesa payment
✓ initiateMpesaPayment() returns checkoutRequestId
✓ Callback processes payment correctly
✓ Credits added immediately after callback
✓ Transaction status updated

// Test 5: Buy Credits Flow
✓ Package selection works
✓ M-Pesa prompt appears
✓ Callback fires and processes payment
✓ Balance updates in real-time

// Test 6: Check Credit Modal
✓ Shows when user has insufficient credits
✓ Blocks action until credits purchased
✓ Shows confirmation when sufficient
```

## Performance Optimization

### Balance Caching

```javascript
// Cache balance for 30 seconds to reduce DB hits
const BALANCE_CACHE_TIME = 30000;
let cachedBalance = null;
let cacheTime = 0;

export async function getUserCreditsBalanceCached(userId) {
  const now = Date.now();
  if (cachedBalance && now - cacheTime < BALANCE_CACHE_TIME) {
    return cachedBalance;
  }
  
  cachedBalance = await getUserCreditsBalance(userId);
  cacheTime = now;
  return cachedBalance;
}
```

### Batch Operations

```javascript
// Deduct multiple credits at once
export async function deductMultipleCredits(userId, actions) {
  // Instead of: for(let action of actions) { await deductCredits(...) }
  // Use transaction: await supabase.rpc('batch_deduct', { ... })
}
```

## Monitoring & Alerts

### Key Metrics to Monitor

```javascript
// 1. Payment success rate
// SELECT COUNT(*) WHERE status = 'completed' / 
//   COUNT(*) WHERE status IN ('pending', 'completed', 'failed')

// 2. Average transaction time
// SELECT AVG(completed_at - created_at) FROM credit_transactions

// 3. Credit usage by action
// SELECT action_type, COUNT(*), SUM(credits_deducted) 
//   FROM credit_usage_logs GROUP BY action_type

// 4. User retention after first purchase
// SELECT COUNT(DISTINCT user_id) WHERE total_purchased > 0
```

### Error Alerts

- M-Pesa initiation failures
- Payment callback delays (> 60 seconds)
- Rate limit triggers
- Zero balance users posting
- Promo code abuse

## Common Mistakes to Avoid

1. ❌ Not calling `deductCredits()` after confirming action
2. ❌ Showing balance before checking auth state
3. ❌ Using incorrect phone number format (missing 254)
4. ❌ Not handling callback delays (up to 60 seconds)
5. ❌ Hardcoding prices instead of querying DB
6. ❌ Not checking rate limits before allowing action
7. ❌ Showing M-Pesa prompt before API call returns
8. ❌ Not logging failed payments for debugging

## File Dependencies

```
components/credits/BuyCreditsModal.js
├── lib/credits-helpers.js (getCreditPackages)
├── lib/payments/mpesa-service.js (initiateMpesaPayment)
└── next/navigation (useRouter)

components/credits/CreditCheck.js
├── lib/credits-helpers.js (checkSufficientCredits)
└── next/link

components/credits/CreditsBalance.js
├── lib/credits-helpers.js (getUserCreditsBalance)
└── next/link

app/api/payments/mpesa/initiate/route.js
├── lib/supabase/server.js
└── M-Pesa API

app/api/payments/mpesa/callback/route.js
├── lib/supabase/server.js
├── lib/payments/mpesa-service.js
└── M-Pesa API (receiving)
```

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial release with M-Pesa integration |
| Future | 2024 | Flutterwave card payments |
| Future | 2024 | Admin dashboard |
| Future | 2024 | Advanced promo system |

---

Keep this reference handy during integration!
