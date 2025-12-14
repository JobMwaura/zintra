export default function TestEnv() {
  return (
    <div>
      <h1>Env Test</h1>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Not found'}</p>
    </div>
  );
}
