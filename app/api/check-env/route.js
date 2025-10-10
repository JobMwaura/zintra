export async function GET() {
  const visible = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? '✅ Loaded'
      : '❌ Missing',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Loaded' : '❌ Missing',
  };

  return new Response(JSON.stringify(visible, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
