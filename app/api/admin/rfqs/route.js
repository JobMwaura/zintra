'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { hasActiveAdminAccess } from '@/lib/adminAccess';
import { normalizeRfqRecord } from '@/lib/rfqUtils';
import { adminManualMatch, approvePublicRFQ } from '@/lib/vendorMatching';
import {
  insertAdminAudit,
  insertRfqRecipients,
  isMissingColumnError,
} from '@/lib/rfqPersistence';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateRfqRecord(rfqId, fields) {
  const optionalFields = ['notes', 'published_at', 'visibility'];
  const payload = { ...fields };

  for (;;) {
    const { data, error } = await supabase
      .from('rfqs')
      .update(payload)
      .eq('id', rfqId)
      .select()
      .single();

    if (!error) {
      return { data, error: null };
    }

    const removableField = optionalFields.find((field) => isMissingColumnError(error, field));
    if (!removableField) {
      return { data: null, error };
    }

    delete payload[removableField];
  }
}

function formatActionMessage(action) {
  switch (action) {
    case 'approve':
      return 'RFQ approved successfully';
    case 'reject':
      return 'RFQ rejected successfully';
    case 'assign_vendor':
      return 'Vendor assigned successfully';
    case 'manual_match':
      return 'Vendors matched successfully';
    case 'mark_completed':
      return 'RFQ marked as completed';
    case 'cancel':
      return 'RFQ cancelled successfully';
    default:
      return 'RFQ updated successfully';
  }
}

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

    const { isAdmin } = await hasActiveAdminAccess(supabase, user.id);

    if (!isAdmin) {
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
      .from('rfqs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && ['submitted', 'pending_approval', 'needs_admin_review', 'approved', 'in_review', 'assigned', 'completed', 'cancelled', 'expired', 'unsuccessful'].includes(status)) {
      query = query.eq('status', status);
    }

    if (type && ['direct', 'wizard', 'matched', 'public', 'vendor-request'].includes(type)) {
      query = query.eq('type', type);
    }

    if (category) {
      query = query.or(`category.eq.${category},category_slug.eq.${category}`);
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
        query = query.order('budget_max', { ascending: false, nullsFirst: false });
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
      .select('id, status');

    let summary = {
      total_pending: 0,
      total_approved: 0,
      total_pending_approval: 0,
      total_needs_admin_review: 0,
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
      summary.total_needs_admin_review = summaryData.filter(r => r.status === 'needs_admin_review').length;
      summary.total_wizard = summaryData.filter(r => ['wizard', 'matched'].includes(r.type)).length;
      summary.total_public = summaryData.filter(r => r.type === 'public').length;
      summary.total_direct = summaryData.filter(r => ['direct', 'vendor-request'].includes(r.type)).length;
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
    const normalizedRfqs = (rfqs || []).map(normalizeRfqRecord);
    const rfqIds = normalizedRfqs.map((rfq) => rfq.id);
    let responsesByRfq = {};
    let recipientsByRfq = {};

    if (rfqIds.length > 0) {
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

      const { data: recipients, error: recipientError } = await supabase
        .from('rfq_recipients')
        .select('*')
        .in('rfq_id', rfqIds);

      if (!recipientError && recipients) {
        const vendorIds = [...new Set(recipients.map((recipient) => recipient.vendor_id).filter(Boolean))];
        let vendorsById = {};

        if (vendorIds.length > 0) {
          const { data: vendors } = await supabase
            .from('vendors')
            .select('id, company_name, name, county, rating, primary_category_slug, category')
            .in('id', vendorIds);

          (vendors || []).forEach((vendor) => {
            vendorsById[vendor.id] = vendor;
          });
        }

        recipients.forEach((recipient) => {
          if (!recipientsByRfq[recipient.rfq_id]) {
            recipientsByRfq[recipient.rfq_id] = [];
          }

          const vendor = vendorsById[recipient.vendor_id] || {};
          recipientsByRfq[recipient.rfq_id].push({
            vendor_id: recipient.vendor_id,
            vendor_name: vendor.company_name || vendor.name || 'Unknown vendor',
            vendor_county: vendor.county || '',
            vendor_rating: vendor.rating || 0,
            vendor_category: vendor.primary_category_slug || vendor.category || '',
            recipient_type: recipient.recipient_type || recipient.type || 'direct',
            status: recipient.status || 'sent',
            match_score: recipient.match_score || null,
            match_reasons: recipient.match_reasons || null,
            sent_at: recipient.created_at || null,
          });
        });
      }
    }

    const enrichedRfqs = normalizedRfqs.map((rfq) => ({
      ...rfq,
      responses: responsesByRfq[rfq.id] || [],
      response_count: (responsesByRfq[rfq.id] || []).length,
      recipients: recipientsByRfq[rfq.id] || [],
      recipient_count: (recipientsByRfq[rfq.id] || []).length,
      action_needed: ['submitted', 'in_review', 'pending_approval', 'needs_admin_review'].includes(rfq.status)
    }));

    return NextResponse.json({
      success: true,
      rfqs: enrichedRfqs,
      pagination: {
        total: count || enrichedRfqs.length,
        page: page,
        limit: limit,
        has_more: offset + limit < (count || enrichedRfqs.length)
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

    const { isAdmin } = await hasActiveAdminAccess(supabase, user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { rfq_id, action, reason, assigned_vendor_id, vendor_ids } = await request.json();

    if (!rfq_id || !action) {
      return NextResponse.json(
        { error: 'RFQ ID and action are required' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'assign_vendor', 'manual_match', 'mark_completed', 'cancel'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    if (action === 'manual_match') {
      if (!Array.isArray(vendor_ids) || vendor_ids.length === 0) {
        return NextResponse.json(
          { error: 'vendor_ids array is required for manual_match action' },
          { status: 400 }
        );
      }

      const result = await adminManualMatch(rfq_id, vendor_ids);
      await insertAdminAudit(supabase, [{
        action: 'manual_match',
        resource_type: 'rfq',
        resource_id: rfq_id,
        user_id: user.id,
        details: {
          previous_status: 'needs_admin_review',
          new_status: 'submitted',
          vendor_ids,
          vendor_count: result.vendorCount,
          reason: reason || 'Admin manually matched vendors',
        }
      }]);

      if (!result.success) {
        return NextResponse.json(
          { error: result.message || 'Failed to manually match vendors' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        vendorCount: result.vendorCount,
        rfq: { id: rfq_id, status: 'submitted' }
      });
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
        if (rfq.type === 'public') {
          const result = await approvePublicRFQ(rfq_id);

          if (!result.success) {
            return NextResponse.json(
              { error: result.message || 'Failed to approve public RFQ' },
              { status: 500 }
            );
          }

          await insertAdminAudit(supabase, [{
            action: 'approve',
            resource_type: 'rfq',
            resource_id: rfq_id,
            user_id: user.id,
            details: {
              previous_status: rfq.status,
              new_status: 'approved',
              rfq_type: 'public',
              vendors_notified: result.vendorCount,
              reason: reason || null,
            }
          }]);

          return NextResponse.json({
            success: true,
            message: `Public RFQ approved and sent to ${result.vendorCount} vendor(s)`,
            rfq: {
              id: rfq_id,
              status: 'approved',
              title: rfq.title,
            }
          });
        }

        newStatus = 'approved';
        updateData = { status: newStatus };
        break;

      case 'reject':
        newStatus = 'cancelled';
        updateData = { status: newStatus, notes: reason || 'Rejected by admin' };
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
        {
          const { error: recipientError } = await insertRfqRecipients(supabase, [{
            rfq_id: rfq_id,
            vendor_id: assigned_vendor_id,
            recipient_type: 'direct',
            status: 'sent'
          }]);

          if (recipientError) {
            return NextResponse.json(
              { error: 'Failed to assign vendor to RFQ' },
              { status: 500 }
            );
          }
        }
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
    const { data: updatedRfq, error: updateError } = await updateRfqRecord(rfq_id, updateData);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update RFQ' },
        { status: 500 }
      );
    }

    await insertAdminAudit(supabase, [{
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
    }]);

    return NextResponse.json({
      success: true,
      message: formatActionMessage(action),
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
