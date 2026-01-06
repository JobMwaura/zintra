import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/negotiations/qa
 * Create a new question in the Q&A thread
 * 
 * PUT /api/negotiations/qa
 * Answer an existing question
 * 
 * Request body (POST):
 * {
 *   negotiationId: string (UUID),
 *   quoteId: string (UUID),
 *   askedBy: string (UUID),
 *   question: string
 * }
 * 
 * Request body (PUT):
 * {
 *   qaId: string (UUID),
 *   answer: string,
 *   answeredBy: string (UUID)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   qa: object (negotiation_qa row)
 * }
 */
export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleCreateQuestion(req, res);
  } else if (req.method === 'PUT') {
    return handleAnswerQuestion(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Handle POST - Create new question
 */
async function handleCreateQuestion(req, res) {
  try {
    const {
      negotiationId,
      quoteId,
      askedBy,
      question
    } = req.body;

    // Validate input
    if (!negotiationId || !quoteId || !askedBy || !question) {
      return res.status(400).json({
        error: 'Missing required fields: negotiationId, quoteId, askedBy, question'
      });
    }

    // Validate question is not empty
    if (typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        error: 'Question cannot be empty'
      });
    }

    // Verify negotiation exists
    const { data: negotiation, error: negotiationError } = await supabase
      .from('negotiation_threads')
      .select('id, user_id, vendor_id')
      .eq('id', negotiationId)
      .eq('rfq_quote_id', quoteId)
      .single();

    if (negotiationError || !negotiation) {
      return res.status(404).json({
        error: 'Negotiation not found'
      });
    }

    // Verify user is participant
    if (askedBy !== negotiation.user_id && askedBy !== negotiation.vendor_id) {
      return res.status(403).json({
        error: 'User is not a participant in this negotiation'
      });
    }

    // Create question
    const { data: qa, error: qaError } = await supabase
      .from('negotiation_qa')
      .insert({
        negotiation_id: negotiationId,
        rfq_quote_id: quoteId,
        asked_by: askedBy,
        question: question.trim()
      })
      .select()
      .single();

    if (qaError) {
      console.error('Question insert error:', qaError);
      throw new Error(qaError.message);
    }

    // Send notification to other party
    const notifiedUserId = askedBy === negotiation.user_id ? negotiation.vendor_id : negotiation.user_id;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: notifiedUserId,
        type: 'qa_question',
        title: 'New Question on Quote',
        description: 'A new question has been asked on your quote negotiation',
        action_id: qa.id,
        action_type: 'qa',
        is_read: false
      });

    if (notificationError) {
      console.warn('Notification creation error:', notificationError);
      // Don't fail the request
    }

    return res.status(200).json({
      success: true,
      qa: qa
    });

  } catch (error) {
    console.error('Create question error:', error);
    return res.status(500).json({
      error: 'Failed to create question',
      details: error.message
    });
  }
}

/**
 * Handle PUT - Answer question
 */
async function handleAnswerQuestion(req, res) {
  try {
    const {
      qaId,
      answer,
      answeredBy
    } = req.body;

    // Validate input
    if (!qaId || !answer || !answeredBy) {
      return res.status(400).json({
        error: 'Missing required fields: qaId, answer, answeredBy'
      });
    }

    // Validate answer is not empty
    if (typeof answer !== 'string' || answer.trim().length === 0) {
      return res.status(400).json({
        error: 'Answer cannot be empty'
      });
    }

    // Fetch the Q&A item
    const { data: qaItem, error: qaFetchError } = await supabase
      .from('negotiation_qa')
      .select('id, negotiation_id, asked_by, answered_at')
      .eq('id', qaId)
      .single();

    if (qaFetchError || !qaItem) {
      return res.status(404).json({
        error: 'Question not found'
      });
    }

    // Check if already answered
    if (qaItem.answered_at) {
      return res.status(400).json({
        error: 'This question has already been answered'
      });
    }

    // Verify negotiation and user permissions
    const { data: negotiation, error: negotiationError } = await supabase
      .from('negotiation_threads')
      .select('user_id, vendor_id')
      .eq('id', qaItem.negotiation_id)
      .single();

    if (negotiationError || !negotiation) {
      return res.status(404).json({
        error: 'Negotiation not found'
      });
    }

    // Verify answerer is the other party (not the one who asked)
    if (qaItem.asked_by === answeredBy) {
      return res.status(403).json({
        error: 'You cannot answer your own question'
      });
    }

    if (answeredBy !== negotiation.user_id && answeredBy !== negotiation.vendor_id) {
      return res.status(403).json({
        error: 'User is not a participant in this negotiation'
      });
    }

    // Update question with answer
    const { data: qa, error: updateError } = await supabase
      .from('negotiation_qa')
      .update({
        answer: answer.trim(),
        answered_by: answeredBy,
        answered_at: new Date().toISOString()
      })
      .eq('id', qaId)
      .select()
      .single();

    if (updateError) {
      console.error('Question update error:', updateError);
      throw new Error(updateError.message);
    }

    // Send notification to person who asked
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: qaItem.asked_by,
        type: 'qa_answer',
        title: 'Your Question Has Been Answered',
        description: 'An answer has been provided to your question',
        action_id: qa.id,
        action_type: 'qa',
        is_read: false
      });

    if (notificationError) {
      console.warn('Notification creation error:', notificationError);
      // Don't fail the request
    }

    return res.status(200).json({
      success: true,
      qa: qa
    });

  } catch (error) {
    console.error('Answer question error:', error);
    return res.status(500).json({
      error: 'Failed to answer question',
      details: error.message
    });
  }
}
