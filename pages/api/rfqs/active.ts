/**
 * API Route: GET /api/rfqs/active
 * 
 * Fetch RFQs with 2 or more quotes
 * Includes price statistics for each RFQ
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
        rfq_responses(
          id,
          vendor_id,
          vendor_name,
          quote_price,
          created_at,
          selected
        )
      `)
      .eq('user_id', user.id);

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
      case 'quotes-least':
        // Will be sorted in post-processing
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

    // Filter for active (>= 2 quotes) in post-processing
    let activeRFQs = data.filter(rfq => rfq.rfq_responses.length >= 2);

    // Apply quote-based sorting
    if (sortBy === 'quotes-most') {
      activeRFQs.sort((a, b) => b.rfq_responses.length - a.rfq_responses.length);
    } else if (sortBy === 'quotes-least') {
      activeRFQs.sort((a, b) => a.rfq_responses.length - b.rfq_responses.length);
    }

    // Calculate price statistics for each RFQ
    const rfqsWithStats = activeRFQs.map(rfq => {
      const prices = rfq.rfq_responses
        .map(r => r.quote_price)
        .filter(p => p !== null && p !== undefined)
        .sort((a, b) => a - b);

      const stats = {
        min: prices.length > 0 ? prices[0] : null,
        max: prices.length > 0 ? prices[prices.length - 1] : null,
        avg: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
        priceVariance: prices.length > 1 ? prices[prices.length - 1] - prices[0] : 0
      };

      return {
        ...rfq,
        priceStats: stats
      };
    });

    // Apply price-based sorting
    if (sortBy === 'price-low') {
      rfqsWithStats.sort((a, b) => (a.priceStats.min || 0) - (b.priceStats.min || 0));
    } else if (sortBy === 'price-high') {
      rfqsWithStats.sort((a, b) => (b.priceStats.max || 0) - (a.priceStats.max || 0));
    }

    // Apply pagination
    const paginatedRFQs = rfqsWithStats.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginatedRFQs,
      count: paginatedRFQs.length,
      total: activeRFQs.length
    });

  } catch (error) {
    console.error('Error in active RFQs endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
