/**
 * Vendor Matching Utilities
 * Functions for auto-matching and selecting vendors for RFQs
 * 
 * Wizard RFQ:  Multi-criteria scoring → auto-pushes to top vendors (no admin needed)
 * Public RFQ:  Created as pending_approval → admin must approve before vendors see it
 * Direct RFQ:  User picks vendors → sent immediately
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// SCORING WEIGHTS  (total = 100 points max)
// ============================================================================
const WEIGHTS = {
  CATEGORY_PRIMARY:   30,  // Primary category exact match
  CATEGORY_SECONDARY: 15,  // Secondary category match
  LOCATION_COUNTY:    20,  // Same county
  LOCATION_TOWN:       5,  // Same town (bonus)
  RATING:             10,  // 4★+ = full, 3★+ = half
  VERIFIED:            5,  // Verified vendor badge
  RESPONSE_TIME:       5,  // Fast responder (<4 h)
  RFQS_COMPLETED:      5,  // Completed at least 3 RFQs
  PRICE_RANGE:         5,  // Budget alignment (budget/mid-range/premium)
};

const MIN_MATCH_SCORE  = 30;  // Minimum score to qualify
const MAX_WIZARD_MATCH = 10;  // Max vendors for wizard auto-match

/**
 * Calculate a 0-100 match score for a vendor vs. an RFQ
 *
 * @param {Object} vendor   – row from vendors table
 * @param {Object} rfqInfo  – { categorySlug, county, town, budgetMin, budgetMax, priceRange }
 * @returns {{ score: number, reasons: string[] }}
 */
export function calculateVendorScore(vendor, rfqInfo) {
  let score = 0;
  const reasons = [];

  // ── 1. Category match (30 / 15 pts) ──────────────────────────
  const primarySlug = vendor.primary_category_slug || vendor.primary_category || vendor.category || '';
  const secondaryArr = Array.isArray(vendor.secondary_categories)
    ? vendor.secondary_categories
    : typeof vendor.secondary_categories === 'string'
      ? (() => { try { return JSON.parse(vendor.secondary_categories); } catch { return []; } })()
      : [];

  if (primarySlug === rfqInfo.categorySlug) {
    score += WEIGHTS.CATEGORY_PRIMARY;
    reasons.push('Primary category match');
  } else if (secondaryArr.includes(rfqInfo.categorySlug)) {
    score += WEIGHTS.CATEGORY_SECONDARY;
    reasons.push('Secondary category match');
  } else {
    // No category match at all → disqualified
    return { score: 0, reasons: ['No category match'] };
  }

  // ── 2. Location match (20 + 5 bonus pts) ─────────────────────
  const vendorCounty = (vendor.county || '').toLowerCase().trim();
  const rfqCounty    = (rfqInfo.county || '').toLowerCase().trim();
  const vendorTown   = (vendor.location || vendor.town || '').toLowerCase().trim();
  const rfqTown      = (rfqInfo.town || '').toLowerCase().trim();

  if (rfqCounty && vendorCounty && vendorCounty === rfqCounty) {
    score += WEIGHTS.LOCATION_COUNTY;
    reasons.push(`Same county (${rfqInfo.county})`);

    if (rfqTown && vendorTown && vendorTown.includes(rfqTown)) {
      score += WEIGHTS.LOCATION_TOWN;
      reasons.push(`Same town (${rfqInfo.town})`);
    }
  }

  // ── 3. Rating (10 pts) ───────────────────────────────────────
  const rating = parseFloat(vendor.rating) || 0;
  if (rating >= 4) {
    score += WEIGHTS.RATING;
    reasons.push(`High rating (${rating.toFixed(1)}★)`);
  } else if (rating >= 3) {
    score += Math.round(WEIGHTS.RATING * 0.5);
    reasons.push(`Good rating (${rating.toFixed(1)}★)`);
  }

  // ── 4. Verification (5 pts) ──────────────────────────────────
  if (vendor.verified || vendor.is_verified) {
    score += WEIGHTS.VERIFIED;
    reasons.push('Verified vendor');
  }

  // ── 5. Response time (5 pts) ─────────────────────────────────
  const responseTime = parseInt(vendor.response_time) || 0;
  if (responseTime > 0 && responseTime <= 4) {
    score += WEIGHTS.RESPONSE_TIME;
    reasons.push(`Fast responder (${responseTime}h)`);
  } else if (responseTime > 0 && responseTime <= 8) {
    score += Math.round(WEIGHTS.RESPONSE_TIME * 0.5);
    reasons.push(`Moderate response time (${responseTime}h)`);
  }

  // ── 6. Track record (5 pts) ──────────────────────────────────
  const completed = parseInt(vendor.rfqs_completed) || 0;
  if (completed >= 3) {
    score += WEIGHTS.RFQS_COMPLETED;
    reasons.push(`${completed} RFQs completed`);
  } else if (completed >= 1) {
    score += Math.round(WEIGHTS.RFQS_COMPLETED * 0.5);
    reasons.push(`${completed} RFQ(s) completed`);
  }

  // ── 7. Price range alignment (5 pts) ─────────────────────────
  const vendorPriceRange = (vendor.price_range || '').toLowerCase();
  if (vendorPriceRange && rfqInfo.budgetMax) {
    // Map budget to expected price_range tier
    const budgetMax = parseFloat(rfqInfo.budgetMax) || 0;
    let expectedTier = '';
    if (budgetMax <= 50000)       expectedTier = 'budget';
    else if (budgetMax <= 200000) expectedTier = 'mid-range';
    else                          expectedTier = 'premium';

    if (vendorPriceRange.includes(expectedTier) || vendorPriceRange.includes('all')) {
      score += WEIGHTS.PRICE_RANGE;
      reasons.push('Price range matches budget');
    }
  }

  return { score: Math.min(score, 100), reasons };
}

/**
 * Auto-match vendors for a Wizard RFQ
 * Multi-criteria scoring: category + location + rating + verification +
 * response_time + track record + price range
 * Pushes automatically to top vendors — NO admin intervention needed
 * If 0 vendors pass threshold → flags for admin manual review
 *
 * @param {string} rfqId        – RFQ ID to match vendors for
 * @param {string} categorySlug – Category slug for matching
 * @param {string} county       – County for location-based matching
 * @param {Object} extras       – { town, budgetMin, budgetMax } (optional)
 * @returns {Promise<{vendors: Array, needsAdminReview: boolean}>}
 */
export async function autoMatchVendors(rfqId, categorySlug, county, extras = {}) {
  try {
    console.log('[AUTO-MATCH] Starting multi-criteria vendor matching:', { rfqId, categorySlug, county, extras });

    // ── Step 1: Pull a broad pool of candidate vendors ──────────
    // We fetch up to 50 vendors in the category (primary or secondary)
    // and then score them all locally
    const { data: candidates, error } = await supabase
      .from('vendors')
      .select(`
        id, company_name, email, user_id,
        primary_category_slug, secondary_categories, category,
        county, location, price_range, description,
        rating, verified, is_verified, response_time,
        rfqs_completed, subscription_active, avatar_url,
        status
      `)
      .or(
        `primary_category_slug.eq.${categorySlug},` +
        `secondary_categories.cs.["${categorySlug}"]`
      )
      .in('status', ['active', 'approved'])
      .limit(50);

    if (error) {
      console.error('[AUTO-MATCH] Query error:', error);
      // Fallback: try simpler query without status filter
      const { data: fallback, error: fbErr } = await supabase
        .from('vendors')
        .select('id, company_name, email, user_id, primary_category_slug, secondary_categories, category, county, location, price_range, rating, verified, is_verified, response_time, rfqs_completed, subscription_active, avatar_url, status')
        .or(`primary_category_slug.eq.${categorySlug},category.eq.${categorySlug}`)
        .limit(50);

      if (fbErr || !fallback?.length) {
        console.error('[AUTO-MATCH] Fallback query also failed:', fbErr);
        return await _flagForAdminReview(rfqId, categorySlug, county);
      }
      return await _scoreAndInsert(rfqId, fallback, { categorySlug, county, ...extras });
    }

    if (!candidates || candidates.length === 0) {
      console.warn('[AUTO-MATCH] No vendors found for category:', categorySlug);
      // Try broader match without category filter — just same county
      if (county) {
        const { data: countyVendors } = await supabase
          .from('vendors')
          .select('id, company_name, email, user_id, primary_category_slug, secondary_categories, category, county, location, price_range, rating, verified, is_verified, response_time, rfqs_completed, subscription_active, avatar_url, status')
          .ilike('county', county)
          .in('status', ['active', 'approved'])
          .limit(30);
        if (countyVendors?.length) {
          console.log('[AUTO-MATCH] Broadened to county-only search, found', countyVendors.length);
          return await _scoreAndInsert(rfqId, countyVendors, { categorySlug, county, ...extras });
        }
      }
      // 0 vendors in category or county → flag for admin
      return await _flagForAdminReview(rfqId, categorySlug, county);
    }

    return await _scoreAndInsert(rfqId, candidates, { categorySlug, county, ...extras });

  } catch (err) {
    console.error('[AUTO-MATCH] Error:', err);
    return await _flagForAdminReview(rfqId, categorySlug, county);
  }
}

/**
 * Internal: Flag an RFQ for admin manual review when auto-match finds 0 vendors
 * Updates RFQ status → needs_admin_review, notifies all admins
 */
async function _flagForAdminReview(rfqId, categorySlug, county) {
  console.warn('[AUTO-MATCH] ⚠️ 0 vendors matched — flagging for admin review:', rfqId);

  // Update RFQ status
  const { error } = await supabase
    .from('rfqs')
    .update({ status: 'needs_admin_review' })
    .eq('id', rfqId);

  if (error) {
    console.error('[AUTO-MATCH] Failed to flag for admin review:', error);
  }

  // Notify all admins
  try {
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins?.length) {
      const adminNotifs = admins.map(a => ({
        user_id: a.user_id,
        type: 'admin_rfq_intervention',
        title: '🚨 Wizard RFQ Needs Manual Matching',
        body: `Auto-matching found 0 qualified vendors for category "${categorySlug}" in ${county || 'any location'}. Please manually assign vendors.`,
        metadata: { rfq_id: rfqId, category: categorySlug, county: county || null, reason: 'zero_matches' },
        related_id: rfqId,
        related_type: 'rfq',
      }));

      await supabase.from('notifications').insert(adminNotifs);
      console.log('[AUTO-MATCH] ✅ Notified', admins.length, 'admin(s) about intervention needed');
    }
  } catch (e) {
    console.warn('[AUTO-MATCH] Admin notification insert failed:', e.message);
  }

  return { vendors: [], needsAdminReview: true };
}

/**
 * Internal: score candidates and insert top matches into rfq_recipients + rfq_requests
 */
async function _scoreAndInsert(rfqId, candidates, rfqInfo) {
  // ── Step 2: Score every candidate ─────────────────────────────
  const scored = candidates.map(vendor => {
    const { score, reasons } = calculateVendorScore(vendor, rfqInfo);
    return { ...vendor, matchScore: score, matchReasons: reasons };
  });

  // ── Step 3: Filter by MIN_MATCH_SCORE, sort desc, take top N ─
  const qualified = scored
    .filter(v => v.matchScore >= MIN_MATCH_SCORE)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, MAX_WIZARD_MATCH);

  console.log('[AUTO-MATCH] Scored', candidates.length, 'candidates →',
    scored.filter(v => v.matchScore > 0).length, 'category matches →',
    qualified.length, 'qualified (≥' + MIN_MATCH_SCORE + ')');

  if (qualified.length === 0) {
    console.warn('[AUTO-MATCH] No vendors passed the minimum score threshold');
    // All candidates scored below MIN_MATCH_SCORE → flag for admin
    return { vendors: [], needsAdminReview: true };
  }

  // Log top matches for debugging
  qualified.forEach((v, i) => {
    console.log(`  #${i + 1} ${v.company_name || v.id} — Score: ${v.matchScore}/100 — ${v.matchReasons.join(', ')}`);
  });

  // ── Step 4: Insert into rfq_recipients ────────────────────────
  const recipientRecords = qualified.map(vendor => ({
    rfq_id: rfqId,
    vendor_id: vendor.id,
    recipient_type: 'wizard',
    status: 'sent',
    match_score: vendor.matchScore,
    match_reasons: vendor.matchReasons,
  }));

  const { error: insertError } = await supabase
    .from('rfq_recipients')
    .insert(recipientRecords);

  if (insertError) {
    // Retry without match_score/match_reasons in case columns don't exist yet
    console.warn('[AUTO-MATCH] Insert with score columns failed, retrying basic insert:', insertError.message);
    const basicRecords = qualified.map(v => ({
      rfq_id: rfqId,
      vendor_id: v.id,
      recipient_type: 'wizard',
      status: 'sent',
    }));
    const { error: retryError } = await supabase
      .from('rfq_recipients')
      .insert(basicRecords);
    if (retryError) {
      console.error('[AUTO-MATCH] Basic insert also failed:', retryError);
      return { vendors: [], needsAdminReview: true };
    }
  }

  // ── Step 5: Also insert into rfq_requests for vendor inbox ────
  // Get the RFQ title for rfq_requests
  const { data: rfqData } = await supabase
    .from('rfqs')
    .select('title, description, user_id')
    .eq('id', rfqId)
    .single();

  if (rfqData) {
    const requestRecords = qualified.map(v => ({
      rfq_id: rfqId,
      vendor_id: v.id,
      user_id: rfqData.user_id,
      project_title: rfqData.title || 'Untitled RFQ',
      project_description: rfqData.description || '',
      status: 'pending',
    }));

    const { error: reqError } = await supabase
      .from('rfq_requests')
      .insert(requestRecords);

    if (reqError) {
      console.warn('[AUTO-MATCH] rfq_requests insert failed (non-critical):', reqError.message);
    } else {
      console.log('[AUTO-MATCH] ✅ Added', qualified.length, 'vendors to rfq_requests for inbox');
    }
  }

  console.log('[AUTO-MATCH] ✅ Matched', qualified.length, 'vendors for Wizard RFQ:', rfqId);
  return { vendors: qualified, needsAdminReview: false };
}

/**
 * Get top vendors for a category (for Public RFQ)
 * Returns the highest-rated vendors to notify
 * NOTE: For public RFQs these vendors are only notified AFTER admin approval
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
      .select('id, company_name, primary_category_slug, secondary_categories, rating, verified, is_verified, subscription_active, avatar_url, county, email, user_id')
      .or(
        `primary_category_slug.eq.${categorySlug},` +
        `secondary_categories.cs.["${categorySlug}"]`
      )
      .in('status', ['active', 'approved'])
      .order('rating', { ascending: false })
      .order('verified', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[TOP-VENDORS] Query error:', error);
      // Fallback without status filter
      const { data: fallback } = await supabase
        .from('vendors')
        .select('id, company_name, primary_category_slug, secondary_categories, rating, verified, is_verified, subscription_active, avatar_url, county, email, user_id')
        .or(`primary_category_slug.eq.${categorySlug},category.eq.${categorySlug}`)
        .order('rating', { ascending: false })
        .limit(limit);
      return fallback || [];
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
 * Public RFQs require admin approval. This function is called:
 * - At creation time: stores recipients with status='pending_approval' (not yet notified)
 * - After admin approves: updates status to 'sent' and triggers notifications
 * 
 * @param {string} rfqId - RFQ ID
 * @param {string} categorySlug - Category for vendor matching
 * @param {string} county - County for location filtering
 * @param {boolean} approved - If true, set status to 'sent' (admin approved)
 * @returns {Promise<boolean>} - Success/failure
 */
export async function createPublicRFQRecipients(rfqId, categorySlug, county, approved = false) {
  try {
    console.log('[PUBLIC-RFQ] Creating recipients for public RFQ:', { rfqId, categorySlug, county, approved });

    // Get top vendors
    const topVendors = await getTopVendorsForCategory(categorySlug, county, 20);

    if (topVendors.length === 0) {
      console.warn('[PUBLIC-RFQ] No vendors found for category:', categorySlug);
      return false;
    }

    // Create recipient records — pending_approval until admin approves
    const recipientRecords = topVendors.map(vendor => ({
      rfq_id: rfqId,
      vendor_id: vendor.id,
      recipient_type: 'public',
      status: approved ? 'sent' : 'pending_approval'
    }));

    const { error: insertError } = await supabase
      .from('rfq_recipients')
      .insert(recipientRecords);

    if (insertError) {
      console.error('[PUBLIC-RFQ] Insert error:', insertError);
      return false;
    }

    console.log('[PUBLIC-RFQ] Created', topVendors.length, 'recipient records (status:', approved ? 'sent' : 'pending_approval', ')');
    return true;

  } catch (err) {
    console.error('[PUBLIC-RFQ] Error:', err);
    return false;
  }
}

/**
 * Approve a Public RFQ — called by admin
 * Updates the RFQ status, flips recipients to 'sent', triggers notifications
 * 
 * @param {string} rfqId - RFQ ID to approve
 * @returns {Promise<{success: boolean, vendorCount: number}>}
 */
export async function approvePublicRFQ(rfqId) {
  try {
    console.log('[PUBLIC-RFQ-APPROVE] Approving public RFQ:', rfqId);

    // 1. Update rfq status → approved, visibility → public
    const { data: rfq, error: updateErr } = await supabase
      .from('rfqs')
      .update({ status: 'approved', visibility: 'public' })
      .eq('id', rfqId)
      .select('id, title, user_id, type, category_slug, county')
      .single();

    if (updateErr || !rfq) {
      console.error('[PUBLIC-RFQ-APPROVE] Failed to update RFQ status:', updateErr);
      return { success: false, vendorCount: 0 };
    }

    // 2. Flip all pending_approval recipients → sent
    const { data: recipients, error: recErr } = await supabase
      .from('rfq_recipients')
      .update({ status: 'sent' })
      .eq('rfq_id', rfqId)
      .eq('status', 'pending_approval')
      .select('vendor_id');

    if (recErr) {
      console.error('[PUBLIC-RFQ-APPROVE] Failed to update recipients:', recErr);
    }

    const vendorCount = recipients?.length || 0;
    console.log('[PUBLIC-RFQ-APPROVE] ✅ Flipped', vendorCount, 'recipients to sent');

    // 3. Trigger notifications now that it's approved
    triggerNotifications(rfqId, rfq.type || 'public', rfq.user_id, rfq.title).catch(err => {
      console.error('[PUBLIC-RFQ-APPROVE] Notification error (non-critical):', err.message);
    });

    return { success: true, vendorCount };

  } catch (err) {
    console.error('[PUBLIC-RFQ-APPROVE] Error:', err);
    return { success: false, vendorCount: 0 };
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
    // 3. Get the submitter's name for INTERNAL reference only
    //    Vendor-facing notifications use "A Zintra user" to protect privacy
    // =========================================================================
    let requesterName = 'A Zintra user';
    let requesterNameInternal = 'A user'; // For user's own notification
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', userId)
        .single();
      if (userData) {
        requesterNameInternal = userData.full_name || userData.email?.split('@')[0] || 'A user';
      }
    } catch (e) {
      console.warn('[NOTIFICATIONS] Could not fetch requester name');
    }

    // =========================================================================
    // 4. Create IN-APP notifications for each vendor (user_id from vendors table)
    //    NOTE: Vendor notifications do NOT reveal the requester's name
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
        You have received a new Request for Quotation on <strong>Zintra</strong>.
      </p>
      <p style="font-size: 14px; color: #666;">
        A buyer is looking for services and your profile was matched. Review the details and submit your quote.
      </p>
      <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 15px 20px; margin: 20px 0;">
        <p style="margin: 0 0 5px 0; font-weight: bold; color: #333;">${rfqTitle}</p>
        <p style="margin: 0; color: #666; font-size: 14px;">Type: ${rfqType === 'vendor-request' ? 'Direct Vendor Request' : rfqType}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://zintra-sandy.vercel.app/vendor/rfq/${rfqId}"
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
          text: `Hi ${vendor.company_name},\n\nYou have a new RFQ on Zintra: "${rfqTitle}".\n\nA buyer is looking for services and your profile was matched. Log in to view details and submit your quote.\n\nhttps://zintra-sandy.vercel.app/vendor-profile/${vendor.id}\n\n— Zintra`,
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

/**
 * Admin Manual Match — called when admin manually assigns vendors to a wizard RFQ
 * that the algorithm couldn't match (needs_admin_review → submitted)
 *
 * @param {string} rfqId      – RFQ ID
 * @param {string[]} vendorIds – Array of vendor IDs to assign
 * @returns {Promise<{success: boolean, vendorCount: number, message: string}>}
 */
export async function adminManualMatch(rfqId, vendorIds) {
  try {
    console.log('[ADMIN-MATCH] Manual matching', vendorIds.length, 'vendors for RFQ:', rfqId);

    // 1. Get the RFQ details
    const { data: rfq, error: rfqErr } = await supabase
      .from('rfqs')
      .select('id, title, description, user_id, type, category_slug, county, status')
      .eq('id', rfqId)
      .single();

    if (rfqErr || !rfq) {
      console.error('[ADMIN-MATCH] RFQ not found:', rfqErr);
      return { success: false, vendorCount: 0, message: 'RFQ not found' };
    }

    // 2. Get vendor details
    const { data: vendors, error: vendorErr } = await supabase
      .from('vendors')
      .select('id, company_name, email, user_id, primary_category_slug, county, rating')
      .in('id', vendorIds);

    if (vendorErr || !vendors?.length) {
      console.error('[ADMIN-MATCH] Vendors not found:', vendorErr);
      return { success: false, vendorCount: 0, message: 'Selected vendors not found' };
    }

    // 3. Insert into rfq_recipients
    const recipientRecords = vendors.map(v => ({
      rfq_id: rfqId,
      vendor_id: v.id,
      recipient_type: 'admin_manual',
      status: 'sent',
    }));

    const { error: recipientErr } = await supabase
      .from('rfq_recipients')
      .insert(recipientRecords);

    if (recipientErr) {
      console.error('[ADMIN-MATCH] Failed to insert recipients:', recipientErr);
      return { success: false, vendorCount: 0, message: 'Failed to assign vendors' };
    }

    // 4. Insert into rfq_requests for vendor inbox
    const requestRecords = vendors.map(v => ({
      rfq_id: rfqId,
      vendor_id: v.id,
      user_id: rfq.user_id,
      project_title: rfq.title || 'Untitled RFQ',
      project_description: rfq.description || '',
      status: 'pending',
    }));

    const { error: reqErr } = await supabase
      .from('rfq_requests')
      .insert(requestRecords);

    if (reqErr) {
      console.warn('[ADMIN-MATCH] rfq_requests insert failed (non-critical):', reqErr.message);
    }

    // 5. Update RFQ status from needs_admin_review → submitted
    const { error: statusErr } = await supabase
      .from('rfqs')
      .update({ status: 'submitted' })
      .eq('id', rfqId);

    if (statusErr) {
      console.error('[ADMIN-MATCH] Failed to update RFQ status:', statusErr);
    }

    // 6. Notify the user: "Your RFQ has been matched to relevant vendors by our team"
    await supabase.from('notifications').insert({
      user_id: rfq.user_id,
      type: 'rfq_admin_matched',
      title: '✅ Your RFQ Has Been Matched',
      body: `Your RFQ "${rfq.title}" has been reviewed and matched to ${vendors.length} relevant vendor${vendors.length > 1 ? 's' : ''} by our team. You'll be notified when vendors respond with quotes.`,
      metadata: {
        rfq_id: rfqId,
        rfq_type: rfq.type,
        vendor_count: vendors.length,
        matched_by: 'admin_manual',
      },
      related_id: rfqId,
      related_type: 'rfq',
    }).catch(e => console.warn('[ADMIN-MATCH] User notification failed:', e.message));

    // 7. Notify matched vendors (reuse triggerNotifications)
    triggerNotifications(rfqId, rfq.type || 'wizard', rfq.user_id, rfq.title).catch(err => {
      console.error('[ADMIN-MATCH] Vendor notification error:', err.message);
    });

    console.log('[ADMIN-MATCH] ✅ Manually matched', vendors.length, 'vendors for RFQ:', rfqId);
    return { success: true, vendorCount: vendors.length, message: `Matched ${vendors.length} vendor(s) successfully` };

  } catch (err) {
    console.error('[ADMIN-MATCH] Error:', err);
    return { success: false, vendorCount: 0, message: err.message };
  }
}

export default {
  autoMatchVendors,
  getTopVendorsForCategory,
  createPublicRFQRecipients,
  approvePublicRFQ,
  calculateVendorScore,
  triggerNotifications,
  adminManualMatch
};
