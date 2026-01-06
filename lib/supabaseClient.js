// DEPRECATED: This file is kept for backward compatibility only.
// Please use /lib/supabase/client.js instead for proper session persistence.
// This file creates a client without SSR support which doesn't properly
// persist sessions across page reloads in Next.js App Router.

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// Uses SSR client for proper session persistence (same as /lib/supabase/client.js)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
