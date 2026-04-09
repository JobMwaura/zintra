# 💳 ZINTRA CREDITS SYSTEM - DESIGN & IMPLEMENTATION

**Date**: 29 January 2026  
**Status**: Design Phase  
**Priority**: Critical (Payment Model)

---

## 📋 Executive Summary

Instead of Zintra holding money and releasing after job completion, we'll implement a **pre-paid credits system**:

- **Employers** buy credits to post jobs/gigs
- **Workers** buy credits to apply for jobs/gigs
- **Credits deducted immediately** when posting/applying
- **No holding period** - simpler, faster, better UX
- **Transparent pricing** - users know exact cost upfront

---

## 🎯 Credit System Overview

### How It Works

```
EMPLOYER FLOW:
1. Employer opens Zintra
2. Sees credit balance (e.g., 0 KES)
3. Clicks "Buy Credits"
4. Chooses package (e.g., 5,000 KES = 10 job posts)
5. Pays via M-Pesa/card
6. Credits added to account
7. Posts job → 500 KES deducted per job
8. Balance updates in real-time

WORKER FLOW:
1. Worker opens Zintra
2. Sees credit balance (e.g., 0 KES)
3. Clicks "Buy Credits"
4. Chooses package (e.g., 500 KES = 10 applications)
5. Pays via M-Pesa/card
6. Credits added to account
7. Applies for gig → 50 KES deducted per application
8. Balance updates in real-time
```

---

## 💰 Credit Pricing Structure

### Employer Credit Packages

| Package | Credits | Cost | Per Job Cost | Save | Best For |
|---------|---------|------|--------------|------|----------|
| **Starter** | 1,000 KES | 1,000 KES | 500 KES | - | Testing (2 jobs) |
| **Professional** | 5,000 KES | 4,500 KES | 450 KES | 10% | Growing (10 jobs) |
| **Business** | 10,000 KES | 8,500 KES | 425 KES | 15% | Active (20+ jobs) |
| **Enterprise** | 25,000 KES | 20,000 KES | 400 KES | 20% | High volume (50+ jobs) |

**Per-Action Costs**:
- Post a Job: 500 KES
- Post a Gig: 250 KES (shorter duration, fewer applicants)
- Renew/Extend: 250 KES
- Feature boost (top placement): 200 KES

### Worker Credit Packages

| Package | Credits | Cost | Per Application | Save | Best For |
|---------|---------|------|-----------------|------|----------|
| **Casual** | 500 KES | 500 KES | 50 KES | - | Trying out (10 applications) |
| **Active** | 2,000 KES | 1,800 KES | 45 KES | 10% | Regular (40+ applications) |
| **Professional** | 5,000 KES | 4,000 KES | 40 KES | 20% | Full-time (125+ applications) |
| **Premium** | 10,000 KES | 7,500 KES | 37.5 KES | 25% | Serious job hunter (250+ applications) |

**Per-Action Costs**:
- Apply for Job: 50 KES
- Apply for Gig: 25 KES (less formal application)
- Save Job to Wishlist: Free (builds engagement)
- Message Employer: 100 KES (direct contact)

---

## 🗄️ Database Schema

### New Tables

#### `credits_packages`
```sql
CREATE TABLE credits_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_type VARCHAR (20) NOT NULL, -- 'employer' or 'worker'
  name VARCHAR (100) NOT NULL, -- 'Starter', 'Professional', etc.
  credit_amount INTEGER NOT NULL, -- Amount of credits
  price_ksh DECIMAL(10, 2) NOT NULL, -- Price in KES
  discount_percentage INTEGER DEFAULT 0, -- Discount if buying bulk
  features TEXT[], -- Array of included features
  position INTEGER, -- Display order
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `user_credits`
```sql
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_balance DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Current balance
  total_purchased DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Total spent
  total_used DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Total used
  last_purchased_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

#### `credit_transactions`
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type VARCHAR (50) NOT NULL, -- 'purchase', 'debit', 'refund', 'bonus'
  amount DECIMAL(10, 2) NOT NULL,
  action_type VARCHAR (50), -- 'post_job', 'apply_gig', 'message', etc.
  reference_id UUID, -- References job, application, etc.
  description TEXT,
  balance_before DECIMAL(10, 2),
  balance_after DECIMAL(10, 2),
  payment_method VARCHAR (50), -- 'mpesa', 'card', 'bank_transfer'
  mpesa_transaction_id VARCHAR (100), -- M-Pesa ref
  status VARCHAR (20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (user_id),
  INDEX (created_at)
);
```

#### `credit_usage_logs`
```sql
CREATE TABLE credit_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type VARCHAR (50) NOT NULL, -- 'post_job', 'apply_gig', etc.
  credits_deducted DECIMAL(10, 2) NOT NULL,
  reference_id UUID, -- Job ID, Application ID, etc.
  reason TEXT,
  auto_refund BOOLEAN DEFAULT false, -- Was refunded automatically?
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX (user_id),
  INDEX (created_at)
);
```

#### `credit_promotions`
```sql
CREATE TABLE credit_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR (20) UNIQUE NOT NULL, -- Promo code
  discount_percentage INTEGER,
  credit_bonus DECIMAL(10, 2), -- Extra credits given
  description TEXT,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Credit Lifecycle

### 1️⃣ Purchase Flow

```
User clicks "Buy Credits"
    ↓
Select package
    ↓
Review: "5,000 KES = 10 job posts"
    ↓
Choose payment method:
  ├─ M-Pesa (instant)
  ├─ Card (instant)
  └─ Bank Transfer (1-2 days)
    ↓
Payment processed
    ↓
Credits added to account
    ↓
Email confirmation sent
    ↓
Can immediately post/apply
```

### 2️⃣ Usage Flow (Posting Job)

```
Employer fills job form
    ↓
Check: Has 500 KES credit?
  ├─ YES → Continue
  └─ NO → Show "Insufficient Credits" → Offer to buy
    ↓
Review job details
    ↓
Click "Post Job"
    ↓
Deduct 500 KES from balance
    ↓
Log transaction
    ↓
Job published
    ↓
Show "Posted! 500 KES deducted. Balance: 4,000 KES"
```

### 3️⃣ Usage Flow (Applying for Gig)

```
Worker sees gig listing
    ↓
Click "Apply Now"
    ↓
Check: Has 25 KES credit?
  ├─ YES → Continue
  └─ NO → Show "Insufficient Credits" → Offer to buy
    ↓
Fill application form
    ↓
Click "Submit Application"
    ↓
Deduct 25 KES from balance
    ↓
Log transaction
    ↓
Application submitted
    ↓
Show "Applied! 25 KES deducted. Balance: 475 KES"
```

### 4️⃣ Refund Flow

User can request refund if:
- Job/gig was rejected (auto-refund 50%)
- Job/gig was cancelled by employer (auto-refund 100%)
- User requests within 24 hours (admin review)

```
Application rejected by employer
    ↓
Auto-refund 50% of cost (12.5 KES)
    ↓
Update balance: 475 + 12.5 = 487.5 KES
    ↓
Log transaction as 'refund'
    ↓
Send notification: "Refunded 12.5 KES"
```

---

## 🛠️ Implementation Components

### Frontend Components Needed

#### 1. Credits Balance Widget
```javascript
// components/credits/CreditsBalance.js
- Shows current balance (in KES)
- Shows if balance is low
- Quick link to buy credits
- Refreshes every 30 seconds
```

#### 2. Buy Credits Modal
```javascript
// components/credits/BuyCreditsModal.js
- Display all packages
- Show savings/discounts
- Payment method selector
- M-Pesa payment flow
- Card payment flow (Stripe/Flutterwave)
- Promo code field
- Transaction confirmation
```

#### 3. Credit Check Component
```javascript
// components/credits/CreditCheck.js
- Checks if user has enough credits
- Shows cost before action
- Offers quick purchase option
- Prevents action if insufficient credits
```

#### 4. Transaction History
```javascript
// components/credits/TransactionHistory.js
- Shows all purchases
- Shows all usages
- Shows refunds
- Export CSV option
- Filter by type/date
```

#### 5. Credit Dashboard
```javascript
// components/credits/CreditDashboard.js
- Balance overview
- Usage statistics
- Spending graph
- Recent transactions
- Recommended actions
```

---

## 📱 UI/UX Examples

### Balance Widget (Top Right)
```
┌─────────────────────────┐
│ 💳 Credits              │
│ Balance: 4,500 KES      │
│                         │
│ [Buy More Credits →]    │
└─────────────────────────┘
```

### Buy Credits Modal
```
┌─────────────────────────────────────┐
│ Buy Credits                    ✕    │
├─────────────────────────────────────┤
│                                     │
│ Starter          Professional       │
│ 1,000 KES        5,000 KES          │
│ 1,000 KES        4,500 KES (-10%)   │
│ [Select]         [Select]           │
│                                     │
│ Business         Enterprise         │
│ 10,000 KES       25,000 KES         │
│ 8,500 KES (-15%) 20,000 KES (-20%)  │
│ [Select]         [Select]           │
│                                     │
│ Promo Code: [_________]             │
│                                     │
│                [Cancel] [Proceed]   │
└─────────────────────────────────────┘
```

### Before Posting Job
```
┌─────────────────────────────────────┐
│ Post a Job                      ✕   │
├─────────────────────────────────────┤
│                                     │
│ You have: 450 KES                  │
│ Cost to post: 500 KES              │
│                                     │
│ ⚠️ Insufficient Credits            │
│                                     │
│ [Cancel] [Buy 5,000 KES Credits]   │
└─────────────────────────────────────┘
```

### After Posting Job Successfully
```
┌─────────────────────────────────────┐
│ ✅ Job Posted Successfully!         │
├─────────────────────────────────────┤
│                                     │
│ Job Title: Bricklayer Needed       │
│ Cost: 500 KES                       │
│                                     │
│ Previous Balance: 950 KES           │
│ New Balance:     450 KES            │
│                                     │
│ Next Steps:                         │
│ • Job is now live                  │
│ • Receive applications             │
│ • Review applicants                │
│                                     │
│           [View Job] [Done]         │
└─────────────────────────────────────┘
```

---

## 🔐 Security & Validation

### Credit Deduction Rules

1. **Atomic Transactions**
   ```javascript
   // Deduct credits and create job in same transaction
   // If either fails, rollback both
   BEGIN TRANSACTION;
     UPDATE user_credits SET balance = balance - 500;
     INSERT INTO listings (job_details);
   COMMIT; // Both succeed or both fail
   ```

2. **Prevent Negative Balance**
   ```javascript
   // Check balance BEFORE deducting
   if (userBalance < costPerAction) {
     throw new Error('Insufficient credits');
   }
   ```

3. **Idempotency**
   ```javascript
   // Same request won't deduct twice
   // Use idempotency keys on payment processing
   ```

4. **Rate Limiting**
   ```javascript
   // Prevent abuse (posting 100 jobs in 1 minute)
   - Max 10 jobs per hour
   - Max 50 jobs per day
   - Escalating costs for high volume
   ```

---

## 💳 Payment Integration

### M-Pesa Integration

```javascript
// lib/payments/mpesa.js

async function initiateSTKPush(phoneNumber, amount) {
  const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BusinessShortCode: '174379',
      Password: generatePassword(),
      Timestamp: getTimestamp(),
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: '174379',
      PhoneNumber: phoneNumber,
      CallBackURL: 'https://zintra.com/api/mpesa/callback',
      AccountReference: 'ZintraCredits',
      TransactionDesc: 'Buy Zintra Credits'
    })
  });
  
  return response.json();
}

async function handleMPesaCallback(payload) {
  // Validate signature
  // Update user credits
  // Log transaction
  // Send confirmation email
}
```

### Card Payment (Flutterwave)

```javascript
// lib/payments/flutterwave.js

async function initiateCardPayment(email, amount) {
  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FLUTTERWAVE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tx_ref: generateTransactionId(),
      amount: amount,
      currency: 'KES',
      payment_options: 'card',
      customer: {
        email: email,
        name: userName
      },
      customizations: {
        title: 'Buy Zintra Credits',
        description: `Purchase ${creditsAmount} credits`
      },
      redirect_url: 'https://zintra.com/credits/success'
    })
  });
  
  return response.json();
}
```

---

## 📊 Analytics & Reporting

### Dashboard Metrics

**For Admins**:
- Total credits sold (KES)
- Total credits used (KES)
- Most popular package
- Payment method breakdown
- Refund rate
- Daily/monthly revenue

**For Users**:
- Credit spending trend
- Usage by action type
- Cost per action analysis
- Recommended package based on usage

---

## 🎁 Promotions & Incentives

### Promotional Strategies

1. **First-Time Bonus**
   - New employers get 2,000 KES free
   - New workers get 500 KES free

2. **Referral Program**
   - Refer friend → Both get 500 KES bonus
   - Max 5 referrals per month

3. **Loyalty Program**
   - Buy 100,000 KES total → 20% discount on next purchase
   - Buy 1,000,000 KES total → Personal account manager

4. **Seasonal Promotions**
   - "New Year Special": Buy 5,000 KES, get 1,000 free
   - "Construction Peak": Double credits for employers in April-September

5. **Achievement Badges**
   - "First 10 Jobs Posted" → 1,000 KES bonus
   - "Perfect Rating" → 500 KES bonus

---

## 📋 Implementation Roadmap

### Phase 1: Core System (Week 1-2)
- [ ] Create database tables
- [ ] Build payment integration (M-Pesa)
- [ ] Create CreditsBalance component
- [ ] Create BuyCreditsModal
- [ ] Implement credit deduction logic

### Phase 2: User Interface (Week 2-3)
- [ ] Build CreditCheck component
- [ ] Build TransactionHistory
- [ ] Build CreditDashboard
- [ ] Update post job/gig forms
- [ ] Update apply buttons

### Phase 3: Advanced Features (Week 3-4)
- [ ] Add card payment (Flutterwave)
- [ ] Add promo code system
- [ ] Add refund system
- [ ] Add analytics dashboard
- [ ] Add admin controls

### Phase 4: Optimization (Week 4+)
- [ ] Performance optimization
- [ ] Security audit
- [ ] User testing
- [ ] Bug fixes
- [ ] Documentation

---

## 🎯 Success Criteria

✅ Users can easily buy credits  
✅ Credits deducted immediately when posting/applying  
✅ No payment processing errors  
✅ Fast payment processing (< 30 seconds)  
✅ Clear balance display everywhere  
✅ Transaction history accurate  
✅ Refund system working  
✅ Analytics show revenue  
✅ Users understand pricing  
✅ Mobile experience smooth  

---

## 💡 Key Advantages Over Hold-and-Release

| Feature | Hold & Release | Credit System |
|---------|---|---|
| **Complexity** | High (escrow) | Simple (pre-paid) |
| **Speed** | Slow (wait for completion) | Instant (post immediately) |
| **Trust Issues** | Both parties must trust Zintra | No trust needed |
| **User Experience** | Confusing flow | Clear & straightforward |
| **Revenue Model** | Dependent on completion | Guaranteed upfront |
| **Chargeback Risk** | High (refund requests) | Low (pre-paid) |
| **Regulatory** | Complex (money holding) | Simple (service fees) |
| **Africa Adoption** | Low (unfamiliar) | High (prepaid culture) |

---

**Status**: 🟡 DESIGN READY FOR IMPLEMENTATION  
**Next Step**: Begin Phase 1 implementation  
**Questions?**: Clarify any requirements before coding
