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
 * Creates in-app notifications for vendors AND the user who submitted
 * Also sends email notifications to vendors
 * 
 * @param {string} rfqId - RFQ ID
 * @param {string} rfqType - Type of RFQ
 * @param {string} userId - User ID who created RFQ
 * @param {string} rfqTitle - RFQ title for notification
 */
export async function triggerNotifications(rfqId, rfqType, userId, rfqTitle) {
  try {
    console.log('[NOTIFICATIONS] Triggering notifications:', { rfqId, rfqType, userId });

    // =========================================================================
    // 1. Get all recipients for this RFQ
    // =========================================================================
    const { data: recipients, error: recipientsError } = await supabase
      .from('rfq_recipients')
      .select('vendor_id')
      .eq('rfq_id', rfqId);

    if (recipientsError) {
      console.error('[NOTIFICATIONS] Error fetching recipients:', recipientsError);
    }

    const vendorIds = (recipients || []).map(r => r.vendor_id).filter(Boolean);
    console.log('[NOTIFICATIONS] Found', vendorIds.length, 'vendor recipients');

    // =========================================================================
    // 2. Get vendor details for email notifications
    // =========================================================================
    let vendorDetails = [];
    if (vendorIds.length > 0) {
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, company_name, email, user_id')
        .in('id', vendorIds);

      if (vendorError) {
        console.error('[NOTIFICATIONS] Error fetching vendor details:', vendorError);
      } else {
        vendorDetails = vendors || [];
      }
    }

    // =========================================================================
    // 3. Get the submitter's name for notification text
    // =========================================================================
    let requesterName = 'A user';
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', userId)
        .single();
      if (userData) {
        requesterName = userData.full_name || userData.email?.split('@')[0] || 'A user';
      }
    } catch (e) {
      console.warn('[NOTIFICATIONS] Could not fetch requester name');
    }

    // =========================================================================
    // 4. Create IN-APP notifications for each vendor (user_id from vendors table)
    // =========================================================================
    if (vendorDetails.length > 0) {
      const vendorNotifications = vendorDetails
        .filter(v => v.user_id) // Only vendors with a user_id
        .map(v => ({
          user_id: v.user_id,
          type: 'rfq_received',
          title: 'New RFQ Received',
          body: `${requesterName} sent you a request for quote: "${rfqTitle}"`,
          metadata: {
            rfq_id: rfqId,
            rfq_type: rfqType,
            vendor_id: v.id,
            requester_id: userId,
          },
          related_id: rfqId,
          related_type: 'rfq',
        }));

      if (vendorNotifications.length > 0) {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert(vendorNotifications);

        if (insertError) {
          console.error('[NOTIFICATIONS] Error inserting vendor notifications:', insertError);
        } else {
          console.log('[NOTIFICATIONS] ✅ Created', vendorNotifications.length, 'in-app notifications for vendors');
        }
      }
    }

    // =========================================================================
    // 5. Create IN-APP notification for the user who submitted the RFQ
    // =========================================================================
    const vendorNames = vendorDetails.map(v => v.company_name).filter(Boolean);
    const vendorSummary = vendorNames.length > 0
      ? vendorNames.length === 1
        ? vendorNames[0]
        : `${vendorNames.length} vendors`
      : 'selected vendors';

    const { error: userNotifError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'rfq_sent',
        title: 'RFQ Submitted Successfully',
        body: `Your RFQ "${rfqTitle}" has been sent to ${vendorSummary}. You'll be notified when vendors respond.`,
        metadata: {
          rfq_id: rfqId,
          rfq_type: rfqType,
          vendor_count: vendorIds.length,
        },
        related_id: rfqId,
        related_type: 'rfq',
      });

    if (userNotifError) {
      console.error('[NOTIFICATIONS] Error inserting user notification:', userNotifError);
    } else {
      console.log('[NOTIFICATIONS] ✅ Created confirmation notification for user');
    }

    // =========================================================================
    // 6. Send EMAIL notifications to vendors (async, best-effort)
    // =========================================================================
    for (const vendor of vendorDetails) {
      if (!vendor.email) continue;

      try {
        // Lazy-load nodemailer to avoid issues if SMTP not configured
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: 'mail.eventsgear.co.ke',
          port: 587,
          secure: false,
          auth: {
            user: 'noreply@eventsgear.co.ke',
            pass: process.env.EVENTSGEAR_EMAIL_PASSWORD,
          },
        });

        const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">New RFQ on Zintra</h1>
    </div>
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333;">Hi ${vendor.company_name || 'there'},</p>
      <p style="font-size: 16px; color: #333;">
        You have received a new Request for Quotation from <strong>${requesterName}</strong>.
      </p>
      <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 15px 20px; margin: 20px 0;">
        <p style="margin: 0 0 5px 0; font-weight: bold; color: #333;">${rfqTitle}</p>
        <p style="margin: 0; color: #666; font-size: 14px;">Type: ${rfqType === 'vendor-request' ? 'Direct Vendor Request' : rfqType}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://zintra.vercel.app/vendor-profile/${vendor.id}"
           style="display: inline-block; background: #ea580c; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          View RFQ & Respond
        </a>
      </div>
      <p style="font-size: 14px; color: #666;">
        Log in to your Zintra vendor profile to view details and submit your quote.
      </p>
    </div>
    <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated notification from Zintra. Please do not reply to this email.
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">© ${new Date().getFullYear()} Zintra. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

        await transporter.sendMail({
          from: '"Zintra" <noreply@eventsgear.co.ke>',
          to: vendor.email,
          subject: `New RFQ: ${rfqTitle} — Zintra`,
          text: `Hi ${vendor.company_name},\n\nYou have a new RFQ from ${requesterName}: "${rfqTitle}".\n\nLog in to your Zintra profile to view and respond.\n\nhttps://zintra.vercel.app/vendor-profile/${vendor.id}\n\n— Zintra`,
          html: htmlContent,
        });

        console.log('[NOTIFICATIONS] ✅ Email sent to vendor:', vendor.email);
      } catch (emailErr) {
        console.error('[NOTIFICATIONS] ❌ Email failed for', vendor.email, ':', emailErr.message);
        // Continue to next vendor - email is best-effort
      }
    }

    console.log('[NOTIFICATIONS] ✅ All notifications processed for RFQ:', rfqId);

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
