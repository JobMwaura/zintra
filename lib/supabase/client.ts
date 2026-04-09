/**
 * Supabase Client Setup
 * Using @supabase/ssr for proper session persistence in Next.js App Router
 */

import { createBrowserClient } from '@supabase/ssr';

// Cache the client instance to prevent multiple GoTrueClient instances
let cachedClient: any = null;

export function createClient() {
  // Return cached instance if it exists
  if (cachedClient) {
    return cachedClient;
  }

  // Create and cache the client
  cachedClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return cachedClient;
}

// For backward compatibility with old code that imports `supabase` directly
export const supabase = createClient();

