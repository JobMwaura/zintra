import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/negotiations/[negotiationId]
 * Fetch complete negotiation thread with all counter offers, Q&A, and revisions
 * 
 * Query parameters:
 * - negotiationId: string (UUID) - ID of the negotiation thread
 * 
 * Response:
 * {
 *   thread: object (negotiation_threads row),
 *   counterOffers: array (counter_offers rows),
 *   qaItems: array (negotiation_qa rows),
 *   revisions: array (quote_revisions rows)
 * }
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { negotiationId } = req.query;

    // Validate input
    if (!negotiationId) {
      return res.status(400).json({
        error: 'Missing required parameter: negotiationId'
      });
    }

    // Fetch negotiation thread
    const { data: thread, error: threadError } = await supabase
      .from('negotiation_threads')
      .select('*')
      .eq('id', negotiationId)
      .single();

    if (threadError) {
      if (threadError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Negotiation thread not found'
        });
      }
      throw new Error(threadError.message);
    }

    if (!thread) {
      return res.status(404).json({
        error: 'Negotiation thread not found'
      });
    }

    // Fetch counter offers (ordered by most recent first)
    const { data: counterOffers, error: offersError } = await supabase
      .from('counter_offers')
      .select(`
        id,
        negotiation_id,
        quote_id,
        proposed_by,
        proposed_price,
        scope_changes,
        delivery_date,
        payment_terms,
        notes,
        status,
        response_by_date,
        rejected_reason,
        created_at,
        updated_at
      `)
      .eq('negotiation_id', negotiationId)
      .order('created_at', { ascending: false });

    if (offersError) {
      console.error('Counter offers fetch error:', offersError);
      throw new Error(offersError.message);
    }

    // Fetch Q&A items (ordered by oldest first)
    const { data: qaItems, error: qaError } = await supabase
      .from('negotiation_qa')
      .select(`
        id,
        negotiation_id,
        quote_id,
        asked_by,
        question,
        answer,
        answered_at,
        answered_by,
        created_at
      `)
      .eq('negotiation_id', negotiationId)
      .order('created_at', { ascending: true });

    if (qaError) {
      console.error('Q&A fetch error:', qaError);
      throw new Error(qaError.message);
    }

    // Fetch quote revisions (ordered by most recent first)
    const { data: revisions, error: revisionsError } = await supabase
      .from('quote_revisions')
      .select(`
        id,
        quote_id,
        revision_number,
        price,
        scope_summary,
        delivery_date,
        payment_terms,
        changed_by,
        change_reason,
        revision_notes,
        created_at
      `)
      .eq('quote_id', thread.quote_id)
      .order('revision_number', { ascending: false });

    if (revisionsError) {
      console.error('Revisions fetch error:', revisionsError);
      throw new Error(revisionsError.message);
    }

    // Calculate negotiation statistics
    const acceptedOffers = counterOffers.filter(co => co.status === 'accepted') || [];
    const pendingOffers = counterOffers.filter(co => co.status === 'pending') || [];
    const rejectedOffers = counterOffers.filter(co => co.status === 'rejected') || [];
    const answeredQuestions = (qaItems || []).filter(qa => qa.answer) || [];

    return res.status(200).json({
      thread: {
        ...thread,
        // Add calculated stats
        stats: {
          totalCounterOffers: counterOffers?.length || 0,
          acceptedOffers: acceptedOffers.length,
          pendingOffers: pendingOffers.length,
          rejectedOffers: rejectedOffers.length,
          totalQuestions: qaItems?.length || 0,
          answeredQuestions: answeredQuestions.length,
          unansweredQuestions: (qaItems?.length || 0) - answeredQuestions.length,
          totalRevisions: revisions?.length || 0
        }
      },
      counterOffers: counterOffers || [],
      qaItems: qaItems || [],
      revisions: revisions || []
    });

  } catch (error) {
    console.error('Fetch negotiation error:', error);
    return res.status(500).json({
      error: 'Failed to fetch negotiation',
      details: error.message
    });
  }
}
