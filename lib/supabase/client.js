import { createBrowserClient } from '@supabase/ssr';

// Cache the client instance to prevent multiple GoTrueClient instances
let cachedClient = null;

export function createClient() {
  // Return cached instance if it exists
  if (cachedClient) {
    return cachedClient;
  }

  // Create and cache the client
  cachedClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return cachedClient;
}
