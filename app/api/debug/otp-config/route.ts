/**
 * DEBUG: Check OTP Service Configuration
 * GET /api/debug/otp-config
 * 
 * Returns which OTP channels are configured and ready to use
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const smsApiKey = process.env.TEXTSMS_API_KEY;
    const smsPartnerId = process.env.TEXTSMS_PARTNER_ID;
    const smsShortcode = process.env.TEXTSMS_SHORTCODE;
    const emailPassword = process.env.EVENTSGEAR_EMAIL_PASSWORD;

    const smsConfigured = !!(smsApiKey && smsPartnerId && smsShortcode);
    const emailConfigured = !!emailPassword;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      otp: {
        sms: {
          configured: smsConfigured,
          hasApiKey: !!smsApiKey,
          hasPartnerId: !!smsPartnerId,
          hasShortcode: !!smsShortcode,
          allRequired: smsConfigured ? true : 'MISSING - Need all 3: TEXTSMS_API_KEY, TEXTSMS_PARTNER_ID, TEXTSMS_SHORTCODE'
        },
        email: {
          configured: emailConfigured,
          hasPassword: !!emailPassword,
          status: emailConfigured ? 'PRODUCTION (real emails)' : 'SIMULATION (no real emails sent)'
        },
        summary: {
          smsReady: smsConfigured,
          emailReady: true, // Email always works in simulation mode at minimum
          bothReady: smsConfigured && emailConfigured
        }
      },
      debug: {
        message: 'If SMS is not configured, users can still use email OTP in simulation mode',
        smsApiKeyLength: smsApiKey?.length || 0,
        smsPartnerIdLength: smsPartnerId?.length || 0,
        smsShortcodeLength: smsShortcode?.length || 0,
        emailPasswordLength: emailPassword?.length || 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to check OTP configuration',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
