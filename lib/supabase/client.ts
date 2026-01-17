/**
 * Supabase Client Setup
 * Using Supabase for auth, database, and RLS
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase instance (in browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side actions, you might want a service role client
// (create a separate file for that with SUPABASE_SERVICE_ROLE_KEY)
