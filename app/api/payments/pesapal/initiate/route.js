/**
 * PesaPal Payment Initiation API Route
 * POST /api/payments/pesapal/initiate
 * 
 * Initiates a new payment order with PesaPal
 * Returns the payment page URL to redirect user to
 */

import { pesapalClient } from '@/lib/pesapal/pesapalClient';

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

    // Initiate payment with PesaPal
    const result = await pesapalClient.initiatePayment({
      vendor_id,
      user_id,
      plan_id,
      plan_name,
      amount: numAmount,
      phone_number: phone_number || '254700000000',
      email,
      description: description || `${plan_name} Subscription`,
    });

    if (!result.success) {
      console.error('❌ PesaPal initiation failed:', result.error);
      return Response.json(
        { 
          success: false, 
          error: result.error || 'Failed to initiate payment' 
        },
        { status: 400 }
      );
    }

    console.log('✅ Payment initiated successfully:', result.order_id);

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
