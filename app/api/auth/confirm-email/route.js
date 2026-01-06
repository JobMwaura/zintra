import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { email } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the user
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
        error: 'User not found'
      }, { status: 404 });
    }

    // Update the user to confirm email
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (updateError) {
      return Response.json({
        error: 'Failed to confirm email',
        details: updateError.message
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Email confirmed',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        email_confirmed: !!updatedUser.email_confirmed_at
      }
    });
  } catch (error) {
    return Response.json({
      error: 'Server error',
      message: error.message
    }, { status: 500 });
  }
}
