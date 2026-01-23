import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/vendor/messages/send
 * Send a message from user to vendor or vendor to user
 * 
 * Request body:
 * {
 *   vendorId: uuid,
 *   messageText: string,
 *   senderType: 'user' | 'vendor',
 *   userId?: uuid (for vendor responses, defaults to auth user)
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { vendorId, messageText, senderType, userId } = body;

    // Get the authorization header
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
    let currentUserEmail;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );
      if (!payload.sub) throw new Error('Missing user ID in token');
      currentUserId = payload.sub;
      currentUserEmail = payload.email || 'user'; // Get email from token
    } catch (decodeError) {
      console.error('❌ Token decode error:', decodeError.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token format' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate inputs
    if (!vendorId || !messageText || !senderType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: vendorId, messageText, senderType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['user', 'vendor'].includes(senderType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid senderType. Must be "user" or "vendor"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For user messages: sender must be the current user
    // For vendor messages: sender must own the vendor
    let actualUserId = currentUserId;
    let senderName = currentUserEmail; // Default to email
    
    if (senderType === 'user') {
      actualUserId = currentUserId;
      
      // Get user's full name from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', currentUserId)
        .single();
      
      if (!userError && userData) {
        senderName = userData.full_name || userData.email || currentUserEmail;
      }
    } else if (senderType === 'vendor') {
      // Verify vendor is owned by current user
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('user_id')
        .eq('id', vendorId)
        .single();

      if (vendorError || !vendor || vendor.user_id !== currentUserId) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: You do not own this vendor' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // If userId provided, use it (for responding to specific user)
      if (userId) {
        actualUserId = userId;
        
        // Get the user's full name for the response context
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', userId)
          .single();
        
        if (!userError && userData) {
          // This doesn't change senderName for vendor messages, but keeps it as "You"
        }
      }
    }

    // Parse message text if it's JSON, otherwise wrap it
    let finalMessageText = messageText;
    try {
      // Try to parse as JSON (from frontend with attachments)
      const parsed = JSON.parse(messageText);
      if (parsed.body && Array.isArray(parsed.attachments)) {
        // Already properly formatted from frontend
        finalMessageText = messageText;
      } else {
        // Has JSON but not our format, re-wrap it
        finalMessageText = JSON.stringify({
          body: messageText,
          attachments: []
        });
      }
    } catch {
      // Not JSON, wrap it
      finalMessageText = JSON.stringify({
        body: messageText,
        attachments: []
      });
    }

    // Insert message
    const { data, error } = await supabase
      .from('vendor_messages')
      .insert({
        vendor_id: vendorId,
        user_id: actualUserId,
        sender_type: senderType,
        message_text: finalMessageText,
        is_read: false,
        sender_name: senderType === 'vendor' ? 'You' : senderName,
      })
      .select();

    if (error) {
      console.error('❌ Message insertion error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to send message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
        message: 'Message sent successfully',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
