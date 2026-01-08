import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const body = await request.json();

    if (!body.company_name || !body.email) {
      return NextResponse.json(
        { error: 'Company name and email are required' },
        { status: 400 }
      );
    }

    const vendorPayload = {
      user_id: body.user_id || null,  // ← ALWAYS include this, even if null
      company_name: body.company_name,
      description: body.description || null,
      phone: body.phone || null,
      phone_verified: body.phone_verified || false,
      phone_verified_at: body.phone_verified_at || null,
      email: body.email,
      county: body.county || null,
      location: body.location || null,
      category: body.category || null,
      primary_category_slug: body.primaryCategorySlug || null,
      secondary_categories: body.secondaryCategories || null,
      services: body.services || null,
      price_range:
        body.price_min && body.price_max
          ? `KSh ${body.price_min} - KSh ${body.price_max}`
          : null,
      plan: body.plan || 'free',
      whatsapp: body.whatsapp || null,
      website: body.website || null,
    };

    const { data, error } = await supabase.from('vendors').insert([vendorPayload]).select();

    if (error) {
      console.error('Database error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Vendor profile created successfully',
        data: data
      },
      { status: 200 }
    );

  } catch (err) {
    console.error('Server error:', err.message);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}