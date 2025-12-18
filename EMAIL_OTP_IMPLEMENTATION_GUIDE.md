# Email OTP Implementation Guide

## Current Status

The OTP system has email OTP **structure** built in, but **implementation is incomplete**:

✅ **Backend Support**:
- OTP generation works for email
- Database schema supports email verification
- API endpoint accepts email parameter
- Error handling in place

❌ **Email Sending**: Currently returns error "Email OTP service not yet implemented"

---

## Email Service Options

### Option 1: **Resend** (Recommended for this project)
**Pros**:
- Modern, developer-friendly
- Easy setup
- Good free tier (100 emails/day)
- Best for small/medium projects
- Simple API

**Cons**:
- Smaller than competitors
- Free tier limited

**Cost**: Free tier → $20/month for more

**Setup Time**: ~10 minutes

---

### Option 2: **SendGrid**
**Pros**:
- Industry standard
- Very reliable
- Good documentation
- Flexible pricing

**Cons**:
- More complex setup
- Overkill for early stage

**Cost**: Free tier (100/day) → Pay as you go

**Setup Time**: ~15 minutes

---

### Option 3: **MailerSend**
**Pros**:
- Good balance of features and simplicity
- Reasonable pricing
- Good templates

**Cons**:
- Less well-known than SendGrid

**Cost**: Free tier (300/month) → $25/month

**Setup Time**: ~10 minutes

---

## My Recommendation

**Use Resend** because:
1. ✅ Perfect for your current scale
2. ✅ Easy to set up in minutes
3. ✅ Clean API similar to what's already partially coded
4. ✅ Great DX (Developer Experience)
5. ✅ Can upgrade later if needed

---

## Implementation with Resend

### Step 1: Install Package
```bash
npm install resend
```

### Step 2: Get API Key
1. Go to https://resend.com
2. Sign up (free)
3. Create API key
4. Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Step 3: Update Code

Replace the placeholder in `/lib/services/otpService.ts` with:

```typescript
export async function sendEmailOTP(
  email: string,
  otp: string
): Promise<OTPResult> {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@zintra.co.ke',
      to: email,
      subject: 'Your Zintra Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p>Your verification code is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #c28a3a; letter-spacing: 2px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">Valid for 10 minutes</p>
        </div>
      `,
    });

    return {
      success: true,
      messageId: emailResult.id,
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
```

### Step 4: Update Vendor Registration UI

Add option to choose SMS or Email in the registration form.

---

## Quick Setup Instructions

### For Local Development:

1. **Install Resend**:
   ```bash
   npm install resend
   ```

2. **Get API Key**:
   - Visit https://resend.com
   - Sign up (takes 2 minutes)
   - Create API key
   - Copy it

3. **Add to .env.local**:
   ```
   RESEND_API_KEY=your_api_key_here
   RESEND_FROM_EMAIL=noreply@zintra.co.ke
   ```

4. **Test**:
   ```bash
   curl -X POST http://localhost:3000/api/otp/send \
     -H "Content-Type: application/json" \
     -d '{
       "email":"your@email.com",
       "channel":"email",
       "type":"registration"
     }'
   ```

### For Production (Vercel):

1. Add environment variables in Vercel dashboard:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`

2. Deploy as usual

---

## API Usage

### Send Email OTP
```bash
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "channel": "email",
    "type": "registration"
  }'
```

### Verify Email OTP
```bash
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otpCode": "123456"
  }'
```

### Send Both SMS and Email
```bash
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "email": "user@example.com",
    "channel": ["sms", "email"],
    "type": "registration"
  }'
```

---

## Email Templates

You can customize email templates for different OTP types:

```typescript
const templates = {
  registration: {
    subject: 'Verify Your Zintra Account',
    heading: 'Welcome to Zintra!',
    message: 'Complete your vendor registration'
  },
  login: {
    subject: 'Zintra Login Code',
    heading: 'Login to Zintra',
    message: 'Secure your account with this code'
  },
  password_reset: {
    subject: 'Reset Your Password',
    heading: 'Password Reset',
    message: 'Use this code to reset your password'
  }
};
```

---

## Timeline

- **Setup Resend**: 5 minutes
- **Implement code**: 10 minutes
- **Add to .env**: 2 minutes
- **Test**: 5 minutes
- **Update UI**: 20 minutes

**Total**: ~45 minutes for full implementation

---

## Questions to Decide

1. **Which email service?** (I recommend Resend)
2. **SMS only or SMS + Email?** 
   - SMS only: Keep current system
   - SMS + Email: Add email option to registration
   - Email default: Change to email for primary channel
3. **From email address?** (e.g., noreply@zintra.co.ke)
4. **Email customization?** (branding, colors, etc.)

---

## What I Can Do

I can immediately:
✅ Install Resend package
✅ Implement sendEmailOTP function
✅ Add environment variables
✅ Test email sending
✅ Update registration UI to show SMS/Email options
✅ Create nice HTML email templates

Just let me know which email service you prefer and if you want SMS + Email or just Email!
