/**
 * Credits System
 * Manages credit balances, purchases, usage tracking, and ledger
 * Backbone for all monetization - boosts, unlocks, outreach messages, etc.
 */

import { supabase } from '@/lib/supabase/client';
import type { CreditsLedger } from '@/types/careers';

/**
 * Credit packages available for purchase
 * Pricing in KES
 */
export const CREDIT_PACKAGES = [
  { credits: 100, price: 500, description: '100 credits', popular: false },
  { credits: 500, price: 2000, description: '500 credits (10% bonus)', popular: true },
  { credits: 1000, price: 3500, description: '1000 credits (17% bonus)', popular: false },
  { credits: 5000, price: 15000, description: '5000 credits (25% bonus)', popular: false },
];

/**
 * Get current credit balance for an employer
 */
export async function getCreditsBalance(employerId: string): Promise<number> {
  // Get the most recent balance record
  const { data, error } = await supabase
    .from('credits_ledger')
    .select('balance')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // If no ledger entry, assume zero balance
    return 0;
  }

  return data?.balance || 0;
}

/**
 * Add credits to employer's account (e.g., after purchase)
 * This creates a ledger entry tracking the credit addition
 */
export async function addCredits(
  employerId: string,
  amount: number,
  creditType: 'purchase' | 'bonus' | 'refund' | 'promotional',
  reference_id?: string
): Promise<{ success: boolean; message: string; new_balance?: number }> {
  if (amount <= 0) {
    return { success: false, message: 'Amount must be greater than zero.' };
  }

  // Get current balance
  const current_balance = await getCreditsBalance(employerId);
  const new_balance = current_balance + amount;

  // Create ledger entry
  const { error } = await supabase.from('credits_ledger').insert({
    employer_id: employerId,
    credit_type: creditType,
    amount: amount, // Positive = addition
    balance_before: current_balance,
    balance_after: new_balance,
    reference_id: reference_id,
  });

  if (error) {
    console.error('Error adding credits:', error);
    return { success: false, message: 'Failed to add credits. Please try again.' };
  }

  return { success: true, message: `${amount} credits added!`, new_balance };
}

/**
 * Deduct credits from employer's account
 * This creates a ledger entry tracking the deduction
 */
export async function deductCredits(
  employerId: string,
  amount: number,
  creditType: CreditsLedger['credit_type'],
  reference_id?: string
): Promise<{ success: boolean; message: string; new_balance?: number }> {
  if (amount <= 0) {
    return { success: false, message: 'Amount must be greater than zero.' };
  }

  // Get current balance
  const current_balance = await getCreditsBalance(employerId);

  if (current_balance < amount) {
    return {
      success: false,
      message: `Insufficient credits. You have ${current_balance} but need ${amount}.`,
    };
  }

  const new_balance = current_balance - amount;

  // Create ledger entry
  const { error } = await supabase.from('credits_ledger').insert({
    employer_id: employerId,
    credit_type: creditType,
    amount: -amount, // Negative = deduction
    balance_before: current_balance,
    balance_after: new_balance,
    reference_id: reference_id,
  });

  if (error) {
    console.error('Error deducting credits:', error);
    return { success: false, message: 'Failed to deduct credits. Please try again.' };
  }

  return { success: true, message: `${amount} credits used.`, new_balance };
}

/**
 * Get credit usage summary for an employer
 */
export async function getCreditsSummary(employerId: string): Promise<{
  current_balance: number;
  total_purchased: number;
  total_spent: number;
  spending_breakdown: Record<string, number>;
}> {
  const { data: ledger, error } = await supabase
    .from('credits_ledger')
    .select('*')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching credits ledger:', error);
    return {
      current_balance: 0,
      total_purchased: 0,
      total_spent: 0,
      spending_breakdown: {},
    };
  }

  const entries = ledger || [];

  // Calculate totals
  let total_purchased = 0;
  let total_spent = 0;
  const spending_breakdown: Record<string, number> = {};

  entries.forEach((entry) => {
    if (entry.amount > 0 && (entry.credit_type === 'purchase' || entry.credit_type === 'bonus')) {
      total_purchased += entry.amount;
    } else if (entry.amount < 0) {
      total_spent += Math.abs(entry.amount);
      spending_breakdown[entry.credit_type] = (spending_breakdown[entry.credit_type] || 0) + Math.abs(entry.amount);
    }
  });

  const current_balance = total_purchased - total_spent;

  return {
    current_balance,
    total_purchased,
    total_spent,
    spending_breakdown,
  };
}

/**
 * Get detailed ledger history for an employer
 */
export async function getCreditsLedger(
  employerId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{
  entries: CreditsLedger[];
  total: number;
}> {
  const { data: entries, count, error } = await supabase
    .from('credits_ledger')
    .select('*', { count: 'exact' })
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching ledger:', error);
    return { entries: [], total: 0 };
  }

  return { entries: entries || [], total: count || 0 };
}

/**
 * Get spending this month
 */
export async function getMonthlySpending(employerId: string): Promise<number> {
  const now = new Date();
  const month_start = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: ledger, error } = await supabase
    .from('credits_ledger')
    .select('amount')
    .eq('employer_id', employerId)
    .gte('created_at', month_start.toISOString())
    .lt('amount', 0); // Only deductions

  if (error) {
    console.error('Error fetching monthly spending:', error);
    return 0;
  }

  return (ledger || []).reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
}

/**
 * Set a credit allowance for an employer (e.g., plan-included credits)
 */
export async function allocateCreditsForPlan(
  employerId: string,
  planCredits: number,
  month: Date = new Date()
): Promise<{ success: boolean; message: string }> {
  // Check if credits already allocated for this month
  const month_start = new Date(month.getFullYear(), month.getMonth(), 1);
  const month_end = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  const { data: existing } = await supabase
    .from('credits_ledger')
    .select('id')
    .eq('employer_id', employerId)
    .eq('credit_type', 'plan_allocation')
    .gte('created_at', month_start.toISOString())
    .lt('created_at', month_end.toISOString())
    .single();

  if (existing) {
    return { success: false, message: 'Plan credits already allocated for this month.' };
  }

  // Allocate credits
  const result = await addCredits(employerId, planCredits, 'promotional');

  return {
    success: result.success,
    message: result.message || 'Plan credits allocated.',
  };
}

/**
 * Validate credit package and get details
 */
export function getPackageDetails(packageId: number): (typeof CREDIT_PACKAGES)[0] | null {
  return CREDIT_PACKAGES[packageId] || null;
}

/**
 * Get recommended package for employer
 */
export function getRecommendedPackage(monthlySpending: number): (typeof CREDIT_PACKAGES)[0] {
  if (monthlySpending > 10000) {
    return CREDIT_PACKAGES[3]; // 5000 credits
  } else if (monthlySpending > 5000) {
    return CREDIT_PACKAGES[2]; // 1000 credits
  } else if (monthlySpending > 2000) {
    return CREDIT_PACKAGES[1]; // 500 credits
  }
  return CREDIT_PACKAGES[0]; // 100 credits
}

/**
 * Expire monthly plan credits (run at start of each month via cron)
 */
export async function expireMonthlyCredits(
  employerId: string,
  previousMonth: Date
): Promise<{ success: boolean; remaining_credits: number }> {
  const month_start = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
  const month_end = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 1);

  // Get all plan allocations for the previous month
  const { data: allocations } = await supabase
    .from('credits_ledger')
    .select('amount')
    .eq('employer_id', employerId)
    .eq('credit_type', 'plan_allocation')
    .gte('created_at', month_start.toISOString())
    .lt('created_at', month_end.toISOString());

  const unused_credits = (allocations || []).reduce((sum, alloc) => sum + alloc.amount, 0);

  if (unused_credits > 0) {
    // Create an expiry record (doesn't actually deduct, just tracks)
    const { error } = await supabase.from('credits_ledger').insert({
      employer_id: employerId,
      credit_type: 'expired_credits',
      amount: -unused_credits,
      reference_id: `monthly_expiry_${previousMonth.toISOString()}`,
    });

    if (error) {
      console.error('Error expiring credits:', error);
      return { success: false, remaining_credits: unused_credits };
    }
  }

  return { success: true, remaining_credits: unused_credits };
}
