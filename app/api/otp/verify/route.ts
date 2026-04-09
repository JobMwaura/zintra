/**
 * ============================================================================
 * OTP VERIFY ENDPOINT
 * ============================================================================
 * API route to verify OTP codes sent via SMS or Email
 * 
 * POST /api/otp/verify
 * 
 * Request Body:
 * {
 *   "otpId": "otp_1234567890",  // ID from send response
 *   "otpCode": "123456",         // User-entered OTP code
 *   "phoneNumber": "+254712345678"  // Optional - for verification
 * }
 * 
 * Response (Success):
 * {
 *   "success": true,
 *   "message": "OTP verified successfully",
 *   "userId": "uuid_here"
 * }
 * 
 * Response (Failure):
 * {
 *   "success": false,
 *   "error": "Invalid OTP code",
 *   "remainingAttempts": 2
 * }
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { isOTPExpired, validateOTPFormat } from '@/lib/services/otpService';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ============================================================================
// TYPES
// ============================================================================

interface VerifyOTPRequest {
  otpId?: string;
  otpCode: string;
  phoneNumber?: string;
  email?: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  userId?: string;
  remainingAttempts?: number;
  verified?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_OTP_ATTEMPTS = 3;
const OTP_EXPIRY_MINUTES = 10;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validate OTP code format
 */
function isValidOTPCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Hash OTP for secure comparison (simple example)
 * In production, use bcrypt or similar
 */
function hashOTP(otp: string): string {
  return Buffer.from(otp).toString('base64');
}

/**
 * Compare OTP (simple example)
 * In production, use bcrypt compare
 */
function compareOTP(provided: string, stored: string): boolean {
  // Direct string comparison - both should be plain text 6-digit codes
  const isMatch = provided === stored;
  console.log('[OTP Compare]', {
    provided,
    stored,
    isMatch,
    providedType: typeof provided,
    storedType: typeof stored,
    providedLength: provided.length,
    storedLength: stored.length
  });
  return isMatch;
}

// ============================================================================
// MAIN ENDPOINT
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<VerifyOTPResponse>> {
  try {
    // Parse request body
    const body = (await request.json()) as VerifyOTPRequest;
    const { otpId, otpCode, phoneNumber, email } = body;

    // Validate OTP code format
    console.log('[OTP Verify] Raw otpCode received:', {
      otpCode,
      type: typeof otpCode,
      length: otpCode?.length,
      chars: otpCode?.split('').map(c => ({ char: c, code: c.charCodeAt(0) }))
    });

    // Clean the OTP code (remove any whitespace)
    const cleanOtpCode = otpCode?.toString().trim();
    
    console.log('[OTP Verify] Cleaned otpCode:', {
      cleanOtpCode,
      type: typeof cleanOtpCode,
      length: cleanOtpCode?.length,
      isValid: isValidOTPCode(cleanOtpCode)
    });

    if (!cleanOtpCode || !isValidOTPCode(cleanOtpCode)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid OTP format. Must be 6 digits. Received: "${cleanOtpCode}" (length: ${cleanOtpCode?.length})`
        },
        { status: 400 }
      );
    }

    // Try to find OTP record
    let otpRecord: any = null;

    // Method 1: Find by otpId (preferred)
    if (otpId) {
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('id', otpId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          {
            success: false,
            error: 'OTP not found. Please request a new one.'
          },
          { status: 404 }
        );
      }
      otpRecord = data;
    }
    // Method 2: Find by phone number
    else if (phoneNumber) {
      // First, clean up any expired OTPs for this phone
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      
      try {
        await supabase
          .from('otp_verifications')
          .update({ verified: false })
          .eq('phone_number', phoneNumber)
          .eq('verified', false)
          .lt('created_at', tenMinutesAgo.toISOString());
      } catch (cleanupError) {
        console.log('[OTP Verify] Note: Could not cleanup old OTPs:', cleanupError);
      }
      
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.log('[OTP Verify] Error finding OTP for phone:', { phoneNumber, error });
        return NextResponse.json(
          {
            success: false,
            error: 'No pending OTP found for this phone number.'
          },
          { status: 404 }
        );
      }
      console.log('[OTP Verify] Found record for phone:', { 
        phoneNumber, 
        recordId: data.id,
        recordPhone: data.phone_number,
        storedCode: data.otp_code,
        createdAt: data.created_at,
        verified: data.verified 
      });
      otpRecord = data;
    }
    // Method 3: Find by email
    else if (email) {
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('email_address', email)
        .eq('verified', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return NextResponse.json(
          {
            success: false,
            error: 'No pending OTP found for this email.'
          },
          { status: 404 }
        );
      }
      otpRecord = data;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Must provide otpId, phoneNumber, or email'
        },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (isOTPExpired(otpRecord.created_at, OTP_EXPIRY_MINUTES)) {
      // Mark as expired
      await supabase
        .from('otp_verifications')
        .update({ verified: false })
        .eq('id', otpRecord.id);

      return NextResponse.json(
        {
          success: false,
          error: 'OTP has expired. Please request a new one.'
        },
        { status: 401 }
      );
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum OTP attempts exceeded. Please request a new one.',
          remainingAttempts: 0
        },
        { status: 401 }
      );
    }

    // Verify OTP code
    const isValid = compareOTP(cleanOtpCode, otpRecord.otp_code);

    console.log('[OTP Verify]', {
      provided: otpCode,
      stored: otpRecord.otp_code,
      isValid,
      match: otpCode === otpRecord.otp_code
    });

    if (!isValid) {
      // Increment attempts
      const newAttempts = otpRecord.attempts + 1;
      const remainingAttempts = MAX_OTP_ATTEMPTS - newAttempts;

      await supabase
        .from('otp_verifications')
        .update({ attempts: newAttempts })
        .eq('id', otpRecord.id);

      // If last attempt, fail with final message
      if (remainingAttempts === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid OTP code. Maximum attempts exceeded.',
            remainingAttempts: 0
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid OTP code',
          remainingAttempts
        },
        { status: 401 }
      );
    }

    // OTP is valid - mark as verified
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({
        verified: true,
        verified_at: now
      })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Error updating OTP verification:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify OTP. Please try again.'
        },
        { status: 500 }
      );
    }

    // If associated with a user, update their verification status
    if (otpRecord.user_id) {
      const updateData: any = {};
      if (otpRecord.method === 'sms' && otpRecord.phone_number) {
        updateData.phone_verified = true;
        updateData.phone_verified_at = now;
      } else if (otpRecord.method === 'email' && otpRecord.email_address) {
        updateData.email_verified = true;
        updateData.email_verified_at = now;
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('users')
          .update(updateData)
          .eq('id', otpRecord.user_id);
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully',
        userId: otpRecord.user_id || undefined,
        verified: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP Verify Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: `Failed to verify OTP: ${errorMessage}`
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET METHOD (Optional - for debugging/testing)
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<VerifyOTPResponse>> {
  // Only allow GET in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'GET method not allowed in production' },
      { status: 405 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const otpCode = searchParams.get('code');
    const phoneNumber = searchParams.get('phone');
    const otpId = searchParams.get('otpId');

    if (!otpCode) {
      return NextResponse.json(
        { success: false, error: 'Provide code parameter' },
        { status: 400 }
      );
    }

    // Forward to POST handler
    const body = {
      otpId: otpId || undefined,
      otpCode,
      phoneNumber: phoneNumber || undefined
    };

    const mockRequest = new NextRequest('http://localhost:3000/api/otp/verify', {
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
