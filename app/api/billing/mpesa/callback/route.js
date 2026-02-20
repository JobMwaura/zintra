/**
 * M-Pesa Callback for Billing Passes
 * POST /api/billing/mpesa/callback
 * 
 * Called by Safaricom after STK Push completes.
 * On success: creates billing_pass, activates capabilities.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role for webhook (no user session)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const callbackData = await request.json();
    console.log('[billing/mpesa/callback] Received:', JSON.stringify(callbackData, null, 2));

    const { Body } = callbackData;
    const { stkCallback } = Body || {};

    if (!stkCallback) {
      console.error('[billing/mpesa/callback] Invalid payload — no stkCallback');
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid payload' });
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // Find the purchase record
    const { data: purchase, error: findError } = await supabase
      .from('billing_pass_purchases')
      .select('id, user_id, product_id, amount_kes, status')
      .eq('provider_checkout_id', CheckoutRequestID)
      .maybeSingle();

    if (findError || !purchase) {
      console.error('[billing/mpesa/callback] Purchase not found for checkout:', CheckoutRequestID);
      // Still return success to Safaricom to prevent retries
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // Already processed?
    if (purchase.status === 'paid') {
      console.log('[billing/mpesa/callback] Already processed:', purchase.id);
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Already processed' });
    }

    if (ResultCode === 0) {
      // ─── PAYMENT SUCCESS ──────────────────────────────────────
      let mpesaReceipt = null;
      let amount = null;
      let phoneNumber = null;

      if (CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
          if (item.Name === 'MpesaReceiptNumber') mpesaReceipt = item.Value;
          if (item.Name === 'Amount') amount = item.Value;
          if (item.Name === 'PhoneNumber') phoneNumber = item.Value;
        }
      }

      // Update purchase → paid
      await supabase
        .from('billing_pass_purchases')
        .update({
          status: 'paid',
          provider_receipt: mpesaReceipt,
          metadata: {
            mpesa_receipt: mpesaReceipt,
            mpesa_amount: amount,
            mpesa_phone: phoneNumber,
            result_desc: ResultDesc,
          },
        })
        .eq('id', purchase.id);

      // Get product details
      const { data: product } = await supabase
        .from('billing_products')
        .select('id, duration_days, scope, tier, product_code, name')
        .eq('id', purchase.product_id)
        .single();

      if (product) {
        const now = new Date();
        const endsAt = new Date(now.getTime() + (product.duration_days || 30) * 24 * 60 * 60 * 1000);

        // Cancel any existing active pass for same scope
        const { data: sameScope } = await supabase
          .from('billing_products')
          .select('id')
          .eq('scope', product.scope);

        if (sameScope?.length) {
          await supabase
            .from('billing_passes')
            .update({ status: 'cancelled' })
            .eq('user_id', purchase.user_id)
            .eq('status', 'active')
            .in('product_id', sameScope.map(p => p.id));
        }

        // Create active pass
        await supabase
          .from('billing_passes')
          .insert({
            user_id: purchase.user_id,
            product_id: purchase.product_id,
            status: 'active',
            starts_at: now.toISOString(),
            ends_at: endsAt.toISOString(),
            purchase_ref: purchase.id,
            metadata: {
              mpesa_receipt: mpesaReceipt,
              amount_kes: amount,
            },
          });

        // Initialize included usage
        const { data: entitlements } = await supabase
          .from('billing_entitlements')
          .select('capability_key, capability_value')
          .eq('product_id', purchase.product_id);

        for (const ent of (entitlements || [])) {
          if (ent.capability_key.includes('included') && ent.capability_value.type === 'number') {
            await supabase
              .from('billing_included_usage')
              .upsert({
                user_id: purchase.user_id,
                scope: product.scope,
                product_id: purchase.product_id,
                period_start: now.toISOString(),
                period_end: endsAt.toISOString(),
                metric_key: ent.capability_key,
                metric_value: 0,
                updated_at: now.toISOString(),
              }, { onConflict: 'user_id,product_id,period_start,metric_key' });
          }
        }

        // Refresh capabilities cache
        await supabase
          .from('user_capabilities_cache')
          .delete()
          .eq('user_id', purchase.user_id);

        console.log(`[billing/mpesa/callback] ✅ Pass activated: ${product.product_code} for user ${purchase.user_id} until ${endsAt.toISOString()}`);
      }
    } else if (ResultCode === 1032) {
      // ─── USER CANCELLED ───────────────────────────────────────
      await supabase
        .from('billing_pass_purchases')
        .update({ status: 'cancelled', metadata: { result_desc: 'User cancelled' } })
        .eq('id', purchase.id);

      console.log(`[billing/mpesa/callback] User cancelled purchase ${purchase.id}`);
    } else {
      // ─── PAYMENT FAILED ───────────────────────────────────────
      await supabase
        .from('billing_pass_purchases')
        .update({ status: 'failed', metadata: { result_code: ResultCode, result_desc: ResultDesc } })
        .eq('id', purchase.id);

      console.log(`[billing/mpesa/callback] Payment failed: ${ResultDesc}`);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('[billing/mpesa/callback] Error:', error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Error logged' });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Billing M-Pesa callback endpoint ready' });
}
