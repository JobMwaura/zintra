/**
 * Contact Unlock Mechanics
 * Handles revealing candidate contact info after employers shortlist
 * Second monetization layer: unlocking contact details
 */

import { supabase } from '@/lib/supabase/client';
import type { ContactUnlock } from '@/types/careers';

/**
 * Contact unlock pricing (in KES)
 * Charged when employer reveals a candidate's contact info
 */
export const CONTACT_UNLOCK_PRICE = 200; // Per candidate revealed

/**
 * Unlock a candidate's contact information for an employer
 * Deducts credits and creates unlock record
 */
export async function unlockContact(
  employerId: string,
  candidateId: string,
  credits_available: number
): Promise<{ success: boolean; message: string; unlock?: ContactUnlock }> {
  // Check if already unlocked
  const { data: existing } = await supabase
    .from('contact_unlocks')
    .select('id')
    .eq('employer_id', employerId)
    .eq('candidate_id', candidateId)
    .single();

  if (existing) {
    return { success: false, message: 'You have already unlocked this candidate.' };
  }

  // Check if employer has enough credits
  if (credits_available < CONTACT_UNLOCK_PRICE) {
    return {
      success: false,
      message: `Insufficient credits. You have ${credits_available} but need ${CONTACT_UNLOCK_PRICE}.`,
    };
  }

  // Create unlock record
  const { data: unlock, error: unlockError } = await supabase
    .from('contact_unlocks')
    .insert({
      employer_id: employerId,
      candidate_id: candidateId,
      unlocked_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (unlockError) {
    console.error('Error creating unlock:', unlockError);
    return { success: false, message: 'Failed to unlock contact. Please try again.' };
  }

  // Deduct credits from ledger
  const { error: ledgerError } = await supabase.from('credits_ledger').insert({
    employer_id: employerId,
    credit_type: 'contact_unlock',
    amount: -CONTACT_UNLOCK_PRICE,
    balance_before: credits_available,
    balance_after: credits_available - CONTACT_UNLOCK_PRICE,
    reference_id: unlock.id,
  });

  if (ledgerError) {
    console.error('Error deducting credits:', ledgerError);
    // TODO: Rollback unlock creation
    return { success: false, message: 'Failed to deduct credits. Please try again.' };
  }

  return {
    success: true,
    message: 'Contact information unlocked!',
    unlock,
  };
}

/**
 * Check if employer can see candidate's contact info
 */
export async function hasContactAccess(
  employerId: string,
  candidateId: string
): Promise<boolean> {
  const { data: unlock, error } = await supabase
    .from('contact_unlocks')
    .select('id')
    .eq('employer_id', employerId)
    .eq('candidate_id', candidateId)
    .single();

  return !error && !!unlock;
}

/**
 * Get all unlocked candidates for an employer
 */
export async function getUnlockedCandidates(
  employerId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{
  candidates: any[]; // Should include candidate profile details
  total: number;
}> {
  // Fetch unlocked candidate IDs
  const { data: unlocks, error: unlocksError, count } = await supabase
    .from('contact_unlocks')
    .select('candidate_id', { count: 'exact' })
    .eq('employer_id', employerId)
    .order('unlocked_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unlocksError) {
    console.error('Error fetching unlocks:', unlocksError);
    return { candidates: [], total: 0 };
  }

  if (!unlocks || unlocks.length === 0) {
    return { candidates: [], total: count || 0 };
  }

  // Fetch full candidate profiles
  const candidateIds = unlocks.map((u) => u.candidate_id);
  const { data: candidates, error: candidatesError } = await supabase
    .from('candidate_profiles')
    .select(
      `
        *,
        profile:profiles(
          id, email, phone, created_at
        )
      `
    )
    .in('id', candidateIds)
    .order('created_at', { ascending: false });

  if (candidatesError) {
    console.error('Error fetching candidate profiles:', candidatesError);
    return { candidates: [], total: count || 0 };
  }

  return { candidates: candidates || [], total: count || 0 };
}

/**
 * Get unlock statistics for an employer
 */
export async function getUnlockStats(employerId: string): Promise<{
  total_unlocked: number;
  unlocked_this_month: number;
  total_spent_on_unlocks: number;
}> {
  const now = new Date();
  const month_start = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total unlocks
  const { count: total_count } = await supabase
    .from('contact_unlocks')
    .select('id', { count: 'exact' })
    .eq('employer_id', employerId);

  // Unlocks this month
  const { count: month_count } = await supabase
    .from('contact_unlocks')
    .select('id', { count: 'exact' })
    .eq('employer_id', employerId)
    .gte('unlocked_at', month_start.toISOString());

  // Total spent
  const { data: spending } = await supabase
    .from('credits_ledger')
    .select('amount')
    .eq('employer_id', employerId)
    .eq('credit_type', 'contact_unlock')
    .lt('amount', 0); // Only deductions

  const total_spent = (spending || []).reduce((sum, item) => sum + Math.abs(item.amount), 0);

  return {
    total_unlocked: total_count || 0,
    unlocked_this_month: month_count || 0,
    total_spent_on_unlocks: total_spent,
  };
}

/**
 * Send outreach message from employer to candidate
 * Uses unlocked contact or included outreach messages in plan
 */
export async function sendOutreachMessage(
  employerId: string,
  candidateId: string,
  messageBody: string,
  credits_available: number,
  plan_outreach_included: number
): Promise<{ success: boolean; message: string; conversation_id?: string }> {
  // Check if employer has access to candidate
  const hasAccess = await hasContactAccess(employerId, candidateId);

  if (!hasAccess && plan_outreach_included <= 0) {
    return {
      success: false,
      message: 'You must unlock this candidate or upgrade your plan to send messages.',
    };
  }

  // Check rate limiting (max 5 messages per candidate per day)
  const today_start = new Date();
  today_start.setHours(0, 0, 0, 0);

  const { count: today_messages } = await supabase
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('sender_id', employerId)
    .eq('recipient_id', candidateId)
    .gte('created_at', today_start.toISOString());

  if ((today_messages || 0) >= 5) {
    return { success: false, message: 'You have reached the daily message limit for this candidate.' };
  }

  // Check if conversation exists
  let { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('employer_id', employerId)
    .eq('candidate_id', candidateId)
    .single();

  if (convError) {
    // Create new conversation
    const { data: newConv, error: newConvError } = await supabase
      .from('conversations')
      .insert({
        employer_id: employerId,
        candidate_id: candidateId,
        initiated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (newConvError) {
      console.error('Error creating conversation:', newConvError);
      return { success: false, message: 'Failed to send message. Please try again.' };
    }

    conversation = newConv;
  }

  // Create message
  const { error: messageError } = await supabase.from('messages').insert({
    conversation_id: conversation!.id,
    sender_id: employerId,
    recipient_id: candidateId,
    message_body: messageBody,
    created_at: new Date().toISOString(),
  });

  if (messageError) {
    console.error('Error creating message:', messageError);
    return { success: false, message: 'Failed to send message. Please try again.' };
  }

  // Deduct credit if not included in plan
  if (plan_outreach_included <= 0 && credits_available >= CONTACT_UNLOCK_PRICE) {
    await supabase.from('credits_ledger').insert({
      employer_id: employerId,
      credit_type: 'outreach_message',
      amount: -100, // Outreach messages cost less than unlocks
      balance_before: credits_available,
      balance_after: credits_available - 100,
    });
  }

  return {
    success: true,
    message: 'Message sent!',
    conversation_id: conversation!.id,
  };
}
