/**
 * Vendor Matching Utilities
 * Functions for auto-matching and selecting vendors for RFQs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Auto-match vendors for a Wizard RFQ
 * Matches vendors by category and ranks by rating/response_rate
 * 
 * @param {string} rfqId - RFQ ID to match vendors for
 * @param {string} categorySlug - Category slug for matching
 * @param {string} county - County for location-based matching (optional)
 * @returns {Promise<Array>} - Array of matched vendors
 */
export async function autoMatchVendors(rfqId, categorySlug, county) {
  try {
    console.log('[AUTO-MATCH] Starting vendor matching:', { rfqId, categorySlug, county });

    // Query vendors by category
    const { data: candidates, error } = await supabase
      .from('vendors')
      .select('id, name, primary_category, secondary_categories, rating, verified_docs, response_rate, county, subscription_active, avatar_url')
      .or(
        `primary_category.eq.${categorySlug},` +
        `secondary_categories.contains.[${categorySlug}]`
      )
      .eq('subscription_active', true)
      .order('rating', { ascending: false })
      .order('response_rate', { ascending: false })
      .limit(5); // Top 5-10 vendors

    if (error) {
      console.error('[AUTO-MATCH] Query error:', error);
      return [];
    }

    // Filter by county if provided
    let matched = candidates || [];
    if (county) {
      matched = matched.filter(v => v.county === county);
    }

    console.log('[AUTO-MATCH] Found', matched.length, 'matching vendors');

    // Create recipient records
    if (matched.length > 0) {
      const recipientRecords = matched.map(vendor => ({
        rfq_id: rfqId,
        vendor_id: vendor.id,
        recipient_type: 'wizard',
        status: 'sent'
      }));

      const { error: insertError } = await supabase
        .from('rfq_recipients')
        .insert(recipientRecords);

      if (insertError) {
        console.error('[AUTO-MATCH] Insert error:', insertError);
        return [];
      }

      console.log('[AUTO-MATCH] Added', matched.length, 'vendors to rfq_recipients');
    }

    return matched;

  } catch (err) {
    console.error('[AUTO-MATCH] Error:', err);
    return [];
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

    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('id, name, primary_category, secondary_categories, rating, verified_docs, subscription_active, avatar_url')
      .or(
        `primary_category.eq.${categorySlug},` +
        `secondary_categories.contains.[${categorySlug}]`
      )
      .eq('subscription_active', true)
      .order('rating', { ascending: false })
      .order('verified_docs', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[TOP-VENDORS] Query error:', error);
      return [];
    }

    const result = vendors || [];
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
 * @returns {Promise<boolean>} - Success/failure
 */
export async function createPublicRFQRecipients(rfqId, categorySlug, county) {
  try {
    console.log('[PUBLIC-RFQ] Creating recipients for public RFQ:', { rfqId, categorySlug, county });

    // Get top vendors
    const topVendors = await getTopVendorsForCategory(categorySlug, county, 20);

    if (topVendors.length === 0) {
      console.warn('[PUBLIC-RFQ] No vendors found for category:', categorySlug);
      return false;
    }

    // Create recipient records
    const recipientRecords = topVendors.map(vendor => ({
      rfq_id: rfqId,
      vendor_id: vendor.id,
      recipient_type: 'public',
      status: 'sent'
    }));

    const { error: insertError } = await supabase
      .from('rfq_recipients')
      .insert(recipientRecords);

    if (insertError) {
      console.error('[PUBLIC-RFQ] Insert error:', insertError);
      return false;
    }

    console.log('[PUBLIC-RFQ] Created', topVendors.length, 'recipient records');
    return true;

  } catch (err) {
    console.error('[PUBLIC-RFQ] Error:', err);
    return false;
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

    // Send notifications to each vendor (async - we're not waiting)
    // This would integrate with your notification service
    // For now, just log
    console.log('[NOTIFICATIONS] Would send notifications to', recipients.length, 'vendors');
    console.log('[NOTIFICATIONS] RFQ:', { rfqId, title: rfqTitle, type: rfqType });

    // TODO: Integrate with actual notification service:
    // - Send in-app notifications
    // - Send email notifications
    // - Send SMS notifications (optional)

  } catch (err) {
    console.error('[NOTIFICATIONS] Error:', err);
    // Don't throw - notifications are non-critical
  }
}

export default {
  autoMatchVendors,
  getTopVendorsForCategory,
  createPublicRFQRecipients,
  triggerNotifications
};
