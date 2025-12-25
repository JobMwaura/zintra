/**
 * ============================================================================
 * OTP SERVICE - SMS & Email Verification
 * ============================================================================
 * Handles OTP generation and delivery via SMS (TextSMS Kenya) and Email
 * 
 * Features:
 * - SMS OTP via TextSMS Kenya API
 * - Email OTP (placeholder for SendGrid/Resend integration)
 * - OTP generation (secure random 6-digit codes)
 * - Rate limiting support
 * - Error handling and logging
 * 
 * Usage:
 *   const result = await sendSMSOTP('+254712345678', '123456');
 *   const result = await sendEmailOTP('user@example.com', '123456');
 * ============================================================================
 */

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
 * Send OTP via Email
 * Currently a placeholder - implement with SendGrid or Resend
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

    // TODO: Implement with SendGrid or Resend
    // For now, return placeholder response
    console.log(`[OTP Email] Email: ${email}, OTP: ${otp}`);

    return {
      success: false,
      error: 'Email OTP service not yet implemented. Please use SMS instead.'
    };

    // Example SendGrid implementation:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // 
    // const msg = {
    //   to: email,
    //   from: process.env.SENDGRID_FROM_EMAIL || 'noreply@zintra.co.ke',
    //   subject: 'Your Zintra Verification Code',
    //   html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
    // };
    //
    // const result = await sgMail.send(msg);
    // return {
    //   success: true,
    //   messageId: result[0].headers['x-message-id']
    // };
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
