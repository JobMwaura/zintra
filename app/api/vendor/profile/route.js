'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/vendor/profile
 * 
 * Fetches the current user's vendor profile
 * Uses service role key to bypass RLS
 * 
 * Response: {
 *   success: true,
 *   vendor: { id, user_id, company_name, ... }
 * }
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Fetch vendor profile using service role (bypasses RLS)
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (vendorError) {
      return NextResponse.json(
        { error: 'Vendor profile not found', details: vendorError },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor: vendor
    });

  } catch (error) {
    console.error('Error fetching vendor profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
