import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { email } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Try to get the user by email
    const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();

    if (getUserError) {
      return Response.json({
        error: 'Failed to list users',
        details: getUserError.message
      }, { status: 500 });
    }

    const user = users.find(u => u.email === email);

    if (!user) {
      return Response.json({
        error: 'User not found',
        email: email,
        totalUsers: users.length
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed: !!user.email_confirmed_at,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    return Response.json({
      error: 'Server error',
      message: error.message
    }, { status: 500 });
  }
}
