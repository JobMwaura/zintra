'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Get user profile with reputation metrics
 * Safe to call from client or server
 */
export async function getUserProfile(userId) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching user profile:', err);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error updating user profile:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Increment RFQ count for user
 * Called after RFQ is successfully created
 */
export async function incrementRFQCount(userId) {
  try {
    const supabase = await createClient();
    
    // Get current count
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('rfq_count')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching RFQ count:', fetchError);
      return false;
    }

    // Increment
    const { error: updateError } = await supabase
      .from('users')
      .update({
        rfq_count: (user.rfq_count || 0) + 1,
        last_rfq_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error incrementing RFQ count:', updateError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error incrementing RFQ count:', err);
    return false;
  }
}

/**
 * Check if user is suspended
 */
export async function checkUserSuspension(userId) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('is_suspended, suspension_reason, suspension_until')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking suspension:', error);
      return { suspended: false };
    }

    // Check if suspension has expired
    const now = new Date();
    const suspensionExpired = data.suspension_until 
      ? new Date(data.suspension_until) < now 
      : false;

    if (data.is_suspended && suspensionExpired) {
      // Auto-unsuspend if time has passed
      await supabase
        .from('users')
        .update({ is_suspended: false })
        .eq('id', userId);
      
      return { suspended: false };
    }

    return {
      suspended: data.is_suspended || false,
      reason: data.suspension_reason,
      until: data.suspension_until,
    };
  } catch (err) {
    console.error('Unexpected error checking suspension:', err);
    return { suspended: false };
  }
}

/**
 * Update buyer reputation based on RFQ metrics
 * Call this periodically (e.g., after RFQ is completed)
 */
export async function updateBuyerReputation(userId) {
  try {
    const supabase = await createClient();
    
    // Get user's RFQ metrics
    const { data: rfqs, error: rfqError } = await supabase
      .from('rfqs')
      .select('id')
      .eq('user_id', userId);

    if (rfqError) {
      console.error('Error fetching RFQs:', rfqError);
      return false;
    }

    const totalRfqs = rfqs?.length || 0;
    
    // Get quote metrics
    const { data: responses, error: responseError } = await supabase
      .from('rfq_responses')
      .select('status')
      .in('rfq_id', rfqs?.map(r => r.id) || []);

    if (responseError) {
      console.error('Error fetching responses:', responseError);
      return false;
    }

    const totalResponses = responses?.length || 0;
    const acceptedResponses = responses?.filter(r => r.status === 'accepted').length || 0;
    
    // Calculate response rate
    const responseRate = totalRfqs > 0 ? (totalResponses / totalRfqs) : 0;
    
    // Determine reputation tier
    let newReputation = 'new';
    if (totalRfqs >= 50 && acceptedResponses >= 10) {
      newReputation = 'platinum';
    } else if (totalRfqs >= 30 && acceptedResponses >= 5) {
      newReputation = 'gold';
    } else if (totalRfqs >= 15 && acceptedResponses >= 3) {
      newReputation = 'silver';
    } else if (totalRfqs >= 5 && acceptedResponses >= 1) {
      newReputation = 'bronze';
    }

    // Update user reputation
    const { error: updateError } = await supabase
      .from('users')
      .update({
        rfq_count: totalRfqs,
        quotes_received: totalResponses,
        quotes_accepted: acceptedResponses,
        response_rate: parseFloat(responseRate.toFixed(2)),
        buyer_reputation: newReputation,
        trust_score: parseFloat((responseRate * 5).toFixed(2)), // Scale 0-5
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating reputation:', updateError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error updating reputation:', err);
    return false;
  }
}

/**
 * Get user's daily RFQ quota status
 * Similar to /api/rfq-rate-limit but reads from users table
 */
export async function getUserRFQQuota(userId) {
  try {
    const supabase = await createClient();
    
    // Get user's daily limit
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('rfq_limit_daily, is_suspended')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user limit:', userError);
      return { error: 'Could not fetch user quota' };
    }

    if (user.is_suspended) {
      return { 
        suspended: true,
        message: 'Your account is currently suspended and cannot post RFQs',
      };
    }

    // Get RFQs created in last 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: recentRfqs, error: rfqError } = await supabase
      .from('rfqs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .lte('created_at', now.toISOString());

    if (rfqError) {
      console.error('Error fetching recent RFQs:', rfqError);
      return { error: 'Could not check quota' };
    }

    const count = recentRfqs?.length || 0;
    const dailyLimit = user.rfq_limit_daily || 2;
    const remaining = Math.max(0, dailyLimit - count);
    const isLimited = count >= dailyLimit;

    return {
      count,
      dailyLimit,
      remaining,
      isLimited,
      resetTime: twentyFourHoursAgo.getTime() + 24 * 60 * 60 * 1000,
    };
  } catch (err) {
    console.error('Unexpected error getting quota:', err);
    return { error: 'Could not check quota' };
  }
}
