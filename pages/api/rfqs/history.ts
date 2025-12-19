/**
 * API Route: GET /api/rfqs/history
 * 
 * Fetch closed/completed RFQs
 * Includes selected quote and completion details
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
    const dateRange = searchParams.get('dateRange') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Calculate date filter
    let dateFilter: Date | null = null;
    if (dateRange !== 'all') {
      const now = new Date();
      switch (dateRange) {
        case 'week':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    // Build base query
    let query = supabase
      .from('rfqs')
      .select(`
        *,
        rfq_responses(
          id,
          vendor_id,
          vendor_name,
          quote_price,
          created_at,
          selected
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['closed', 'completed']);

    // Apply date filter if specified
    if (dateFilter) {
      query = query.gte('created_at', dateFilter.toISOString());
    }

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

    // Enrich data with selected quote info
    const rfqsWithSelectedQuote = data.map(rfq => {
      const selectedQuote = rfq.rfq_responses.find(r => r.selected);
      return {
        ...rfq,
        selectedQuote: selectedQuote || null,
        totalQuotes: rfq.rfq_responses.length,
        avgQuotePrice: rfq.rfq_responses.length > 0
          ? rfq.rfq_responses
              .map(r => r.quote_price)
              .filter(p => p !== null)
              .reduce((a, b) => a + b, 0) / rfq.rfq_responses.length
          : null
      };
    });

    // Apply pagination
    const paginatedRFQs = rfqsWithSelectedQuote.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedRFQs,
      count: paginatedRFQs.length,
      total: rfqsWithSelectedQuote.length
    });

  } catch (error) {
    console.error('Error in history RFQs endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
