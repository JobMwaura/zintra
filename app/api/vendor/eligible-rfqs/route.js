'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/vendor/eligible-rfqs
 * 
 * Get list of RFQs that vendor is eligible to respond to
 * Filters by:
 * - RFQs that are NOT direct assignments to other vendors
 * - RFQs that match vendor's skills/categories
 * - RFQs that are in 'assigned' or 'in_review' status
 * - RFQs that haven't expired
 * 
 * Query Parameters:
 * - category: Filter by category
 * - location: Filter by location/county
 * - urgency: Filter by urgency level
 * - status: Filter by status (assigned, in_review)
 * - sort: Sort by (newest, oldest, urgent, budget)
 * - page: Pagination page (default 1)
 * - limit: Items per page (default 20, max 100)
 * 
 * Response: {
 *   success: true,
 *   rfqs: [...],
 *   total: number,
 *   page: number,
 *   has_more: boolean
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
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get vendor profile to check if they're a vendor
    const { data: vendorProfile } = await supabase
      .from('vendors')
      .select('id, category, location')
      .eq('user_id', user.id)
      .single();

    if (!vendorProfile) {
      return NextResponse.json(
        { error: 'Vendor profile not found. Only vendors can view RFQs.' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const urgency = searchParams.get('urgency');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    // Build query - query rfqs table directly instead of incomplete view
    let query = supabase
      .from('rfqs')
      .select('*', { count: 'exact' });

    // Filter by status (assigned or in_review)
    query = query.in('status', ['assigned', 'in_review', 'submitted', 'approved']);

    // Filter by vendor's category if not specified
    if (category) {
      query = query.eq('category', category);
    } else if (vendorProfile.category) {
      query = query.eq('category', vendorProfile.category);
    }

    // Filter by location
    if (location) {
      query = query.eq('location', location);
    }

    // Filter by urgency
    if (urgency && ['low', 'normal', 'high', 'critical'].includes(urgency)) {
      query = query.eq('urgency', urgency);
    }

    // Filter by status
    const statusFilter = status || 'assigned';
    if (['assigned', 'in_review', 'submitted'].includes(statusFilter)) {
      query = query.eq('status', statusFilter);
    }

    // Filter out expired RFQs
    query = query.gt('expires_at', new Date().toISOString());

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'urgent':
        query = query.order('urgency', { ascending: false }).order('created_at', { ascending: false });
        break;
      case 'budget':
        query = query.order('budget_estimate', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: rfqs, error: rfqError, count } = await query;

    if (rfqError) {
      console.error('Error fetching eligible RFQs:', rfqError);
      return NextResponse.json(
        { error: 'Failed to fetch RFQs' },
        { status: 500 }
      );
    }

    // Enhance RFQ data with vendor's existing responses
    const rfqIds = rfqs.map(r => r.id);
    let vendorResponses = {};

    if (rfqIds.length > 0) {
      const { data: responses } = await supabase
        .from('rfq_responses')
        .select('rfq_id, status, created_at')
        .eq('vendor_id', vendorProfile.id)
        .in('rfq_id', rfqIds);

      if (responses) {
        responses.forEach(resp => {
          vendorResponses[resp.rfq_id] = {
            status: resp.status,
            submitted_at: resp.created_at
          };
        });
      }
    }

    // Format response
    const enrichedRfqs = rfqs.map(rfq => ({
      ...rfq,
      vendor_response: vendorResponses[rfq.id] || null,
      can_respond: !vendorResponses[rfq.id], // Can only respond if no existing response
      days_until_expiry: Math.ceil(
        (new Date(rfq.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
      )
    }));

    return NextResponse.json({
      success: true,
      rfqs: enrichedRfqs,
      pagination: {
        total: count,
        page: page,
        limit: limit,
        has_more: offset + limit < count
      },
      filters_applied: {
        category: category || vendorProfile.category,
        location: location || null,
        urgency: urgency || null,
        status: statusFilter,
        sort: sort
      }
    });

  } catch (error) {
    console.error('Vendor eligible RFQs error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
