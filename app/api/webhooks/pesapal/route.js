/**
 * PesaPal Webhook Handler
 * POST /api/webhooks/pesapal
 * 
 * Receives payment notifications from PesaPal
 * Updates subscription status based on payment outcome
 */

import { pesapalClient } from '@/lib/pesapal/pesapalClient';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Process webhook from PesaPal
 */
export async function POST(req) {
  try {
    // Get request body and signature
    const body = await req.json();
    const signature = req.headers.get('pesapal-signature') || req.headers.get('x-pesapal-signature');

    console.log('📦 PesaPal Webhook received');
    console.log('📋 Order ID:', body.id);
    console.log('📊 Status:', body.status);

    // Validate webhook signature
    if (!signature) {
      console.error('❌ Missing webhook signature');
      return Response.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    const isValid = pesapalClient.validateWebhookSignature(signature, body);
    if (!isValid) {
      console.error('❌ Invalid webhook signature - rejecting');
      return Response.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const orderId = body.id;
    const webhookStatus = body.status;

    // Verify payment status with PesaPal (for extra security)
    console.log('🔍 Verifying payment status with PesaPal...');
    const statusResult = await pesapalClient.getPaymentStatus(orderId);

    if (!statusResult.success) {
      console.error('❌ Could not verify payment status:', statusResult.error);
      // Still process webhook in case of temporary API issues
      // but log the error for investigation
    }

    const paymentStatus = statusResult.status || webhookStatus;

    console.log('✅ Verified payment status:', paymentStatus);

    // Find the pending subscription by order ID
    const { data: pendingSub, error: fetchError } = await supabase
      .from('vendor_subscriptions')
      .select('*')
      .eq('pesapal_order_id', orderId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching subscription:', fetchError);
      return Response.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!pendingSub) {
      console.warn('⚠️ No pending subscription found for order:', orderId);
      // Still return success to acknowledge webhook receipt
      return Response.json({ success: true }, { status: 200 });
    }

    console.log('📋 Found subscription:', {
      id: pendingSub.id,
      vendor_id: pendingSub.vendor_id,
      current_status: pendingSub.status,
    });

    // Handle different payment statuses
    if (paymentStatus === 'COMPLETED') {
      // ✅ Payment successful - activate subscription
      console.log('✅ Payment COMPLETED - activating subscription');

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
          payment_status: 'COMPLETED',
          payment_method: 'pesapal',
          transaction_id: body.reference || orderId,
        })
        .eq('id', pendingSub.id);

      if (updateError) {
        console.error('❌ Error activating subscription:', updateError);
        return Response.json(
          { error: 'Could not activate subscription' },
          { status: 500 }
        );
      }

      console.log('✅ Subscription activated successfully');

      // Log payment event
      await logPaymentEvent({
        event_type: 'PAYMENT_COMPLETED',
        order_id: orderId,
        vendor_id: pendingSub.vendor_id,
        status: 'active',
        amount: body.amount,
      });

      // TODO: Send confirmation email
      // await sendConfirmationEmail(pendingSub.user_id, pendingSub.plan_id);

    } else if (paymentStatus === 'FAILED') {
      // ❌ Payment failed - mark as failed
      console.log('❌ Payment FAILED - marking subscription as failed');

      const { error: updateError } = await supabase
        .from('vendor_subscriptions')
        .update({
          status: 'payment_failed',
          pesapal_order_id: orderId,
          payment_status: 'FAILED',
          payment_date: new Date().toISOString(),
          transaction_id: body.reference || orderId,
        })
        .eq('id', pendingSub.id);

      if (updateError) {
        console.error('❌ Error updating failed subscription:', updateError);
      }

      // Log payment event
      await logPaymentEvent({
        event_type: 'PAYMENT_FAILED',
        order_id: orderId,
        vendor_id: pendingSub.vendor_id,
        status: 'payment_failed',
        amount: body.amount,
      });

      // TODO: Send failure notification email
      // await sendFailureEmail(pendingSub.user_id);

    } else if (paymentStatus === 'CANCELLED') {
      // ⚠️ Payment cancelled - delete pending subscription
      console.log('⚠️ Payment CANCELLED - removing pending subscription');

      const { error: deleteError } = await supabase
        .from('vendor_subscriptions')
        .delete()
        .eq('id', pendingSub.id)
        .eq('status', 'pending_payment');

      if (deleteError) {
        console.error('❌ Error cancelling subscription:', deleteError);
      }

      // Log payment event
      await logPaymentEvent({
        event_type: 'PAYMENT_CANCELLED',
        order_id: orderId,
        vendor_id: pendingSub.vendor_id,
        status: 'cancelled',
        amount: body.amount,
      });

    } else {
      // Unknown status
      console.warn('⚠️ Unknown payment status:', paymentStatus);
      
      // Log for investigation
      await logPaymentEvent({
        event_type: 'PAYMENT_UNKNOWN_STATUS',
        order_id: orderId,
        vendor_id: pendingSub.vendor_id,
        status: paymentStatus,
        amount: body.amount,
      });
    }

    // Return success to acknowledge webhook receipt
    return Response.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);

    // Still return 200 to prevent PesaPal from retrying
    // Log the error for investigation
    return Response.json(
      { error: error.message },
      { status: 200 } // Return 200 even on error to stop retries
    );
  }
}

/**
 * Log payment event for monitoring and debugging
 * @param {Object} event - Event details
 */
async function logPaymentEvent(event) {
  try {
    await supabase.from('payment_logs').insert([{
      event_type: event.event_type,
      order_id: event.order_id,
      vendor_id: event.vendor_id,
      status: event.status,
      amount: event.amount,
      timestamp: new Date().toISOString(),
      details: JSON.stringify(event),
    }]);

    console.log('📝 Payment event logged:', event.event_type);
  } catch (error) {
    console.error('⚠️ Error logging payment event:', error);
    // Don't throw - logging errors shouldn't break the webhook
  }
}
