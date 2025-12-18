# OTP Service Implementation - Complete Setup Guide

## Overview

This guide walks you through setting up the complete OTP verification system for Zintra using TextSMS Kenya for SMS and optional email service.

---

## What We've Created

### 1. **Service Layer** - `/lib/services/otpService.ts`
Core OTP functionality:
- OTP generation (secure 6-digit codes)
- SMS sending via TextSMS Kenya API
- Email OTP placeholder (for future SendGrid/Resend integration)
- Expiry and validation helpers
- Rate limiting utilities

### 2. **API Routes**
#### Send OTP - `/app/api/otp/send/route.ts`
- Endpoint: `POST /api/otp/send`
- Sends OTP via SMS, email, or both
- Rate limiting (3 attempts per 10 minutes)
- Stores OTP in database

#### Verify OTP - `/app/api/otp/verify/route.ts`
- Endpoint: `POST /api/otp/verify`
- Validates OTP codes
- Max 3 verification attempts
- Updates user verification status

### 3. **Database** - `/supabase/sql/CREATE_OTP_TABLE.sql`
- `otp_verifications` table for tracking OTPs
- Automatic cleanup function
- Row-level security policies
- Verification status columns in `users` table

---

## Step-by-Step Setup

### Step 1: Set Environment Variables

Add to `.env.local`:

```env
# TextSMS Kenya Configuration
NEXT_PUBLIC_TEXTSMS_BASE_URL=https://sms.textsms.co.ke
TEXTSMS_API_KEY=your_api_key_from_textsms
TEXTSMS_PARTNER_ID=your_partner_id_from_textsms
TEXTSMS_SHORTCODE=your_shortcode_from_textsms

# Email Service (optional for now)
SENDGRID_API_KEY=your_sendgrid_key_here
SENDGRID_FROM_EMAIL=noreply@zintra.co.ke

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3
```

**How to get TextSMS Kenya credentials:**
1. Visit https://sms.textsms.co.ke
2. Sign up for an account
3. Create API credentials in your dashboard
4. Get your API Key, Partner ID, and Shortcode
5. Add them to environment variables above

### Step 2: Create Database Tables

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run the SQL from `/supabase/sql/CREATE_OTP_TABLE.sql`

This will:
- Create `otp_verifications` table
- Add columns to `users` table
- Set up indexes for performance
- Enable row-level security

### Step 3: Test the Service

Test sending OTP via curl:

```bash
# Test SMS OTP
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "type": "registration"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "OTP sent successfully via sms",
  "otpId": "otp_1234567890_abc123",
  "expiresIn": 600
}
```

Test verifying OTP:

```bash
# Test OTP verification
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "otpCode": "123456"
  }'
```

### Step 4: Build & Test

```bash
# Build the project
npm run build

# Run in development
npm run dev

# Check for TypeScript errors
npm run type-check
```

---

## API Documentation

### Send OTP Endpoint

**POST** `/api/otp/send`

#### Request Body
```typescript
{
  phoneNumber?: string;      // "+254712345678" or "0712345678"
  email?: string;            // "user@example.com"
  channel?: 'sms' | 'email' | ['sms', 'email'];  // Default: 'sms'
  type?: 'registration' | 'login' | 'payment' | 'password_reset';  // Default: 'registration'
  userId?: string;           // Optional - associate with user
}
```

#### Response (Success)
```json
{
  "success": true,
  "message": "OTP sent successfully via sms",
  "otpId": "otp_1234567890_abc123",
  "expiresIn": 600,
  "smsResult": { "success": true }
}
```

#### Response (Error)
```json
{
  "success": false,
  "error": "Invalid phone number format"
}
```

#### Examples

**Send SMS OTP for registration:**
```javascript
const response = await fetch('/api/otp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+254712345678',
    type: 'registration'
  })
});
const data = await response.json();
// Save data.otpId for verification
```

**Send OTP via both SMS and Email:**
```javascript
const response = await fetch('/api/otp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+254712345678',
    email: 'user@example.com',
    channel: ['sms', 'email'],
    type: 'registration'
  })
});
```

---

### Verify OTP Endpoint

**POST** `/api/otp/verify`

#### Request Body
```typescript
{
  otpCode: string;           // "123456" - required
  otpId?: string;            // From send response
  phoneNumber?: string;      // Alternative lookup
  email?: string;            // Alternative lookup
}
```

#### Response (Success)
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "userId": "user-uuid-here",
  "verified": true
}
```

#### Response (Error)
```json
{
  "success": false,
  "error": "Invalid OTP code",
  "remainingAttempts": 2
}
```

#### Examples

**Verify OTP using otpId:**
```javascript
const response = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    otpId: 'otp_1234567890_abc123',
    otpCode: '123456'
  })
});
const result = await response.json();
if (result.success) {
  console.log('Phone verified!');
}
```

**Verify OTP using phone number:**
```javascript
const response = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+254712345678',
    otpCode: '123456'
  })
});
```

---

## Integration Examples

### 1. User Registration with Phone Verification

```typescript
// pages/register.tsx
import { useState } from 'react';

export default function Register() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpId, setOtpId] = useState('');

  const handleSendOTP = async () => {
    const response = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber,
        type: 'registration'
      })
    });

    const data = await response.json();
    if (data.success) {
      setOtpId(data.otpId);
      setStep('otp');
    } else {
      alert('Failed to send OTP: ' + data.error);
    }
  };

  const handleVerifyOTP = async () => {
    const response = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otpId,
        otpCode
      })
    });

    const data = await response.json();
    if (data.success) {
      // Continue with registration
      console.log('Phone verified, create account');
    } else {
      alert('Invalid OTP: ' + data.error);
    }
  };

  return (
    <div>
      {step === 'phone' ? (
        <div>
          <input
            type="tel"
            placeholder="+254712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button onClick={handleSendOTP}>Send OTP</button>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="123456"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.slice(0, 6))}
            maxLength={6}
          />
          <button onClick={handleVerifyOTP}>Verify OTP</button>
        </div>
      )}
    </div>
  );
}
```

### 2. Phone Verification in Vendor Registration

```typescript
// Add phone verification to vendor registration form
async function verifyVendorPhone(phone: string) {
  // Send OTP
  const sendRes = await fetch('/api/otp/send', {
    method: 'POST',
    body: JSON.stringify({
      phoneNumber: phone,
      type: 'registration'
    })
  });

  const { otpId } = await sendRes.json();

  // Show verification modal
  const otpCode = await showOTPModal();

  // Verify OTP
  const verifyRes = await fetch('/api/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ otpId, otpCode })
  });

  const result = await verifyRes.json();
  return result.success;
}
```

### 3. 2FA Login (Optional)

```typescript
// Add 2FA after login
async function loginWith2FA(email: string, password: string) {
  // 1. Regular login
  const loginRes = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  const { user } = await loginRes.json();

  // 2. Send 2FA OTP to phone
  const otpRes = await fetch('/api/otp/send', {
    method: 'POST',
    body: JSON.stringify({
      phoneNumber: user.phone,
      type: 'login'
    })
  });

  const { otpId } = await otpRes.json();

  // 3. Verify OTP
  const otpCode = await show2FAModal();
  const verifyRes = await fetch('/api/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ otpId, otpCode })
  });

  if (verifyRes.ok) {
    // Complete login
    return user;
  }
}
```

---

## Security Considerations

### ✅ What We've Implemented

1. **OTP Generation**
   - Cryptographically secure 6-digit codes
   - Each OTP is unique
   - 10-minute expiry (short window)

2. **Rate Limiting**
   - Max 3 send requests per 10 minutes
   - Max 3 verification attempts per OTP
   - Prevents brute force attacks

3. **Validation**
   - Phone number format validation
   - Email format validation
   - OTP code format validation

4. **Database Security**
   - Row-level security policies
   - OTP stored in database
   - Verification timestamps logged

5. **API Security**
   - HTTPS only (enforced in production)
   - Environment variables for secrets
   - Request validation

### ⚠️ Production Recommendations

1. **Hash OTPs Before Storage**
   ```typescript
   // In otpService.ts
   import bcrypt from 'bcryptjs';
   const hashedOTP = await bcrypt.hash(otp, 10);
   // Store hashedOTP
   ```

2. **Use Redis for Rate Limiting**
   ```typescript
   // Replace in-memory store with Redis
   import Redis from 'redis';
   const redis = Redis.createClient();
   ```

3. **Monitor for Abuse**
   ```typescript
   // Log suspicious activity
   console.log(`[SECURITY] OTP spam attempt from ${phoneNumber}`);
   ```

4. **Add CAPTCHA**
   - Add reCAPTCHA to OTP request form
   - Prevents automated attacks

5. **Use HTTPS**
   - Enforce HTTPS in production
   - Protects in-transit data

---

## Testing

### Manual Testing

Test the send/verify flow:

```bash
# 1. Send OTP
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "type": "registration"
  }'

# 2. Note the otpId from response

# 3. Verify OTP (use test code from SMS or logs)
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "otpId": "otp_xxx_yyy",
    "otpCode": "123456"
  }'
```

### Automated Testing

```typescript
// tests/otp.test.ts
import { sendSMSOTP, generateOTP } from '@/lib/services/otpService';

describe('OTP Service', () => {
  it('should generate 6-digit OTP', () => {
    const otp = generateOTP();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('should send SMS OTP', async () => {
    const result = await sendSMSOTP('+254712345678', '123456');
    expect(result.success).toBe(true);
  });
});
```

---

## Troubleshooting

### SMS Not Sending

**Problem:** OTP send returns 500 error
**Solution:**
1. Check TextSMS Kenya API key in `.env.local`
2. Verify phone number format (+254 or 0)
3. Check API rate limits with TextSMS Kenya
4. Check TextSMS Kenya account balance

### OTP Always Invalid

**Problem:** Verification fails with "Invalid OTP code"
**Solution:**
1. Verify OTP code is exactly what user entered
2. Check OTP hasn't expired (10 minutes)
3. Check max attempts not exceeded (3)
4. Look at database record to confirm OTP stored

### Rate Limiting Not Working

**Problem:** Can send unlimited OTPs
**Solution:**
1. In-memory rate limiting only works within same process
2. For multiple servers, use Redis or database
3. Check `process.env.NODE_ENV` for development bypass

### Email OTP Not Working

**Problem:** Email OTP returns "not implemented"
**Solution:**
1. Email service is placeholder for now
2. Integrate SendGrid or Resend:
   ```typescript
   import sgMail from '@sendgrid/mail';
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   await sgMail.send({ to, from, subject, html });
   ```

---

## Next Steps

### Phase 1: Complete (✅)
- [x] OTP service infrastructure
- [x] SMS integration with TextSMS Kenya
- [x] API routes for send/verify
- [x] Database table
- [x] Basic testing

### Phase 2: UI Components (⏭️)
- [ ] Create OTP input component
- [ ] Create phone verification modal
- [ ] Create OTP verification form
- [ ] Integrate into registration flow

### Phase 3: Email Integration (Optional)
- [ ] Choose email provider (SendGrid/Resend)
- [ ] Integrate email OTP
- [ ] Add email verification flow
- [ ] Add password reset via email

### Phase 4: Advanced Features (Optional)
- [ ] 2FA toggle in user settings
- [ ] Phone number change verification
- [ ] Account recovery via phone/email
- [ ] Push notifications for OTP
- [ ] WhatsApp OTP (if needed)

---

## Cost Estimates

### TextSMS Kenya SMS
- Average: 0.5 - 2 KES per SMS
- For 1,000 registrations/month: ~1,000-2,000 KES
- For 10,000 registrations/month: ~10,000-20,000 KES

### Email Service
- Free tier: 100-10,000 emails/month
- Paid: From $10/month

### Total Monthly Cost
- Light usage (< 500 messages): ~500-1,000 KES
- Medium usage (500-5,000): ~2,000-5,000 KES
- Heavy usage (5,000+): ~10,000+ KES

---

## Support Resources

### Documentation
- TextSMS Kenya: https://sms.textsms.co.ke
- SendGrid: https://docs.sendgrid.com
- Resend: https://resend.com/docs
- Next.js API Routes: https://nextjs.org/docs/api-routes

### Files Created
1. `/lib/services/otpService.ts` - Core service
2. `/app/api/otp/send/route.ts` - Send endpoint
3. `/app/api/otp/verify/route.ts` - Verify endpoint
4. `/supabase/sql/CREATE_OTP_TABLE.sql` - Database setup

---

## Conclusion

✅ **OTP system is ready for integration!**

The complete infrastructure is in place:
- SMS sending via TextSMS Kenya ✅
- OTP verification API ✅
- Database storage ✅
- Rate limiting ✅
- Error handling ✅

Next: Integrate into registration and login flows.

For questions or issues, refer to the troubleshooting section or check the API documentation above.
