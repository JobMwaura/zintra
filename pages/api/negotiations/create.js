import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/negotiations/create
 * Creates a new negotiation thread for a quote
 * 
 * Request body:
 * {
 *   quoteId: string (UUID),
 *   buyerId: string (UUID),
 *   vendorId: string (UUID),
 *   originalPrice: number
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   thread: object (negotiation_threads row)
 * }
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { quoteId, buyerId, vendorId, originalPrice } = req.body;

    // Validate input
    if (!quoteId || !buyerId || !vendorId || originalPrice === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: quoteId, buyerId, vendorId, originalPrice' 
      });
    }

    // Validate price
    if (typeof originalPrice !== 'number' || originalPrice < 0) {
      return res.status(400).json({ 
        error: 'Invalid price: must be a positive number' 
      });
    }

    // Check if negotiation already exists for this quote
    const { data: existingThread } = await supabase
      .from('negotiation_threads')
      .select('id')
      .eq('quote_id', quoteId)
      .single();

    if (existingThread) {
      return res.status(400).json({ 
        error: 'Negotiation already exists for this quote',
        threadId: existingThread.id
      });
    }

    // Create new negotiation thread
    const { data: thread, error: createError } = await supabase
      .from('negotiation_threads')
      .insert({
        quote_id: quoteId,
        buyer_id: buyerId,
        vendor_id: vendorId,
        original_price: originalPrice,
        current_price: originalPrice,
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('Database insert error:', createError);
      throw new Error(createError.message);
    }

    return res.status(200).json({
      success: true,
      thread: thread
    });

  } catch (error) {
    console.error('Create negotiation error:', error);
    return res.status(500).json({
      error: 'Failed to create negotiation',
      details: error.message
    });
  }
}
