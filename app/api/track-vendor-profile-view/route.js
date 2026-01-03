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
      // Log the error but don't fail the request - tracking is not critical
      console.warn('Warning: Could not track vendor profile view:', error.message);
      // Return success anyway so client doesn't error
      return Response.json({ success: true, tracked: false });
    }

    return Response.json({ success: true, tracked: true });
  } catch (error) {
    // Log the error but return success - tracking is not critical to the app
    console.warn('Warning in track-vendor-profile-view:', error.message);
    return Response.json({ success: true, tracked: false });
  }
}
