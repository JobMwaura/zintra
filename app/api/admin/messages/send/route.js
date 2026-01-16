// API Route: POST /api/admin/messages/send
// Send a message from admin to vendor
// Uses service role key to bypass RLS restrictions

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/admin/messages/send
 * Send a message from admin to vendor
 * 
 * Request body:
 * {
 *   vendorId: uuid,           // vendors.id
 *   vendorUserId: uuid,       // vendor's auth user id
 *   messageBody: string,      // message content
 *   messageSubject?: string,  // optional subject
 *   attachments?: array       // optional file attachments
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { vendorId, vendorUserId, messageBody, messageSubject, attachments } = body;

    // Validate required fields
    if (!vendorId || !vendorUserId || !messageBody) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: vendorId, vendorUserId, messageBody' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get admin user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No bearer token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7);
    let adminId;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT');
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );
      adminId = payload.sub;
      if (!adminId) throw new Error('No user ID in token');
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📨 Admin sending message:', {
      adminId,
      vendorId,
      vendorUserId: vendorUserId,
      messageLength: messageBody.length
    });

    // Step 1: Verify vendor exists and get correct user_id if needed
    console.log('📋 Verifying vendor...');
    let actualVendorUserId = vendorUserId;
    
    // If vendorUserId looks like a vendor.id instead of auth.users.id, fetch the correct user_id
    if (vendorUserId === vendorId) {
      console.log('⚠️ vendorUserId matches vendorId, fetching correct user_id from vendors table...');
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('user_id')
        .eq('id', vendorId)
        .single();

      if (vendorError || !vendor) {
        console.error('❌ Error fetching vendor:', vendorError);
        return new Response(
          JSON.stringify({ error: 'Vendor not found: ' + (vendorError?.message || 'Unknown error') }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      actualVendorUserId = vendor.user_id;
      console.log('✅ Found vendor user_id:', actualVendorUserId);
    }

    // Step 2: Find or create conversation
    let conversationId;
    const { data: existingConv, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_1_id', adminId)
      .eq('participant_2_id', actualVendorUserId)
      .maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
      console.log('✅ Found existing conversation:', conversationId);
    } else {
      console.log('📝 Creating new conversation...');
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: adminId,
          participant_2_id: actualVendorUserId,
          subject: messageSubject || `Message to vendor ${vendorId}`,
          is_active: true
        })
        .select('id')
        .single();

      if (createError) {
        console.error('❌ Error creating conversation:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create conversation: ' + createError.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      conversationId = newConv.id;
      console.log('✅ Created conversation:', conversationId);
    }

    // Step 2: Insert into vendor_messages (for vendor inbox)
    // Use service role client to bypass RLS
    console.log('📨 Saving to vendor_messages...');
    const { data: vendorMsg, error: vendorMsgError } = await supabase
      .from('vendor_messages')
      .insert({
        vendor_id: vendorId,
        user_id: actualVendorUserId,
        message_text: messageBody,
        sender_type: 'admin',
        is_read: false,
        sender_name: 'Admin'
      })
      .select('id')
      .single();

    if (vendorMsgError) {
      console.error('❌ Error saving to vendor_messages:', vendorMsgError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save message to vendor inbox: ' + vendorMsgError.message 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.log('✅ Saved to vendor_messages:', vendorMsg.id);

    // Step 3: Insert into messages (for admin inbox)
    console.log('📨 Saving to messages table...');
    const { data: msg, error: msgError } = await supabase
      .from('messages')
      .insert({
        sender_id: adminId,
        recipient_id: actualVendorUserId,
        conversation_id: conversationId,
        body: messageBody,
        message_type: 'admin_to_vendor',
        attachments: attachments || []
      })
      .select('id')
      .single();

    if (msgError) {
      console.warn('⚠️ Warning: Could not save to messages table:', msgError);
      // Don't fail - message is already in vendor_messages
    } else {
      console.log('✅ Saved to messages:', msg.id);
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          vendorMessageId: vendorMsg.id,
          messageId: msg?.id,
          conversationId
        },
        message: 'Message sent successfully to vendor'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
