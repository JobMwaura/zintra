/**
 * PesaPal Payment Initiation API Route
 * POST /api/payments/pesapal/initiate
 * 
 * Initiates a new payment order with PesaPal
 * Returns the payment page URL to redirect user to
 */

import crypto from 'crypto';

// Server-side only credentials
const PESAPAL_API_URL = process.env.NEXT_PUBLIC_PESAPAL_API_URL || 'https://sandbox.pesapal.com/api/v3';
const CONSUMER_KEY = process.env.NEXT_PUBLIC_PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

/**
 * Generate OAuth signature for PesaPal
 */
function generateSignature(params, method = 'GET') {
  const signatureString = Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const signature = crypto
    .createHmac('sha256', CONSUMER_SECRET)
    .update(signatureString)
    .digest('base64');
  
  return signature;
}

/**
 * Get OAuth Bearer Token
 */
async function getAccessToken() {
  const timestamp = new Date().toISOString();
  const signatureParams = {
    consumer_key: CONSUMER_KEY,
    timestamp: timestamp,
  };

  const signature = generateSignature(signatureParams, 'GET');

  const response = await fetch(`${PESAPAL_API_URL}/api/auth/request/token`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONSUMER_KEY}:${signature}:${timestamp}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Initiate payment with PesaPal
 */
async function initiatePayment(paymentData) {
  const token = await getAccessToken();

  const orderData = {
    id: paymentData.order_id,
    currency: 'KES',
    amount: paymentData.amount,
    description: paymentData.description,
    callback_url: process.env.PESAPAL_WEBHOOK_URL,
    notification_id: '4e4af0b6-3758-40d8-8e22-0c1f21847e15',
    billing_address: {
      email_address: paymentData.email,
      phone_number: paymentData.phone_number,
      first_name: 'Vendor',
      last_name: 'User',
      line_1: 'Kenya',
      postal_code: '00100',
      city: 'Nairobi',
      state: 'Nairobi',
      country_code: 'KE',
    },
  };

  const response = await fetch(`${PESAPAL_API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PesaPal API error: ${error}`);
  }

  const result = await response.json();
  return result;
}

export async function POST(req) {
  try {
    // Parse request body
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

    // Validate required fields
    if (!vendor_id || !user_id || !plan_id || !amount || !email) {
      console.error('❌ Missing required fields:', {
        vendor_id: !!vendor_id,
        user_id: !!user_id,
        plan_id: !!plan_id,
        amount: !!amount,
        email: !!email,
      });

      return Response.json(
        { 
          success: false, 
          error: 'Missing required fields: vendor_id, user_id, plan_id, amount, email' 
        },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return Response.json(
        { 
          success: false, 
          error: 'Amount must be a positive number' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400 }
      );
    }

    console.log('📋 Payment initiation request:', {
      vendor_id,
      plan_name,
      amount: numAmount,
      email,
    });

    // Generate unique order ID
    const orderId = `order_${vendor_id}_${Date.now()}`;

    // Initiate payment with PesaPal
    const result = await initiatePayment({
      order_id: orderId,
      vendor_id,
      user_id,
      plan_id,
      plan_name,
      amount: numAmount,
      phone_number: phone_number || '254700000000',
      email,
      description: description || `${plan_name} Subscription`,
    });

    console.log('✅ PesaPal order created:', result);

    return Response.json(
      {
        success: true,
        order_id: result.id,
        iframe_url: result.payment_link,
        redirect_url: result.redirect_url || result.payment_link,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Payment initiation error:', error);
    return Response.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
