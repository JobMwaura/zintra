/**
 * M-Pesa Status Check API
 * POST /api/payments/mpesa/status
 * 
 * Checks the status of an M-Pesa payment
 */

import { NextResponse } from 'next/server';

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;

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
 * Generate timestamp
 */
function generateTimestamp() {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
}

/**
 * Generate password
 */
function generatePassword(timestamp) {
  const password = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(password).toString('base64');
}

export async function POST(request) {
  try {
    const { checkoutRequestId } = await request.json();

    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: 'CheckoutRequestId is required' },
        { status: 400 }
      );
    }

    // Get M-Pesa access token
    const accessToken = await getMpesaAccessToken();

    // Generate timestamp and password
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    // Query M-Pesa for transaction status
    const response = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        }),
      }
    );

    const data = await response.json();

    // Parse response
    // Response codes:
    // 0 = Success
    // 1 = Insufficient funds
    // 2 = Less amount
    // Other = Various errors

    if (data.ResponseCode === '0') {
      // Check ResultCode
      if (data.ResultCode === '0') {
        // Transaction completed successfully
        return NextResponse.json({
          success: true,
          status: 'completed',
          resultCode: data.ResultCode,
          resultDesc: data.ResultDesc,
          amount: data.Amount,
          mpesaReceiptNumber: data.MpesaReceiptNumber,
        });
      } else {
        // Transaction not yet completed or failed
        return NextResponse.json({
          success: false,
          status: 'pending',
          resultCode: data.ResultCode,
          resultDesc: data.ResultDesc,
        });
      }
    } else {
      return NextResponse.json(
        {
          error: data.ResponseDescription || 'Failed to query status',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in status check endpoint:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
