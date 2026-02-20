/**
 * Pass Purchase Status
 * GET /api/billing/pass/status?purchase_id=...
 * 
 * Returns current purchase status for frontend polling.
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const purchaseId = searchParams.get('purchase_id');

    if (!purchaseId) {
      return NextResponse.json({ error: 'purchase_id is required' }, { status: 400 });
    }

    const { data: purchase, error } = await supabase
      .from('billing_pass_purchases')
      .select(`
        id, status, amount_kes, provider_receipt, created_at,
        billing_products(product_code, name, scope, tier, duration_days)
      `)
      .eq('id', purchaseId)
      .eq('user_id', user.id)
      .single();

    if (error || !purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // If paid, also get the pass
    let pass = null;
    if (purchase.status === 'paid') {
      const { data: passData } = await supabase
        .from('billing_passes')
        .select('id, status, starts_at, ends_at')
        .eq('user_id', user.id)
        .eq('purchase_ref', purchaseId)
        .maybeSingle();

      pass = passData;
    }

    return NextResponse.json({
      success: true,
      purchase: {
        id: purchase.id,
        status: purchase.status,
        amount_kes: purchase.amount_kes,
        receipt: purchase.provider_receipt,
        product: purchase.billing_products,
      },
      pass,
    });
  } catch (error) {
    console.error('Error in pass status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
