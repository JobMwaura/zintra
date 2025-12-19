/**
 * API Route: GET /api/rfqs/pending
 * 
 * Fetch RFQs with fewer than 2 quotes
 * Optimized query with quote counts
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    // Get user from JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get search params
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';
    const sortBy = searchParams.get('sort') || 'latest';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build base query
    let query = supabase
      .from('rfqs')
      .select(`
        *,
        rfq_responses(id, vendor_name, quote_price, created_at)
      `)
      .eq('user_id', user.id);

    // Filter: Only RFQs with fewer than 2 quotes (pending)
    // This is done in post-processing due to Supabase count limitations

    // Apply search filter
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'deadline-soon':
        query = query.order('deadline', { ascending: true });
        break;
      case 'deadline-far':
        query = query.order('deadline', { ascending: false });
        break;
      default: // 'latest'
        query = query.order('created_at', { ascending: false });
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch RFQs' },
        { status: 500 }
      );
    }

    // Filter for pending (< 2 quotes) in post-processing
    const pendingRFQs = data
      .filter(rfq => rfq.rfq_responses.length < 2)
      .slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: pendingRFQs,
      count: pendingRFQs.length,
      total: data.filter(rfq => rfq.rfq_responses.length < 2).length
    });

  } catch (error) {
    console.error('Error in pending RFQs endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
