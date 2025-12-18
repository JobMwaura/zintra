/**
 * API Route: GET /api/rfqs/stats
 * 
 * Fetch aggregated statistics for RFQ dashboard
 * Calculates KPIs for all RFQs
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
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

    // Fetch all user RFQs with responses
    const { data: rfqs, error } = await supabase
      .from('rfqs')
      .select(`
        *,
        rfq_responses(
          id,
          vendor_id,
          quote_price,
          created_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: rfqs.length,
      pending: 0,
      active: 0,
      completed: 0,
      closed: 0,
      newQuotesThisWeek: 0,
      averageResponseTime: 0,
      onTimeClosureRate: 0,
      totalQuotes: 0,
      avgQuotesPerRFQ: 0,
      totalSpent: 0,
      avgSpentPerRFQ: 0,
      categoryBreakdown: {},
      topVendors: []
    };

    // Vendor tracking for top vendors
    const vendorMap = new Map();
    const categoryMap = new Map();

    // Process each RFQ
    let onTimeClosures = 0;
    let totalResponseTimes = 0;
    let responseTimesCount = 0;

    rfqs.forEach(rfq => {
      const quoteCount = rfq.rfq_responses?.length || 0;

      // Status categorization
      if (rfq.status === 'completed' || rfq.status === 'closed') {
        if (rfq.status === 'completed') stats.completed++;
        if (rfq.status === 'closed') stats.closed++;
      } else if (quoteCount < 2) {
        stats.pending++;
      } else {
        stats.active++;
      }

      // Category breakdown
      const category = rfq.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);

      // New quotes this week
      if (rfq.rfq_responses) {
        rfq.rfq_responses.forEach(quote => {
          stats.totalQuotes++;

          if (new Date(quote.created_at) >= oneWeekAgo) {
            stats.newQuotesThisWeek++;
          }

          // Vendor tracking
          if (quote.vendor_id) {
            vendorMap.set(
              quote.vendor_id,
              (vendorMap.get(quote.vendor_id) || 0) + 1
            );
          }

          // Response time calculation
          if (quote.created_at && rfq.created_at) {
            const createdTime = new Date(rfq.created_at);
            const responseTime = new Date(quote.created_at);
            const diffMs = responseTime.getTime() - createdTime.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            totalResponseTimes += diffDays;
            responseTimesCount++;
          }
        });
      }

      // On-time closure rate (if deadline is set and RFQ is closed)
      if ((rfq.status === 'completed' || rfq.status === 'closed') && rfq.deadline) {
        const deadline = new Date(rfq.deadline);
        if (rfq.closed_at) {
          const closedDate = new Date(rfq.closed_at);
          if (closedDate <= deadline) {
            onTimeClosures++;
          }
        }
      }

      // Total spent (sum of selected quotes)
      if (rfq.rfq_responses) {
        rfq.rfq_responses.forEach(quote => {
          if (quote.selected && quote.quote_price) {
            stats.totalSpent += quote.quote_price;
          }
        });
      }
    });

    // Calculate derived statistics
    stats.pending = Math.max(0, stats.pending); // Ensure non-negative
    stats.avgQuotesPerRFQ = rfqs.length > 0 ? stats.totalQuotes / rfqs.length : 0;
    stats.averageResponseTime = responseTimesCount > 0 ? totalResponseTimes / responseTimesCount : 0;
    stats.onTimeClosureRate = (stats.completed + stats.closed) > 0
      ? (onTimeClosures / (stats.completed + stats.closed)) * 100
      : 0;
    stats.avgSpentPerRFQ = (stats.completed + stats.closed) > 0
      ? stats.totalSpent / (stats.completed + stats.closed)
      : 0;

    // Convert category map to object
    categoryMap.forEach((value, key) => {
      stats.categoryBreakdown[key] = value;
    });

    // Get top 5 vendors
    stats.topVendors = Array.from(vendorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([vendorId, count]) => ({
        vendorId,
        count,
        percentage: (count / stats.totalQuotes) * 100
      }));

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error in stats endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
