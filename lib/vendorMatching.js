/**
 * Vendor Matching Utilities
 * Functions for auto-matching and selecting vendors for RFQs
 */

import { createClient } from '@supabase/supabase-js';
import { isMissingColumnError, insertRfqRecipients, insertRfqRequests } from '@/lib/rfqPersistence';
import { rfqMatchesVendorCategory } from '@/lib/rfqUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeCounty(value) {
  return String(value || '').trim().toLowerCase();
}

function vendorServesCounty(vendor, county) {
  if (!county) {
    return true;
  }

  const rfqCounty = normalizeCounty(county);
  const vendorCounty = normalizeCounty(vendor?.county);
  const serviceCounties = toArray(vendor?.service_counties).map(normalizeCounty);

  return vendorCounty === rfqCounty || serviceCounties.includes(rfqCounty);
}

function vendorMatchScore(vendor, county) {
  let score = 0;

  if (vendorServesCounty(vendor, county)) {
    score += 25;
  }

  if (vendor?.verified || vendor?.verified_docs) {
    score += 20;
  }

  score += Math.min(20, Number(vendor?.rating || 0) * 4);

  const responseTime = Number(vendor?.response_time || 0);
  if (responseTime > 0) {
    score += Math.max(0, 10 - Math.min(10, responseTime / 4));
  }

  score += Math.min(15, Number(vendor?.rfqs_completed || 0));
  score += Math.min(10, Number(vendor?.response_rate || 0) / 10);

  return score;
}

async function getRfqRecord(rfqId) {
  const { data, error } = await supabase
    .from('rfqs')
    .select('id, title, user_id, description, category, category_slug, county')
    .eq('id', rfqId)
    .maybeSingle();

  if (error) {
    console.error('[RFQ MATCH] Failed to load RFQ:', error);
    return null;
  }

  return data || null;
}

async function getCandidateVendors(categorySlug) {
  const { data, error } = await supabase
    .from('vendors')
    .select('id, user_id, company_name, name, primary_category_slug, primary_category, category, secondary_categories, rating, verified, verified_docs, response_time, response_rate, county, service_counties, status, subscription_active, rfqs_completed');

  if (error) {
    throw error;
  }

  return (data || []).filter((vendor) => {
    const vendorStatus = String(vendor?.status || '').toLowerCase();
    if (vendorStatus && !['active', 'approved'].includes(vendorStatus)) {
      return false;
    }

    if (vendor?.subscription_active === false) {
      return false;
    }

    return rfqMatchesVendorCategory({ category_slug: categorySlug, category: categorySlug }, vendor);
  });
}

async function notifyRecipientUsers(rfqId, rfqTitle, vendorIds) {
  if (!vendorIds.length) {
    return;
  }

  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('id, user_id')
    .in('id', vendorIds);

  if (vendorError) {
    console.error('[RFQ MATCH] Failed to load vendor notification targets:', vendorError);
    return;
  }

  const notifications = (vendors || [])
    .filter((vendor) => vendor.user_id)
    .map((vendor) => ({
      user_id: vendor.user_id,
      type: 'rfq_match',
      title: `New RFQ: ${rfqTitle}`,
      body: 'A new RFQ matching your services is ready for review.',
      metadata: {
        rfq_id: rfqId,
      },
    }));

  if (notifications.length === 0) {
    return;
  }

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) {
    console.error('[RFQ MATCH] Failed to create notifications:', error);
  }
}

async function createBackwardCompatibleRequests(rfqId, vendorIds, rfq) {
  if (!vendorIds.length || !rfq) {
    return;
  }

  const requestRecords = vendorIds.map((vendorId) => ({
    rfq_id: rfqId,
    vendor_id: vendorId,
    user_id: rfq.user_id || null,
    project_title: rfq.title || 'Untitled RFQ',
    project_description: rfq.description || '',
    status: 'pending',
  }));

  const { error } = await insertRfqRequests(supabase, requestRecords);
  if (error) {
    console.error('[RFQ MATCH] Failed to create rfq_requests compatibility rows:', error);
  }
}

/**
 * Auto-match vendors for a Wizard RFQ
 * Matches vendors by category and ranks by rating/response_rate
 * 
 * @param {string} rfqId - RFQ ID to match vendors for
 * @param {string} categorySlug - Category slug for matching
 * @param {string} county - County for location-based matching (optional)
 * @returns {Promise<object>} - Match result
 */
export async function autoMatchVendors(rfqId, categorySlug, county) {
  try {
    console.log('[AUTO-MATCH] Starting vendor matching:', { rfqId, categorySlug, county });

    const candidates = await getCandidateVendors(categorySlug);
    let matched = candidates.filter((vendor) => vendorServesCounty(vendor, county));

    if (matched.length === 0) {
      matched = candidates;
    }

    matched = matched
      .sort((left, right) => vendorMatchScore(right, county) - vendorMatchScore(left, county))
      .slice(0, 5);

    if (matched.length === 0) {
      return {
        success: true,
        vendors: [],
        vendorCount: 0,
        needsAdminReview: true,
      };
    }

    const recipientRecords = matched.map((vendor) => ({
      rfq_id: rfqId,
      vendor_id: vendor.id,
      recipient_type: 'wizard',
      status: 'sent',
    }));

    const { error: insertError } = await insertRfqRecipients(supabase, recipientRecords);
    if (insertError) {
      console.error('[AUTO-MATCH] Insert error:', insertError);
      return {
        success: false,
        vendors: [],
        vendorCount: 0,
        needsAdminReview: true,
        message: insertError.message,
      };
    }

    const rfq = await getRfqRecord(rfqId);
    await createBackwardCompatibleRequests(rfqId, matched.map((vendor) => vendor.id), rfq);

    return {
      success: true,
      vendors: matched,
      vendorCount: matched.length,
      needsAdminReview: false,
    };

  } catch (err) {
    console.error('[AUTO-MATCH] Error:', err);
    return {
      success: false,
      vendors: [],
      vendorCount: 0,
      needsAdminReview: true,
      message: err.message,
    };
  }
}

/**
 * Get top vendors for a category (for Public RFQ)
 * Returns the highest-rated vendors to notify
 * 
 * @param {string} categorySlug - Category slug for matching
 * @param {string} county - County for location-based filtering (optional)
 * @param {number} limit - Number of vendors to return (default 20)
 * @returns {Promise<Array>} - Array of top vendors
 */
export async function getTopVendorsForCategory(categorySlug, county, limit = 20) {
  try {
    console.log('[TOP-VENDORS] Fetching top vendors:', { categorySlug, county, limit });

    const vendors = await getCandidateVendors(categorySlug);
    let result = vendors.filter((vendor) => vendorServesCounty(vendor, county));
    if (result.length === 0) {
      result = vendors;
    }

    result = result
      .sort((left, right) => vendorMatchScore(right, county) - vendorMatchScore(left, county))
      .slice(0, limit);

    console.log('[TOP-VENDORS] Found', result.length, 'top vendors');
    return result;

  } catch (err) {
    console.error('[TOP-VENDORS] Error:', err);
    return [];
  }
}

/**
 * Create recipient records for Public RFQ
 * Notifies top vendors about the public RFQ
 * 
 * @param {string} rfqId - RFQ ID
 * @param {string} categorySlug - Category for vendor matching
 * @param {string} county - County for location filtering
 * @returns {Promise<object>} - Result summary
 */
export async function createPublicRFQRecipients(rfqId, categorySlug, county, shouldNotify = true) {
  try {
    console.log('[PUBLIC-RFQ] Creating recipients for public RFQ:', { rfqId, categorySlug, county });

    // Get top vendors
    const topVendors = await getTopVendorsForCategory(categorySlug, county, 20);

    if (topVendors.length === 0) {
      console.warn('[PUBLIC-RFQ] No vendors found for category:', categorySlug);
      return { success: false, vendorCount: 0, vendors: [] };
    }

    const recipientStatus = shouldNotify ? 'sent' : 'pending_approval';
    const recipientRecords = topVendors.map(vendor => ({
      rfq_id: rfqId,
      vendor_id: vendor.id,
      recipient_type: 'public',
      status: recipientStatus,
    }));

    const { error: insertError } = await insertRfqRecipients(supabase, recipientRecords);

    if (insertError) {
      console.error('[PUBLIC-RFQ] Insert error:', insertError);
      return { success: false, vendorCount: 0, vendors: [] };
    }

    if (shouldNotify) {
      const rfq = await getRfqRecord(rfqId);
      await notifyRecipientUsers(rfqId, rfq?.title || 'New RFQ', topVendors.map((vendor) => vendor.id));
    }

    console.log('[PUBLIC-RFQ] Created', topVendors.length, 'recipient records');
    return { success: true, vendorCount: topVendors.length, vendors: topVendors };

  } catch (err) {
    console.error('[PUBLIC-RFQ] Error:', err);
    return { success: false, vendorCount: 0, vendors: [] };
  }
}

export async function approvePublicRFQ(rfqId) {
  try {
    const rfq = await getRfqRecord(rfqId);
    if (!rfq) {
      return { success: false, message: 'RFQ not found', vendorCount: 0 };
    }

    let { data: recipients, error: recipientsError } = await supabase
      .from('rfq_recipients')
      .select('vendor_id, status')
      .eq('rfq_id', rfqId);

    if (recipientsError) {
      console.error('[PUBLIC-RFQ] Failed to load recipients before approval:', recipientsError);
      recipients = [];
    }

    if (!recipients || recipients.length === 0) {
      const created = await createPublicRFQRecipients(rfqId, rfq.category_slug || rfq.category, rfq.county, false);
      if (!created.success) {
        return { success: false, message: 'No vendors matched this public RFQ', vendorCount: 0 };
      }

      const reloaded = await supabase
        .from('rfq_recipients')
        .select('vendor_id, status')
        .eq('rfq_id', rfqId);
      recipients = reloaded.data || [];
    }

    const { error: recipientUpdateError } = await supabase
      .from('rfq_recipients')
      .update({ status: 'sent' })
      .eq('rfq_id', rfqId);

    if (recipientUpdateError && !isMissingColumnError(recipientUpdateError, 'status')) {
      console.error('[PUBLIC-RFQ] Failed to activate recipients:', recipientUpdateError);
      return { success: false, message: 'Failed to activate RFQ recipients', vendorCount: 0 };
    }

    const { error: updateError } = await supabase
      .from('rfqs')
      .update({
        status: 'approved',
        visibility: 'public',
        published_at: new Date().toISOString(),
      })
      .eq('id', rfqId);

    if (updateError) {
      console.error('[PUBLIC-RFQ] Failed to update RFQ approval state:', updateError);
      return { success: false, message: 'Failed to approve public RFQ', vendorCount: 0 };
    }

    const vendorIds = [...new Set((recipients || []).map((recipient) => recipient.vendor_id).filter(Boolean))];
    await notifyRecipientUsers(rfqId, rfq.title || 'New RFQ', vendorIds);

    return { success: true, vendorCount: vendorIds.length };
  } catch (error) {
    console.error('[PUBLIC-RFQ] Approval error:', error);
    return { success: false, message: error.message, vendorCount: 0 };
  }
}

export async function adminManualMatch(rfqId, vendorIds) {
  try {
    const uniqueVendorIds = [...new Set((vendorIds || []).filter(Boolean))];
    if (uniqueVendorIds.length === 0) {
      return { success: false, message: 'No vendors selected', vendorCount: 0 };
    }

    const recipientRecords = uniqueVendorIds.map((vendorId) => ({
      rfq_id: rfqId,
      vendor_id: vendorId,
      recipient_type: 'manual_match',
      status: 'sent',
    }));

    const { error: recipientError } = await insertRfqRecipients(supabase, recipientRecords);
    if (recipientError) {
      console.error('[RFQ MATCH] Manual match insert error:', recipientError);
      return { success: false, message: 'Failed to save manual vendor matches', vendorCount: 0 };
    }

    const rfq = await getRfqRecord(rfqId);
    await createBackwardCompatibleRequests(rfqId, uniqueVendorIds, rfq);

    const { error: updateError } = await supabase
      .from('rfqs')
      .update({ status: 'submitted' })
      .eq('id', rfqId);

    if (updateError) {
      console.error('[RFQ MATCH] Manual match RFQ update error:', updateError);
      return { success: false, message: 'Failed to update RFQ after manual matching', vendorCount: 0 };
    }

    await notifyRecipientUsers(rfqId, rfq?.title || 'New RFQ', uniqueVendorIds);

    return {
      success: true,
      message: `Matched ${uniqueVendorIds.length} vendor${uniqueVendorIds.length === 1 ? '' : 's'} to this RFQ.`,
      vendorCount: uniqueVendorIds.length,
    };
  } catch (error) {
    console.error('[RFQ MATCH] Manual match error:', error);
    return { success: false, message: error.message, vendorCount: 0 };
  }
}

/**
 * Trigger notifications (async, non-blocking)
 * Sends notifications to vendors and user
 * 
 * @param {string} rfqId - RFQ ID
 * @param {string} rfqType - Type of RFQ
 * @param {string} userId - User ID who created RFQ
 * @param {string} rfqTitle - RFQ title for notification
 */
export async function triggerNotifications(rfqId, rfqType, userId, rfqTitle) {
  try {
    console.log('[NOTIFICATIONS] Triggering notifications:', { rfqId, rfqType, userId });

    // Get all recipients for this RFQ
    const { data: recipients, error: recipientsError } = await supabase
      .from('rfq_recipients')
      .select('vendor_id')
      .eq('rfq_id', rfqId);

    if (recipientsError) {
      console.error('[NOTIFICATIONS] Error fetching recipients:', recipientsError);
      return;
    }

    if (!recipients || recipients.length === 0) {
      console.log('[NOTIFICATIONS] No recipients to notify');
      return;
    }

    const vendorIds = [...new Set(recipients.map((recipient) => recipient.vendor_id).filter(Boolean))];
    await notifyRecipientUsers(rfqId, rfqTitle, vendorIds);

  } catch (err) {
    console.error('[NOTIFICATIONS] Error:', err);
    // Don't throw - notifications are non-critical
  }
}

export default {
  autoMatchVendors,
  getTopVendorsForCategory,
  createPublicRFQRecipients,
  approvePublicRFQ,
  adminManualMatch,
  triggerNotifications
};
