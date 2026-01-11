// /pages/api/debug/aws-config.js
// Debug endpoint to check AWS configuration status
// WARNING: Only for debugging - remove before production

export default function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  // Check AWS configuration
  const config = {
    AWS_REGION: process.env.AWS_REGION ? '✅ Set' : '❌ Missing',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID
      ? `✅ Set (${process.env.AWS_ACCESS_KEY_ID.substring(0, 10)}...)`
      : '❌ Missing',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
      ? '✅ Set (hidden)'
      : '❌ Missing',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET ? `✅ ${process.env.AWS_S3_BUCKET}` : '❌ Missing',
  };

  // Check Supabase configuration
  const supabaseConfig = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? '✅ Set'
      : '❌ Missing',
  };

  return res.status(200).json({
    environment: process.env.NODE_ENV,
    aws: config,
    supabase: supabaseConfig,
    timestamp: new Date().toISOString(),
    note: 'This endpoint is for debugging only. Remove before production deployment.',
  });
}
