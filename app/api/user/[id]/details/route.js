import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role to access auth.users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/user/[id]/details
 * Fetch user details including email from auth.users
 * Used when vendors need buyer contact info
 */
export async function GET(request, { params }) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First try to get from public.users table
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('id, full_name, email, phone')
      .eq('id', userId)
      .maybeSingle();

    // If we have email from public.users, use it
    if (publicUser?.email) {
      return NextResponse.json({
        success: true,
        user: {
          id: publicUser.id,
          full_name: publicUser.full_name || 'User',
          email: publicUser.email,
          phone: publicUser.phone || null
        }
      });
    }

    // Otherwise, get email from auth.users (requires service role)
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser?.user) {
      console.error('Error fetching auth user:', authError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Combine data from both sources
    const userData = {
      id: userId,
      full_name: publicUser?.full_name || authUser.user.user_metadata?.full_name || 'User',
      email: authUser.user.email || null,
      phone: publicUser?.phone || authUser.user.phone || null
    };

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Error in user details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
