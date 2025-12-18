# OTP Verification Service Integration Analysis

## Service Overview: TextSMS Kenya OTP Service

### API Details
- **Service:** TextSMS Kenya (sms.textsms.co.ke)
- **Endpoint:** `/api/services/sendotp/`
- **Supported Methods:** GET & POST
- **Use Case:** SMS OTP delivery for verification (email & phone)

---

## Service Capabilities

### ✅ What It Can Do
1. **Send SMS OTP** to mobile numbers
2. **Supports GET & POST** methods for flexibility
3. **Customizable Messages** - can include custom text
4. **Shortcode Support** - for branded sender ID
5. **Partner Integration** - business-level credentials

### ⚠️ Limitations & Clarifications

**SMS Only, Not Email:**
- This service sends **SMS only** (text messages)
- For email verification, we'll need a **separate email service** (e.g., SendGrid, Resend, AWS SES)
- Can't directly send email OTPs with this service

**Supported Channels:**
- ✅ SMS (mobile/text)
- ❌ Email (requires separate service)
- ❌ WhatsApp (not mentioned in API)

---

## Implementation Architecture

### Channel Strategy
```
User Verification Flow
│
├─ Email Verification → SendGrid/Resend/AWS SES (separate service)
│  │
│  ├─ User Registration Email
│  ├─ Email Confirmation OTP
│  └─ Password Reset Email
│
└─ Phone Verification → TextSMS Kenya OTP API (this service)
   │
   ├─ User Registration SMS
   ├─ Phone Confirmation OTP
   ├─ Transaction Alerts
   └─ Important Notifications
```

---

## Required Implementation Files

### 1. OTP Service Wrapper
**File to Create:** `/lib/services/otpService.ts`
```typescript
// OTP Service Handler
export const sendOTP = async (
  phoneNumber: string,
  message: string,
  type: 'sms' | 'email'
): Promise<{ success: boolean; messageId?: string; error?: string }>
```

### 2. Email Service (Separate)
**File to Create:** `/lib/services/emailService.ts`
```typescript
// Email Service Handler
export const sendEmailOTP = async (
  email: string,
  otp: string
): Promise<{ success: boolean; messageId?: string; error?: string }>
```

### 3. OTP Storage Table
**Database:** Add OTP_VERIFICATIONS table for tracking
```sql
CREATE TABLE otp_verifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  phone_number text,
  email_address text,
  otp_code text UNIQUE,
  method text, -- 'sms' | 'email'
  verified boolean DEFAULT false,
  attempts int DEFAULT 0,
  created_at timestamptz,
  expires_at timestamptz,
  verified_at timestamptz
)
```

### 4. API Route for OTP Handling
**File to Create:** `/app/api/otp/send/route.ts`
**File to Create:** `/app/api/otp/verify/route.ts`

### 5. UI Components
**Files to Create:**
- `/components/OTPInput.tsx` - OTP entry component
- `/components/PhoneVerification.tsx` - Phone verification flow
- `/components/EmailVerification.tsx` - Email verification flow

---

## API Configuration Required

### Environment Variables Needed
```env
# TextSMS Kenya OTP Service
NEXT_PUBLIC_TEXTSMS_BASE_URL=https://sms.textsms.co.ke
TEXTSMS_API_KEY=your_api_key_here
TEXTSMS_PARTNER_ID=your_partner_id_here
TEXTSMS_SHORTCODE=your_shortcode_here

# Email Service (choose one)
# Option 1: SendGrid
SENDGRID_API_KEY=your_sendgrid_key_here

# Option 2: Resend
RESEND_API_KEY=your_resend_key_here

# Option 3: AWS SES
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your_access_key
AWS_SES_SECRET_KEY=your_secret_key

# OTP Settings
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3
```

---

## Implementation Steps

### Phase 1: Setup & Infrastructure (Week 1)
1. **Get TextSMS Kenya Credentials**
   - Sign up for TextSMS Kenya account
   - Get API key, Partner ID, Shortcode
   - Test SMS delivery with test numbers

2. **Choose Email Service Provider**
   - Option A: SendGrid (Recommended - free tier: 100 emails/day)
   - Option B: Resend (Great for Next.js, free tier available)
   - Option C: AWS SES (Cost-effective at scale)

3. **Create OTP Storage Table**
   - Run migration to create otp_verifications table
   - Add indexes for performance

4. **Create Service Wrappers**
   - `/lib/services/otpService.ts` - SMS OTP handler
   - `/lib/services/emailService.ts` - Email OTP handler

### Phase 2: API Routes (Week 1)
1. **Create OTP Send Endpoint**
   - `/app/api/otp/send` (POST)
   - Validates phone/email
   - Generates OTP code
   - Calls SMS/Email service
   - Stores in database

2. **Create OTP Verify Endpoint**
   - `/app/api/otp/verify` (POST)
   - Validates OTP code
   - Checks expiry
   - Prevents brute force
   - Updates user verification status

3. **Error Handling**
   - Rate limiting (max 3 attempts per OTP)
   - Expiry handling (10 min default)
   - Service failure fallbacks
   - Retry logic

### Phase 3: UI Components (Week 2)
1. **OTP Input Component**
   - 6-digit input field
   - Auto-focus next field
   - Paste support
   - Clear error states

2. **Phone Verification Page**
   - Phone number input
   - Send OTP button
   - Resend OTP (60s cooldown)
   - OTP verification form
   - Success confirmation

3. **Email Verification Page**
   - Email display
   - Send OTP button
   - Resend OTP (60s cooldown)
   - OTP verification form
   - Success confirmation

### Phase 4: Integration (Week 2)
1. **Registration Flow**
   - Add phone verification step
   - Add email verification step
   - Update users table with verified_phone, verified_email fields

2. **Login Flow**
   - Optional 2FA with SMS
   - Phone verification for sensitive operations

3. **Profile Management**
   - Ability to update phone number
   - Phone reverification required

---

## Implementation Example

### Send OTP API Route
```typescript
// /app/api/otp/send/route.ts
import { sendOTP } from '@/lib/services/otpService';

export async function POST(request: Request) {
  const { phoneNumber, type } = await request.json();

  // Validate input
  if (!phoneNumber || !type) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Generate 6-digit OTP
  const otp = Math.random().toString().slice(2, 8).padStart(6, '0');

  try {
    // Send via TextSMS Kenya
    const result = await sendOTP(
      phoneNumber,
      `Your ${type} verification code is: ${otp}`,
      'sms'
    );

    if (result.success) {
      // Store OTP in database
      await supabase
        .from('otp_verifications')
        .insert({
          phone_number: phoneNumber,
          otp_code: otp,
          method: 'sms',
          expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

      return Response.json({ success: true, message: 'OTP sent' });
    } else {
      return Response.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
```

### SMS Service Wrapper
```typescript
// /lib/services/otpService.ts
export async function sendOTP(
  phoneNumber: string,
  message: string,
  type: 'sms' | 'email'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  if (type === 'sms') {
    return sendSMSViaTextSMS(phoneNumber, message);
  } else if (type === 'email') {
    return sendEmailOTP(phoneNumber, message);
  }
}

async function sendSMSViaTextSMS(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  
  const apiKey = process.env.TEXTSMS_API_KEY;
  const partnerId = process.env.TEXTSMS_PARTNER_ID;
  const shortcode = process.env.TEXTSMS_SHORTCODE;
  
  const payload = {
    apikey: apiKey,
    partnerID: partnerId,
    mobile: phoneNumber,
    message: message,
    shortcode: shortcode
  };

  try {
    const response = await fetch(
      'https://sms.textsms.co.ke/api/services/sendotp/',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    
    if (response.ok && data.success) {
      return { success: true, messageId: data.messageId };
    } else {
      return { success: false, error: data.message || 'Failed to send SMS' };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
```

---

## Database Changes Required

### Add to Users Table
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
```

### Create OTP Verification Table
```sql
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text,
  email_address text,
  otp_code text UNIQUE NOT NULL,
  method text CHECK (method IN ('sms', 'email')) NOT NULL,
  verified boolean DEFAULT false,
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz
);

CREATE INDEX idx_otp_phone ON public.otp_verifications(phone_number);
CREATE INDEX idx_otp_code ON public.otp_verifications(otp_code);
CREATE INDEX idx_otp_expires ON public.otp_verifications(expires_at);
```

---

## Email Service Recommendations

### Option 1: SendGrid (Recommended)
**Pros:**
- Free tier: 100 emails/day
- Excellent deliverability
- Good documentation
- Reliable for production

**Implementation:**
```typescript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmailOTP(email: string, otp: string) {
  await sgMail.send({
    to: email,
    from: 'noreply@zintra.co.ke',
    subject: 'Your Zintra Verification Code',
    html: `<p>Your verification code is: <strong>${otp}</strong></p>`
  });
}
```

### Option 2: Resend (Modern Alternative)
**Pros:**
- Built for Next.js
- React email components
- Simpler API
- Good free tier

**Implementation:**
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailOTP(email: string, otp: string) {
  await resend.emails.send({
    from: 'noreply@zintra.co.ke',
    to: email,
    subject: 'Your Zintra Verification Code',
    html: `<p>Your code: <strong>${otp}</strong></p>`
  });
}
```

---

## Security Considerations

### ✅ Security Best Practices
1. **OTP Generation**
   - Use cryptographically secure random
   - 6 digits (666,666 combinations)
   - 10-minute expiry (short window)

2. **Rate Limiting**
   - Max 3 attempts per OTP
   - Lock after failed attempts
   - Exponential backoff for resend

3. **Phone Number Validation**
   - Validate format (Kenya +254)
   - Prevent common test numbers
   - Log all attempts

4. **Storage**
   - Hash OTP before storing
   - Use separate table
   - Auto-cleanup expired OTPs

5. **API Security**
   - Use HTTPS only
   - Validate API keys in environment
   - Log all OTP deliveries
   - Monitor for abuse

### ⚠️ Potential Risks
- SMS interception (mitigated by short expiry)
- Brute force attacks (rate limiting + attempt limits)
- Account takeover (add 2FA for sensitive operations)

---

## Timeline & Effort Estimate

| Phase | Task | Effort | Timeline |
|-------|------|--------|----------|
| 1 | Setup & Configuration | 2 days | Week 1 |
| 1 | Database Migrations | 1 day | Week 1 |
| 2 | API Routes | 3 days | Week 1 |
| 3 | UI Components | 3 days | Week 2 |
| 3 | Integration Testing | 2 days | Week 2 |
| Total | **Full Implementation** | **~11 days** | **~2 weeks** |

---

## Testing Strategy

### Unit Tests
- OTP generation logic
- Validation functions
- Rate limiting logic

### Integration Tests
- SMS delivery via TextSMS Kenya
- Email delivery via chosen service
- OTP verification flow
- Error handling

### E2E Tests
- Complete registration flow
- Phone verification
- Email verification
- 2FA flow (if implemented)

---

## Deployment Checklist

- [ ] Get TextSMS Kenya credentials
- [ ] Choose email service provider
- [ ] Set environment variables in .env.local
- [ ] Create database migrations
- [ ] Create service wrapper files
- [ ] Create API routes
- [ ] Create UI components
- [ ] Integration testing
- [ ] Security review
- [ ] Documentation
- [ ] Deploy to staging
- [ ] Final testing
- [ ] Deploy to production

---

## Next Steps

1. **Clarify Email vs SMS:**
   - This TextSMS Kenya service is SMS-only
   - You'll need separate email service for email OTPs
   - Both can work together

2. **Choose Email Provider:**
   - Recommend SendGrid or Resend
   - Both have free tiers

3. **Get API Credentials:**
   - TextSMS Kenya API key, Partner ID, Shortcode
   - Email service API key

4. **Start Implementation:**
   - Phase 1: Database + Service wrappers
   - Phase 2: API routes
   - Phase 3: UI components
   - Phase 4: Integration

---

## Conclusion

✅ **Yes, you can use TextSMS Kenya for SMS OTP verification** - it's specifically designed for this use case.

✅ **For Email OTP:** You'll need a separate service like SendGrid or Resend, as this TextSMS service is SMS-only.

✅ **Best Approach:** Implement both channels:
- **SMS:** TextSMS Kenya (for phone verification, alerts)
- **Email:** SendGrid/Resend (for email verification, password reset)

This dual-channel approach provides flexibility and better user experience for different verification scenarios.
