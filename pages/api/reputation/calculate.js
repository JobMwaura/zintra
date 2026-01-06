/**
 * ============================================================================
 * REPUTATION CALCULATION ENDPOINT
 * ============================================================================
 * POST /api/reputation/calculate
 * 
 * Calculate and update user reputation based on RFQ activity
 * 
 * Request Body:
 * {
 *   "userId": "uuid"
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "reputation": {
 *     "id": "uuid",
 *     "user_id": "uuid",
 *     "total_rfqs": 15,
 *     "response_rate": 85.5,
 *     "acceptance_rate": 72.3,
 *     "reputation_score": 78,
 *     "badge_tier": "platinum",
 *     "updated_at": "2025-12-18T..."
 *   },
 *   "metrics": {
 *     "totalRfqs": 15,
 *     "responseRate": 85.5,
 *     "acceptanceRate": 72.3
 *   }
 * }
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Calculate reputation score from metrics
 */
function calculateReputationScore(totalRfqs, responseRate, acceptanceRate) {
  const rfqScore = Math.min(totalRfqs * 2, 30);
  const responseScore = (responseRate / 100) * 35;
  const acceptanceScore = (acceptanceRate / 100) * 35;
  
  return Math.round(rfqScore + responseScore + acceptanceScore);
}

/**
 * Determine badge tier based on reputation score
 */
function determineBadgeTier(score) {
  if (score >= 75) return 'platinum';
  if (score >= 50) return 'gold';
  if (score >= 25) return 'silver';
  return 'bronze';
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).json({ error: 'userId is required in request body' });
    }

    if (typeof userId !== 'string' || userId.length < 36) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Get user's RFQs
    const { data: rfqs, error: rfqError } = await supabase
      .from('rfqs')
      .select('id, status, created_at')
      .eq('user_id', userId);

    if (rfqError) {
      console.error('Error fetching RFQs:', rfqError);
      throw new Error(`Failed to fetch RFQs: ${rfqError.message}`);
    }

    if (!rfqs) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate total RFQs and closed RFQs
    const totalRfqs = rfqs.length;
    const closedRfqs = rfqs.filter(r => r.status === 'closed' || r.status === 'completed').length;
    const responseRate = totalRfqs > 0 ? (closedRfqs / totalRfqs) * 100 : 0;

    // Get quote acceptance rate
    const { data: quotes, error: quotesError } = await supabase
      .from('rfq_quotes')
      .select('id, status, rfq_id')
      .in('rfq_id', rfqs.map(r => r.id));

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError);
      throw new Error(`Failed to fetch quotes: ${quotesError.message}`);
    }

    const selectedQuotes = quotes.filter(q => q.status === 'accepted').length;
    const acceptanceRate = quotes.length > 0 ? (selectedQuotes / quotes.length) * 100 : 0;

    // Calculate final reputation score
    const reputationScore = calculateReputationScore(
      totalRfqs,
      responseRate,
      acceptanceRate
    );

    // Determine badge tier
    const badgeTier = determineBadgeTier(reputationScore);

    // Upsert reputation record
    const { data: reputation, error: updateError } = await supabase
      .from('reputation_scores')
      .upsert(
        {
          user_id: userId,
          total_rfqs: totalRfqs,
          response_rate: parseFloat(responseRate.toFixed(2)),
          acceptance_rate: parseFloat(acceptanceRate.toFixed(2)),
          reputation_score: reputationScore,
          badge_tier: badgeTier,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reputation:', updateError);
      throw new Error(`Failed to update reputation: ${updateError.message}`);
    }

    // Update users table with reputation data
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({
        reputation_score: reputationScore,
        badge_tier: badgeTier
      })
      .eq('id', buyerId);

    if (userUpdateError) {
      console.error('Error updating user reputation:', userUpdateError);
      // Don't throw, as the reputation_scores table is updated
    }

    // Return success response
    return res.status(200).json({
      success: true,
      reputation: reputation,
      metrics: {
        totalRfqs,
        responseRate: parseFloat(responseRate.toFixed(2)),
        acceptanceRate: parseFloat(acceptanceRate.toFixed(2))
      }
    });

  } catch (error) {
    console.error('Reputation calculation error:', error);
    
    return res.status(500).json({
      error: 'Failed to calculate reputation',
      details: error.message,
      code: 'REPUTATION_CALC_ERROR'
    });
  }
}
