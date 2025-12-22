'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Note: These are placeholder URLs - replace with actual M-Pesa and Pesapal credentials
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  shortCode: process.env.MPESA_SHORT_CODE,
  passkey: process.env.MPESA_PASSKEY,
  initiatorName: process.env.MPESA_INITIATOR_NAME,
  initiatorPassword: process.env.MPESA_INITIATOR_PASSWORD,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox' // sandbox or production
};

const PESAPAL_CONFIG = {
  consumerKey: process.env.PESAPAL_CONSUMER_KEY,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET,
  baseUrl: process.env.PESAPAL_BASE_URL || 'https://demo.pesapal.com'
};

/**
 * POST /api/rfq/payment/topup
 * 
 * Initiate payment for additional RFQs
 * 
 * Request body:
 * {
 *   quantity: number (number of RFQs to purchase, min 1),
 *   payment_method: 'mpesa' | 'pesapal' | 'credit_card' | 'wallet',
 *   mpesa_phone?: string (for M-Pesa, e.g., '254712345678'),
 *   email?: string (for Pesapal confirmation)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   payment_id: uuid,
 *   amount: number (KES),
 *   currency: string,
 *   status: 'pending' | 'processing',
 *   payment_url?: string (for redirect if applicable),
 *   payment_method: string,
 *   expires_at: timestamp,
 *   instructions?: object
 * }
 */
export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const { quantity, payment_method, mpesa_phone, email } = await request.json();

    // Validation
    if (!quantity || quantity < 1 || quantity > 50) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 50' },
        { status: 400 }
      );
    }

    if (!payment_method || !['mpesa', 'pesapal', 'credit_card', 'wallet'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    if (payment_method === 'mpesa' && !mpesa_phone) {
      return NextResponse.json(
        { error: 'M-Pesa phone number required' },
        { status: 400 }
      );
    }

    // Validate M-Pesa phone format
    if (mpesa_phone && !mpesa_phone.match(/^254\d{9}$/)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use 254XXXXXXXXX format' },
        { status: 400 }
      );
    }

    // Calculate amount (KES 300 per RFQ)
    const amount = quantity * 300;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('rfq_payments')
      .insert([
        {
          user_id: user.id,
          amount: amount,
          currency: 'KES',
          quantity: quantity,
          payment_method: payment_method,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
          metadata: {
            mpesa_phone: mpesa_phone || null,
            email: email || user.email,
            requested_at: new Date().toISOString()
          }
        }
      ])
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record creation error:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Handle different payment methods
    let paymentResponse = {
      success: true,
      payment_id: paymentRecord.id,
      amount: amount,
      currency: 'KES',
      quantity: quantity,
      status: 'pending',
      payment_method: payment_method,
      expires_at: expiresAt.toISOString(),
      expires_in_minutes: 15
    };

    switch (payment_method) {
      case 'mpesa':
        paymentResponse = {
          ...paymentResponse,
          status: 'processing',
          instructions: {
            message: `M-Pesa prompt will be sent to ${mpesa_phone}`,
            amount_kes: amount,
            steps: [
              '1. You will receive an M-Pesa prompt shortly',
              '2. Enter your M-Pesa PIN to confirm',
              '3. Your RFQ quota will be updated automatically',
              '4. You can submit more RFQs immediately'
            ],
            timeout_seconds: 120
          }
        };
        // TODO: Integrate with M-Pesa STK Push API
        // await initiateMpesaPayment(mpesa_phone, amount, paymentRecord.id);
        break;

      case 'pesapal':
        paymentResponse = {
          ...paymentResponse,
          status: 'processing',
          payment_url: `${PESAPAL_CONFIG.baseUrl}/api/query-payment-status?reference=${paymentRecord.id}`,
          instructions: {
            message: 'You will be redirected to Pesapal to complete payment',
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pesapal-callback?payment_id=${paymentRecord.id}`,
            payment_methods: ['mpesa', 'airtel_money', 'credit_card']
          }
        };
        // TODO: Generate Pesapal payment URL
        // paymentResponse.payment_url = await generatePesapalPaymentUrl(amount, paymentRecord.id);
        break;

      case 'credit_card':
        paymentResponse = {
          ...paymentResponse,
          status: 'processing',
          payment_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/credit-card?payment_id=${paymentRecord.id}`,
          instructions: {
            message: 'You will be redirected to secure payment gateway',
            gateway: 'Stripe or similar',
            redirect_after_setup: `${process.env.NEXT_PUBLIC_APP_URL}/payment/card-checkout?payment_id=${paymentRecord.id}`
          }
        };
        break;

      case 'wallet':
        // Check user wallet balance
        const { data: userWallet } = await supabase
          .from('users')
          .select('wallet_balance')
          .eq('id', user.id)
          .single();

        if (!userWallet || userWallet.wallet_balance < amount) {
          // Update payment status to failed
          await supabase
            .from('rfq_payments')
            .update({ status: 'failed', notes: 'Insufficient wallet balance' })
            .eq('id', paymentRecord.id);

          return NextResponse.json(
            {
              error: 'Insufficient wallet balance',
              balance: userWallet?.wallet_balance || 0,
              required: amount,
              shortfall: amount - (userWallet?.wallet_balance || 0)
            },
            { status: 402 }
          );
        }

        // Deduct from wallet and mark payment as success
        const { error: deductError } = await supabase
          .from('users')
          .update({ wallet_balance: userWallet.wallet_balance - amount })
          .eq('id', user.id);

        if (deductError) {
          await supabase
            .from('rfq_payments')
            .update({ status: 'failed', notes: 'Wallet deduction failed' })
            .eq('id', paymentRecord.id);

          return NextResponse.json(
            { error: 'Failed to process wallet payment' },
            { status: 500 }
          );
        }

        // Mark payment as success
        const { error: updateError } = await supabase
          .from('rfq_payments')
          .update({
            status: 'success',
            completed_at: new Date().toISOString()
          })
          .eq('id', paymentRecord.id);

        // Increment RFQ quota
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { error: quotaError } = await supabase
          .from('users_rfq_quota')
          .update({
            free_quota_remaining: supabase.rpc('increment_rfq_quota', {
              p_user_id: user.id,
              p_quantity: quantity,
              p_month: currentMonth
            })
          })
          .eq('user_id', user.id)
          .eq('month_year', currentMonth);

        paymentResponse = {
          ...paymentResponse,
          status: 'success',
          message: `Deducted KES ${amount} from wallet. Your RFQ quota has been updated.`,
          new_wallet_balance: userWallet.wallet_balance - amount,
          rfqs_added: quantity
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported payment method' },
          { status: 400 }
        );
    }

    return NextResponse.json(paymentResponse, { status: 201 });

  } catch (error) {
    console.error('Payment topup error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Initiate M-Pesa STK Push
 * This would integrate with Safaricom M-Pesa API
 */
async function initiateMpesaPayment(phoneNumber, amount, paymentId) {
  try {
    // TODO: Implement M-Pesa STK Push
    // 1. Get access token from Safaricom
    // 2. Call STK Push endpoint
    // 3. Handle callback
    console.log(`[M-Pesa] Initiating payment: ${phoneNumber} - KES ${amount} - ID: ${paymentId}`);
  } catch (error) {
    console.error('M-Pesa error:', error);
    throw error;
  }
}

/**
 * Helper: Generate Pesapal Payment URL
 * This would integrate with Pesapal API
 */
async function generatePesapalPaymentUrl(amount, paymentId) {
  try {
    // TODO: Implement Pesapal payment URL generation
    // 1. Authenticate with Pesapal
    // 2. Create transaction
    // 3. Return payment URL
    console.log(`[Pesapal] Generating payment URL: KES ${amount} - ID: ${paymentId}`);
    return `${PESAPAL_CONFIG.baseUrl}/api/process-payment?reference=${paymentId}`;
  } catch (error) {
    console.error('Pesapal error:', error);
    throw error;
  }
}
