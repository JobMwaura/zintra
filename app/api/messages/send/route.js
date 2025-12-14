import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const body = await request.json();
    const { recipient_id, conversation_id, message_body, message_type } = body;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!recipient_id || !conversation_id || !message_body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert([
        {
          sender_id: user.id,
          recipient_id,
          conversation_id,
          body: message_body,
          message_type: message_type || 'vendor_to_customer',
          is_read: false
        }
      ])
      .select();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: messageError.message },
        { status: 400 }
      );
    }

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation_id);

    return NextResponse.json(
      { 
        success: true,
        message: 'Message sent successfully',
        data: message
      },
      { status: 200 }
    );

  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}