import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if service role is working
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();

    if (getUserError) {
      return Response.json({
        error: 'Service role error',
        details: getUserError.message
      }, { status: 401 });
    }

    return Response.json({
      success: true,
      userCount: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        emailConfirmed: !!u.email_confirmed_at,
        lastSignIn: u.last_sign_in_at,
        createdAt: u.created_at
      }))
    });
  } catch (error) {
    return Response.json({
      error: 'Server error',
      message: error.message
    }, { status: 500 });
  }
}
