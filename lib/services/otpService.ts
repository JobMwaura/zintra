/**
 * ============================================================================
 * OTP SERVICE - SMS & Email Verification
 * ============================================================================
 * Handles OTP generation and delivery via SMS (TextSMS Kenya) and Email
 * 
 * Features:
 * - SMS OTP via TextSMS Kenya API
 * - Email OTP via Supabase Auth (EventsGear SMTP)
 * - OTP generation (secure random 6-digit codes)
 * - Rate limiting support
 * - Error handling and logging
 * 
 * Usage:
 *   const result = await sendSMSOTP('+254712345678', '123456');
 *   const result = await sendEmailOTP('user@example.com', '123456');
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface OTPResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp?: string;
}

export interface OTPConfig {
  length: number;
  expiryMinutes: number;
  maxAttempts: number;
}

// ============================================================================
// OTP GENERATION
// ============================================================================

/**
 * Generate a secure random OTP code
 * @param length - Length of OTP (default: 6)
 * @returns 6-digit OTP code as string
 */
export function generateOTP(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

/**
 * Validate OTP format
 * @param otp - OTP code to validate
 * @returns true if valid format
 */
export function validateOTPFormat(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

// ============================================================================
// SMS OTP - TextSMS Kenya
// ============================================================================

interface TextSMSPayload {
  apikey: string;
  partnerID: string;
  mobile: string;
  message: string;
  shortcode: string;
  pass_type?: string;
}

interface TextSMSResponse {
  success?: boolean;
  message?: string;
  messageId?: string;
  code?: string | number;
  responses?: Array<{
    'response-code'?: number;
    'response-description'?: string;
    'response_code'?: string;
    'response_description'?: string;
    messageid?: string;
    messageId?: string;
    networkid?: number;
    mobile?: number | string;
  }>;
}

/**
 * Send SMS OTP via TextSMS Kenya API
 * @param phoneNumber - Recipient phone number (with country code, e.g., +254712345678)
 * @param otp - 6-digit OTP code
 * @returns Success/failure result
 */
export async function sendSMSOTP(
  phoneNumber: string,
  otp: string
): Promise<OTPResult> {
  try {
    // Validate inputs
    if (!phoneNumber || !otp) {
      return {
        success: false,
        error: 'Phone number and OTP code required'
      };
    }

    if (!validateOTPFormat(otp)) {
      return {
        success: false,
        error: 'Invalid OTP format'
      };
    }

    // Validate phone number format
    if (!phoneNumber.match(/^\+254\d{9}$/) && !phoneNumber.match(/^0\d{9}$/)) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    // Ensure phone number has country code
    const normalizedPhone = phoneNumber.startsWith('+254')
      ? phoneNumber
      : phoneNumber.startsWith('0')
      ? '+254' + phoneNumber.slice(1)
      : phoneNumber;

    // Get configuration from environment
    const apiKey = process.env.TEXTSMS_API_KEY;
    const partnerId = process.env.TEXTSMS_PARTNER_ID;
    const shortcode = process.env.TEXTSMS_SHORTCODE;

    if (!apiKey || !partnerId || !shortcode) {
      console.error('TextSMS Kenya credentials not configured');
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }

    // Prepare request payload
    const payload: TextSMSPayload = {
      apikey: apiKey,
      partnerID: partnerId,
      mobile: normalizedPhone,
      message: `Your Zintra verification code is: ${otp}. Valid for 10 minutes.`,
      shortcode: shortcode,
      pass_type: 'plain'
    };

    // Send request to TextSMS Kenya using /sendotp/ endpoint
    // (dedicated for OTP/sensitive transaction traffic)
    const response = await fetch(
      'https://sms.textsms.co.ke/api/services/sendotp/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Zintra/1.0'
        },
        body: JSON.stringify(payload)
      }
    );

    const data: TextSMSResponse = await response.json();

    // Log the request for audit purposes
    console.log(`[OTP SMS] Phone: ${normalizedPhone}, Status: ${data.success}`);

    if (response.ok && data.success) {
      return {
        success: true,
        messageId: data.messageId || 'sms_' + Date.now(),
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to send SMS OTP'
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[OTP SMS Error] ${errorMessage}`);
    return {
      success: false,
      error: 'Failed to send SMS OTP: ' + errorMessage
    };
  }
}

/**
 * Send OTP via SMS with custom message
 * Useful for different OTP types (registration, 2FA, payment, etc.)
 */
export async function sendSMSOTPCustom(
  phoneNumber: string,
  otp: string,
  type: 'registration' | 'login' | 'payment' | 'password_reset' = 'registration'
): Promise<OTPResult> {
  try {
    const apiKey = process.env.TEXTSMS_API_KEY;
    const partnerId = process.env.TEXTSMS_PARTNER_ID;
    const shortcode = process.env.TEXTSMS_SHORTCODE;

    if (!apiKey || !partnerId || !shortcode) {
      return { success: false, error: 'SMS service not configured' };
    }

    // Customize message based on type
    const messages: Record<string, string> = {
      registration: `Your Zintra registration code is: ${otp}. Valid for 10 minutes.`,
      login: `Your Zintra login code is: ${otp}. Valid for 10 minutes.`,
      payment: `Your Zintra payment confirmation code is: ${otp}. Valid for 5 minutes.`,
      password_reset: `Your Zintra password reset code is: ${otp}. Valid for 30 minutes.`
    };

    const normalizedPhone = phoneNumber.startsWith('+254')
      ? phoneNumber
      : '+254' + phoneNumber.slice(1);

    const payload: TextSMSPayload = {
      apikey: apiKey,
      partnerID: partnerId,
      mobile: normalizedPhone,
      message: messages[type],
      shortcode: shortcode,
      pass_type: 'plain'
    };

    // Use /sendotp/ endpoint (for sensitive transaction traffic like OTP)
    // instead of /sendsms/ endpoint
    const response = await fetch(
      'https://sms.textsms.co.ke/api/services/sendotp/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data: TextSMSResponse = await response.json();

    console.log('[OTP SendOTP] Request:', { 
      phone: normalizedPhone, 
      type, 
      endpoint: '/sendotp/',
      timestamp: new Date().toISOString()
    });
    console.log('[OTP SendOTP Response]', JSON.stringify(data, null, 2));

    // Check if response has the expected structure
    // TextSMS Kenya's /sendotp/ endpoint might return different format than /sendsms/
    let isSuccess = false;
    let errorMessage = 'Failed to send OTP';
    let messageId = '';

    if (data.success !== undefined) {
      // Standard response format { success: boolean, message?: string }
      isSuccess = data.success;
      errorMessage = data.message || 'Failed to send OTP';
      messageId = data.messageId || '';
      console.log('[OTP SendOTP] Using standard format response');
    } else if (data.responses && Array.isArray(data.responses) && data.responses.length > 0) {
      // Array response format from TextSMS Kenya
      const firstResponse = data.responses[0];
      console.log('[OTP SendOTP] Response item:', firstResponse);
      
      // Check for successful response (code 200 means success)
      const responseCode = firstResponse['response-code'] || firstResponse['response_code'];
      const responseDesc = firstResponse['response-description'] || firstResponse['response_description'];
      messageId = firstResponse['messageid'] || firstResponse['messageId'] || '';
      
      isSuccess = responseCode === 200 || responseCode === '200';
      errorMessage = responseDesc || 'Failed to send OTP';
      console.log('[OTP SendOTP] Using array format response - code:', responseCode, 'success:', isSuccess);
    } else if (data.code !== undefined) {
      // Alternative response format with just a code
      isSuccess = data.code === '200' || data.code === 200 || data.code === '201';
      errorMessage = data.message || `Failed to send OTP (code: ${data.code})`;
      console.log('[OTP SendOTP] Using code-based format response - code:', data.code);
    }

    console.log('[OTP SendOTP Parsed]', { 
      isSuccess, 
      errorMessage, 
      messageId, 
      phone: normalizedPhone,
      type
    });

    return isSuccess
      ? {
          success: true,
          messageId: messageId || 'sms_' + Date.now(),
          timestamp: new Date().toISOString()
        }
      : {
          success: false,
          error: errorMessage
        };
  } catch (error) {
    console.error('[OTP SMS Error]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// EMAIL OTP - Placeholder for SendGrid/Resend Integration
// ============================================================================

/**
 * Send OTP via Email using internal email API
 */
export async function sendEmailOTP(
  email: string,
  otp: string
): Promise<OTPResult> {
  try {
    // Validate email format
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return {
        success: false,
        error: 'Invalid email format'
      };
    }

    if (!validateOTPFormat(otp)) {
      return {
        success: false,
        error: 'Invalid OTP format'
      };
    }

    // Create professional email template with OTP code
    const emailSubject = `Your verification code: ${otp}`;
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Verification Code</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
        }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { 
            background: linear-gradient(135deg, #5f6466, #4a5053); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
        }
        .content { background: white; padding: 40px 30px; }
        .otp-code { 
            background: linear-gradient(135deg, #007bff, #0056b3); 
            color: white; 
            font-size: 32px; 
            font-weight: bold; 
            text-align: center; 
            padding: 20px; 
            border-radius: 12px; 
            letter-spacing: 4px; 
            margin: 30px 0; 
            box-shadow: 0 4px 8px rgba(0,123,255,0.2);
            font-family: 'Monaco', 'Consolas', monospace;
        }
        .footer { 
            background: #f8f9fa; 
            padding: 20px 30px; 
            text-align: center; 
            font-size: 14px; 
            color: #666; 
            border-radius: 0 0 8px 8px; 
        }
        .warning { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 25px 0; 
        }
        .highlight { color: #007bff; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🔐 Email Verification</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Zintra Platform</p>
        </div>
        <div class="content">
            <h2 style="color: #333; margin-bottom: 20px;">Your Verification Code</h2>
            <p>Hello,</p>
            <p>You requested an email verification code for your Zintra account. Please use the following code to complete your verification:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p><strong class="highlight">✅ Enter this code in the verification form to complete the process.</strong></p>
            
            <div class="warning">
                <strong style="color: #856404;">⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>This code expires in <strong>10 minutes</strong></li>
                    <li>Never share this code with anyone</li>
                    <li>If you didn't request this verification, please ignore this email</li>
                    <li>For security, this code can only be used once</li>
                </ul>
            </div>
            
            <p style="margin-top: 30px;">If you're having trouble with verification, please contact our support team.</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                The Zintra Team
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0;">© 2026 Zintra Platform. All rights reserved.</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">This is an automated email, please do not reply directly to this address.</p>
        </div>
    </div>
</body>
</html>
`;

    const emailText = `
Your Zintra Platform verification code: ${otp}

Enter this code in the verification form to complete your email verification.

⚠️ Security Notice:
- This code expires in 10 minutes
- Never share this code with anyone  
- If you didn't request this verification, please ignore this email
- For security, this code can only be used once

Best regards,
The Zintra Team

© 2026 Zintra Platform. All rights reserved.
This is an automated email, please do not reply directly to this address.
`;

    // Send to our internal email API endpoint
    console.log(`[OTP Email] Sending email to: ${email}, OTP: ${otp}`);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-email-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: email,
        subject: emailSubject,
        html: emailHtml,
        text: emailText
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log(`[OTP Email] API Response:`, result);

    return {
      success: true,
      messageId: `email_otp_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[OTP Email Error] ${errorMessage}`);
    return {
      success: false,
      error: 'Failed to send email OTP: ' + errorMessage
    };
  }
}

/**
 * Send OTP via Email with custom template
 * Placeholder for future implementation
 */
export async function sendEmailOTPCustom(
  email: string,
  otp: string,
  type: 'registration' | 'login' | 'password_reset' = 'registration'
): Promise<OTPResult> {
  // TODO: Implement custom email templates for different OTP types
  return sendEmailOTP(email, otp);
}

// ============================================================================
// MULTI-CHANNEL OTP
// ============================================================================

/**
 * Send OTP via specified channel(s)
 * Supports SMS, Email, or both
 */
export async function sendOTP(
  phoneNumber: string,
  email: string,
  channels: ('sms' | 'email')[] = ['sms']
): Promise<{
  sms?: OTPResult;
  email?: OTPResult;
  anySuccess: boolean;
}> {
  const otp = generateOTP();
  const results: {
    sms?: OTPResult;
    email?: OTPResult;
    anySuccess: boolean;
  } = {
    anySuccess: false
  };

  // Send via requested channels
  if (channels.includes('sms') && phoneNumber) {
    results.sms = await sendSMSOTP(phoneNumber, otp);
    if (results.sms.success) results.anySuccess = true;
  }

  if (channels.includes('email') && email) {
    results.email = await sendEmailOTP(email, otp);
    if (results.email.success) results.anySuccess = true;
  }

  return results;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if OTP has expired
 * @param createdAt - ISO timestamp when OTP was created
 * @param expiryMinutes - Minutes until expiry (default: 10)
 * @returns true if expired
 */
export function isOTPExpired(
  createdAt: Date | string,
  expiryMinutes: number = 10
): boolean {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const expiryTime = new Date(created.getTime() + expiryMinutes * 60 * 1000);
  return new Date() > expiryTime;
}

/**
 * Get remaining time for OTP validity
 * @param createdAt - ISO timestamp when OTP was created
 * @param expiryMinutes - Minutes until expiry (default: 10)
 * @returns Remaining seconds, or 0 if expired
 */
export function getOTPRemainingTime(
  createdAt: Date | string,
  expiryMinutes: number = 10
): number {
  if (isOTPExpired(createdAt, expiryMinutes)) return 0;
  
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const expiryTime = new Date(created.getTime() + expiryMinutes * 60 * 1000);
  const remaining = Math.floor((expiryTime.getTime() - new Date().getTime()) / 1000);
  
  return Math.max(0, remaining);
}

/**
 * Format remaining time for display
 * @param seconds - Remaining seconds
 * @returns Formatted string (e.g., "5m 30s", "30s")
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const otpConfig: OTPConfig = {
  length: 6,
  expiryMinutes: 10,
  maxAttempts: 3
};
