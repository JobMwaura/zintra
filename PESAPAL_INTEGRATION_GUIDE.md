# 🔐 PesaPal Payment Integration Guide for Zintra Subscriptions

**Date:** 4 January 2026  
**Status:** Ready to Implement  
**API Version:** PesaPal v3 (Latest)

---

## 📋 Quick Start

### What You Need
- ✅ PesaPal Consumer Key
- ✅ PesaPal Consumer Secret
- ✅ Sandbox/Production API endpoints
- ✅ Business registration with PesaPal

### Integration Overview
```
User subscribes to plan
    ↓
Payment form with PesaPal
    ↓
PesaPal checkout (hosted page)
    ↓
Payment processing
    ↓
Webhook verification
    ↓
Activate subscription in database
```

---

## 🔧 Step 1: Environment Setup

### Create `.env.local` (Keep this PRIVATE!)
```bash
# PesaPal Configuration
NEXT_PUBLIC_PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here  # DON'T expose this to frontend!

# PesaPal Endpoints
NEXT_PUBLIC_PESAPAL_API_URL=https://api.pesapal.com/api/v3  # Production
# OR for testing:
NEXT_PUBLIC_PESAPAL_SANDBOX_URL=https://sandbox.pesapal.com/api/v3  # Sandbox

# Webhook
PESAPAL_WEBHOOK_URL=https://yourdomain.com/api/webhooks/pesapal
```

### Update `.env.example`
```bash
NEXT_PUBLIC_PESAPAL_CONSUMER_KEY=your_key
PESAPAL_CONSUMER_SECRET=your_secret
NEXT_PUBLIC_PESAPAL_API_URL=https://api.pesapal.com/api/v3
PESAPAL_WEBHOOK_URL=https://yourdomain.com/api/webhooks/pesapal
```

---

## 📁 Step 2: Create PesaPal Service Layer

### File: `/lib/pesapal/pesapalClient.js`

```javascript
/**
 * PesaPal Payment Service
 * Handles all PesaPal API interactions
 */

import crypto from 'crypto';

const PESAPAL_API = process.env.NEXT_PUBLIC_PESAPAL_API_URL || 
                    'https://sandbox.pesapal.com/api/v3';

const CONSUMER_KEY = process.env.NEXT_PUBLIC_PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

class PesaPalClient {
  constructor() {
    this.apiUrl = PESAPAL_API;
    this.consumerKey = CONSUMER_KEY;
    this.consumerSecret = CONSUMER_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Generate OAuth signature for PesaPal
   */
  generateSignature(params, method = 'GET') {
    const signatureString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const signature = crypto
      .createHmac('sha256', this.consumerSecret)
      .update(signatureString)
      .digest('base64');
    
    return signature;
  }

  /**
   * Get OAuth Bearer Token (valid for 5 minutes)
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      const timestamp = new Date().toISOString();
      const params = {
        consumer_key: this.consumerKey,
        consumer_secret: this.consumerSecret,
        timestamp: timestamp,
      };

      const signature = this.generateSignature(params);

      const response = await fetch(`${this.apiUrl}/api/auth/request/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consumer_key: this.consumerKey,
          consumer_secret: this.consumerSecret,
          timestamp: timestamp,
          signature: signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get access token: ${errorData.message}`);
      }

      const data = await response.json();
      this.accessToken = data.token;
      this.tokenExpiry = Date.now() + (data.expiresIn * 1000);

      console.log('✅ PesaPal access token obtained');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Error getting PesaPal token:', error);
      throw error;
    }
  }

  /**
   * Initiate payment order
   * Returns iframe_url for hosted checkout
   */
  async initiatePayment(orderData) {
    const {
      vendor_id,
      user_id,
      plan_id,
      plan_name,
      amount,
      phone_number,
      email,
      description = 'Subscription Payment',
    } = orderData;

    try {
      const token = await this.getAccessToken();

      const payload = {
        id: `subscription_${vendor_id}_${Date.now()}`,
        amount: parseFloat(amount),
        currency: 'KES',
        description: description,
        callback_url: process.env.PESAPAL_WEBHOOK_URL,
        notification_id: 'webhook', // Enable webhooks
        metadata: {
          vendor_id,
          user_id,
          plan_id,
          plan_name,
          phone_number,
          email,
        },
        billing_details: {
          email_address: email,
          phone_number: phone_number,
          first_name: email.split('@')[0],
          last_name: plan_name,
          country_code: 'KE',
        },
      };

      const response = await fetch(`${this.apiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to initiate payment: ${errorData.message}`);
      }

      const data = await response.json();

      console.log('✅ Payment order initiated:', data.id);

      return {
        success: true,
        order_id: data.id,
        iframe_url: data.redirect_url,
        redirect_url: data.redirect_url,
      };
    } catch (error) {
      console.error('❌ Error initiating payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(orderId) {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.apiUrl}/orders/${orderId}/status`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get payment status: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        status: data.payment_status,
        order_id: data.id,
        amount: data.amount,
        currency: data.currency,
      };
    } catch (error) {
      console.error('❌ Error getting payment status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate webhook from PesaPal
   */
  validateWebhookSignature(signature, payload) {
    const generatedSignature = crypto
      .createHmac('sha256', this.consumerSecret)
      .update(JSON.stringify(payload))
      .digest('base64');

    return signature === generatedSignature;
  }
}

export const pesapalClient = new PesaPalClient();
```

---

## 💳 Step 3: Update Subscription Purchase Flow

### File: `/app/subscription-plans/page.js`

Replace the `handleSubscribe` function:

```javascript
import { pesapalClient } from '@/lib/pesapal/pesapalClient';

const handleSubscribe = async (planId) => {
  if (!user) {
    setMessage('Please log in first');
    return;
  }

  try {
    setPurchasing(planId);
    setMessage('');

    // Get vendor id
    const { data: vendorData } = await supabase
      .from('vendors')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single();

    if (!vendorData) {
      setMessage('Error: Vendor profile not found. Please complete your profile first.');
      setPurchasing(null);
      return;
    }

    // Get plan details
    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) {
      setMessage('Plan not found');
      setPurchasing(null);
      return;
    }

    // Create payment order with PesaPal
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
        phone_number: user.phone || '254700000000', // Get from user profile
        description: `${selectedPlan.name} Subscription - ${vendorData.company_name}`,
      }),
    });

    const paymentData = await paymentResult.json();

    if (!paymentData.success) {
      setMessage(`Payment Error: ${paymentData.error}`);
      setPurchasing(null);
      return;
    }

    // Store pending subscription with order ID
    const { error: pendingError } = await supabase
      .from('vendor_subscriptions')
      .insert([
        {
          vendor_id: vendorData.id,
          user_id: user.id,
          plan_id: planId,
          status: 'pending_payment',
          pesapal_order_id: paymentData.order_id,
          created_at: new Date().toISOString(),
        },
      ]);

    if (pendingError) {
      console.error('Error creating pending subscription:', pendingError);
      setMessage('Error initiating subscription');
      setPurchasing(null);
      return;
    }

    // Redirect to PesaPal payment page
    if (paymentData.iframe_url) {
      window.location.href = paymentData.iframe_url;
    }
  } catch (err) {
    console.error('Exception:', err);
    setMessage(`Error: ${err.message}`);
    setPurchasing(null);
  }
};
```

---

## 🔗 Step 4: Create Payment Initiation API Route

### File: `/app/api/payments/pesapal/initiate/route.js`

```javascript
import { pesapalClient } from '@/lib/pesapal/pesapalClient';

export async function POST(req) {
  try {
    const {
      vendor_id,
      user_id,
      plan_id,
      plan_name,
      amount,
      email,
      phone_number,
      description,
    } = await req.json();

    // Validate input
    if (!vendor_id || !user_id || !plan_id || !amount || !email) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initiate payment with PesaPal
    const result = await pesapalClient.initiatePayment({
      vendor_id,
      user_id,
      plan_id,
      plan_name,
      amount,
      phone_number,
      email,
      description,
    });

    if (!result.success) {
      return Response.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: true,
        order_id: result.order_id,
        iframe_url: result.iframe_url,
        redirect_url: result.redirect_url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment initiation error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🔔 Step 5: Create Webhook Handler

### File: `/app/api/webhooks/pesapal/route.js`

```javascript
import { pesapalClient } from '@/lib/pesapal/pesapalClient';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    console.log('📦 PesaPal Webhook received:', body);

    // Validate webhook signature
    const signature = req.headers.get('pesapal-signature');
    if (!signature) {
      return Response.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    const isValid = pesapalClient.validateWebhookSignature(signature, body);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return Response.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const { id: orderId, status, metadata } = body;

    // Check payment status with PesaPal
    const statusResult = await pesapalClient.getPaymentStatus(orderId);

    if (!statusResult.success) {
      console.error('❌ Could not verify payment status:', statusResult.error);
      return Response.json(
        { error: 'Could not verify payment status' },
        { status: 400 }
      );
    }

    const paymentStatus = statusResult.status;

    console.log(`📊 Payment status for ${orderId}: ${paymentStatus}`);

    // Handle different payment statuses
    if (paymentStatus === 'COMPLETED') {
      // ✅ Payment successful - activate subscription
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { error: updateError } = await supabase
        .from('vendor_subscriptions')
        .update({
          status: 'active',
          pesapal_order_id: orderId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          auto_renew: true,
          payment_date: new Date().toISOString(),
          payment_method: 'pesapal',
        })
        .eq('pesapal_order_id', orderId);

      if (updateError) {
        console.error('❌ Error activating subscription:', updateError);
        return Response.json(
          { error: 'Could not activate subscription' },
          { status: 400 }
        );
      }

      console.log('✅ Subscription activated for order:', orderId);

      // Send confirmation email (optional)
      // await sendConfirmationEmail(metadata.email, metadata.plan_name);

    } else if (paymentStatus === 'FAILED') {
      // ❌ Payment failed - mark as failed
      const { error: failError } = await supabase
        .from('vendor_subscriptions')
        .update({
          status: 'payment_failed',
          pesapal_order_id: orderId,
        })
        .eq('pesapal_order_id', orderId);

      console.log('❌ Payment failed for order:', orderId);

    } else if (paymentStatus === 'CANCELLED') {
      // ⚠️ Payment cancelled - delete pending subscription
      const { error: deleteError } = await supabase
        .from('vendor_subscriptions')
        .delete()
        .eq('pesapal_order_id', orderId)
        .eq('status', 'pending_payment');

      console.log('⚠️ Payment cancelled for order:', orderId);
    }

    return Response.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 📊 Step 6: Update Database Schema

### Add to vendor_subscriptions table:

```sql
-- Add payment-related columns to vendor_subscriptions
ALTER TABLE vendor_subscriptions ADD COLUMN IF NOT EXISTS (
  pesapal_order_id text,
  payment_method text DEFAULT 'pesapal',
  payment_date timestamptz,
  payment_status text,
  transaction_id text
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_pesapal_order_id 
  ON vendor_subscriptions(pesapal_order_id);

-- Add check to ensure valid statuses
ALTER TABLE vendor_subscriptions 
  ADD CONSTRAINT valid_subscription_status 
  CHECK (status IN ('pending_payment', 'active', 'expired', 'cancelled', 'payment_failed'));
```

---

## 🎨 Step 7: Create Payment Status Page

### File: `/app/subscription-payment-status/page.js`

```javascript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState('checking');
  const [subscription, setSubscription] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (orderId) {
      checkPaymentStatus();
    }
  }, [orderId]);

  const checkPaymentStatus = async () => {
    try {
      // Get subscription by order ID
      const { data: sub, error } = await supabase
        .from('vendor_subscriptions')
        .select('*')
        .eq('pesapal_order_id', orderId)
        .single();

      if (error) throw error;

      setSubscription(sub);

      if (sub.status === 'active') {
        setStatus('success');
        setMessage('✅ Payment successful! Your subscription is now active.');
      } else if (sub.status === 'payment_failed') {
        setStatus('failed');
        setMessage('❌ Payment failed. Please try again.');
      } else if (sub.status === 'pending_payment') {
        setStatus('pending');
        setMessage('⏳ Payment is being processed. Please wait...');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
      setMessage('Error checking payment status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
        {status === 'checking' && (
          <>
            <Loader className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Checking payment status...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            {subscription && (
              <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
                <p className="text-sm text-gray-700">
                  <strong>Order ID:</strong> {orderId}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Status:</strong> Active
                </p>
              </div>
            )}
            <Link href="/vendor-profile">
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Go to Your Profile
              </button>
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link href="/subscription-plans">
              <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
                Try Again
              </button>
            </Link>
          </>
        )}

        {status === 'pending' && (
          <>
            <Loader className="w-12 h-12 text-yellow-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={checkPaymentStatus}
              className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700"
            >
              Refresh Status
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link href="/subscription-plans">
              <button className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700">
                Back to Plans
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## 🧪 Step 8: Testing Checklist

### Environment Setup
- [ ] Copy `.env.example` to `.env.local`
- [ ] Add PesaPal credentials to `.env.local`
- [ ] Verify credentials are NOT in git

### Payment Flow Testing
- [ ] Browse to `/subscription-plans`
- [ ] Click "Subscribe Now" on a plan
- [ ] Verify payment form appears
- [ ] Complete test payment on PesaPal
- [ ] Check webhook is received
- [ ] Verify subscription is activated
- [ ] Check vendor profile shows subscription

### Edge Cases
- [ ] Test with invalid credentials
- [ ] Test payment cancellation
- [ ] Test payment failure
- [ ] Test webhook timeout
- [ ] Test duplicate webhooks
- [ ] Test network errors

### Database Verification
```sql
-- Check pending subscription created
SELECT * FROM vendor_subscriptions 
WHERE status = 'pending_payment';

-- Check active subscription after payment
SELECT * FROM vendor_subscriptions 
WHERE status = 'active' 
ORDER BY created_at DESC;

-- Verify payment details stored
SELECT pesapal_order_id, payment_date, payment_method 
FROM vendor_subscriptions 
WHERE pesapal_order_id IS NOT NULL;
```

---

## 🔒 Security Best Practices

### ✅ DO
- [x] Keep `PESAPAL_CONSUMER_SECRET` in server-side only
- [x] Validate webhook signatures
- [x] Use HTTPS for all payment endpoints
- [x] Log payment transactions
- [x] Rate limit payment endpoints
- [x] Validate all input data
- [x] Use environment variables for credentials

### ❌ DON'T
- [ ] Expose `PESAPAL_CONSUMER_SECRET` to frontend
- [ ] Skip webhook signature validation
- [ ] Store credit card details
- [ ] Log sensitive payment data
- [ ] Use hardcoded credentials
- [ ] Skip SSL/TLS verification
- [ ] Trust client-side validation alone

---

## 📈 Monitoring & Logging

### Add to your logging system:
```javascript
// Log payment events for monitoring
const logPaymentEvent = async (event) => {
  await supabase.from('payment_logs').insert([{
    event_type: event.type,
    order_id: event.order_id,
    vendor_id: event.vendor_id,
    status: event.status,
    amount: event.amount,
    timestamp: new Date().toISOString(),
    details: event.details,
  }]);
};
```

### Create payment_logs table:
```sql
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT,
  order_id TEXT,
  vendor_id UUID,
  status TEXT,
  amount NUMERIC,
  timestamp TIMESTAMPTZ,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_logs_order_id ON payment_logs(order_id);
CREATE INDEX idx_payment_logs_vendor_id ON payment_logs(vendor_id);
```

---

## 🚀 Deployment Checklist

### Before Going to Production
- [ ] Test with PesaPal production credentials
- [ ] Set up error monitoring (Sentry/LogRocket)
- [ ] Configure email notifications
- [ ] Set up payment success/failure emails
- [ ] Test webhook delivery reliability
- [ ] Configure firewall/security rules
- [ ] Document PesaPal callback requirements
- [ ] Set up dashboard for monitoring payments

### Production Configuration
```bash
# Update to production PesaPal endpoint
NEXT_PUBLIC_PESAPAL_API_URL=https://api.pesapal.com/api/v3

# Ensure webhook URL is production
PESAPAL_WEBHOOK_URL=https://zintra.vercel.app/api/webhooks/pesapal
```

---

## 📞 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Payment page doesn't load | Invalid credentials | Verify PESAPAL_CONSUMER_KEY/SECRET |
| Webhook not received | Wrong callback URL | Check PESAPAL_WEBHOOK_URL in PesaPal dashboard |
| "Invalid signature" error | Secret mismatch | Verify PESAPAL_CONSUMER_SECRET is correct |
| Payment status stuck | Webhook failed | Check server logs, resend webhook |
| Subscription not activated | Database error | Check Supabase permissions |
| CORS error | API request blocked | Ensure API route is in `/app/api/` |

---

## 📚 PesaPal API Reference

### Key Endpoints
- `POST /api/auth/request/token` - Get access token
- `POST /orders` - Create payment order
- `GET /orders/{id}/status` - Get payment status
- `POST /webhooks` - Receive payment notifications

### Payment Statuses
- `PENDING` - Waiting for payment
- `COMPLETED` - Payment successful
- `FAILED` - Payment failed
- `CANCELLED` - Payment cancelled

### Response Example
```json
{
  "id": "subscription_uuid_timestamp",
  "amount": 999.00,
  "currency": "KES",
  "status": "PENDING",
  "redirect_url": "https://checkout.pesapal.com/...",
  "description": "Subscription Payment"
}
```

---

## 🔄 Next Steps

1. **Immediate:**
   - [ ] Add PesaPal credentials to `.env.local`
   - [ ] Create `/lib/pesapal/pesapalClient.js`
   - [ ] Test with sandbox credentials

2. **This Week:**
   - [ ] Implement payment initiation API
   - [ ] Test webhook handler
   - [ ] Update database schema
   - [ ] Test end-to-end flow

3. **Before Launch:**
   - [ ] Switch to production credentials
   - [ ] Set up monitoring
   - [ ] Document for team
   - [ ] Load testing

---

## 📞 Support Resources

- **PesaPal Docs:** https://developer.pesapal.com/
- **PesaPal Sandbox:** https://sandbox.pesapal.com/
- **PesaPal Support:** support@pesapal.com

---

**Status:** 🟢 Ready to implement  
**Estimated Time:** 3-4 hours  
**Team:** 1-2 developers  

