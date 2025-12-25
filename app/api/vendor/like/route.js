import { createClient } from '@supabase/supabase-js';

// Create a Supabase admin client using service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/vendor/like
 * Toggle like/unlike for a vendor profile
 * 
 * Request body:
 * {
 *   vendorId: uuid,
 *   action: 'like' | 'unlike'
 * }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { vendorId, action } = body;

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid auth header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No bearer token provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JWT token
    const token = authHeader.substring(7);

    // Decode JWT manually to extract user ID from 'sub' claim
    let userId;
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      // Decode the payload (second part)
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );
      
      if (!payload.sub) {
        throw new Error('Missing user ID in token');
      }
      
      userId = payload.sub;
      console.log('✅ Token decoded successfully, user ID:', userId);
    } catch (decodeError) {
      console.error('❌ Token decode error:', decodeError.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token format' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate inputs
    if (!vendorId || !action || !['like', 'unlike'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: vendorId and action required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify vendor exists
    const { data: vendorExists, error: vendorCheckError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .single();

    if (vendorCheckError || !vendorExists) {
      return new Response(
        JSON.stringify({ error: 'Vendor not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'like') {
      // Insert like using service role (bypass RLS)
      const { data, error } = await supabase
        .from('vendor_profile_likes')
        .insert({
          vendor_id: vendorId,
          user_id: userId,
        })
        .select();

      if (error) {
        console.error('Like error:', error);
        // If it's a unique constraint error, it means the user already liked
        if (error.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'You have already liked this vendor' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to like vendor' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data, message: 'Vendor liked successfully' }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Delete like using service role (bypass RLS)
      const { data, error } = await supabase
        .from('vendor_profile_likes')
        .delete()
        .eq('vendor_id', vendorId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Unlike error:', error);
        return new Response(
          JSON.stringify({ error: error.message || 'Failed to unlike vendor' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data, message: 'Vendor unliked successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
