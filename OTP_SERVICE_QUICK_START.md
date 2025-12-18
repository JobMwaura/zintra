# OTP Service Quick Implementation Guide

## Can You Use TextSMS Kenya for OTP?

### ✅ YES - For SMS OTP
This TextSMS Kenya service is **perfect for SMS OTP delivery**:
- Sends verification codes via SMS
- Supports both GET and POST
- Kenya-based provider
- Reliable for user verification

### ❌ NO - Not for Email OTP
This service is **SMS-only**, not email:
- Can't send email directly
- Only sends text messages
- For email, use separate service (SendGrid, Resend, etc.)

---

## Quick Start: SMS OTP Setup

### 1. Get Credentials
Contact TextSMS Kenya and obtain:
- API Key
- Partner ID
- Shortcode (sender name)

### 2. Add to Environment
```env
# .env.local
TEXTSMS_API_KEY=your_api_key_here
TEXTSMS_PARTNER_ID=your_partner_id_here
TEXTSMS_SHORTCODE=your_shortcode_here
TEXTSMS_BASE_URL=https://sms.textsms.co.ke
```

### 3. Create Service Wrapper (5 minutes)
```typescript
// /lib/services/otpService.ts
export async function sendSMSOTP(
  phoneNumber: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  const payload = {
    apikey: process.env.TEXTSMS_API_KEY,
    partnerID: process.env.TEXTSMS_PARTNER_ID,
    mobile: phoneNumber,
    message: `Your Zintra verification code is: ${otp}`,
    shortcode: process.env.TEXTSMS_SHORTCODE
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
    return data.success ? { success: true } : { success: false, error: data.message };
  } catch (error) {
    return { success: false, error: 'SMS send failed' };
  }
}
```

### 4. Create API Route (5 minutes)
```typescript
// /app/api/otp/send/route.ts
import { sendSMSOTP } from '@/lib/services/otpService';

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();
  
  // Generate 6-digit OTP
  const otp = Math.random().toString().slice(2, 8).padStart(6, '0');
  
  // Send SMS
  const result = await sendSMSOTP(phoneNumber, otp);
  
  if (result.success) {
    // TODO: Store OTP in database for verification
    return Response.json({ success: true });
  } else {
    return Response.json({ error: result.error }, { status: 500 });
  }
}
```

### 5. Test It
```bash
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+254712345678"}'
```

---

## Use Cases in Zintra

### ✅ Use SMS OTP For:
1. **User Registration** - Verify phone number during signup
2. **Vendor Registration** - Verify business phone
3. **Login 2FA** - Optional two-factor authentication
4. **Payment Confirmation** - OTP before sensitive transactions
5. **Quote Acceptance** - Confirm quote acceptance via SMS

### ❌ Don't Use SMS OTP For (Use Email Instead):
1. Email verification - Use SendGrid/Resend
2. Password reset - Use email service
3. Invoices/Receipts - Use email service
4. Long messages - SMS has character limits

---

## SMS vs Email OTP Comparison

| Feature | SMS (TextSMS) | Email (SendGrid) |
|---------|---------------|-----------------|
| **Speed** | Instant (seconds) | Fast (1-2 min) |
| **Cost** | Paid per SMS | 100/day free |
| **Delivery** | High (99%+) | High (99%+) |
| **Use Case** | Phone verification | Email verification |
| **Deliverability** | Very reliable | Depends on ISP |
| **International** | Works globally | Works globally |

---

## Full Implementation Roadmap

### Phase 1: Database (30 min)
```sql
-- Add columns to users table
ALTER TABLE public.users ADD COLUMN phone_verified boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN phone_verified_at timestamptz;

-- Create OTP tracking table
CREATE TABLE otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  otp_code text UNIQUE NOT NULL,
  verified boolean DEFAULT false,
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  expires_at timestamptz NOT NULL
);
```

### Phase 2: Backend Services (1 hour)
1. Create `/lib/services/otpService.ts` - SMS sending
2. Create `/lib/services/otpValidator.ts` - OTP validation
3. Create `/app/api/otp/send/route.ts` - Send endpoint
4. Create `/app/api/otp/verify/route.ts` - Verify endpoint

### Phase 3: Frontend Components (2 hours)
1. Create `PhoneVerificationModal.tsx` - Modal for phone entry
2. Create `OTPInput.tsx` - 6-digit OTP input
3. Create `PhoneVerificationFlow.tsx` - Complete flow

### Phase 4: Integration (2 hours)
1. Add to user registration
2. Add to vendor registration
3. Add to login (optional 2FA)
4. Add to payment flows

**Total Time:** ~5-6 hours for full implementation

---

## Security Quick Checklist

- [ ] OTP is 6 digits (secure enough)
- [ ] OTP expires in 10 minutes
- [ ] Max 3 verification attempts
- [ ] OTP codes are one-time use
- [ ] Phone numbers validated before sending
- [ ] Rate limiting on OTP requests
- [ ] API keys stored in environment variables
- [ ] Use HTTPS for all API calls
- [ ] Log all OTP deliveries for audit
- [ ] Implement rate limiting per phone number

---

## Example: User Registration with SMS OTP

```typescript
// Registration page flow
1. User enters email → Create auth account
2. User enters phone → Send OTP via SMS
3. User enters OTP code → Verify and confirm
4. Update user record with phone_verified = true
5. Registration complete
```

---

## Pricing & Cost Estimate

### TextSMS Kenya SMS
- Typically **0.5 - 2 KES per SMS** (varies by volume)
- For 1000 users: ~500-2000 KES/month
- Can negotiate volume discounts

### Email Service (SendGrid)
- Free: 100 emails/day
- Paid: From $10/month for 25,000 emails
- Usually sufficient for most platforms

### Total Monthly Cost
- SMS OTP: ~1000 KES (if used moderately)
- Email: Free tier or ~500 KES
- **Total: ~1500 KES/month** for both channels

---

## Decision Matrix: SMS vs Email OTP

**Use SMS OTP when:**
- ✅ Verifying phone number
- ✅ Quick verification needed
- ✅ High security (separate from email)
- ✅ 2FA implementation

**Use Email OTP when:**
- ✅ Verifying email address
- ✅ Less urgent
- ✅ Longer message needed
- ✅ Low-cost verification

**Use Both when:**
- ✅ Maximum security (multi-factor)
- ✅ Multiple verification methods
- ✅ Different user types (buyer vs vendor)

---

## Next Steps for Zintra

1. **Decision:** Do you want to implement SMS OTP?
2. **Contact TextSMS Kenya** to get API credentials
3. **Choose email provider** (SendGrid recommended)
4. **Decide on verification flow:**
   - Mandatory phone verification?
   - Optional 2FA?
   - Vendor vs buyer different flows?
5. **Start with Phase 1** (database) first

---

## Helpful Resources

### TextSMS Kenya
- Website: https://sms.textsms.co.ke
- API Docs: Check their support/docs section
- Test: Use test numbers before production

### Email Services
- **SendGrid:** https://sendgrid.com
- **Resend:** https://resend.com
- **AWS SES:** https://aws.amazon.com/ses/

### Next.js OTP Examples
- NextAuth.js for auth flow
- Prisma ORM for OTP storage
- Server actions for API routes

---

## Conclusion

✅ **TextSMS Kenya is perfect for SMS OTP in Zintra**

**Recommended Setup:**
- SMS via TextSMS Kenya (phone verification, 2FA)
- Email via SendGrid (email verification, password reset)
- Combined approach gives best UX

**Effort:** ~1 week for full implementation including both channels

Ready to proceed? Let me know and I'll help with the implementation! 🚀
