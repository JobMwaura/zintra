/**
 * M-Pesa Payment Initiation API
 * POST /api/payments/mpesa/initiate
 * 
 * Initiates an M-Pesa STK Push request
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// M-Pesa API credentials (from environment variables)
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

/**
 * Get M-Pesa access token
 */
async function getMpesaAccessToken() {
  try {
    const auth = Buffer.from(
      `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa access token:', error);
    throw new Error('Failed to authenticate with M-Pesa');
  }
}

/**
 * Generate timestamp in format YYYYMMDDHHmmss
 */
function generateTimestamp() {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
}

/**
 * Generate password for M-Pesa
 * Password = base64(shortcode + passkey + timestamp)
 */
function generatePassword(timestamp) {
  const password = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(password).toString('base64');
}

export async function POST(request) {
  try {
    const { phoneNumber, amount, description, userId } = await request.json();

    // Validate input
    if (!phoneNumber || !amount || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get M-Pesa access token
    const accessToken = await getMpesaAccessToken();

    // Generate timestamp and password
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    // Create payment transaction record
    const supabase = createClient();
    const { data: transaction, error: txnError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'purchase',
        amount: amount,
        payment_method: 'mpesa',
        status: 'pending',
        mpesa_phone: phoneNumber,
        description: description,
      })
      .select()
      .single();

    if (txnError) {
      console.error('Error creating transaction:', txnError);
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    // Initiate M-Pesa STK Push
    const mpesaPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.floor(amount),
      PartyA: phoneNumber,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: `ZINTRA-${userId}`,
      TransactionDesc: description || 'Zintra Credits Purchase',
    };

    const mpesaResponse = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mpesaPayload),
      }
    );

    const mpesaData = await mpesaResponse.json();

    // Check if STK Push was initiated successfully
    if (
      mpesaData.ResponseCode !== '0' ||
      !mpesaData.CheckoutRequestID ||
      !mpesaData.MerchantRequestID
    ) {
      console.error('M-Pesa error:', mpesaData);

      // Update transaction as failed
      await supabase
        .from('credit_transactions')
        .update({
          status: 'failed',
          mpesa_response_code: mpesaData.ResponseCode,
          mpesa_response_desc: mpesaData.ResponseDescription,
        })
        .eq('id', transaction.id);

      return NextResponse.json(
        {
          error: mpesaData.ResponseDescription || 'Failed to initiate payment',
        },
        { status: 400 }
      );
    }

    // Update transaction with M-Pesa request IDs
    await supabase
      .from('credit_transactions')
      .update({
        mpesa_request_id: mpesaData.CheckoutRequestID,
        mpesa_merchant_request_id: mpesaData.MerchantRequestID,
      })
      .eq('id', transaction.id);

    return NextResponse.json({
      success: true,
      checkoutRequestId: mpesaData.CheckoutRequestID,
      merchantRequestId: mpesaData.MerchantRequestID,
      transactionId: transaction.id,
      message: 'STK Push initiated. Check your phone for the prompt.',
    });
  } catch (error) {
    console.error('Error in M-Pesa initiate endpoint:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
