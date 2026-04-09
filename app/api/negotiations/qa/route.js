'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/negotiations/qa — Ask a question
 * PUT /api/negotiations/qa — Answer a question
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { negotiationId, quoteId, askedBy, question } = body;

    if (!negotiationId || !quoteId || !askedBy || !question) {
      return NextResponse.json(
        { error: 'Missing required fields: negotiationId, quoteId, askedBy, question' },
        { status: 400 }
      );
    }

    if (typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question cannot be empty' },
        { status: 400 }
      );
    }

    // Verify negotiation exists
    const { data: negotiation, error: negotiationError } = await supabase
      .from('negotiation_threads')
      .select('id, user_id, vendor_id, rfq_id')
      .eq('id', negotiationId)
      .eq('rfq_quote_id', quoteId)
      .single();

    if (negotiationError || !negotiation) {
      return NextResponse.json(
        { error: 'Negotiation not found' },
        { status: 404 }
      );
    }

    // Verify user is participant
    if (askedBy !== negotiation.user_id && askedBy !== negotiation.vendor_id) {
      return NextResponse.json(
        { error: 'User is not a participant in this negotiation' },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: 'Failed to create question', details: qaError.message },
        { status: 500 }
      );
    }

    // Notify the other party
    const notifiedUserId = askedBy === negotiation.user_id ? negotiation.vendor_id : negotiation.user_id;

    await supabase.from('notifications').insert({
      user_id: notifiedUserId,
      type: 'qa_question',
      title: 'New Question on Quote Negotiation',
      body: `A new question has been asked: "${question.trim().substring(0, 100)}${question.trim().length > 100 ? '...' : ''}"`,
      metadata: { thread_id: negotiationId, qa_id: qa.id, rfq_id: negotiation.rfq_id },
      related_id: qa.id,
      related_type: 'negotiation_qa'
    });

    return NextResponse.json({ success: true, qa });

  } catch (error) {
    console.error('Create question error:', error);
    return NextResponse.json(
      { error: 'Failed to create question', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { qaId, answer, answeredBy } = body;

    if (!qaId || !answer || !answeredBy) {
      return NextResponse.json(
        { error: 'Missing required fields: qaId, answer, answeredBy' },
        { status: 400 }
      );
    }

    if (typeof answer !== 'string' || answer.trim().length === 0) {
      return NextResponse.json(
        { error: 'Answer cannot be empty' },
        { status: 400 }
      );
    }

    // Fetch the Q&A item
    const { data: qaItem, error: qaFetchError } = await supabase
      .from('negotiation_qa')
      .select('id, negotiation_id, asked_by, answered_at')
      .eq('id', qaId)
      .single();

    if (qaFetchError || !qaItem) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    if (qaItem.answered_at) {
      return NextResponse.json(
        { error: 'This question has already been answered' },
        { status: 400 }
      );
    }

    // Verify negotiation + permissions
    const { data: negotiation, error: negotiationError } = await supabase
      .from('negotiation_threads')
      .select('user_id, vendor_id, rfq_id')
      .eq('id', qaItem.negotiation_id)
      .single();

    if (negotiationError || !negotiation) {
      return NextResponse.json(
        { error: 'Negotiation not found' },
        { status: 404 }
      );
    }

    if (qaItem.asked_by === answeredBy) {
      return NextResponse.json(
        { error: 'You cannot answer your own question' },
        { status: 403 }
      );
    }

    if (answeredBy !== negotiation.user_id && answeredBy !== negotiation.vendor_id) {
      return NextResponse.json(
        { error: 'User is not a participant in this negotiation' },
        { status: 403 }
      );
    }

    // Update with answer
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
      return NextResponse.json(
        { error: 'Failed to submit answer', details: updateError.message },
        { status: 500 }
      );
    }

    // Notify the person who asked
    await supabase.from('notifications').insert({
      user_id: qaItem.asked_by,
      type: 'qa_answer',
      title: 'Your Question Has Been Answered',
      body: `An answer has been provided: "${answer.trim().substring(0, 100)}${answer.trim().length > 100 ? '...' : ''}"`,
      metadata: { thread_id: qaItem.negotiation_id, qa_id: qa.id, rfq_id: negotiation.rfq_id },
      related_id: qa.id,
      related_type: 'negotiation_qa'
    });

    return NextResponse.json({ success: true, qa });

  } catch (error) {
    console.error('Answer question error:', error);
    return NextResponse.json(
      { error: 'Failed to answer question', details: error.message },
      { status: 500 }
    );
  }
}
