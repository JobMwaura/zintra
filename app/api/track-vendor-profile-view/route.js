import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { vendorId } = await request.json();

    if (!vendorId) {
      return Response.json(
        { error: 'vendorId is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // setAll is called from Server Component scope, this is a noop if it fails
            }
          },
        },
      }
    );

    // Get current user (optional for anonymous views)
    const { data: { user } } = await supabase.auth.getUser();

    // Insert view record
    const { error } = await supabase
      .from('vendor_profile_views')
      .insert({
        vendor_id: vendorId,
        viewed_by_user_id: user?.id || null,
      });

    if (error) {
      console.error('Error tracking vendor profile view:', error);
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in track-vendor-profile-view:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
