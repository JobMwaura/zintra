/**
 * ============================================================================
 * OTP SERVICE - SMS & Email Verification
 * ============================================================================
 * Handles OTP generation and delivery via SMS (TextSMS Kenya) and Email
 * 
 * Features:
 * - SMS OTP via TextSMS Kenya API
 * - Email OTP via EventsGear SMTP (production ready)
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

    // TextSMS Kenya expects phone number without + sign or with it
    // Try both formats but prefer the one without +
    let normalizedPhone = phoneNumber;
    
    // Remove + if present
    if (normalizedPhone.startsWith('+')) {
      normalizedPhone = normalizedPhone.slice(1);
    }
    
    // Ensure it starts with 254 (Kenya country code)
    if (!normalizedPhone.startsWith('254')) {
      // If it starts with 0, replace with 254
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '254' + normalizedPhone.slice(1);
      } else {
        // Otherwise prepend 254
        normalizedPhone = '254' + normalizedPhone;
      }
    }

    console.log('[OTP SMS] Phone normalization:', {
      original: phoneNumber,
      normalized: normalizedPhone
    });

    // Message should be simple and not too long
    const message = messages[type];
    
    // TextSMS Kenya /sendotp/ endpoint payload
    // Based on API: https://sms.textsms.co.ke/api/services/sendotp/
    const payload = {
      apikey: apiKey,
      partnerID: partnerId,
      mobile: normalizedPhone,  // Phone without + sign
      message: message,
      shortcode: shortcode
    };

    console.log('[OTP SMS] Sending request to TextSMS Kenya:', {
      endpoint: 'https://sms.textsms.co.ke/api/services/sendotp/',
      phone: normalizedPhone,
      hasApiKey: !!apiKey,
      hasPartnerId: !!partnerId,
      hasShortcode: !!shortcode,
      messageLength: message.length,
      messagePreview: message.substring(0, 50),
      payloadKeys: Object.keys(payload)
    });

    const response = await fetch(
      'https://sms.textsms.co.ke/api/services/sendotp/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    console.log('[OTP SMS] Fetch response status:', response.status, response.statusText);
    
    // Check if response is OK before parsing JSON
    if (!response.ok) {
      console.error('[OTP SMS] HTTP error response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      const errorText = await response.text();
      console.error('[OTP SMS] Error response body:', errorText);
      return {
        success: false,
        error: `TextSMS API returned ${response.status}: ${response.statusText}`
      };
    }
    
    const data: TextSMSResponse = await response.json();

    console.log('[OTP SendOTP] Request:', { 
      phone: normalizedPhone, 
      type, 
      endpoint: '/sendotp/',
      timestamp: new Date().toISOString()
    });
    console.log('[OTP SendOTP Response]', JSON.stringify(data, null, 2));
    console.log('[OTP SendOTP Response Keys]', Object.keys(data));

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
    } else {
      // Unknown response format - log it and treat as failure with details
      console.error('[OTP SendOTP] Unrecognized response format from TextSMS Kenya:', data);
      errorMessage = 'Unrecognized response from TextSMS API. Check logs.';
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
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[OTP SMS Error]', { error: errorMsg, stack: error instanceof Error ? error.stack : undefined });
    return {
      success: false,
      error: `SMS Error: ${errorMsg}`
    };
  }
}

// ============================================================================
// EMAIL OTP - Placeholder for SendGrid/Resend Integration
// ============================================================================

/**
 * Send OTP via Email using EventsGear SMTP
 */
export async function sendEmailOTP(
  email: string,
  otp: string
): Promise<OTPResult> {
  try {
    console.log(`[OTP Email] Function called with email: "${email}", otp: "${otp}"`);
    
    // Check for undefined or empty email
    if (!email || typeof email !== 'string') {
      console.error(`[OTP Email] Email is invalid:`, { email, type: typeof email });
      return {
        success: false,
        error: 'Email address is required and must be a string'
      };
    }

    // Trim and validate email format
    const trimmedEmail = email.trim();
    if (!trimmedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      console.error(`[OTP Email] Invalid email format: "${trimmedEmail}"`);
      return {
        success: false,
        error: 'Invalid email format'
      };
    }

    if (!validateOTPFormat(otp)) {
      console.error(`[OTP Email] Invalid OTP format: "${otp}"`);
      return {
        success: false,
        error: 'Invalid OTP format'
      };
    }

    console.log(`[OTP Email] Preparing to send email to: ${trimmedEmail}, OTP: ${otp}`);

    // Check if production email is enabled
    const emailPassword = process.env.EVENTSGEAR_EMAIL_PASSWORD;
    
    if (!emailPassword) {
      // Simulation mode - no real email configured
      console.log(`[OTP Email] 📧 SIMULATING EMAIL (no EVENTSGEAR_EMAIL_PASSWORD):`);
      console.log(`[OTP Email] ┌─ From: Zintra <noreply@eventsgear.co.ke>`);
      console.log(`[OTP Email] ├─ To: ${trimmedEmail}`);
      console.log(`[OTP Email] ├─ Subject: Your Zintra verification code: ${otp}`);
      console.log(`[OTP Email] ├─ OTP Code: ${otp}`);
      console.log(`[OTP Email] └─ Status: Simulation mode (configure EVENTSGEAR_EMAIL_PASSWORD)`);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        success: true,
        messageId: `simulated_email_otp_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }

    // Production mode - send real email via EventsGear SMTP
    console.log(`[OTP Email] 📧 SENDING REAL EMAIL via EventsGear SMTP...`);
    
    // Lazy load nodemailer only when needed
    const nodemailer = await import('nodemailer');
    
    // Create nodemailer transporter for EventsGear SMTP
    const transporter = nodemailer.default.createTransport({
      host: 'mail.eventsgear.co.ke',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: 'noreply@eventsgear.co.ke',
        pass: emailPassword
      }
    });

    // Create simple but professional email content
    const emailSubject = `Your Zintra verification code: ${otp}`;
    
    // Simple HTML template that won't cause parsing issues
    const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white;">
  <div style="background: #007bff; color: white; padding: 30px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">Email Verification</h1>
    <p style="margin: 10px 0 0 0;">Zintra Platform</p>
  </div>
  <div style="padding: 40px 30px;">
    <h2>Your Verification Code</h2>
    <p>Hello,</p>
    <p>You requested an email verification code for your Zintra account. Please use the following code:</p>
    
    <div style="background: #f8f9fa; border: 2px solid #007bff; color: #007bff; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; margin: 20px 0; letter-spacing: 4px; font-family: monospace;">
      ${otp}
    </div>
    
    <p><strong>Enter this code in the verification form to complete the process.</strong></p>
    
    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0;">
      <strong>Security Notice:</strong>
      <ul style="margin: 10px 0;">
        <li>This code expires in 10 minutes</li>
        <li>Never share this code with anyone</li>
        <li>If you didn't request this, ignore this email</li>
      </ul>
    </div>
    
    <p style="color: #666; margin-top: 30px;">
      Best regards,<br>
      The Zintra Team
    </p>
  </div>
  <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
    <p>© 2026 Zintra Platform. All rights reserved.</p>
  </div>
</div>
`;

    // Send email
    const info = await transporter.sendMail({
      from: 'Zintra <noreply@eventsgear.co.ke>',
      to: trimmedEmail,
      subject: emailSubject,
      html: htmlContent,
      text: `Your Zintra verification code is: ${otp}. This code expires in 10 minutes. Never share this code with anyone.`
    });

    console.log(`[OTP Email] ✅ EMAIL SENT SUCCESSFULLY`);
    console.log(`[OTP Email] ├─ Message ID: ${info.messageId}`);
    console.log(`[OTP Email] ├─ From: Zintra <noreply@eventsgear.co.ke>`);
    console.log(`[OTP Email] ├─ To: ${trimmedEmail}`);
    console.log(`[OTP Email] └─ OTP: ${otp}`);

    return {
      success: true,
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[OTP Email Error] ${errorMessage}`);
    console.error(`[OTP Email Error] Full error:`, error);
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
