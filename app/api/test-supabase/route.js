import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(url, key);

  const { data, error } = await supabase.from('User').select('*').limit(1);

  return new Response(
    JSON.stringify(
      error
        ? { connected: false, error: error.message }
        : { connected: true, sampleData: data },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
