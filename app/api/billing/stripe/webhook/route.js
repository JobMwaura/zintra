/**
 * Stripe Webhook — Handles subscription lifecycle events
 * POST /api/billing/stripe/webhook
 * 
 * Events handled:
 *   - checkout.session.completed → create billing_subscriptions record
 *   - invoice.paid → renew period, re-initialize usage
 *   - customer.subscription.updated → sync status changes
 *   - customer.subscription.deleted → cancel subscription
 * 
 * Requires env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
}

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request) {
  let event;

  try {
    const stripe = getStripe();
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[stripe/webhook] Missing signature or webhook secret');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[stripe/webhook] Event: ${event.type} (${event.id})`);

  // Log event for audit
  await supabase.from('billing_subscription_events').insert({
    provider_event_id: event.id,
    type: event.type,
    payload: event.data.object,
  }).catch(() => {});

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      default:
        console.log(`[stripe/webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`[stripe/webhook] Error handling ${event.type}:`, err);
    // Don't return 500 — Stripe will retry
  }

  return NextResponse.json({ received: true });
}

// ─── Event Handlers ─────────────────────────────────────────────

async function handleCheckoutCompleted(session) {
  if (session.mode !== 'subscription') return;

  const subscriptionId = session.subscription;
  const customerId = session.customer;
  const userId = session.metadata?.supabase_user_id;
  const productCode = session.metadata?.product_code;

  if (!userId || !subscriptionId) {
    console.error('[stripe/webhook] Missing userId or subscriptionId in checkout session');
    return;
  }

  // Fetch subscription details from Stripe
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Find product
  const { data: product } = await supabase
    .from('billing_products')
    .select('id, scope, tier, product_code')
    .eq('product_code', productCode)
    .single();

  if (!product) {
    console.error(`[stripe/webhook] Product not found: ${productCode}`);
    return;
  }

  // Cancel any existing active pass for same scope (subscription takes over)
  const { data: sameScopeProducts } = await supabase
    .from('billing_products')
    .select('id')
    .eq('scope', product.scope);

  if (sameScopeProducts?.length) {
    await supabase
      .from('billing_passes')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .in('product_id', sameScopeProducts.map(p => p.id));
  }

  // Create billing_subscriptions record
  await supabase
    .from('billing_subscriptions')
    .upsert({
      user_id: userId,
      product_id: product.id,
      provider: 'stripe',
      provider_customer_id: customerId,
      provider_subscription_id: subscriptionId,
      status: subscription.status === 'active' ? 'active' : 'trialing',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, { onConflict: 'user_id,product_id' })
    .then(() => {
      // Update the event record with subscription_id
      supabase.from('billing_subscription_events')
        .update({ subscription_id: subscriptionId })
        .eq('provider_event_id', `checkout_${session.id}`)
        .catch(() => {});
    });

  // Initialize included usage for this billing period
  await initializeUsage(userId, product.id, product.scope,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000)
  );

  // Invalidate capabilities cache
  await supabase
    .from('user_capabilities_cache')
    .delete()
    .eq('user_id', userId);

  console.log(`[stripe/webhook] ✅ Subscription created: ${product.product_code} for user ${userId}`);
}

async function handleInvoicePaid(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  // Find our subscription record
  const { data: sub } = await supabase
    .from('billing_subscriptions')
    .select('id, user_id, product_id, billing_products(scope)')
    .eq('provider_subscription_id', subscriptionId)
    .maybeSingle();

  if (!sub) return;

  // Get period from Stripe
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update period
  await supabase
    .from('billing_subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', sub.id);

  // Re-initialize usage for the new period
  await initializeUsage(sub.user_id, sub.product_id, sub.billing_products?.scope,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000)
  );

  // Invalidate cache
  await supabase
    .from('user_capabilities_cache')
    .delete()
    .eq('user_id', sub.user_id);

  console.log(`[stripe/webhook] ✅ Invoice paid, period renewed for sub ${sub.id}`);
}

async function handleSubscriptionUpdated(subscription) {
  const { data: sub } = await supabase
    .from('billing_subscriptions')
    .select('id, user_id')
    .eq('provider_subscription_id', subscription.id)
    .maybeSingle();

  if (!sub) return;

  // Map Stripe status → our status
  const statusMap = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'cancelled',
    unpaid: 'past_due',
    paused: 'paused',
  };

  await supabase
    .from('billing_subscriptions')
    .update({
      status: statusMap[subscription.status] || subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', sub.id);

  // Invalidate cache
  await supabase
    .from('user_capabilities_cache')
    .delete()
    .eq('user_id', sub.user_id);

  console.log(`[stripe/webhook] Subscription updated: ${subscription.id} → ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription) {
  const { data: sub } = await supabase
    .from('billing_subscriptions')
    .select('id, user_id')
    .eq('provider_subscription_id', subscription.id)
    .maybeSingle();

  if (!sub) return;

  await supabase
    .from('billing_subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', sub.id);

  // Invalidate cache — user falls back to free or pass
  await supabase
    .from('user_capabilities_cache')
    .delete()
    .eq('user_id', sub.user_id);

  console.log(`[stripe/webhook] ✅ Subscription cancelled: ${subscription.id}`);
}

// ─── Helpers ────────────────────────────────────────────────────

async function initializeUsage(userId, productId, scope, periodStart, periodEnd) {
  const { data: entitlements } = await supabase
    .from('billing_entitlements')
    .select('capability_key, capability_value')
    .eq('product_id', productId);

  for (const ent of (entitlements || [])) {
    if (ent.capability_key.includes('included') && ent.capability_value.type === 'number') {
      await supabase
        .from('billing_included_usage')
        .upsert({
          user_id: userId,
          scope: scope,
          product_id: productId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          metric_key: ent.capability_key,
          metric_value: 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,product_id,period_start,metric_key' });
    }
  }
}
