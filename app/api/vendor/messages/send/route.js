import { createClient } from '@supabase/supabase-js';
import { notifyBuyerOfNewMessage, notifyVendorOfNewMessage } from '@/lib/services/emailNotificationService';

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
    console.log('📝 Raw messageText received:', { 
      type: typeof messageText,
      length: messageText?.length,
      first50chars: messageText?.substring(0, 50)
    });
    
    try {
      // Try to parse as JSON (from frontend with attachments)
      const parsed = JSON.parse(messageText);
      console.log('✅ Successfully parsed JSON:', { 
        hasBody: !!parsed.body,
        hasAttachments: Array.isArray(parsed.attachments),
        bodyPreview: parsed.body?.substring(0, 30)
      });
      
      if (parsed.body && Array.isArray(parsed.attachments)) {
        // Already properly formatted from frontend
        console.log('✅ Message already properly formatted, using as-is');
        finalMessageText = messageText;
      } else {
        // Has JSON but not our format, re-wrap it
        console.log('⚠️ JSON has wrong format, re-wrapping');
        finalMessageText = JSON.stringify({
          body: messageText,
          attachments: []
        });
      }
    } catch (e) {
      // Not JSON, wrap it
      console.log('⚠️ Not valid JSON, wrapping as plain text:', e.message);
      finalMessageText = JSON.stringify({
        body: messageText,
        attachments: []
      });
    }
    
    console.log('📦 Final messageText to store:', {
      type: typeof finalMessageText,
      length: finalMessageText?.length,
      first50chars: finalMessageText?.substring(0, 50)
    });

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

    // Create notification for the recipient (async, don't block response)
    try {
      let notificationTitle = '';
      let notificationBody = '';
      let notificationType = 'message';

      // Extract plain text message for notification
      let messagePreview = messageText;
      try {
        const parsed = JSON.parse(messageText);
        messagePreview = parsed.body || messageText;
      } catch (e) {
        // Use as-is if not JSON
      }

      // Truncate message for notification
      const truncatedMessage = messagePreview.length > 100 
        ? messagePreview.substring(0, 100) + '...' 
        : messagePreview;

      if (senderType === 'vendor') {
        // Vendor sending to buyer
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('company_name')
          .eq('id', vendorId)
          .single();

        notificationTitle = `New message from ${vendorData?.company_name || 'A vendor'}`;
        notificationBody = truncatedMessage;
        notificationType = 'vendor_message';

        // Create notification in database
        await supabase
          .from('notifications')
          .insert({
            user_id: actualUserId,
            title: notificationTitle,
            body: notificationBody,
            message: notificationBody,
            type: notificationType,
            related_id: vendorId,
            related_type: 'vendor_message',
            created_at: new Date().toISOString(),
            read_at: null
          });

        console.log('[Notification] ✅ Buyer notification created for vendor message');
      } else {
        // User sending to vendor
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('user_id')
          .eq('id', vendorId)
          .single();

        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', currentUserId)
          .single();

        if (vendorData?.user_id) {
          notificationTitle = `New message from ${userData?.full_name || 'A buyer'}`;
          notificationBody = truncatedMessage;
          notificationType = 'vendor_message';

          // Create notification for vendor owner
          await supabase
            .from('notifications')
            .insert({
              user_id: vendorData.user_id,
              title: notificationTitle,
              body: notificationBody,
              message: notificationBody,
              type: notificationType,
              related_id: vendorId,
              related_type: 'vendor_message',
              created_at: new Date().toISOString(),
              read_at: null
            });

          console.log('[Notification] ✅ Vendor owner notification created for buyer message');
        }
      }
    } catch (notifError) {
      // Don't fail the request if notification fails
      console.error('[Notification] ⚠️ Failed to create notification (non-blocking):', notifError);
    }

    // Send email notification (async, don't block response)
    try {
      // Extract plain text message for email preview
      let messagePreview = messageText;
      try {
        const parsed = JSON.parse(messageText);
        messagePreview = parsed.body || messageText;
      } catch (e) {
        // Use as-is if not JSON
      }

      if (senderType === 'vendor') {
        // Vendor sending to buyer - notify buyer via email
        // Get buyer's email from auth.users
        const { data: { user: buyerAuth } } = await supabase.auth.admin.getUserById(actualUserId);
        const { data: buyerData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', actualUserId)
          .single();
        
        // Get vendor name
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('company_name')
          .eq('id', vendorId)
          .single();

        if (buyerAuth?.email) {
          // Send email notification in background (don't await)
          notifyBuyerOfNewMessage({
            buyerEmail: buyerAuth.email,
            buyerName: buyerData?.full_name || 'there',
            vendorName: vendorData?.company_name || 'A vendor',
            messagePreview
          }).catch(err => console.error('Email notification failed:', err));
        }
      } else {
        // User sending to vendor - notify vendor via email
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('user_id, company_name')
          .eq('id', vendorId)
          .single();
        
        if (vendorData?.user_id) {
          // Get vendor owner's email from auth.users
          const { data: { user: vendorAuth } } = await supabase.auth.admin.getUserById(vendorData.user_id);
          
          // Get sender name
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', currentUserId)
            .single();

          if (vendorAuth?.email) {
            // Send email notification in background (don't await)
            notifyVendorOfNewMessage({
              vendorEmail: vendorAuth.email,
              vendorName: vendorData.company_name || 'there',
              buyerName: userData?.full_name || 'A user',
              messagePreview
            }).catch(err => console.error('Email notification failed:', err));
          }
        }
      }
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('❌ Email notification error (non-blocking):', emailError);
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
