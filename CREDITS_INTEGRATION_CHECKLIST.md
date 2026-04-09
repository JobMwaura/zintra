# Credits System - Integration Checklist

**Quick reference for integrating the credits system into your codebase**

---

## ✅ Phase 0: Prerequisites (5 minutes)

- [ ] Database migration executed (`CREDITS_SYSTEM_MIGRATION.sql`)
- [ ] Supabase credentials in `.env.local`
- [ ] M-Pesa credentials obtained from developer.safaricom.co.ke
- [ ] Environment variables configured
- [ ] All 8 files created and in correct directories
- [ ] No TypeScript/import errors in IDE

---

## ✅ Phase 1: Add Balance Widget to Navbar (5 minutes)

**File: `components/layout/Navbar.js`**

```javascript
import CreditsBalance from '@/components/credits/CreditsBalance';
import { useAuth } from '@/hooks/useAuth'; // or your auth hook

export default function Navbar() {
  const { user } = useAuth();
  
  return (
    <nav className="navbar">
      {/* ... existing navbar items ... */}
      
      {user && user.role === 'employer' && (
        <CreditsBalance userId={user.id} variant="compact" />
      )}
    </nav>
  );
}
```

**Test:**
- [ ] Can see balance in navbar when logged in
- [ ] Balance updates every 30 seconds
- [ ] "Buy" button appears next to balance
- [ ] Clicking "Buy" opens modal

---

## ✅ Phase 2: Add Buy Credits Page (10 minutes)

**File: `app/credits/buy/page.js`**

```javascript
'use client';

import BuyCreditsModal from '@/components/credits/BuyCreditsModal';
import { useAuth } from '@/hooks/useAuth';

export default function BuyCreditsPage() {
  const { user } = useAuth();
  
  if (!user) {
    return <p>Please log in first</p>;
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Buy Credits</h1>
      <BuyCreditsModal
        userId={user.id}
        userType={user.role} // 'employer' or 'worker'
        onClose={() => window.history.back()}
      />
    </div>
  );
}
```

**Test:**
- [ ] Page loads at `/credits/buy`
- [ ] Can see all packages
- [ ] Can enter phone number
- [ ] Can submit payment form
- [ ] Validation shows errors

---

## ✅ Phase 3: Integrate with Post Job (15 minutes)

**File: `app/employers/post-job/page.js` or similar**

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
  const [formData, setFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Collect form data
    const data = new FormData(e.target);
    const jobData = Object.fromEntries(data);
    
    // Show credit check modal
    setFormData(jobData);
    setShowCreditCheck(true);
  };

  const handleCreditCheckProceed = async () => {
    setIsSubmitting(true);
    
    try {
      // 1. Deduct credits
      const deductResult = await deductCredits(user.id, 'post_job');
      
      if (!deductResult.success) {
        alert('Error deducting credits: ' + deductResult.error);
        setIsSubmitting(false);
        return;
      }
      
      // 2. Create job (your existing function)
      const jobId = await createJobInDatabase(formData, user.id);
      
      // 3. Redirect to confirmation
      router.push(`/jobs/${jobId}/confirmation?posted=true`);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Credit Check Modal */}
      {showCreditCheck && (
        <CreditCheck
          userId={user.id}
          actionType="post_job"
          actionLabel="post this job"
          onProceed={handleCreditCheckProceed}
          onCancel={() => {
            setShowCreditCheck(false);
            setFormData(null);
          }}
        />
      )}

      {/* Your existing form */}
      <form onSubmit={handleFormSubmit}>
        {/* Job form fields */}
        <button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Post Job'}
        </button>
      </form>
    </>
  );
}
```

**Update your database function:**

```javascript
async function createJobInDatabase(jobData, userId) {
  // Use your existing Supabase code
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...jobData,
      employer_id: userId,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}
```

**Test:**
- [ ] Navigate to post job page
- [ ] Fill out form and click "Post Job"
- [ ] Credit check modal appears
- [ ] Shows correct cost (500 KES)
- [ ] Shows current balance
- [ ] Clicking "Proceed" deducts credits
- [ ] Job is created in database
- [ ] Balance is updated in navbar
- [ ] Can't proceed if insufficient credits

---

## ✅ Phase 4: Integrate with Job Application (15 minutes)

**File: `components/jobs/JobCard.js` or application button**

```javascript
'use client';

import { useState } from 'react';
import CreditCheck from '@/components/credits/CreditCheck';
import { deductCredits } from '@/lib/credits-helpers';
import { useAuth } from '@/hooks/useAuth';

export default function ApplyButton({ jobId, userId }) {
  const [showCreditCheck, setShowCreditCheck] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyClick = async () => {
    if (!userId) {
      // Redirect to login
      window.location.href = '/user-registration';
      return;
    }
    
    setShowCreditCheck(true);
  };

  const handleCreditCheckProceed = async () => {
    setIsApplying(true);
    
    try {
      // 1. Deduct credits
      const deductResult = await deductCredits(userId, 'apply_job', jobId);
      
      if (!deductResult.success) {
        alert('Error: ' + deductResult.error);
        setIsApplying(false);
        return;
      }
      
      // 2. Create application
      await createJobApplication(userId, jobId);
      
      alert('Application submitted successfully!');
      setShowCreditCheck(false);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsApplying(false);
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

      <button
        onClick={handleApplyClick}
        disabled={isApplying}
        className="apply-button"
      >
        {isApplying ? 'Applying...' : 'Apply Now'}
      </button>
    </>
  );
}
```

**Test:**
- [ ] Click "Apply" button on job card
- [ ] Credit check modal appears
- [ ] Shows correct cost (50 KES)
- [ ] Shows current balance
- [ ] Clicking "Proceed" deducts credits
- [ ] Application is created
- [ ] Balance updates
- [ ] Can't apply if insufficient credits

---

## ✅ Phase 5: M-Pesa Testing (15 minutes)

**Test with Sandbox:**

1. **Get to payment form**
   - [ ] Navigate to `/credits/buy`
   - [ ] Select a package
   - [ ] Enter phone: `254708374149`

2. **Check API call**
   - [ ] Open DevTools Network tab
   - [ ] Click "Pay"
   - [ ] See POST to `/api/payments/mpesa/initiate`
   - [ ] Status should be 200

3. **Check database**
   - [ ] Go to Supabase
   - [ ] Check `credit_transactions` table
   - [ ] Should see new entry with status 'pending'

4. **Verify callback**
   - [ ] Check server logs
   - [ ] Should eventually see callback log entry
   - [ ] Transaction status should change to 'completed'
   - [ ] User credits should increase

**Test:**
- [ ] Payment initiated successfully
- [ ] Callback processes without errors
- [ ] Credits added to account
- [ ] Transaction logged in database
- [ ] Email notification sent (if configured)

---

## ✅ Phase 6: Verify Messaging Flow (10 minutes)

If you have messaging/contact features:

**File: `components/messaging/SendMessageButton.js`**

```javascript
import CreditCheck from '@/components/credits/CreditCheck';
import { deductCredits } from '@/lib/credits-helpers';

export default function SendMessageButton({ recipientId, userId }) {
  const [showCreditCheck, setShowCreditCheck] = useState(false);

  const handleSendClick = () => {
    setShowCreditCheck(true);
  };

  const handleCreditCheckProceed = async () => {
    // Deduct 100 KES for message
    const result = await deductCredits(userId, 'send_message', recipientId);
    
    if (!result.success) {
      alert('Insufficient credits');
      return;
    }
    
    // Send message
    await sendMessage(userId, recipientId, messageContent);
    alert('Message sent!');
  };

  return (
    <>
      {showCreditCheck && (
        <CreditCheck
          userId={userId}
          actionType="send_message"
          actionLabel="send a message"
          onProceed={handleCreditCheckProceed}
          onCancel={() => setShowCreditCheck(false)}
        />
      )}
      
      <button onClick={handleSendClick}>Send Message</button>
    </>
  );
}
```

**Test:**
- [ ] Click "Send Message" button
- [ ] Credit check appears with 100 KES cost
- [ ] Message is sent and credits deducted
- [ ] Balance updates

---

## ✅ Phase 7: Add Dashboard Credit Display (10 minutes)

**File: `app/employer/dashboard/page.js` or `/app/worker/dashboard/page.js`**

```javascript
'use client';

import CreditsBalance from '@/components/credits/CreditsBalance';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Credits Widget */}
        <div className="col-span-1">
          <CreditsBalance userId={user.id} variant="full" />
        </div>

        {/* Other dashboard widgets */}
        <div className="col-span-2">
          {/* Job listings, applications, etc. */}
        </div>
      </div>
    </div>
  );
}
```

**Test:**
- [ ] Dashboard loads
- [ ] Credit balance widget visible
- [ ] Shows full stats (purchased, used, refunded)
- [ ] "Buy More Credits" button works

---

## ✅ Phase 8: Error Handling & Edge Cases (15 minutes)

Check these scenarios:

- [ ] **User not logged in**: Redirect to login, don't crash
- [ ] **No credits**: Show insufficient credits modal
- [ ] **Network error**: Show error message, allow retry
- [ ] **M-Pesa timeout**: Show "waiting for payment" message
- [ ] **Invalid phone**: Show phone format error
- [ ] **Expired promo code**: Show error message
- [ ] **Rate limit exceeded**: Show "too many requests" message
- [ ] **Database error**: Show generic error, log to Sentry
- [ ] **Callback arrives late**: Balance eventually updates
- [ ] **Duplicate callback**: Only process once

---

## ✅ Final Checklist

- [ ] All components display correctly
- [ ] All buttons are clickable and functional
- [ ] Balance widget shows in navbar
- [ ] Can buy credits via M-Pesa
- [ ] Credits deducted from actions
- [ ] Insufficient credits modal shows
- [ ] Error messages are user-friendly
- [ ] Mobile responsive design works
- [ ] No console errors
- [ ] No network errors in DevTools
- [ ] Database entries are created correctly
- [ ] Transactions are logged
- [ ] Callbacks are processed
- [ ] No TypeScript errors
- [ ] Performance is acceptable (< 2s load time)

---

## 🚀 Go Live Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Update Vercel environment variables
- [ ] Switch M-Pesa to production credentials
- [ ] Register callback URL with Safaricom
- [ ] Test real payment with small amount
- [ ] Set up error monitoring (Sentry)
- [ ] Set up payment alerts
- [ ] Document payment SOP
- [ ] Train support team
- [ ] Create backup/recovery plan
- [ ] Set up daily reconciliation script

---

## Troubleshooting

### "Credit check modal doesn't appear"
- Check CreditCheck component is imported
- Check user is authenticated
- Check userId is being passed
- Check console for errors

### "Payment not going through"
- Check M-Pesa credentials are correct
- Check callback URL is registered
- Check phone number format (254XXXXXXXXX)
- Use sandbox test phone: 254708374149
- Check server logs for M-Pesa errors

### "Credits not added after payment"
- Check callback endpoint is being called
- Check database for credit_transactions entry
- Check if processMpesaCallback() is running
- Check RLS policies on user_credits table
- Check server logs for errors

### "Balance widget shows old balance"
- Refresh page (cache expires after 30s)
- Check getUserCreditsBalance() is returning fresh data
- Check database has current user_credits record

---

**Questions?** Check these docs:
- `CREDITS_IMPLEMENTATION_GUIDE_PHASE1.md` - Detailed setup
- `CREDITS_TECHNICAL_REFERENCE.md` - API reference
- `CREDITS_SYSTEM_DESIGN.md` - System design
- M-Pesa Docs: https://developer.safaricom.co.ke/docs
