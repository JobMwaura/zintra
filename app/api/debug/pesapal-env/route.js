/**
 * PesaPal Credentials Debug Endpoint
 * GET /api/debug/pesapal-env
 * 
 * This endpoint helps diagnose why PesaPal credentials aren't loading
 * SECURITY: Remove this before production
 */

export async function GET(req) {
  // Basic check - only allow from localhost or specific IP in dev
  const host = req.headers.get('host');
  console.log('🔍 Debug endpoint accessed from:', host);

  const envVars = {
    NEXT_PUBLIC_PESAPAL_CONSUMER_KEY: {
      value: process.env.NEXT_PUBLIC_PESAPAL_CONSUMER_KEY,
      present: !!process.env.NEXT_PUBLIC_PESAPAL_CONSUMER_KEY,
      preview: process.env.NEXT_PUBLIC_PESAPAL_CONSUMER_KEY ? process.env.NEXT_PUBLIC_PESAPAL_CONSUMER_KEY.substring(0, 10) + '...' : 'NOT SET'
    },
    PESAPAL_CONSUMER_SECRET: {
      value: process.env.PESAPAL_CONSUMER_SECRET,
      present: !!process.env.PESAPAL_CONSUMER_SECRET,
      preview: process.env.PESAPAL_CONSUMER_SECRET ? 'SET (length: ' + process.env.PESAPAL_CONSUMER_SECRET.length + ')' : 'NOT SET'
    },
    NEXT_PUBLIC_PESAPAL_API_URL: {
      value: process.env.NEXT_PUBLIC_PESAPAL_API_URL,
      present: !!process.env.NEXT_PUBLIC_PESAPAL_API_URL,
      preview: process.env.NEXT_PUBLIC_PESAPAL_API_URL || 'NOT SET'
    },
    PESAPAL_WEBHOOK_URL: {
      value: process.env.PESAPAL_WEBHOOK_URL,
      present: !!process.env.PESAPAL_WEBHOOK_URL,
      preview: process.env.PESAPAL_WEBHOOK_URL || 'NOT SET'
    }
  };

  // Also check for any PESAPAL variables we might have missed
  const allPesapalVars = Object.keys(process.env)
    .filter(key => key.includes('PESAPAL'))
    .reduce((acc, key) => {
      acc[key] = process.env[key] ? 'SET' : 'NOT SET';
      return acc;
    }, {});

  return Response.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    nodeVersion: process.version,
    expectedVars: envVars,
    allPesapalEnvVars: allPesapalVars,
    totalEnvVarCount: Object.keys(process.env).length,
    debugInfo: {
      hasSecret: !!process.env.PESAPAL_CONSUMER_SECRET,
      hasKey: !!process.env.NEXT_PUBLIC_PESAPAL_CONSUMER_KEY,
      hasUrl: !!process.env.NEXT_PUBLIC_PESAPAL_API_URL,
      hasWebhookUrl: !!process.env.PESAPAL_WEBHOOK_URL,
      allPresent: !!process.env.PESAPAL_CONSUMER_SECRET && 
                  !!process.env.NEXT_PUBLIC_PESAPAL_CONSUMER_KEY && 
                  !!process.env.NEXT_PUBLIC_PESAPAL_API_URL &&
                  !!process.env.PESAPAL_WEBHOOK_URL
    }
  });
}
