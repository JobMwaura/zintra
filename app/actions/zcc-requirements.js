'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================
// REQUIREMENTS CHECKLIST ACTIONS
// ============================================

/**
 * Default checklist templates for common job types.
 */
export const REQUIREMENTS_TEMPLATES = {
  construction: [
    { key: 'id_copy', label: 'Upload copy of National ID', done: false },
    { key: 'safety_cert', label: 'Safety training certificate', done: false },
    { key: 'own_tools', label: 'Confirm you have your own tools', done: false },
    { key: 'medical', label: 'Medical fitness certificate', done: false },
    { key: 'next_of_kin', label: 'Next of kin details', done: false },
  ],
  general: [
    { key: 'id_copy', label: 'Upload copy of National ID', done: false },
    { key: 'confirm_start', label: 'Confirm availability for start date', done: false },
    { key: 'contact_info', label: 'Verified phone number', done: false },
  ],
  skilled_trade: [
    { key: 'id_copy', label: 'Upload copy of National ID', done: false },
    { key: 'trade_cert', label: 'Trade qualification certificate (NITA)', done: false },
    { key: 'safety_cert', label: 'Safety training certificate', done: false },
    { key: 'own_tools', label: 'Confirm you have your own tools', done: false },
    { key: 'references', label: 'Provide 2 professional references', done: false },
    { key: 'medical', label: 'Medical fitness certificate', done: false },
  ],
};

/**
 * Create a requirements checklist for a hired candidate.
 */
export async function createRequirements(employerId, applicationId, { title, checklist, notes } = {}) {
  try {
    const supabase = await createClient();

    const finalChecklist = checklist || REQUIREMENTS_TEMPLATES.general;

    const { data, error } = await supabase.rpc('zcc_create_requirements', {
      p_employer_id: employerId,
      p_application_id: applicationId,
      p_title: title || 'Pre-Work Requirements',
      p_checklist: finalChecklist,
      p_notes: notes || null,
    });

    if (error) {
      console.error('createRequirements RPC error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('createRequirements error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Get requirements for an application (employer or candidate view).
 */
export async function getRequirements(applicationId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('zcc_requirements')
      .select('id, post_id, application_id, requested_by, candidate_id, title, checklist, notes, status, completed_at, created_at, updated_at')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getRequirements error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, requirements: data || [] };
  } catch (err) {
    console.error('getRequirements error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Get all requirements for a candidate (across all their applications).
 */
export async function getCandidateRequirements(candidateId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('zcc_requirements')
      .select(`
        id, post_id, application_id, title, checklist, notes, status, completed_at, created_at, updated_at,
        listings:post_id (title, type)
      `)
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getCandidateRequirements error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, requirements: data || [] };
  } catch (err) {
    console.error('getCandidateRequirements error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Update a checklist item (candidate marks item as done/not done).
 */
export async function updateRequirementItem(requirementsId, itemKey, done) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('zcc_update_requirement_item', {
      p_requirements_id: requirementsId,
      p_item_key: itemKey,
      p_done: done,
    });

    if (error) {
      console.error('updateRequirementItem RPC error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('updateRequirementItem error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

// ============================================
// NOTIFICATION ACTIONS
// ============================================

/**
 * Get notifications for a user (paginated).
 */
export async function getUserNotifications(userId, { limit = 20, offset = 0, unreadOnly = false } = {}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('zcc_notifications')
      .select('id, event_type, channel, title, body, payload, status, created_at, read_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.neq('status', 'read');
    }

    const { data, error } = await query;

    if (error) {
      console.error('getUserNotifications error:', error);
      return { success: false, error: error.message };
    }

    // Also get unread count
    const { count: unreadCount } = await supabase
      .from('zcc_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('status', 'read');

    return { success: true, notifications: data || [], unreadCount: unreadCount || 0 };
  } catch (err) {
    console.error('getUserNotifications error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('zcc_notifications')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('markNotificationRead error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('markNotificationRead error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsRead(userId) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('zcc_notifications')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .neq('status', 'read');

    if (error) {
      console.error('markAllNotificationsRead error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('markAllNotificationsRead error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Create an in-app notification (with optional SMS fallback).
 * Sends SMS if the user has a phone number and the event is high-priority.
 */
export async function sendZCCNotification(userId, eventType, title, body, { payload = {}, sendSMS = false } = {}) {
  try {
    const supabase = await createClient();

    // Insert in-app notification
    const { data, error } = await supabase.rpc('zcc_send_notification', {
      p_user_id: userId,
      p_event_type: eventType,
      p_title: title,
      p_body: body,
      p_payload: payload,
      p_channel: 'in_app',
    });

    if (error) {
      console.error('sendZCCNotification RPC error:', error);
      return { success: false, error: error.message };
    }

    // SMS fallback for high-priority events
    if (sendSMS) {
      try {
        // Get user's phone number
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', userId)
          .single();

        if (profile?.phone) {
          // Dynamic import to avoid loading SMS module in all contexts
          const { sendSMS: sendSMSFn } = await import('@/lib/services/smsService');
          const smsResult = await sendSMSFn(profile.phone, body);

          if (smsResult.success) {
            // Also log the SMS notification
            await supabase.rpc('zcc_send_notification', {
              p_user_id: userId,
              p_event_type: eventType,
              p_title: title,
              p_body: body,
              p_payload: { ...payload, sms_message_id: smsResult.messageId },
              p_channel: 'sms',
            });
          }
        }
      } catch (smsErr) {
        console.error('SMS fallback error (non-blocking):', smsErr);
      }
    }

    return data;
  } catch (err) {
    console.error('sendZCCNotification error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

// ============================================
// SMS NOTIFICATION TRIGGERS FOR ZCC EVENTS
// ============================================

const SMS_EVENTS = {
  shortlisted: (candidateName, jobTitle) =>
    `Hi ${candidateName}! Great news — you've been shortlisted for "${jobTitle}" on Zintra Careers. Login to zintra.co.ke to view details.`,
  offer: (candidateName, jobTitle) =>
    `Congratulations ${candidateName}! You've received a job offer for "${jobTitle}" on Zintra Careers. Login to zintra.co.ke to review and accept.`,
  hired: (candidateName, jobTitle) =>
    `Welcome aboard ${candidateName}! You've been hired for "${jobTitle}" on Zintra Careers. Login to zintra.co.ke for next steps.`,
  verification_approved: (candidateName) =>
    `Hi ${candidateName}, your verification on Zintra Careers has been approved ✓. You're now verified and more visible to employers!`,
  requirements_sent: (candidateName, jobTitle) =>
    `Hi ${candidateName}, your employer has sent pre-work requirements for "${jobTitle}" on Zintra Careers. Login to zintra.co.ke to complete them.`,
};

/**
 * Send a pipeline event notification (shortlisted, offer, hired) with SMS.
 * Called from updateApplicationStatus when status changes.
 */
export async function notifyPipelineEvent(candidateId, eventType, { jobTitle = '', candidateName = '' } = {}) {
  try {
    const titleMap = {
      shortlisted: '⭐ You\'ve been shortlisted!',
      offer: '📋 Job Offer Received',
      hired: '✅ You\'re Hired!',
      interview: '🗓️ Interview Scheduled',
      rejected: 'Application Update',
    };

    const bodyMap = {
      shortlisted: `You've been shortlisted for "${jobTitle}". The employer wants to move forward!`,
      offer: `You've received a job offer for "${jobTitle}". Review the details and accept.`,
      hired: `Congratulations! You've been hired for "${jobTitle}". Check your requirements checklist.`,
      interview: `An interview has been scheduled for "${jobTitle}". Check the details.`,
      rejected: `Your application for "${jobTitle}" has been updated. Thank you for applying.`,
    };

    const highPriorityEvents = ['shortlisted', 'offer', 'hired'];
    const shouldSendSMS = highPriorityEvents.includes(eventType);

    // Get candidate name if not provided
    if (!candidateName && shouldSendSMS) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', candidateId)
        .single();
      candidateName = profile?.full_name || 'there';
    }

    return await sendZCCNotification(
      candidateId,
      eventType,
      titleMap[eventType] || 'Application Update',
      bodyMap[eventType] || `Your application for "${jobTitle}" has been updated.`,
      {
        payload: { job_title: jobTitle, event: eventType },
        sendSMS: shouldSendSMS,
      }
    );
  } catch (err) {
    console.error('notifyPipelineEvent error:', err);
    return { success: false, error: 'Notification failed' };
  }
}
