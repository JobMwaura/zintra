/**
 * Credits System Helper Functions
 * Handles all credit operations: purchases, deductions, refunds, etc.
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Get user's current credit balance
 */
export async function getUserCreditsBalance(userId) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_credits')
      .select('credit_balance, total_purchased, total_used, total_refunded')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching credits balance:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserCreditsBalance:', error);
    return null;
  }
}

/**
 * Get cost of a specific action
 */
export async function getActionCost(actionType) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('credit_pricing_actions')
      .select('cost_ksh')
      .eq('action_type', actionType)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching action cost:', error);
      return null;
    }

    return data?.cost_ksh || 0;
  } catch (error) {
    console.error('Error in getActionCost:', error);
    return null;
  }
}

/**
 * Check if user has enough credits for an action
 */
export async function checkSufficientCredits(userId, actionType) {
  try {
    const balance = await getUserCreditsBalance(userId);
    const cost = await getActionCost(actionType);

    if (!balance || cost === null) {
      return {
        hasSufficient: false,
        error: 'Unable to verify credits',
        balance: balance?.credit_balance || 0,
        cost: cost || 0,
      };
    }

    return {
      hasSufficient: balance.credit_balance >= cost,
      balance: balance.credit_balance,
      cost: cost,
    };
  } catch (error) {
    console.error('Error in checkSufficientCredits:', error);
    return {
      hasSufficient: false,
      error: 'Error checking credits',
    };
  }
}

/**
 * Deduct credits for an action
 * Returns: { success, message, newBalance, error }
 */
export async function deductCredits(userId, actionType, referenceId = null) {
  try {
    const supabase = createClient();

    // Check sufficient credits
    const costResult = await getActionCost(actionType);
    if (costResult === null) {
      return {
        success: false,
        error: 'Invalid action type',
      };
    }

    // Call deduct function
    const { data, error } = await supabase
      .rpc('deduct_user_credits', {
        p_user_id: userId,
        p_amount: costResult,
        p_action_type: actionType,
        p_reference_id: referenceId,
        p_description: `${actionType} action`,
      });

    if (error) {
      console.error('Error deducting credits:', error);
      return {
        success: false,
        error: error.message || 'Failed to deduct credits',
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error,
        balance: data.current_balance,
      };
    }

    return {
      success: true,
      message: data.message,
      balanceBefore: data.balance_before,
      balanceAfter: data.balance_after,
    };
  } catch (error) {
    console.error('Error in deductCredits:', error);
    return {
      success: false,
      error: 'Unexpected error during deduction',
    };
  }
}

/**
 * Add credits to user account (for purchases or bonuses)
 */
export async function addCredits(
  userId,
  amount,
  transactionType = 'purchase',
  paymentMethod = null,
  mpesaTransactionId = null,
  description = null
) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .rpc('add_user_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_transaction_type: transactionType,
        p_payment_method: paymentMethod,
        p_mpesa_transaction_id: mpesaTransactionId,
        p_description: description,
      });

    if (error) {
      console.error('Error adding credits:', error);
      return {
        success: false,
        error: error.message || 'Failed to add credits',
      };
    }

    return {
      success: true,
      message: data.message,
      amountAdded: data.amount_added,
    };
  } catch (error) {
    console.error('Error in addCredits:', error);
    return {
      success: false,
      error: 'Unexpected error adding credits',
    };
  }
}

/**
 * Refund credits (partial or full)
 */
export async function refundCredits(userId, amount, reason = 'Refund', referenceId = null) {
  try {
    const supabase = createClient();

    // Add back to balance
    const result = await addCredits(
      userId,
      amount,
      'refund',
      null,
      null,
      reason
    );

    if (!result.success) {
      return result;
    }

    // Log refund
    if (referenceId) {
      await supabase
        .from('credit_usage_logs')
        .insert({
          user_id: userId,
          action_type: 'refund',
          credits_deducted: -amount, // Negative to show it's a credit
          reference_id: referenceId,
          reason: reason,
        });
    }

    return result;
  } catch (error) {
    console.error('Error in refundCredits:', error);
    return {
      success: false,
      error: 'Error processing refund',
    };
  }
}

/**
 * Get credit transaction history for a user
 */
export async function getTransactionHistory(userId, limit = 20) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTransactionHistory:', error);
    return [];
  }
}

/**
 * Get all available credit packages
 */
export async function getCreditPackages(userType) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('credits_packages')
      .select('*')
      .eq('user_type', userType)
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching packages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCreditPackages:', error);
    return [];
  }
}

/**
 * Apply promo code to a transaction
 */
export async function validatePromoCode(code) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('credit_promotions')
      .select('*')
      .eq('code', code)
      .gte('valid_until', new Date().toISOString())
      .lte('valid_from', new Date().toISOString())
      .single();

    if (error) {
      return {
        valid: false,
        error: 'Invalid or expired promo code',
      };
    }

    // Check usage limit
    if (data.usage_limit && data.used_count >= data.usage_limit) {
      return {
        valid: false,
        error: 'Promo code usage limit reached',
      };
    }

    return {
      valid: true,
      code: data.code,
      discountPercentage: data.discount_percentage,
      creditBonus: data.credit_bonus,
    };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return {
      valid: false,
      error: 'Error validating promo code',
    };
  }
}

/**
 * Record promo code usage
 */
export async function recordPromoCodeUsage(code) {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('credit_promotions')
      .update({ used_count: supabase.rpc('increment_used_count', { p_code: code }) })
      .eq('code', code);

    if (error) {
      console.error('Error recording promo usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in recordPromoCodeUsage:', error);
    return false;
  }
}

/**
 * Create a payment transaction (for M-Pesa, Card, etc.)
 */
export async function createPaymentTransaction(
  userId,
  amount,
  paymentMethod,
  packageId = null
) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: 'purchase',
        amount: amount,
        payment_method: paymentMethod,
        status: 'pending',
        description: packageId ? `Credit package purchase` : `Credit purchase`,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment transaction:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createPaymentTransaction:', error);
    return null;
  }
}

/**
 * Update payment transaction status
 */
export async function updatePaymentStatus(
  transactionId,
  status,
  mpesaTransactionId = null,
  mpesaResponseCode = null
) {
  try {
    const supabase = createClient();

    const updateData = {
      status: status,
    };

    if (mpesaTransactionId) {
      updateData.mpesa_transaction_id = mpesaTransactionId;
    }

    if (mpesaResponseCode) {
      updateData.mpesa_response_code = mpesaResponseCode;
    }

    const { error } = await supabase
      .from('credit_transactions')
      .update(updateData)
      .eq('id', transactionId);

    if (error) {
      console.error('Error updating payment status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    return false;
  }
}

/**
 * Get credit usage statistics for a user
 */
export async function getCreditStatistics(userId) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('credit_usage_logs')
      .select('action_type, credits_deducted')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching statistics:', error);
      return {};
    }

    // Aggregate by action type
    const stats = {};
    (data || []).forEach((log) => {
      if (!stats[log.action_type]) {
        stats[log.action_type] = {
          count: 0,
          totalCost: 0,
        };
      }
      stats[log.action_type].count += 1;
      stats[log.action_type].totalCost += log.credits_deducted;
    });

    return stats;
  } catch (error) {
    console.error('Error in getCreditStatistics:', error);
    return {};
  }
}

/**
 * Check if action would exceed rate limit
 */
export async function checkRateLimit(userId, actionType) {
  try {
    const supabase = createClient();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const { count, error } = await supabase
      .from('credit_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action_type', actionType)
      .gte('created_at', oneHourAgo.toISOString());

    if (error) {
      console.error('Error checking rate limit:', error);
      return { limited: false };
    }

    // Define limits per action
    const limits = {
      'post_job': 10,
      'post_gig': 10,
      'apply_job': 50,
      'apply_gig': 50,
    };

    const limit = limits[actionType] || 10;
    const isLimited = (count || 0) >= limit;

    return {
      limited: isLimited,
      count: count || 0,
      limit: limit,
      remaining: Math.max(0, limit - (count || 0)),
    };
  } catch (error) {
    console.error('Error in checkRateLimit:', error);
    return { limited: false };
  }
}
