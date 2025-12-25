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
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No bearer token provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JWT token
    const token = authHeader.substring(7);

    // Create a user client with the token to get the user ID
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get the current user from the token
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

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
