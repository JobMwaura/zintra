/**
 * SMS OTP Verify Endpoint
 * 
 * TWEAK 4: Phone Verification for Guest RFQ Submission
 * 
 * Purpose: Verify the 6-digit OTP code sent via SMS
 * 
 * Usage:
 * POST /api/auth/verify-sms-otp
 * Body: { phoneNumber: "254712345678", otpCode: "123456", email: "user@example.com" }
 * 
 * Response:
 * 200: { success: true, message: "Phone verified", verified: true }
 * 400: { success: false, message: "Invalid OTP" }
 * 410: { success: false, message: "OTP expired" }
 * 429: { success: false, message: "Too many attempts" }
 */

// Simple rate limiter for Vercel serverless environment
const rateLimitStore = {};

function checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { count: 1, firstAttempt: now };
    return true;
  }
  
  const entry = rateLimitStore[key];
  
  // Reset if window has passed
  if (now - entry.firstAttempt > windowMs) {
    rateLimitStore[key] = { count: 1, firstAttempt: now };
    return true;
  }
  
  // Check if within limit
  if (entry.count < maxAttempts) {
    entry.count++;
    return true;
  }
  
  return false;
}

export default async function handler(req, res) {
  // Apply rate limiting (skip in development)
  if (process.env.NODE_ENV === 'production') {
    const { phoneNumber } = req.body || {};
    if (phoneNumber && !checkRateLimit(`sms-verify:${phoneNumber}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        message: 'Too many verification attempts. Please try again later.'
      });
    }
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { phoneNumber, otpCode, email } = req.body;

  // Validation
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  if (!otpCode || typeof otpCode !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'OTP code is required'
    });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  // Validate phone format
  const phoneDigitsOnly = phoneNumber.replace(/\D/g, '');
  if (phoneDigitsOnly.length < 10 || phoneDigitsOnly.length > 15) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }

  // Validate OTP format (must be 6 digits)
  const otpDigitsOnly = otpCode.replace(/\D/g, '');
  if (otpDigitsOnly.length !== 6) {
    return res.status(400).json({
      success: false,
      message: 'OTP must be 6 digits'
    });
  }

  try {
    // Step 1: Retrieve stored OTP
    if (!global.otpStore) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new code.'
      });
    }

    const otpKey = `otp_${phoneDigitsOnly}_${email}`;
    const storedOtp = global.otpStore[otpKey];

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this phone number and email. Please request a new code.'
      });
    }

    // Step 2: Check if OTP expired
    if (storedOtp.expiresAt < Date.now()) {
      delete global.otpStore[otpKey];
      return res.status(410).json({
        success: false,
        message: 'OTP has expired. Please request a new code.'
      });
    }

    // Step 3: Check if too many attempts
    if (storedOtp.attempts >= 5) {
      delete global.otpStore[otpKey];
      return res.status(429).json({
        success: false,
        message: 'Too many verification attempts. Please request a new code.'
      });
    }

    // Step 4: Verify OTP code
    if (otpDigitsOnly !== storedOtp.code) {
      // Increment attempts
      storedOtp.attempts++;
      
      const attemptsLeft = 5 - storedOtp.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${attemptsLeft > 0 ? `${attemptsLeft} attempts left.` : 'Please request a new code.'}`
      });
    }

    // Step 5: OTP is valid! Delete from store
    delete global.otpStore[otpKey];

    // Step 6: In production, update user's phone_verified_at in database
    // For now, we just mark it as verified in response
    // The RFQ API endpoint will check for phone_verified_at

    console.log(`Phone verified for ${email}: ${phoneNumber}`);

    return res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      verified: true,
      phoneNumber: phoneDigitsOnly,
      email: email
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error verifying OTP'
    });
  }
}

/**
 * IMPORTANT: Phone Verification Flow
 * 
 * After OTP verification is successful:
 * 1. Guest's email + phone are captured
 * 2. RFQ API endpoint (/pages/api/rfq/create.js) requires phone_verified_at
 * 3. For guests, we mark phone as verified when OTP passes
 * 4. For authenticated users, phone_verified_at is set during profile update
 * 
 * PRODUCTION SETUP:
 * 
 * 1. Store OTP in Redis (not in-memory global):
 *    ```javascript
 *    const redis = require('redis');
 *    const client = redis.createClient({
 *      host: process.env.REDIS_HOST,
 *      port: process.env.REDIS_PORT
 *    });
 *    
 *    // Store OTP
 *    await client.setex(otpKey, 300, otpCode); // 5 minutes
 *    
 *    // Verify OTP
 *    const code = await client.get(otpKey);
 *    ```
 * 
 * 2. Database Schema Update:
 *    ```sql
 *    ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
 *    ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMP;
 *    
 *    CREATE TABLE phone_verification (
 *      id UUID PRIMARY KEY,
 *      email VARCHAR(255) NOT NULL,
 *      phone_number VARCHAR(20) NOT NULL,
 *      verified BOOLEAN DEFAULT FALSE,
 *      verified_at TIMESTAMP,
 *      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *    );
 *    ```
 * 
 * 3. After successful OTP verification:
 *    - If user is authenticated: Update users.phone_verified_at
 *    - If user is guest: Store in temporary table until RFQ created
 *    - RFQ created with phone_verified_at timestamp
 * 
 * 4. Security Considerations:
 *    - OTP stored server-side only, never sent in response (except dev)
 *    - Rate limit attempts (max 5 per 15 min)
 *    - Rate limit OTP sends (max 3 per 15 min)
 *    - Expire OTP after 5 minutes
 *    - Increment attempts counter on wrong code
 *    - Delete OTP after successful verification
 */
