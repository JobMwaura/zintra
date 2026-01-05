/**
 * PesaPal Payment Initiation API Route
 * POST /api/payments/pesapal/initiate
 * 
 * Initiates a new payment order with PesaPal
 * Returns the payment page URL to redirect user to
 */

import crypto from 'crypto';

// Server-side only credentials - these must be set in production
function getCredentials() {
  const url = process.env.NEXT_PUBLIC_PESAPAL_API_URL || 'https://sandbox.pesapal.com/api/v3';
  const key = process.env.NEXT_PUBLIC_PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;
  
  console.log('🔐 PesaPal Credentials Check:');
  console.log('  - API URL:', url ? `✓ Set (${url.substring(0, 30)}...)` : '❌ Not set');
  console.log('  - Consumer Key:', key ? `✓ Set (${key.substring(0, 10)}...)` : '❌ Not set');
  console.log('  - Consumer Secret:', secret ? `✓ Set (length: ${secret.length})` : '❌ Not set');
  
  // Debug: List all env vars that contain PESAPAL
  console.log('🔍 All PESAPAL env vars:', Object.keys(process.env).filter(k => k.includes('PESAPAL')));
  
  return { url, key, secret };
}

/**
 * Generate OAuth signature for PesaPal
 */
function generateSignature(params, method = 'GET') {
  const { secret } = getCredentials();
  
  if (!secret) {
    throw new Error('PESAPAL_CONSUMER_SECRET is not configured');
  }
  
  const signatureString = Object.keys(params)
    .sort()
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureString)
    .digest('base64');
  
  return signature;
}

/**
 * Get OAuth Bearer Token
 */
async function getAccessToken() {
  const { url, key, secret } = getCredentials();
  
  if (!key || !secret) {
    throw new Error('PesaPal credentials not configured');
  }

  // PesaPal RequestToken is a POST request with consumer credentials in body
  console.log('🔑 Attempting token request with:');
  console.log('   - URL:', `${url}/api/Auth/RequestToken`);
  console.log('   - Key (first 10 chars):', key?.substring(0, 10));
  console.log('   - Key length:', key?.length);
  console.log('   - Secret length:', secret?.length);
  
  const requestBody = {
    consumer_key: key,
    consumer_secret: secret,
  };
  
  console.log('📝 Request body:', JSON.stringify(requestBody).substring(0, 100) + '...');
  
  const response = await fetch(`${url}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('📥 Token response status:', response.status, response.statusText);
  console.log('📥 Response headers:', {
    contentType: response.headers.get('content-type'),
  });

  const responseText = await response.text();
  console.log('📥 Response body (raw):', responseText);

  if (!response.ok) {
    console.error('🔴 PesaPal token request failed!');
    console.error('   Status:', response.status);
    console.error('   Status Text:', response.statusText);
    console.error('   Response Body:', responseText);
    throw new Error(`Failed to get token: ${response.statusText} - ${responseText}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error('❌ Failed to parse response as JSON');
    console.error('   Response was:', responseText);
    throw new Error(`Failed to parse token response: ${e.message}`);
  }

  console.log('✅ PesaPal token received successfully');
  console.log('   Token (first 20 chars):', data.token?.substring(0, 20));
  console.log('   Expiry:', data.expiryDate);
  
  return data.token;
}

/**
 * Initiate payment with PesaPal
 */
async function initiatePayment(paymentData) {
  const { url } = getCredentials();
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

  const response = await fetch(`${url}/api/Transactions/SubmitOrderRequest`, {
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 POST /api/payments/pesapal/initiate');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check credentials first
    const creds = getCredentials();
    console.log('📊 Credentials loaded:', creds);
    
    if (!creds.key || !creds.secret) {
      console.error('❌ PesaPal credentials not configured');
      console.error('   - Key present:', !!creds.key);
      console.error('   - Secret present:', !!creds.secret);
      console.error('   - URL:', creds.url);
      
      return Response.json(
        { 
          success: false, 
          error: 'Server not configured: PesaPal credentials missing. Check Vercel environment variables.' 
        },
        { status: 500 }
      );
    }

    console.log('✅ Credentials verified');

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
