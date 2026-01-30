/**
 * M-Pesa Payment Callback API
 * POST /api/payments/mpesa/callback
 * 
 * Receives M-Pesa payment confirmation callbacks
 * This is called by M-Pesa after payment is completed
 */

import { createClient } from '@/lib/supabase/server';
import { processMpesaCallback } from '@/lib/payments/mpesa-service';
import { NextResponse } from 'next/server';

/**
 * POST handler for M-Pesa callbacks
 */
export async function POST(request) {
  try {
    const callbackData = await request.json();

    // Log callback for debugging
    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

    // Initialize Supabase client
    const supabase = createClient();

    // Process the callback
    const result = await processMpesaCallback(callbackData, supabase);

    if (result.success) {
      console.log('M-Pesa payment processed successfully:', result);

      // Return success response to M-Pesa
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: 'The service request has been accepted for processing',
      });
    } else {
      console.error('Error processing M-Pesa callback:', result);

      // Return success response to M-Pesa anyway (to prevent retries)
      // but log the error for manual investigation
      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: result.error || 'Error processing payment',
      });
    }
  } catch (error) {
    console.error('Error in M-Pesa callback endpoint:', error);

    // Return success to prevent infinite retries
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: 'Error processing callback',
    });
  }
}

/**
 * GET handler for testing/verification
 */
export async function GET(request) {
  return NextResponse.json({
    status: 'Callback endpoint is ready',
    timestamp: new Date().toISOString(),
  });
}
