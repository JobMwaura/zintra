import { createClient } from '@supabase/supabase-js';
import { generateFileAccessUrl } from '@/lib/aws-s3';

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

      // Regenerate presigned URLs for message attachment images
      console.log('🔄 Processing', messages.length, 'messages for image URL regeneration');
      for (const msg of messages) {
        try {
          let attachments = [];
          
          // Parse message_text to extract attachments
          if (typeof msg.message_text === 'string') {
            try {
              const parsed = JSON.parse(msg.message_text);
              attachments = parsed.attachments || [];
            } catch (e) {
              // Not JSON, skip
              continue;
            }
          } else if (typeof msg.message_text === 'object' && msg.message_text !== null) {
            attachments = msg.message_text.attachments || [];
          }

          // Regenerate presigned URLs for image attachments
          if (attachments.length > 0) {
            console.log('  📎 Processing', attachments.length, 'attachments in message');
            for (const att of attachments) {
              if (!att.url) continue;
              
              try {
                // Check if URL is an S3 URL or key that needs regeneration
                if (typeof att.url === 'string' && att.url.includes('amazonaws.com')) {
                  // Extract S3 key from S3 URL (presigned or direct)
                  const urlObj = new URL(att.url);
                  let path = urlObj.pathname.replace(/^\//, ''); // Remove leading slash

                  // If path starts with bucket name, remove it
                  if (path.includes('/')) {
                    const parts = path.split('/');
                    if (parts[0] === process.env.AWS_S3_BUCKET) {
                      path = parts.slice(1).join('/');
                    }
                  }

                  // Decode URI component (handle %20 for spaces, etc)
                  const extractedKey = decodeURIComponent(path);
                  console.log('    🔐 Regenerating presigned URL for attachment');
                  
                  try {
                    const freshUrl = await generateFileAccessUrl(extractedKey);
                    att.url = freshUrl;
                    console.log('    ✅ Fresh presigned URL generated');
                  } catch (urlErr) {
                    console.warn('    ⚠️ Failed to regenerate URL:', urlErr.message);
                    // Keep original URL as fallback
                  }
                } else if (typeof att.url === 'string' && !att.url.startsWith('http')) {
                  // It's an S3 key, generate fresh presigned URL
                  const freshUrl = await generateFileAccessUrl(att.url);
                  att.url = freshUrl;
                  console.log('    ✅ Fresh presigned URL generated from S3 key');
                }
              } catch (error) {
                console.warn('    ⚠️ Failed to process attachment URL:', error.message);
              }
            }

            // Update message_text with regenerated URLs
            if (typeof msg.message_text === 'string') {
              try {
                const parsed = JSON.parse(msg.message_text);
                parsed.attachments = attachments;
                msg.message_text = JSON.stringify(parsed);
              } catch (e) {
                // Skip if not JSON
              }
            } else if (typeof msg.message_text === 'object' && msg.message_text !== null) {
              msg.message_text.attachments = attachments;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error processing message attachments:', error.message);
        }
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
