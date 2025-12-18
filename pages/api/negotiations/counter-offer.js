import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/negotiations/counter-offer
 * Submit a counter offer with optional scope changes and delivery date
 * 
 * Request body:
 * {
 *   negotiationId: string (UUID),
 *   quoteId: string (UUID),
 *   proposedBy: string (UUID),
 *   proposedPrice: number,
 *   scopeChanges: string (optional),
 *   deliveryDate: string (ISO date, optional),
 *   paymentTerms: string (optional),
 *   notes: string (optional),
 *   responseByDays: number (default: 3)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   counterOffer: object (counter_offers row)
 * }
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      negotiationId,
      quoteId,
      proposedBy,
      proposedPrice,
      scopeChanges,
      deliveryDate,
      paymentTerms,
      notes,
      responseByDays = 3
    } = req.body;

    // Validate required fields
    if (!negotiationId || !quoteId || !proposedBy || proposedPrice === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: negotiationId, quoteId, proposedBy, proposedPrice'
      });
    }

    // Validate price
    if (typeof proposedPrice !== 'number' || proposedPrice < 0) {
      return res.status(400).json({
        error: 'Invalid price: must be a positive number'
      });
    }

    // Validate response days
    if (typeof responseByDays !== 'number' || responseByDays < 1 || responseByDays > 30) {
      return res.status(400).json({
        error: 'Invalid responseByDays: must be a number between 1 and 30'
      });
    }

    // Calculate response deadline
    const responseByDate = new Date();
    responseByDate.setDate(responseByDate.getDate() + responseByDays);

    // Verify negotiation exists and user is participant
    const { data: negotiation, error: negotiationError } = await supabase
      .from('negotiation_threads')
      .select('id, buyer_id, vendor_id, quote_id')
      .eq('id', negotiationId)
      .eq('quote_id', quoteId)
      .single();

    if (negotiationError || !negotiation) {
      return res.status(404).json({
        error: 'Negotiation not found or quote does not match'
      });
    }

    // Verify user is buyer or vendor
    if (proposedBy !== negotiation.buyer_id && proposedBy !== negotiation.vendor_id) {
      return res.status(403).json({
        error: 'User is not a participant in this negotiation'
      });
    }

    // Create counter offer
    const { data: counterOffer, error: offerError } = await supabase
      .from('counter_offers')
      .insert({
        negotiation_id: negotiationId,
        quote_id: quoteId,
        proposed_by: proposedBy,
        proposed_price: proposedPrice,
        scope_changes: scopeChanges || null,
        delivery_date: deliveryDate || null,
        payment_terms: paymentTerms || null,
        notes: notes || null,
        status: 'pending',
        response_by_date: responseByDate.toISOString()
      })
      .select()
      .single();

    if (offerError) {
      console.error('Counter offer insert error:', offerError);
      throw new Error(offerError.message);
    }

    // Update negotiation thread
    const { error: threadUpdateError } = await supabase
      .from('negotiation_threads')
      .update({
        current_price: proposedPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', negotiationId);

    if (threadUpdateError) {
      console.error('Negotiation update error:', threadUpdateError);
      throw new Error(threadUpdateError.message);
    }

    // Increment counter offer count (done via trigger in database)
    const { error: countError } = await supabase.rpc('increment_counter_offers', {
      thread_id: negotiationId
    }).then(res => ({ error: res.error }));

    if (countError) {
      console.warn('Could not increment counter offer count:', countError);
      // Don't fail the request if this fails
    }

    // Create quote revision
    const { error: revisionError } = await supabase
      .from('quote_revisions')
      .insert({
        quote_id: quoteId,
        price: proposedPrice,
        scope_summary: scopeChanges || null,
        delivery_date: deliveryDate || null,
        payment_terms: paymentTerms || null,
        changed_by: proposedBy,
        change_reason: 'Counter offer submitted',
        revision_notes: notes || null
      });

    if (revisionError) {
      console.warn('Revision creation error:', revisionError);
      // Don't fail the request if this fails
    }

    // Send notification to other party
    const notifiedUserId = proposedBy === negotiation.buyer_id ? negotiation.vendor_id : negotiation.buyer_id;
    
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: notifiedUserId,
        type: 'counter_offer',
        title: 'New Counter Offer Received',
        description: `A counter offer of ₹${proposedPrice.toLocaleString()} has been submitted for your quote`,
        action_id: counterOffer.id,
        action_type: 'counter_offer',
        is_read: false
      });

    if (notificationError) {
      console.warn('Notification creation error:', notificationError);
      // Don't fail the request if this fails
    }

    return res.status(200).json({
      success: true,
      counterOffer: counterOffer
    });

  } catch (error) {
    console.error('Submit counter offer error:', error);
    return res.status(500).json({
      error: 'Failed to submit counter offer',
      details: error.message
    });
  }
}
