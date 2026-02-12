'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { approvePublicRFQ, triggerNotifications } from '@/lib/vendorMatching';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/admin/rfqs
 * 
 * Admin view all RFQs with filtering and sorting
 * Requires admin role
 * 
 * Query Parameters:
 * - status: Filter by status (submitted, approved, in_review, assigned, completed, cancelled, expired)
 * - type: Filter by type (direct, wizard, public)
 * - category: Filter by category
 * - date_from: Start date (YYYY-MM-DD)
 * - date_to: End date (YYYY-MM-DD)
 * - search: Search in title/description
 * - sort: Sort by (newest, oldest, highest_budget, most_responses)
 * - page: Pagination page (default 1)
 * - limit: Items per page (default 20)
 * 
 * Response: {
 *   success: true,
 *   rfqs: [...],
 *   total: number,
 *   page: number,
 *   has_more: boolean,
 *   summary: {
 *     total_pending: number,
 *     total_approved: number,
 *     total_responses: number,
 *     revenue_from_paid_rfqs: number
 *   }
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

    // Check admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('rfqs_with_details')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && ['submitted', 'pending_approval', 'approved', 'in_review', 'assigned', 'completed', 'cancelled', 'expired'].includes(status)) {
      query = query.eq('status', status);
    }

    if (type && ['direct', 'wizard', 'public'].includes(type)) {
      query = query.eq('type', type);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Date range filter
    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00Z`);
    }

    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59Z`);
    }

    // Search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'highest_budget':
        query = query.order('budget_estimate', { ascending: false });
        break;
      case 'most_responses':
        query = query.order('response_count', { ascending: false });
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
      console.error('Error fetching RFQs:', rfqError);
      return NextResponse.json(
        { error: 'Failed to fetch RFQs' },
        { status: 500 }
      );
    }

    // Get summary statistics
    const { data: summaryData } = await supabase
      .from('rfqs')
      .select('id, status, type', { count: 'exact' });

    let summary = {
      total_pending: 0,
      total_approved: 0,
      total_pending_approval: 0,
      total_wizard: 0,
      total_public: 0,
      total_direct: 0,
      total_responses: 0,
      revenue_from_paid_rfqs: 0
    };

    if (summaryData) {
      summary.total_pending = summaryData.filter(r => r.status === 'submitted').length;
      summary.total_approved = summaryData.filter(r => r.status === 'approved').length;
      summary.total_pending_approval = summaryData.filter(r => r.status === 'pending_approval').length;
      summary.total_wizard = summaryData.filter(r => r.type === 'wizard').length;
      summary.total_public = summaryData.filter(r => r.type === 'public').length;
      summary.total_direct = summaryData.filter(r => r.type === 'direct' || r.type === 'vendor-request').length;
    }

    // Get payment summary
    const { data: paymentData } = await supabase
      .from('rfq_payments')
      .select('amount')
      .eq('status', 'success');

    if (paymentData) {
      summary.revenue_from_paid_rfqs = paymentData.reduce((sum, p) => sum + p.amount, 0);
    }

    // Get total responses
    const { data: responseData } = await supabase
      .from('rfq_responses')
      .select('id', { count: 'exact' });

    if (responseData) {
      summary.total_responses = responseData.length;
    }

    // Enrich RFQ data with more details
    const rfqIds = rfqs.map(r => r.id);
    let responsesByRfq = {};
    let recipientsByRfq = {};

    if (rfqIds.length > 0) {
      // Fetch responses
      const { data: responses } = await supabase
        .from('rfq_responses')
        .select('rfq_id, id, vendor_id, status');

      if (responses) {
        responses.forEach(r => {
          if (!responsesByRfq[r.rfq_id]) {
            responsesByRfq[r.rfq_id] = [];
          }
          responsesByRfq[r.rfq_id].push({
            id: r.id,
            vendor_id: r.vendor_id,
            status: r.status
          });
        });
      }

      // Fetch recipients with vendor details (for admin to see where RFQs were sent)
      const { data: recipients } = await supabase
        .from('rfq_recipients')
        .select('rfq_id, vendor_id, recipient_type, status, match_score, match_reasons, created_at')
        .in('rfq_id', rfqIds);

      if (recipients) {
        // Get unique vendor IDs to fetch their names
        const vendorIds = [...new Set(recipients.map(r => r.vendor_id).filter(Boolean))];
        let vendorNames = {};
        if (vendorIds.length > 0) {
          const { data: vendors } = await supabase
            .from('vendors')
            .select('id, company_name, county, rating, primary_category_slug')
            .in('id', vendorIds);
          if (vendors) {
            vendors.forEach(v => {
              vendorNames[v.id] = {
                company_name: v.company_name,
                county: v.county,
                rating: v.rating,
                category: v.primary_category_slug
              };
            });
          }
        }

        recipients.forEach(r => {
          if (!recipientsByRfq[r.rfq_id]) {
            recipientsByRfq[r.rfq_id] = [];
          }
          recipientsByRfq[r.rfq_id].push({
            vendor_id: r.vendor_id,
            vendor_name: vendorNames[r.vendor_id]?.company_name || 'Unknown',
            vendor_county: vendorNames[r.vendor_id]?.county || '',
            vendor_rating: vendorNames[r.vendor_id]?.rating || 0,
            vendor_category: vendorNames[r.vendor_id]?.category || '',
            recipient_type: r.recipient_type,
            status: r.status,
            match_score: r.match_score || null,
            match_reasons: r.match_reasons || null,
            sent_at: r.created_at
          });
        });
      }
    }

    const enrichedRfqs = rfqs.map(rfq => ({
      ...rfq,
      responses: responsesByRfq[rfq.id] || [],
      response_count: (responsesByRfq[rfq.id] || []).length,
      recipients: recipientsByRfq[rfq.id] || [],
      recipient_count: (recipientsByRfq[rfq.id] || []).length,
      action_needed: ['submitted', 'in_review', 'pending_approval'].includes(rfq.status)
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
      summary: summary,
      filters_applied: {
        status: status || null,
        type: type || null,
        category: category || null,
        date_range: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : null,
        search: search || null,
        sort: sort
      }
    });

  } catch (error) {
    console.error('Admin RFQs error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/rfqs
 * 
 * Admin update RFQ status, approve/reject RFQs
 * 
 * Request body:
 * {
 *   rfq_id: uuid,
 *   action: 'approve' | 'reject' | 'assign_vendor' | 'mark_completed' | 'cancel',
 *   reason?: string (for rejection/cancellation),
 *   assigned_vendor_id?: uuid (for assign_vendor action)
 * }
 */
export async function PATCH(request) {
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

    // Check admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { rfq_id, action, reason, assigned_vendor_id } = await request.json();

    if (!rfq_id || !action) {
      return NextResponse.json(
        { error: 'RFQ ID and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'assign_vendor', 'mark_completed', 'cancel'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Get RFQ
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('*')
      .eq('id', rfq_id)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json(
        { error: 'RFQ not found' },
        { status: 404 }
      );
    }

    let newStatus = rfq.status;
    let updateData = {};

    switch (action) {
      case 'approve':
        // Public RFQs: use approvePublicRFQ to flip recipients + send notifications
        if (rfq.type === 'public') {
          const result = await approvePublicRFQ(rfq_id);
          if (!result.success) {
            return NextResponse.json(
              { error: 'Failed to approve public RFQ' },
              { status: 500 }
            );
          }
          // approvePublicRFQ already updated the RFQ status and triggered notifications
          // Log audit and return
          await supabase
            .from('rfq_admin_audit')
            .insert([{
              action: 'approve',
              resource_type: 'rfq',
              resource_id: rfq_id,
              user_id: user.id,
              details: {
                previous_status: rfq.status,
                new_status: 'approved',
                rfq_type: 'public',
                vendors_notified: result.vendorCount,
                reason: reason || null
              }
            }]).catch(() => {});

          return NextResponse.json({
            success: true,
            message: `Public RFQ approved and sent to ${result.vendorCount} vendor(s)`,
            rfq: { id: rfq_id, status: 'approved', title: rfq.title }
          });
        }
        // Non-public RFQs: simple status update
        newStatus = 'approved';
        updateData = { status: newStatus };
        break;

      case 'reject':
        newStatus = 'cancelled';
        updateData = { status: newStatus, notes: reason || 'Rejected by admin' };
        // Also clean up pending recipients
        await supabase
          .from('rfq_recipients')
          .update({ status: 'cancelled' })
          .eq('rfq_id', rfq_id)
          .eq('status', 'pending_approval');
        break;

      case 'assign_vendor':
        if (!assigned_vendor_id) {
          return NextResponse.json(
            { error: 'assigned_vendor_id is required for assign_vendor action' },
            { status: 400 }
          );
        }
        newStatus = 'assigned';
        updateData = { status: newStatus };
        // Add vendor to recipients
        await supabase
          .from('rfq_recipients')
          .insert([
            {
              rfq_id: rfq_id,
              vendor_id: assigned_vendor_id,
              type: 'direct',
              status: 'sent'
            }
          ]);
        break;

      case 'mark_completed':
        newStatus = 'completed';
        updateData = { status: newStatus };
        break;

      case 'cancel':
        newStatus = 'cancelled';
        updateData = { status: newStatus, notes: reason || 'Cancelled by admin' };
        break;
    }

    // Update RFQ
    const { data: updatedRfq, error: updateError } = await supabase
      .from('rfqs')
      .update(updateData)
      .eq('id', rfq_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update RFQ' },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase
      .from('rfq_admin_audit')
      .insert([
        {
          action: action,
          resource_type: 'rfq',
          resource_id: rfq_id,
          user_id: user.id,
          details: {
            previous_status: rfq.status,
            new_status: newStatus,
            reason: reason || null,
            assigned_vendor_id: assigned_vendor_id || null
          }
        }
      ]);

    return NextResponse.json({
      success: true,
      message: `RFQ ${action}d successfully`,
      rfq: {
        id: updatedRfq.id,
        status: updatedRfq.status,
        title: updatedRfq.title
      }
    });

  } catch (error) {
    console.error('Admin RFQ update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
