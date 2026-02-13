'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/negotiations/report — Report/flag a negotiation for admin review
 * Body: { negotiationId, reportedBy, reason, details? }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { negotiationId, reportedBy, reason, details } = body;

    if (!negotiationId || !reportedBy || !reason) {
      return NextResponse.json(
        { error: 'Missing required: negotiationId, reportedBy, reason' },
        { status: 400 }
      );
    }

    // Verify the negotiation exists and user is a participant
    const { data: thread, error: threadError } = await supabase
      .from('negotiation_threads')
      .select('id, user_id, vendor_id, rfq_id, rfq_quote_id, status')
      .eq('id', negotiationId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 });
    }

    if (reportedBy !== thread.user_id && reportedBy !== thread.vendor_id) {
      return NextResponse.json({ error: 'Only participants can report a negotiation' }, { status: 403 });
    }

    const isFromBuyer = reportedBy === thread.user_id;
    const reportedUserId = isFromBuyer ? thread.vendor_id : thread.user_id;

    // Store the report in negotiation metadata (update thread)
    const existingMetadata = thread.metadata || {};
    const reports = existingMetadata.reports || [];
    reports.push({
      reported_by: reportedBy,
      reported_user: reportedUserId,
      reason,
      details: details || null,
      created_at: new Date().toISOString()
    });

    await supabase
      .from('negotiation_threads')
      .update({
        metadata: { ...existingMetadata, reports, flagged: true },
        updated_at: new Date().toISOString()
      })
      .eq('id', negotiationId);

    // Notify all admins
    const { data: admins } = await supabase
      .from('admin_users')
      .select('id');

    if (admins && admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'admin_negotiation_report',
        title: '🚩 Negotiation Reported',
        body: `A ${isFromBuyer ? 'buyer' : 'vendor'} reported a negotiation. Reason: ${reason}${details ? `. Details: ${details}` : ''}`,
        metadata: {
          negotiation_id: negotiationId,
          rfq_id: thread.rfq_id,
          reported_by: reportedBy,
          reported_user: reportedUserId,
          reason,
          details
        },
        related_id: negotiationId,
        related_type: 'negotiation'
      }));
      await supabase.from('notifications').insert(adminNotifications);
    }

    // Notify the reported user (optional warning)
    await supabase.from('notifications').insert({
      user_id: reportedUserId,
      type: 'negotiation_warning',
      title: 'Negotiation Activity Flagged',
      body: 'Activity in one of your negotiations has been flagged for review. Please ensure you follow platform guidelines.',
      metadata: { negotiation_id: negotiationId },
      related_id: negotiationId,
      related_type: 'negotiation'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Report submitted. Our team will review this.' 
    });

  } catch (error) {
    console.error('Report negotiation error:', error);
    return NextResponse.json(
      { error: 'Failed to submit report', details: error.message },
      { status: 500 }
    );
  }
}
