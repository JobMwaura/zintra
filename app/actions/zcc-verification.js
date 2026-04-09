'use server';

import { createClient } from '@/lib/supabase/server';
import { ZCC_COSTS, ZCC_SPEND_TYPES, ZCC_LEVELS } from '@/lib/zcc/credit-config';
import { spendCredits } from '@/app/actions/zcc-wallet';

// ============================================
// VERIFICATION ACTIONS
// ============================================

/**
 * Submit a verification document for review.
 * Costs VERIFICATION_BUNDLE (50 credits) — charged once for the first submission.
 * Re-submissions (after rejection) are free.
 */
export async function submitVerification(userId, verificationType, { fileUrl = null, notes = null } = {}) {
  try {
    const supabase = await createClient();

    if (!userId) return { success: false, error: 'User ID required' };
    if (!['id_document', 'references', 'certificates'].includes(verificationType)) {
      return { success: false, error: 'Invalid verification type' };
    }

    // Check if a verification already exists for this type
    const { data: existing } = await supabase
      .from('zcc_candidate_verifications')
      .select('id, status')
      .eq('user_id', userId)
      .eq('verification_type', verificationType)
      .single();

    if (existing) {
      if (existing.status === 'approved') {
        return { success: false, error: 'This verification is already approved' };
      }
      if (existing.status === 'pending') {
        return { success: false, error: 'A verification is already pending review' };
      }

      // Status is 'rejected' — allow re-submission for free
      const { error: updateError } = await supabase
        .from('zcc_candidate_verifications')
        .update({
          file_url: fileUrl,
          notes,
          status: 'pending',
          reject_reason: null,
          reviewed_by: null,
          reviewed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Verification re-submit error:', updateError);
        return { success: false, error: 'Failed to re-submit verification' };
      }

      return { success: true, resubmission: true };
    }

    // First-time submission: check if user has EVER paid for verification bundle
    const { data: previousSpend } = await supabase
      .from('zcc_credit_spends')
      .select('id')
      .eq('user_id', userId)
      .eq('spend_type', ZCC_SPEND_TYPES.VERIFICATION_BUNDLE)
      .limit(1)
      .single();

    // If never paid, charge the verification bundle cost
    if (!previousSpend) {
      const spendResult = await spendCredits(userId, ZCC_COSTS.VERIFICATION_BUNDLE, {
        spendType: ZCC_SPEND_TYPES.VERIFICATION_BUNDLE,
        description: `Verification bundle — ${verificationType}`,
      });

      if (!spendResult.success) {
        return {
          success: false,
          error: spendResult.error || 'Insufficient credits for verification bundle',
          creditsNeeded: ZCC_COSTS.VERIFICATION_BUNDLE,
        };
      }
    }

    // Insert the verification record
    const { error: insertError } = await supabase
      .from('zcc_candidate_verifications')
      .insert({
        user_id: userId,
        verification_type: verificationType,
        file_url: fileUrl,
        notes,
        status: 'pending',
      });

    if (insertError) {
      console.error('Verification insert error:', insertError);
      return { success: false, error: 'Failed to submit verification' };
    }

    return { success: true };
  } catch (err) {
    console.error('submitVerification error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Get verification status for a candidate.
 */
export async function getVerificationStatus(userId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('zcc_candidate_verifications')
      .select('id, verification_type, status, reject_reason, file_url, notes, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getVerificationStatus error:', error);
      return { success: false, error: error.message };
    }

    // Also get candidate profile data for level + flags
    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('verified_id, verified_references, tools_ready, level, featured_until, completed_gigs, rating, no_shows')
      .eq('id', userId)
      .single();

    // Build a structured response
    const verifications = {
      id_document: data?.find(v => v.verification_type === 'id_document') || null,
      references: data?.find(v => v.verification_type === 'references') || null,
      certificates: data?.find(v => v.verification_type === 'certificates') || null,
    };

    return {
      success: true,
      verifications,
      profile: profile || {},
    };
  } catch (err) {
    console.error('getVerificationStatus error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

// ============================================
// FEATURED PROFILE ACTIONS
// ============================================

/**
 * Purchase featured profile placement (7 days).
 * Costs FEATURED_PROFILE_7D (80 credits).
 */
export async function purchaseFeaturedProfile(userId) {
  try {
    const supabase = await createClient();

    if (!userId) return { success: false, error: 'User ID required' };

    // Check if already featured
    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('featured_until')
      .eq('id', userId)
      .single();

    if (profile?.featured_until && new Date(profile.featured_until) > new Date()) {
      return { success: false, error: 'Your profile is already featured until ' + new Date(profile.featured_until).toLocaleDateString() };
    }

    // Spend credits
    const spendResult = await spendCredits(userId, ZCC_COSTS.FEATURED_PROFILE_7D, {
      spendType: ZCC_SPEND_TYPES.FEATURED_PROFILE,
      description: 'Featured profile — 7 days',
    });

    if (!spendResult.success) {
      return {
        success: false,
        error: spendResult.error || 'Insufficient credits for featured profile',
        creditsNeeded: ZCC_COSTS.FEATURED_PROFILE_7D,
      };
    }

    // Set featured_until to 7 days from now
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + 7);

    const { error: updateError } = await supabase
      .from('candidate_profiles')
      .update({ featured_until: featuredUntil.toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Featured profile update error:', updateError);
      return { success: false, error: 'Failed to activate featured profile' };
    }

    return { success: true, featured_until: featuredUntil.toISOString() };
  } catch (err) {
    console.error('purchaseFeaturedProfile error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Get featured candidates for the talent browse page.
 * Returns candidates whose featured_until is in the future.
 */
export async function getFeaturedCandidates(limit = 6) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('candidate_profiles')
      .select('id, full_name, avatar_url, city, role, bio, skills, availability, rate_per_day, level, rating, completed_gigs, verified_id, verified_references, tools_ready, featured_until')
      .gt('featured_until', new Date().toISOString())
      .order('featured_until', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('getFeaturedCandidates error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, candidates: data || [] };
  } catch (err) {
    console.error('getFeaturedCandidates error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

// ============================================
// WORKER LEVEL ACTIONS
// ============================================

/**
 * Calculate and return the worker level for a candidate.
 * Uses the ZCC_LEVELS thresholds from credit-config.
 */
export async function calculateWorkerLevel(userId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('zcc_calculate_worker_level', {
      p_user_id: userId,
    });

    if (error) {
      console.error('calculateWorkerLevel RPC error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, level: data };
  } catch (err) {
    console.error('calculateWorkerLevel error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Get level info with progress to next level.
 */
export async function getLevelProgress(completedGigs = 0, rating = 0) {
  const levels = [
    { ...ZCC_LEVELS.NEW },
    { ...ZCC_LEVELS.RISING },
    { ...ZCC_LEVELS.TRUSTED },
    { ...ZCC_LEVELS.TOP_RATED },
  ];

  let currentLevel = levels[0];
  let nextLevel = levels[1];
  let currentIndex = 0;

  for (let i = levels.length - 1; i >= 0; i--) {
    if (completedGigs >= levels[i].min_completed && rating >= levels[i].min_rating) {
      currentLevel = levels[i];
      currentIndex = i;
      nextLevel = i < levels.length - 1 ? levels[i + 1] : null;
      break;
    }
  }

  // Calculate progress to next level
  let gigsProgress = 100;
  let ratingProgress = 100;

  if (nextLevel) {
    const gigsRange = nextLevel.min_completed - currentLevel.min_completed;
    const gigsCompleted = Math.min(completedGigs - currentLevel.min_completed, gigsRange);
    gigsProgress = gigsRange > 0 ? Math.round((gigsCompleted / gigsRange) * 100) : 100;

    const ratingRange = nextLevel.min_rating - currentLevel.min_rating;
    const ratingGained = Math.min(rating - currentLevel.min_rating, ratingRange);
    ratingProgress = ratingRange > 0 ? Math.round((ratingGained / ratingRange) * 100) : 100;
  }

  return {
    currentLevel,
    nextLevel,
    currentIndex,
    totalLevels: levels.length,
    gigsProgress: Math.max(0, Math.min(100, gigsProgress)),
    ratingProgress: Math.max(0, Math.min(100, ratingProgress)),
    completedGigs,
    rating,
  };
}

// ============================================
// ADMIN: Review pending verifications
// ============================================

/**
 * Get all pending verifications (for admin panel).
 */
export async function getPendingVerifications() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('zcc_candidate_verifications')
      .select(`
        id, user_id, verification_type, file_url, notes, status, created_at,
        profiles:user_id (full_name, email, phone)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('getPendingVerifications error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, verifications: data || [] };
  } catch (err) {
    console.error('getPendingVerifications error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Admin: approve or reject a verification.
 */
export async function reviewVerification(verificationId, status, reviewedBy, rejectReason = null) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('zcc_review_verification', {
      p_verification_id: verificationId,
      p_status: status,
      p_reviewed_by: reviewedBy,
      p_reject_reason: rejectReason,
    });

    if (error) {
      console.error('reviewVerification RPC error:', error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error('reviewVerification error:', err);
    return { success: false, error: 'Unexpected error' };
  }
}
