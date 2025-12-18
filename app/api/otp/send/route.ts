/**
 * ============================================================================
 * OTP SEND ENDPOINT
 * ============================================================================
 * API route to send OTP verification codes via SMS or Email
 * 
 * POST /api/otp/send
 * 
 * Request Body:
 * {
 *   "phoneNumber": "+254712345678",  // Optional
 *   "email": "user@example.com",     // Optional
 *   "channel": "sms" | "email" | ["sms", "email"]  // Default: "sms"
 *   "type": "registration" | "login" | "payment" | "password_reset"  // Default: "registration"
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "message": "OTP sent successfully",
 *   "expiresIn": 600,
 *   "otpId": "otp_1234567890"
 * }
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendSMSOTP, sendSMSOTPCustom, sendEmailOTP, generateOTP, isOTPExpired } from '@/lib/services/otpService';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ============================================================================
// TYPES
// ============================================================================

interface SendOTPRequest {
  phoneNumber?: string;
  email?: string;
  channel?: 'sms' | 'email' | ('sms' | 'email')[];
  type?: 'registration' | 'login' | 'payment' | 'password_reset';
  userId?: string;
}

interface SendOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  otpId?: string;
  expiresIn?: number;
  smsResult?: any;
  emailResult?: any;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

// In-memory store for rate limiting (consider using Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxAttempts: number = 3, windowSeconds: number = 600): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowSeconds * 1000
    });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false; // Rate limited
  }

  record.count += 1;
  return true;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validate phone number format
 */
function validatePhoneNumber(phone: string): boolean {
  // Kenya format: +254712345678 or 0712345678
  return /^(\+254|0)\d{9}$/.test(phone);
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Normalize phone number to +254 format
 */
function normalizePhoneNumber(phone: string): string {
  if (phone.startsWith('+254')) return phone;
  if (phone.startsWith('0')) return '+254' + phone.slice(1);
  return '+254' + phone;
}

// ============================================================================
// MAIN ENDPOINT
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<SendOTPResponse>> {
  try {
    // Parse request body
    const body = (await request.json()) as SendOTPRequest;
    const { phoneNumber, email, channel = 'sms', type = 'registration', userId } = body;

    // Validate at least one contact method provided
    if (!phoneNumber && !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either phoneNumber or email must be provided'
        },
        { status: 400 }
      );
    }

    // Normalize and validate phone number if provided
    let validatedPhone: string | null = null;
    if (phoneNumber) {
      if (!validatePhoneNumber(phoneNumber)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid phone number format. Use +254712345678 or 0712345678'
          },
          { status: 400 }
        );
      }
      validatedPhone = normalizePhoneNumber(phoneNumber);
    }

    // Validate email if provided
    let validatedEmail: string | null = null;
    if (email) {
      if (!validateEmail(email)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid email format'
          },
          { status: 400 }
        );
      }
      validatedEmail = email.toLowerCase();
    }

    // Check rate limiting per phone/email
    const rateLimitKey = validatedPhone || validatedEmail || 'unknown';
    if (!checkRateLimit(rateLimitKey, 3, 600)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many OTP requests. Please try again in 10 minutes.'
        },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = generateOTP(6);
    const otpId = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Send OTP via specified channel(s)
    let smsResult: any = null;
    let emailResult: any = null;
    const channels = Array.isArray(channel) ? channel : [channel];

    if (channels.includes('sms') && validatedPhone) {
      if (type === 'registration') {
        smsResult = await sendSMSOTPCustom(validatedPhone, otp, 'registration');
      } else {
        smsResult = await sendSMSOTPCustom(validatedPhone, otp, type);
      }
    }

    if (channels.includes('email') && validatedEmail) {
      emailResult = await sendEmailOTP(validatedEmail, otp);
    }

    // Check if at least one channel succeeded
    const smsSuccess = smsResult?.success || false;
    const emailSuccess = emailResult?.success || false;
    const anySuccess = smsSuccess || emailSuccess;

    if (!anySuccess) {
      const errors: string[] = [];
      if (smsResult?.error) errors.push(`SMS: ${smsResult.error}`);
      if (emailResult?.error) errors.push(`Email: ${emailResult.error}`);

      return NextResponse.json(
        {
          success: false,
          error: errors.join(' | ') || 'Failed to send OTP via all channels'
        },
        { status: 500 }
      );
    }

    // Store OTP record in database for verification
    if (anySuccess) {
      try {
        await supabase.from('otp_verifications').insert({
          id: otpId,
          user_id: userId || null,
          phone_number: validatedPhone,
          email_address: validatedEmail,
          otp_code: otp, // In production, hash this
          method: channels[0], // Store first successful channel
          verified: false,
          attempts: 0,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        });
      } catch (dbError) {
        console.error('Database error storing OTP:', dbError);
        // Don't fail the request if DB storage fails - OTP was still sent
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: `OTP sent successfully via ${channels.join(' and ')}`,
        otpId,
        expiresIn: 600, // 10 minutes in seconds
        smsResult: smsSuccess ? { success: true } : undefined,
        emailResult: emailSuccess ? { success: true } : undefined
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP Send Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: `Failed to process OTP request: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET METHOD (Optional - for debugging/testing)
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<SendOTPResponse>> {
  // Only allow GET in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'GET method not allowed in production' },
      { status: 405 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const phoneNumber = searchParams.get('phone');
    const email = searchParams.get('email');

    if (!phoneNumber && !email) {
      return NextResponse.json(
        { success: false, error: 'Provide phone or email parameter' },
        { status: 400 }
      );
    }

    // Forward to POST handler
    const body = {
      phoneNumber: phoneNumber || undefined,
      email: email || undefined,
      channel: 'sms'
    };

    const mockRequest = new NextRequest('http://localhost:3000/api/otp/send', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    return POST(mockRequest);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
