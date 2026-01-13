'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/vendor-profile/views
 * Track a vendor profile view (unique per viewer per day)
 * 
 * Body:
 * - vendorId (required): Vendor UUID
 * - viewerId (optional): Viewer UUID (for authenticated users)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { vendorId, viewerId } = body;

    if (!vendorId) {
      return NextResponse.json(
        { message: 'vendorId is required' },
        { status: 400 }
      );
    }

    // Get client IP for anonymous users
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request.headers.get('user-agent') || '';

    console.log(`📊 Recording profile view for vendor ${vendorId} by user ${viewerId || ipAddress}`);

    // Verify vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      console.log('❌ Vendor not found:', vendorId);
      return NextResponse.json(
        { message: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Check if view already tracked today for this viewer/IP
    const today = new Date().toISOString().split('T')[0];
    const { data: existingView } = await supabase
      .from('vendor_profile_views')
      .select('id')
      .eq('vendor_id', vendorId)
      .gte('viewed_at', today + 'T00:00:00')
      .lt('viewed_at', today + 'T23:59:59')
      .eq(viewerId ? 'viewer_id' : 'ip_address', viewerId || ipAddress)
      .single();

    if (existingView) {
      console.log(`ℹ️  Profile view already tracked today for this viewer/IP`);
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    // Insert view record
    const { error: viewError } = await supabase
      .from('vendor_profile_views')
      .insert({
        vendor_id: vendorId,
        viewer_id: viewerId || null,
        ip_address: viewerId ? null : ipAddress,
        user_agent: userAgent,
      });

    if (viewError) {
      console.error('❌ View insertion error:', viewError);
      // Don't fail the request, just log it
    } else {
      console.log(`✅ Profile view recorded for vendor ${vendorId}`);
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Error recording profile view:', err);
    return NextResponse.json(
      { message: 'Error recording profile view' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor-profile/views?vendorId=...
 * Get statistics for a vendor profile (unique view count, breakdown)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { message: 'vendorId is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching profile stats for vendor ${vendorId}`);

    // Verify vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      console.log('❌ Vendor not found:', vendorId);
      return NextResponse.json(
        { message: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Count unique views (authenticated viewers counted once per day, anonymous by IP once per day)
    const { data: viewsData, error: viewsError } = await supabase
      .from('vendor_profile_views')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    if (viewsError) {
      console.error('❌ View count query error:', viewsError);
      // Continue with 0
    }

    // Get breakdown by authenticated vs anonymous
    const { data: authenticatedViews, error: authViewsError } = await supabase
      .from('vendor_profile_views')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .not('viewer_id', 'is', null);

    const { data: anonymousViews, error: anonViewsError } = await supabase
      .from('vendor_profile_views')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .is('viewer_id', null);

    const totalViews = viewsData?.length || 0;
    const authViewCount = authenticatedViews?.length || 0;
    const anonViewCount = anonymousViews?.length || 0;

    console.log(`✅ Profile stats: ${totalViews} views (${authViewCount} auth, ${anonViewCount} anon)`);
    
    return NextResponse.json(
      {
        vendorId: vendor.id,
        viewCount: totalViews,
        viewBreakdown: {
          authenticated: authViewCount,
          anonymous: anonViewCount,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Error fetching profile stats:', err);
    return NextResponse.json(
      { message: 'Error fetching profile stats' },
      { status: 500 }
    );
  }
}
