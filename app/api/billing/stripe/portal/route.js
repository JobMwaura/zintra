/**
 * Stripe Customer Portal — Create a portal session
 * POST /api/billing/stripe/portal
 * 
 * Lets users manage their subscription (cancel, update payment, view invoices).
 * Requires: STRIPE_SECRET_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json(
        { error: 'Card payments not yet available' },
        { status: 503 }
      );
    }

    const stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });

    // Auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Find Stripe customer ID
    const { data: sub } = await supabase
      .from('billing_subscriptions')
      .select('provider_customer_id')
      .eq('user_id', user.id)
      .eq('provider', 'stripe')
      .not('provider_customer_id', 'is', null)
      .limit(1)
      .maybeSingle();

    if (!sub?.provider_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found. Nothing to manage.' },
        { status: 404 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zintra-sandy.vercel.app';

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.provider_customer_id,
      return_url: `${siteUrl}/upgrade`,
    });

    return NextResponse.json({
      success: true,
      portal_url: session.url,
    });
  } catch (error) {
    console.error('[stripe/portal] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
