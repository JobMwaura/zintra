import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { rfqId } = await request.json();

    if (!rfqId) {
      return Response.json(
        { error: 'rfqId is required' },
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
      .from('rfq_views')
      .insert({
        rfq_id: rfqId,
        viewed_by_user_id: user?.id || null,
      });

    if (error) {
      console.error('Error tracking RFQ view:', error);
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in track-rfq-view:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
