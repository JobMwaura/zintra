export default function DebugEnv() {
  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h2>Environment Debug</h2>
      <p><b>Supabase URL:</b> {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Missing'}</p>
      <p><b>Supabase Key:</b> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing'}</p>
    </div>
  );
}