'use server';

import { createClient } from '@/lib/supabase/server';
import { ZCC_COSTS, ZCC_SPEND_TYPES, ZCC_FREE } from '@/lib/zcc/credit-config';

/**
 * Get wallet balance for a user.
 * Creates wallet with 0 balance if it doesn't exist.
 */
export async function getWalletBalance(userId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('zcc_wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No wallet yet — return 0, wallet will be created on first topup
      return { success: true, balance: 0 };
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, balance: data.balance };
  } catch (err) {
    console.error('Error getting wallet balance:', err);
    return { success: false, error: 'Failed to get balance' };
  }
}

/**
 * Top up credits via Supabase RPC (atomic).
 * Used after payment confirmation.
 */
export async function topupCredits(userId, amount, { sku = null, amountKes = null, reference = null, type = 'topup' } = {}) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('zcc_topup_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_sku: sku,
      p_amount_kes: amountKes,
      p_reference: reference,
      p_type: type,
    });

    if (error) {
      console.error('Topup RPC error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: data.success,
      balance: data.balance,
      transactionId: data.transaction_id,
      error: data.error,
    };
  } catch (err) {
    console.error('Error topping up credits:', err);
    return { success: false, error: 'Failed to top up credits' };
  }
}

/**
 * Spend credits via Supabase RPC (atomic — prevents double-spend).
 * Returns new balance + spend_id for linking to featured_posts, unlocks, etc.
 */
export async function spendCredits(userId, amount, spendType, relatedId = null, description = null) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('zcc_spend_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_spend_type: spendType,
      p_related_id: relatedId,
      p_description: description,
    });

    if (error) {
      console.error('Spend RPC error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: data.success,
      balance: data.balance,
      transactionId: data.transaction_id,
      spendId: data.spend_id,
      error: data.error,
    };
  } catch (err) {
    console.error('Error spending credits:', err);
    return { success: false, error: 'Failed to spend credits' };
  }
}

/**
 * Get transaction history for a user.
 */
export async function getTransactionHistory(userId, limit = 20) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('zcc_credit_transactions')
      .select('id, type, sku, credits_delta, balance_after, amount_kes, reference, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, transactions: data || [] };
  } catch (err) {
    console.error('Error getting transaction history:', err);
    return { success: false, error: 'Failed to get transaction history' };
  }
}

/**
 * Get available credit products (packs) by role scope.
 */
export async function getCreditProducts(roleScope = 'employer') {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('zcc_credit_products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    // Filter by role scope: show role-specific + "both"
    if (roleScope === 'employer') {
      query = query.in('role_scope', ['employer', 'both']);
    } else if (roleScope === 'candidate') {
      query = query.in('role_scope', ['candidate', 'both']);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    // Separate packs from action costs
    const packs = (data || []).filter(p => !p.metadata?.is_action);
    const actions = (data || []).filter(p => p.metadata?.is_action);

    return { success: true, packs, actions };
  } catch (err) {
    console.error('Error getting credit products:', err);
    return { success: false, error: 'Failed to get products' };
  }
}

/**
 * Initialize wallet for new user with signup bonus credits.
 * Called during role enablement (onboarding).
 */
export async function initializeWallet(userId, isVendor = false) {
  try {
    const initialCredits = isVendor
      ? ZCC_FREE.VENDOR_EMPLOYER_SIGNUP_CREDITS
      : ZCC_FREE.EMPLOYER_SIGNUP_CREDITS;

    const result = await topupCredits(userId, initialCredits, {
      type: 'bonus',
      reference: 'signup_bonus',
    });

    return result;
  } catch (err) {
    console.error('Error initializing wallet:', err);
    return { success: false, error: 'Failed to initialize wallet' };
  }
}

/**
 * Publish a job listing — deducts JOB_POST credits + optional featured add-on.
 * Returns the created listing ID.
 */
export async function publishJobWithCredits(userId, listingData, featuredOption = null) {
  try {
    const supabase = await createClient();

    // Calculate total cost
    let totalCost = ZCC_COSTS.JOB_POST;
    let featuredCost = 0;

    if (featuredOption) {
      const featuredCosts = {
        '7d': ZCC_COSTS.FEATURED_JOB_7D,
        '14d': ZCC_COSTS.FEATURED_JOB_14D,
        '30d': ZCC_COSTS.FEATURED_JOB_30D,
      };
      featuredCost = featuredCosts[featuredOption] || 0;
      totalCost += featuredCost;
    }

    // 1. Spend credits atomically
    const spendResult = await spendCredits(
      userId,
      totalCost,
      ZCC_SPEND_TYPES.JOB_POST,
      null,
      `Post job: ${listingData.title}${featuredOption ? ` + Featured ${featuredOption}` : ''}`
    );

    if (!spendResult.success) {
      return { success: false, error: spendResult.error };
    }

    // 2. Insert the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        employer_id: userId,
        type: 'job',
        title: listingData.title,
        description: listingData.description,
        category: listingData.category,
        location: listingData.location,
        pay_min: listingData.payMin ? parseInt(listingData.payMin) : null,
        pay_max: listingData.payMax ? parseInt(listingData.payMax) : null,
        pay_currency: 'KES',
        start_date: listingData.startDate || null,
        duration: listingData.duration || null,
        contract_type: listingData.contractType || 'full-time',
        requirements: listingData.requirements || null,
        status: 'active',
      })
      .select('id')
      .single();

    if (listingError) {
      // TODO: Refund credits on listing creation failure
      console.error('Listing creation failed:', listingError);
      return { success: false, error: 'Failed to create listing: ' + listingError.message };
    }

    // 3. Create featured post record if add-on selected
    if (featuredOption && listing) {
      const durationDays = { '7d': 7, '14d': 14, '30d': 30 }[featuredOption] || 7;
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + durationDays);

      await supabase.from('zcc_featured_posts').insert({
        post_id: listing.id,
        employer_id: userId,
        label: 'featured',
        starts_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
        spend_id: spendResult.spendId,
      });
    }

    return {
      success: true,
      listingId: listing.id,
      creditsSpent: totalCost,
      balance: spendResult.balance,
    };
  } catch (err) {
    console.error('Error publishing job:', err);
    return { success: false, error: 'Failed to publish job' };
  }
}

/**
 * Publish a gig listing — deducts GIG_POST credits + optional featured add-on.
 */
export async function publishGigWithCredits(userId, listingData, featuredOption = null) {
  try {
    const supabase = await createClient();

    // Calculate total cost
    let totalCost = ZCC_COSTS.GIG_POST;
    let featuredCost = 0;

    if (featuredOption) {
      const featuredCosts = {
        '24h': ZCC_COSTS.FEATURED_GIG_24H,
        '72h': ZCC_COSTS.FEATURED_GIG_72H,
      };
      featuredCost = featuredCosts[featuredOption] || 0;
      totalCost += featuredCost;
    }

    // 1. Spend credits atomically
    const spendResult = await spendCredits(
      userId,
      totalCost,
      ZCC_SPEND_TYPES.GIG_POST,
      null,
      `Post gig: ${listingData.title}${featuredOption ? ` + Featured ${featuredOption}` : ''}`
    );

    if (!spendResult.success) {
      return { success: false, error: spendResult.error };
    }

    // 2. Insert the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        employer_id: userId,
        type: 'gig',
        title: listingData.title,
        description: listingData.description,
        category: listingData.category,
        location: listingData.location,
        pay_min: listingData.payMin ? parseInt(listingData.payMin) : null,
        pay_max: listingData.payMax ? parseInt(listingData.payMax) : null,
        pay_currency: 'KES',
        start_date: listingData.startDate || null,
        duration: listingData.duration || null,
        workers_needed: listingData.workersNeeded ? parseInt(listingData.workersNeeded) : 1,
        requirements: listingData.requirements || null,
        status: 'active',
      })
      .select('id')
      .single();

    if (listingError) {
      console.error('Gig creation failed:', listingError);
      return { success: false, error: 'Failed to create gig: ' + listingError.message };
    }

    // 3. Create featured post record if add-on selected
    if (featuredOption && listing) {
      const durationHours = { '24h': 24, '72h': 72 }[featuredOption] || 24;
      const endsAt = new Date();
      endsAt.setTime(endsAt.getTime() + durationHours * 60 * 60 * 1000);

      await supabase.from('zcc_featured_posts').insert({
        post_id: listing.id,
        employer_id: userId,
        label: featuredOption === '24h' ? 'urgent' : 'featured',
        starts_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
        spend_id: spendResult.spendId,
      });
    }

    return {
      success: true,
      listingId: listing.id,
      creditsSpent: totalCost,
      balance: spendResult.balance,
    };
  } catch (err) {
    console.error('Error publishing gig:', err);
    return { success: false, error: 'Failed to publish gig' };
  }
}

/**
 * Unlock a candidate's contact info — deducts CONTACT_UNLOCK credits.
 */
export async function unlockCandidateContact(employerId, candidateId, postId = null, applicationId = null) {
  try {
    const supabase = await createClient();

    // Check if already unlocked
    const { data: existing } = await supabase
      .from('zcc_contact_unlocks')
      .select('id')
      .eq('employer_id', employerId)
      .eq('candidate_id', candidateId)
      .single();

    if (existing) {
      return { success: true, alreadyUnlocked: true, message: 'Contact already unlocked' };
    }

    // Spend credits
    const spendResult = await spendCredits(
      employerId,
      ZCC_COSTS.CONTACT_UNLOCK,
      ZCC_SPEND_TYPES.CONTACT_UNLOCK,
      candidateId,
      'Contact unlock'
    );

    if (!spendResult.success) {
      return { success: false, error: spendResult.error };
    }

    // Create unlock record
    const { error: unlockError } = await supabase
      .from('zcc_contact_unlocks')
      .insert({
        employer_id: employerId,
        candidate_id: candidateId,
        post_id: postId,
        application_id: applicationId,
        spend_id: spendResult.spendId,
      });

    if (unlockError) {
      console.error('Unlock insert error:', unlockError);
      return { success: false, error: 'Failed to create unlock record' };
    }

    // Fetch candidate contact details
    const { data: candidateData } = await supabase
      .from('candidate_profiles')
      .select('phone, whatsapp')
      .eq('id', candidateId)
      .single();

    // Also check profiles table for phone
    const { data: profileData } = await supabase
      .from('profiles')
      .select('phone, email')
      .eq('id', candidateId)
      .single();

    return {
      success: true,
      alreadyUnlocked: false,
      contact: {
        phone: candidateData?.phone || profileData?.phone || null,
        whatsapp: candidateData?.whatsapp || candidateData?.phone || profileData?.phone || null,
        email: profileData?.email || null,
      },
      creditsSpent: ZCC_COSTS.CONTACT_UNLOCK,
      balance: spendResult.balance,
    };
  } catch (err) {
    console.error('Error unlocking contact:', err);
    return { success: false, error: 'Failed to unlock contact' };
  }
}

/**
 * Check if an employer has unlocked a candidate's contact.
 */
export async function hasUnlockedContact(employerId, candidateId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('zcc_contact_unlocks')
      .select('id, unlocked_at')
      .eq('employer_id', employerId)
      .eq('candidate_id', candidateId)
      .single();

    if (error && error.code === 'PGRST116') {
      return { success: true, unlocked: false };
    }

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, unlocked: true, unlockedAt: data.unlocked_at };
  } catch (err) {
    console.error('Error checking unlock:', err);
    return { success: false, error: 'Failed to check unlock status' };
  }
}

/**
 * Get featured posts for the homepage / listing pages.
 * Returns only currently active featured posts.
 */
export async function getFeaturedPosts(type = null, limit = 6) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('zcc_featured_posts')
      .select(`
        id,
        post_id,
        label,
        starts_at,
        ends_at
      `)
      .gt('ends_at', new Date().toISOString())
      .lte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: false })
      .limit(limit);

    const { data: featuredData, error: featuredError } = await query;

    if (featuredError || !featuredData || featuredData.length === 0) {
      return { success: true, posts: [] };
    }

    // Get the actual listings for these featured posts
    const postIds = featuredData.map(f => f.post_id);

    let listingsQuery = supabase
      .from('listings')
      .select(`
        id, title, description, type, location, pay_min, pay_max, pay_currency,
        start_date, duration, status, created_at,
        employer_id
      `)
      .in('id', postIds)
      .eq('status', 'active');

    if (type) {
      listingsQuery = listingsQuery.eq('type', type);
    }

    const { data: listings, error: listingsError } = await listingsQuery;

    if (listingsError) {
      return { success: false, error: listingsError.message };
    }

    // Merge featured info with listing data
    const posts = (listings || []).map(listing => {
      const featured = featuredData.find(f => f.post_id === listing.id);
      return {
        ...listing,
        featured_label: featured?.label || 'featured',
        featured_until: featured?.ends_at,
      };
    });

    return { success: true, posts };
  } catch (err) {
    console.error('Error getting featured posts:', err);
    return { success: false, error: 'Failed to get featured posts' };
  }
}

/**
 * Get free application count remaining for a candidate this month.
 */
export async function getCandidateApplyQuota(candidateId) {
  try {
    const supabase = await createClient();

    // Count applications this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('candidate_id', candidateId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      return { success: false, error: error.message };
    }

    const used = count || 0;
    const freeRemaining = Math.max(0, ZCC_FREE.FREE_APPLIES_PER_MONTH - used);

    return {
      success: true,
      freeLimit: ZCC_FREE.FREE_APPLIES_PER_MONTH,
      used,
      freeRemaining,
      needsCredits: freeRemaining === 0,
    };
  } catch (err) {
    console.error('Error getting apply quota:', err);
    return { success: false, error: 'Failed to get apply quota' };
  }
}

/**
 * Add test credits for development (keeps backward compatibility).
 */
export async function addTestWalletCredits(userId, amount = 500) {
  return topupCredits(userId, amount, {
    type: 'bonus',
    reference: `TEST-${Date.now()}`,
  });
}
