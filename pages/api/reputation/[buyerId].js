/**
 * ============================================================================
 * FETCH REPUTATION ENDPOINT
 * ============================================================================
 * GET /api/reputation/[userId]
 * 
 * Fetch reputation data for a specific user
 * 
 * Query Parameters:
 * - userId (required): UUID of the user
 * 
 * Response (Success):
 * {
 *   "id": "uuid",
 *   "user_id": "uuid",
 *   "total_rfqs": 15,
 *   "response_rate": 85.5,
 *   "acceptance_rate": 72.3,
 *   "reputation_score": 78,
 *   "badge_tier": "platinum",
 *   "created_at": "2025-12-18T...",
 *   "updated_at": "2025-12-18T..."
 * }
 * 
 * Response (Not Found - Returns Default):
 * {
 *   "user_id": "uuid",
 *   "total_rfqs": 0,
 *   "response_rate": 0,
 *   "acceptance_rate": 0,
 *   "reputation_score": 0,
 *   "badge_tier": "bronze",
 *   "created_at": "2025-12-18T...",
 *   "updated_at": "2025-12-18T..."
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

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const { buyerId } = req.query;

    // Validate input
    if (!buyerId) {
      return res.status(400).json({ error: 'userId is required in query parameters' });
    }

    if (typeof buyerId !== 'string' || buyerId.length < 36) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Fetch reputation data from database
    const { data: reputation, error } = await supabase
      .from('reputation_scores')
      .select('*')
      .eq('user_id', buyerId)
      .single();

    // Handle "no rows" error (not found) gracefully
    if (error && error.code === 'PGRST116') {
      // Return default reputation for new users
      const now = new Date().toISOString();
      return res.status(200).json({
        user_id: buyerId,
        total_rfqs: 0,
        response_rate: 0,
        acceptance_rate: 0,
        reputation_score: 0,
        badge_tier: 'bronze',
        created_at: now,
        updated_at: now,
        isDefault: true
      });
    }

    // Handle other errors
    if (error) {
      console.error('Error fetching reputation:', error);
      throw new Error(`Failed to fetch reputation: ${error.message}`);
    }

    // Return reputation data
    return res.status(200).json(reputation);

  } catch (error) {
    console.error('Fetch reputation error:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch reputation',
      details: error.message,
      code: 'REPUTATION_FETCH_ERROR'
    });
  }
}
