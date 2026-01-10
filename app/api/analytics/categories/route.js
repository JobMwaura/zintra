/**
 * Category Analytics API
 * 
 * GET /api/analytics/categories
 * 
 * Returns:
 * - RFQ breakdown by category
 * - Vendor distribution by category
 * - Category trends
 * - Most popular categories
 * 
 * Phase 3 Feature 3: Category analytics
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timeRange));

    // 1. Get RFQs by category
    const { data: rfqsByCategory, error: rfqError } = await supabase
      .from('rfqs')
      .select('primaryCategorySlug, id, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (rfqError) throw rfqError;

    // 2. Get vendor count by category
    const { data: vendorsByCategory, error: vendorError } = await supabase
      .from('vendors')
      .select('primary_category_slug, id');

    if (vendorError) throw vendorError;

    // 3. Get RFQ responses by category
    const { data: responsesByCategory, error: responseError } = await supabase
      .from('rfq_responses')
      .select('rfq_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (responseError) throw responseError;

    // Process data
    const rfqStats = {};
    const vendorStats = {};
    const responseStats = {};

    // Count RFQs by category
    rfqsByCategory?.forEach(rfq => {
      const cat = rfq.primaryCategorySlug || 'uncategorized';
      rfqStats[cat] = (rfqStats[cat] || 0) + 1;
    });

    // Count vendors by category
    vendorsByCategory?.forEach(vendor => {
      const cat = vendor.primaryCategorySlug || 'uncategorized';
      vendorStats[cat] = (vendorStats[cat] || 0) + 1;
    });

    // Count responses by category (requires RFQ lookup)
    if (responsesByCategory && responsesByCategory.length > 0) {
      // Get RFQ category data for responses
      const rfqIds = responsesByCategory.map(r => r.rfq_id);
      const { data: relatedRFQs } = await supabase
        .from('rfqs')
        .select('id, primaryCategorySlug')
        .in('id', rfqIds);

      relatedRFQs?.forEach(rfq => {
        const cat = rfq.primaryCategorySlug || 'uncategorized';
        responseStats[cat] = (responseStats[cat] || 0) + 1;
      });
    }

    // Calculate stats
    const allCategories = new Set([
      ...Object.keys(rfqStats),
      ...Object.keys(vendorStats),
      ...Object.keys(responseStats)
    ]);

    const categoryStats = Array.from(allCategories).map(category => ({
      category,
      rfqCount: rfqStats[category] || 0,
      vendorCount: vendorStats[category] || 0,
      responseCount: responseStats[category] || 0,
      avgResponseRate: vendorStats[category] 
        ? ((responseStats[category] || 0) / vendorStats[category]).toFixed(2)
        : '0.00'
    }));

    // Sort by RFQ count (popularity)
    categoryStats.sort((a, b) => b.rfqCount - a.rfqCount);

    return Response.json({
      success: true,
      timeRange,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalRFQs: rfqsByCategory?.length || 0,
        totalVendors: vendorsByCategory?.length || 0,
        totalResponses: responsesByCategory?.length || 0,
        activeCategories: allCategories.size
      },
      categories: categoryStats,
      topCategories: categoryStats.slice(0, 5),
      vendorDistribution: {
        byCategory: vendorStats
      },
      rfqTrends: {
        byCategory: rfqStats
      }
    });

  } catch (error) {
    console.error('Category analytics error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
