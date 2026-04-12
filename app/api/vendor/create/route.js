import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // ============================================================================
    // CRITICAL FIX: Use SERVICE ROLE KEY instead of ANON KEY
    // ============================================================================
    // The RLS policy "Vendors can create own profile" uses: auth.uid() = user_id
    // This works with the service role key which has permission to set the context
    // ============================================================================
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const requestedUserId = typeof body.user_id === 'string' ? body.user_id.trim() : body.user_id;
    const trimmedEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!body.company_name || !trimmedEmail) {
      return NextResponse.json(
        { error: 'Company name and email are required' },
        { status: 400 }
      );
    }

    if (!requestedUserId) {
      return NextResponse.json(
        { error: 'user_id is required to create a vendor profile' },
        { status: 400 }
      );
    }

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        );
      }

      if (user.id !== requestedUserId) {
        return NextResponse.json(
          { error: 'Authenticated user does not match the vendor profile request' },
          { status: 403 }
        );
      }
    }

    const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(requestedUserId);

    if (authUserError || !authUserData?.user) {
      return NextResponse.json(
        { error: 'Auth account not found for this vendor profile request' },
        { status: 404 }
      );
    }

    const authEmail = (authUserData.user.email || '').trim().toLowerCase();
    if (!authEmail || authEmail !== trimmedEmail) {
      return NextResponse.json(
        { error: 'Vendor email must match the authenticated account email' },
        { status: 403 }
      );
    }

    // Check if a vendor with this email already exists
    const { data: existingVendor, error: checkError } = await supabase
      .from('vendors')
      .select('id, email')
      .eq('email', trimmedEmail)
      .limit(1);

    if (checkError) {
      console.error('Error checking for existing vendor:', checkError.message);
      return NextResponse.json(
        { error: 'Error validating vendor information' },
        { status: 500 }
      );
    }

    if (existingVendor && existingVendor.length > 0) {
      console.warn(`Vendor with email ${body.email} already exists`);
      return NextResponse.json(
        { 
          error: 'A vendor with this email already exists. Please sign in to your existing account or use a different email.',
          vendorId: existingVendor[0].id
        },
        { status: 409 }
      );
    }

    const vendorPayload = {
      user_id: requestedUserId,
      company_name: body.company_name,
      description: body.description || null,
      phone: body.phone || null,
      phone_verified: body.phone_verified || false,
      phone_verified_at: body.phone_verified_at || null,
      email: trimmedEmail,
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
      // Check if it's a unique constraint violation
      if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
        return NextResponse.json(
          { error: 'Vendor with this email already exists' },
          { status: 409 }
        );
      }
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