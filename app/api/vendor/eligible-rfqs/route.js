'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import {
  getVendorCategoryDisplayName,
  getVendorCategorySlugs,
  normalizeRfqRecord,
  rfqMatchesVendorCategory,
} from '@/lib/rfqUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function loadVendorProfile(userId) {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return { data, error };
}

async function loadRecipientRows(vendorId) {
  const preferredSelects = [
    'rfq_id, recipient_type, status',
    'rfq_id, recipient_type',
    '*',
  ];

  for (const selectClause of preferredSelects) {
    const { data, error } = await supabase
      .from('rfq_recipients')
      .select(selectClause)
      .eq('vendor_id', vendorId);

    if (!error) {
      return { data: data || [], error: null };
    }

    if (!['42703', 'PGRST204'].includes(error.code)) {
      return { data: [], error };
    }
  }

  return { data: [], error: null };
}

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
    const { data: vendorProfile, error: vendorProfileError } = await loadVendorProfile(user.id);

    if (vendorProfileError || !vendorProfile) {
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
    const allowedStatuses = ['assigned', 'in_review', 'submitted', 'approved', 'open', 'active'];

    const { data: recipientRows, error: recipientError } = await loadRecipientRows(vendorProfile.id);

    if (recipientError) {
      console.error('Error loading RFQ recipients for vendor:', recipientError);
    }

    const recipientsByRfq = new Map(
      (recipientRows || []).map((recipient) => [recipient.rfq_id, recipient])
    );

    // Build query - query rfqs table directly instead of incomplete view
    let query = supabase
      .from('rfqs')
      .select('*');

    // Filter by location
    if (location) {
      query = query.eq('location', location);
    }

    // Filter by urgency
    if (urgency && ['low', 'normal', 'high', 'critical'].includes(urgency)) {
      query = query.eq('urgency', urgency);
    }

    // Filter by status
    if (status && allowedStatuses.includes(status)) {
      query = query.eq('status', status);
    }

    // Apply sorting
    switch (sort) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'urgent':
        query = query.order('urgency', { ascending: false }).order('created_at', { ascending: false });
        break;
      case 'budget':
        query = query.order('budget_max', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data: rfqs, error: rfqError } = await query;

    if (rfqError) {
      console.error('Error fetching eligible RFQs:', rfqError);
      return NextResponse.json(
        { error: 'Failed to fetch RFQs' },
        { status: 500 }
      );
    }

    const now = new Date();
    const hasVendorCategories = getVendorCategorySlugs(vendorProfile).length > 0;
    const normalizedRfqs = (rfqs || [])
      .map(normalizeRfqRecord)
      .filter((rfq) => {
        const recipient = recipientsByRfq.get(rfq.id);
        const recipientStatus = recipient?.status || null;
        const recipientVisible = !recipientStatus || !['pending_approval', 'cancelled'].includes(recipientStatus);
        const isDirectAssignment = ['direct', 'vendor-request'].includes(rfq.type);
        const assignedVendorMatch = !rfq.assigned_vendor_id || rfq.assigned_vendor_id === vendorProfile.id;

        if (rfq.expires_at) {
          const expiresAt = new Date(rfq.expires_at);
          if (!Number.isNaN(expiresAt.getTime()) && expiresAt <= now) {
            return false;
          }
        }

        if (recipient && recipientVisible) {
          return true;
        }

        if (recipient && !recipientVisible) {
          return false;
        }

        if (isDirectAssignment) {
          return assignedVendorMatch && Boolean(rfq.assigned_vendor_id === vendorProfile.id);
        }

        if (rfq.assigned_vendor_id && rfq.assigned_vendor_id !== vendorProfile.id) {
          return false;
        }

        if (!allowedStatuses.includes(rfq.status)) {
          return false;
        }

        if (category) {
          return rfqMatchesVendorCategory(rfq, category);
        }

        if (hasVendorCategories) {
          return rfqMatchesVendorCategory(rfq, vendorProfile);
        }

        return true;
      });

    const total = normalizedRfqs.length;
    const paginatedRfqs = normalizedRfqs.slice(offset, offset + limit);

    // Enhance RFQ data with vendor's existing responses
    const rfqIds = paginatedRfqs.map((rfq) => rfq.id);
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
    const enrichedRfqs = paginatedRfqs.map((rfq) => ({
      ...rfq,
      recipient_assignment: recipientsByRfq.get(rfq.id) || null,
      vendor_response: vendorResponses[rfq.id] || null,
      can_respond: !vendorResponses[rfq.id], // Can only respond if no existing response
      days_until_expiry: rfq.expires_at
        ? Math.ceil((new Date(rfq.expires_at) - now) / (1000 * 60 * 60 * 24))
        : null,
    }));

    return NextResponse.json({
      success: true,
      rfqs: enrichedRfqs,
      pagination: {
        total,
        page: page,
        limit: limit,
        has_more: offset + limit < total
      },
      filters_applied: {
        category: category || getVendorCategoryDisplayName(vendorProfile) || null,
        location: location || null,
        urgency: urgency || null,
        status: status || 'all_eligible',
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
