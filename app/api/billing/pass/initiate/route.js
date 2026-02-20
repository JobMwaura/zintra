/**
 * Pass Purchase — Initiate M-Pesa STK Push
 * POST /api/billing/pass/initiate
 * 
 * Input: { product_code, phone }
 * Creates a billing_pass_purchases record, triggers STK Push.
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox'; // 'sandbox' | 'production'
const MPESA_CALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/billing/mpesa/callback`
  : process.env.MPESA_CALLBACK_URL;

const MPESA_BASE = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

async function getMpesaToken() {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await res.json();
  return data.access_token;
}

function formatPhone(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '254' + cleaned.substring(1);
  if (cleaned.length === 9) cleaned = '254' + cleaned;
  if (cleaned.length !== 12 || !cleaned.startsWith('254')) return null;
  return cleaned;
}

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { product_code, phone } = await request.json();

    if (!product_code || !phone) {
      return NextResponse.json({ error: 'product_code and phone are required' }, { status: 400 });
    }

    // Validate phone
    const formattedPhone = formatPhone(phone);
    if (!formattedPhone) {
      return NextResponse.json({ error: 'Invalid phone number format. Use 0712345678 or 254712345678' }, { status: 400 });
    }

    // Get product
    const { data: product, error: prodError } = await supabase
      .from('billing_products')
      .select('id, product_code, name, price_kes, billing_mode, active, duration_days, scope, tier')
      .eq('product_code', product_code)
      .eq('active', true)
      .single();

    if (prodError || !product) {
      return NextResponse.json({ error: `Product "${product_code}" not found or inactive` }, { status: 404 });
    }

    if (!['pass', 'both'].includes(product.billing_mode)) {
      return NextResponse.json({ error: 'This product does not support pass purchase' }, { status: 400 });
    }

    if (product.price_kes <= 0) {
      return NextResponse.json({ error: 'Cannot purchase a free product' }, { status: 400 });
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('billing_pass_purchases')
      .insert({
        user_id: user.id,
        product_id: product.id,
        amount_kes: product.price_kes,
        currency: 'KES',
        status: 'initiated',
        provider: 'mpesa',
        metadata: { phone: formattedPhone, product_code: product.product_code },
      })
      .select()
      .single();

    if (purchaseError) {
      console.error('Error creating purchase:', purchaseError);
      return NextResponse.json({ error: 'Failed to create purchase record' }, { status: 500 });
    }

    // Initiate M-Pesa STK Push
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

    const stkPayload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.floor(product.price_kes),
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: `ZINTRA-${product.product_code}`,
      TransactionDesc: `Zintra ${product.name} Pass`,
    };

    const stkRes = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode !== '0' || !stkData.CheckoutRequestID) {
      // STK Push failed
      await supabase
        .from('billing_pass_purchases')
        .update({ status: 'failed', metadata: { ...purchase.metadata, mpesa_error: stkData } })
        .eq('id', purchase.id);

      return NextResponse.json({
        error: stkData.ResponseDescription || 'Failed to initiate M-Pesa payment',
      }, { status: 400 });
    }

    // Store checkout ID
    await supabase
      .from('billing_pass_purchases')
      .update({ provider_checkout_id: stkData.CheckoutRequestID })
      .eq('id', purchase.id);

    return NextResponse.json({
      success: true,
      purchase_id: purchase.id,
      checkout_request_id: stkData.CheckoutRequestID,
      product: {
        name: product.name,
        tier: product.tier,
        scope: product.scope,
        price_kes: product.price_kes,
        duration_days: product.duration_days,
      },
      message: 'Check your phone for the M-Pesa prompt.',
    });
  } catch (error) {
    console.error('Error in pass initiate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
