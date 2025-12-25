import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/vendor/messages/get?vendorId=uuid&userId=uuid
 * Retrieve messages in a conversation between a user and vendor
 * 
 * Query params:
 * - vendorId: uuid (required)
 * - userId: uuid (required)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No bearer token provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract and decode JWT token
    const token = authHeader.substring(7);
    let currentUserId;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );
      if (!payload.sub) throw new Error('Missing user ID in token');
      currentUserId = payload.sub;
    } catch (decodeError) {
      console.error('❌ Token decode error:', decodeError.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token format' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const vendorId = url.searchParams.get('vendorId');
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    if (!vendorId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required query params: vendorId, userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Authorization check: user must be either the message participant or vendor owner
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('user_id')
      .eq('id', vendorId)
      .single();

    const isVendorOwner = vendor && vendor.user_id === currentUserId;
    const isUserParticipant = currentUserId === userId;

    if (!isVendorOwner && !isUserParticipant) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not have access to this conversation' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('vendor_messages')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      console.error('❌ Message fetch error:', messagesError);
      return new Response(
        JSON.stringify({ error: messagesError.message || 'Failed to fetch messages' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mark received messages as read
    if (messages && messages.length > 0) {
      const { error: updateError } = await supabase
        .from('vendor_messages')
        .update({ is_read: true })
        .eq('vendor_id', vendorId)
        .eq('user_id', userId)
        .eq('is_read', false)
        .in('sender_type', isVendorOwner ? ['user'] : ['vendor']);

      if (updateError) {
        console.error('⚠️ Failed to mark messages as read:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: messages || [],
        count: messages?.length || 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
