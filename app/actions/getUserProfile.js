'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Server-side action to fetch user profile with service role
 * This bypasses RLS restrictions and ensures we can read phone_verified status
 */
export async function getUserProfile(userId) {
  try {
    // Create service role client (server-side only)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase
      .from('users')
      .select('id, email, phone_verified, email_verified, phone, phone_number, full_name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Server error fetching user profile:', {
        error: error.message,
        code: error.code,
        userId,
      });
      return { success: false, error: error.message };
    }

    console.log('✅ Server fetched user profile for:', userId, {
      phone_verified: data?.phone_verified,
      email_verified: data?.email_verified,
    });

    return { success: true, data };
  } catch (err) {
    console.error('❌ Server error in getUserProfile:', err);
    return { success: false, error: err.message };
  }
}
