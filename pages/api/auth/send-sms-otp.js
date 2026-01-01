/**
 * SMS OTP Send Endpoint
 * 
 * TWEAK 4: Phone Verification for Guest RFQ Submission
 * 
 * Purpose: Generate a 6-digit OTP and send it via SMS to the provided phone number
 * 
 * Usage:
 * POST /api/auth/send-sms-otp
 * Body: { phoneNumber: "254712345678", email: "user@example.com" }
 * 
 * Response:
 * 200: { success: true, message: "OTP sent successfully" }
 * 400: { success: false, message: "Invalid phone number" }
 * 429: { success: false, message: "Too many requests" }
 * 500: { success: false, message: "SMS service error" }
 */

import rateLimit from 'express-rate-limit';

// Rate limiting: Max 3 OTP sends per phone per 15 minutes
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many OTP requests. Please try again later.',
  skip: () => process.env.NODE_ENV === 'development'
});

export default async function handler(req, res) {
  // Apply rate limiting
  await new Promise((resolve, reject) => {
    otpLimiter(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  }).catch(() => {
    return res.status(429).json({
      success: false,
      message: 'Too many OTP requests. Please try again later.'
    });
  });

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { phoneNumber, email } = req.body;

  // Validation
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  // Validate phone format (must be 10-15 digits)
  const phoneDigitsOnly = phoneNumber.replace(/\D/g, '');
  if (phoneDigitsOnly.length < 10 || phoneDigitsOnly.length > 15) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  try {
    // Step 1: Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Step 2: Store OTP temporarily in memory with expiry (5 minutes)
    // NOTE: In production, use Redis or database for distributed systems
    if (!global.otpStore) {
      global.otpStore = {};
    }

    const otpKey = `otp_${phoneDigitsOnly}_${email}`;
    global.otpStore[otpKey] = {
      code: otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0
    };

    // Clean up expired OTPs periodically
    Object.keys(global.otpStore).forEach(key => {
      if (global.otpStore[key].expiresAt < Date.now()) {
        delete global.otpStore[key];
      }
    });

    // Step 3: Send SMS via existing SMS provider
    // IMPORTANT: Replace with your actual SMS API integration
    // Examples:
    // - Twilio: https://www.twilio.com/en-us/messaging/channels/sms
    // - AWS SNS: https://aws.amazon.com/sns/
    // - Local SMS provider (Safaricom, Airtel, etc.)

    const smsResult = await sendSmsOtp(phoneNumber, otp);

    if (!smsResult.success) {
      console.error('SMS send failed:', smsResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    // Step 4: Return success response
    console.log(`OTP sent for ${phoneNumber}: ${otp}`); // Remove in production

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your phone',
      // Do NOT return the OTP code in production!
      // This is only for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error('SMS OTP send error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending OTP'
    });
  }
}

/**
 * Send SMS OTP via existing SMS API
 * 
 * INTEGRATE WITH YOUR SMS PROVIDER HERE
 * 
 * Examples:
 * - Twilio, AWS SNS, Safaricom API, Airtel API, etc.
 */
async function sendSmsOtp(phoneNumber, otp) {
  try {
    // OPTION 1: Twilio Integration (recommended)
    // Uncomment and configure if using Twilio
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      body: `Your Zintra verification code is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return { success: true, messageId: message.sid };
    */

    // OPTION 2: AWS SNS Integration
    // Uncomment and configure if using AWS SNS
    /*
    const AWS = require('aws-sdk');
    const sns = new AWS.SNS({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });

    const params = {
      Message: `Your Zintra verification code is: ${otp}. Valid for 5 minutes.`,
      PhoneNumber: phoneNumber
    };

    const result = await sns.publish(params).promise();
    return { success: true, messageId: result.MessageId };
    */

    // OPTION 3: Local SMS Provider (Safaricom, Airtel, etc.)
    // Example with Safaricom API
    /*
    const response = await fetch('https://api.safaricom.co.ke/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SAFARICOM_API_KEY}`
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        message: `Your Zintra verification code is: ${otp}. Valid for 5 minutes.`,
        senderId: 'Zintra'
      })
    });

    const data = await response.json();
    if (data.success) {
      return { success: true, messageId: data.messageId };
    } else {
      return { success: false, error: data.message };
    }
    */

    // OPTION 4: Development/Mock Response
    // This is for testing without actual SMS provider
    if (process.env.NODE_ENV === 'development' || process.env.SMS_PROVIDER === 'mock') {
      console.log(`[MOCK SMS] OTP to ${phoneNumber}: ${otp}`);
      return { success: true, messageId: `mock_${Date.now()}` };
    }

    // If no provider configured, return error
    console.error('No SMS provider configured');
    return {
      success: false,
      error: 'SMS provider not configured. Please contact support.'
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Setup Instructions for SMS Provider
 * 
 * 1. CHOOSE YOUR SMS PROVIDER:
 *    - Twilio: https://www.twilio.com/console
 *    - AWS SNS: https://aws.amazon.com/sns/
 *    - Safaricom API: https://www.safaricom.co.ke/business/m-pesa/api
 *    - Airtel: https://www.airtel.co.ke/
 *    - or any other provider
 * 
 * 2. ADD CREDENTIALS TO .env.local:
 *    TWILIO_ACCOUNT_SID=your_account_sid
 *    TWILIO_AUTH_TOKEN=your_auth_token
 *    TWILIO_PHONE_NUMBER=your_twilio_number
 *    
 *    OR:
 *    
 *    AWS_ACCESS_KEY_ID=your_access_key
 *    AWS_SECRET_ACCESS_KEY=your_secret_key
 *    AWS_REGION=us-east-1
 *    
 *    OR:
 *    
 *    SAFARICOM_API_KEY=your_api_key
 * 
 * 3. UNCOMMENT THE INTEGRATION YOU'RE USING
 * 
 * 4. TEST WITH:
 *    curl -X POST http://localhost:3000/api/auth/send-sms-otp \
 *      -H "Content-Type: application/json" \
 *      -d '{"phoneNumber": "+254712345678", "email": "test@example.com"}'
 * 
 * 5. IN DEVELOPMENT:
 *    - Set NODE_ENV=development to skip rate limiting
 *    - Set SMS_PROVIDER=mock to use mock SMS (prints to console)
 *    - OTP will be returned in response for testing
 */
