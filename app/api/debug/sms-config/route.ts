/**
 * DEBUG: Check TextSMS Environment Variables
 * GET /api/debug/sms-config
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = process.env.TEXTSMS_API_KEY;
  const partnerId = process.env.TEXTSMS_PARTNER_ID;
  const shortcode = process.env.TEXTSMS_SHORTCODE;

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    textsms: {
      apiKeyConfigured: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      partnerIdConfigured: !!partnerId,
      partnerIdLength: partnerId?.length || 0,
      shortcodeConfigured: !!shortcode,
      shortcodeLength: shortcode?.length || 0,
      allConfigured: !!(apiKey && partnerId && shortcode),
    },
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}
