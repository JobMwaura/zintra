/**
 * Stripe Checkout — Create a subscription checkout session
 * POST /api/billing/stripe/checkout
 * 
 * Body: { product_code: string, success_url?: string, cancel_url?: string }
 * 
 * Creates or reuses a Stripe customer, then creates a Checkout Session
 * in subscription mode pointing to the product's stripe_price_id.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2024-12-18.acacia' });
}

export async function POST(request) {
  try {
    // ── Auth ──
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { product_code, success_url, cancel_url } = await request.json();

    if (!product_code) {
      return NextResponse.json({ error: 'product_code is required' }, { status: 400 });
    }

    // ── Fetch product ──
    const { data: product, error: prodError } = await supabase
      .from('billing_products')
      .select('id, product_code, name, scope, tier, price_usd, stripe_price_id, billing_mode')
      .eq('product_code', product_code)
      .eq('active', true)
      .single();

    if (prodError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.stripe_price_id) {
      return NextResponse.json(
        { error: 'This product is not available for card subscription. Use M-Pesa pass instead.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // ── Get or create Stripe customer ──
    let stripeCustomerId;

    // Check existing subscription records for customer ID
    const { data: existingSub } = await supabase
      .from('billing_subscriptions')
      .select('provider_customer_id')
      .eq('user_id', user.id)
      .eq('provider', 'stripe')
      .not('provider_customer_id', 'is', null)
      .limit(1)
      .maybeSingle();

    if (existingSub?.provider_customer_id) {
      stripeCustomerId = existingSub.provider_customer_id;
    } else {
      // Get user email from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .maybeSingle();

      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // ── Create Checkout Session ──
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zintra-sandy.vercel.app';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: product.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: success_url || `${siteUrl}/upgrade?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: cancel_url || `${siteUrl}/upgrade?cancelled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          product_code: product.product_code,
          product_id: product.id,
          scope: product.scope,
          tier: product.tier,
        },
      },
      metadata: {
        supabase_user_id: user.id,
        product_code: product.product_code,
      },
    });

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error('[stripe/checkout] Error:', error);

    if (error.message === 'STRIPE_SECRET_KEY not configured') {
      return NextResponse.json(
        { error: 'Card payments are not yet available. Please use M-Pesa.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
