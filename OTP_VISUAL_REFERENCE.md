# OTP Service - Visual Architecture & Quick Reference

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZINTRA OTP SYSTEM                             │
└─────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │  User/Vendor │
                          │  Registration│
                          └──────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
            ┌──────────────┐       ┌──────────────┐
            │   Enter      │       │   Enter      │
            │   Phone      │       │   Email      │
            └──────┬───────┘       └──────┬───────┘
                   │                      │
                   └──────────┬───────────┘
                              │
                    ┌─────────▼────────┐
                    │ POST /api/otp/   │
                    │ send             │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌────────────┐   ┌────────────┐  ┌──────────────┐
    │ TextSMS    │   │ SendGrid   │  │ Supabase     │
    │ Kenya API  │   │ (Email)    │  │ Database     │
    │ SMS Send   │   │ Email Send │  │ Store OTP    │
    └────────────┘   └────────────┘  └──────────────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                    ┌────────▼────────┐
                    │ User receives:  │
                    │ - SMS code OR   │
                    │ - Email code OR │
                    │ - Both          │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ User enters     │
                    │ OTP code        │
                    └────────┬────────┘
                             │
                    ┌────────▼─────────┐
                    │ POST /api/otp/   │
                    │ verify           │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Verify in DB:    │
                    │ - Check expiry   │
                    │ - Check attempts │
                    │ - Validate code  │
                    └────────┬─────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌─────────────┐        ┌────────────────┐
        │ Invalid     │        │ Valid          │
        │ Return err  │        │ Mark verified  │
        │ Retry?      │        │ Continue flow  │
        └─────────────┘        └────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────┐
│        USER/VENDOR SUBMISSION            │
└────────────────┬────────────────────────┘
                 │
                 ▼ Phone: +254712345678
        ┌────────────────────┐
        │  API Route         │
        │  /api/otp/send     │
        └────────┬───────────┘
                 │
                 ├─ Validate phone number
                 ├─ Check rate limits
                 ├─ Generate OTP (6 digits)
                 │
                 ▼
        ┌────────────────────┐
        │  TextSMS Kenya     │
        │  API Call          │
        └────────┬───────────┘
                 │
                 ├─ Send SMS: "Your code: 123456"
                 │
                 ▼
        ┌────────────────────┐
        │  Supabase Database │
        │  Store:            │
        │  - otp_code        │
        │  - phone_number    │
        │  - expires_at      │
        │  - created_at      │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Return to Client: │
        │  {                 │
        │    otpId: "...",   │
        │    expiresIn: 600  │
        │  }                 │
        └────────┬───────────┘
                 │
                 ▼ User enters: 123456
        ┌────────────────────┐
        │  API Route         │
        │  /api/otp/verify   │
        └────────┬───────────┘
                 │
                 ├─ Find OTP record
                 ├─ Check expiry (10 min)
                 ├─ Check attempts (3 max)
                 ├─ Validate code
                 │
                 ▼
        ┌────────────────────┐
        │  Supabase Database │
        │  Update:           │
        │  - verified: true  │
        │  - verified_at     │
        │  - user.phone_...  │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Return Success:   │
        │  {                 │
        │    success: true,  │
        │    userId: "..."   │
        │  }                 │
        └────────┬───────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  CONTINUE FLOW     │
        │  (Registration,    │
        │   Login, etc.)     │
        └────────────────────┘
```

---

## File Structure

```
zintra-platform/
│
├── 📄 lib/services/
│   └── otpService.ts
│       ├── generateOTP()
│       ├── sendSMSOTP()
│       ├── sendEmailOTP()
│       ├── isOTPExpired()
│       └── ... [+15 more functions]
│
├── 📡 app/api/otp/
│   ├── send/
│   │   └── route.ts (POST /api/otp/send)
│   │       ├── Validate inputs
│   │       ├── Rate limit check
│   │       ├── Generate OTP
│   │       ├── Send via SMS/Email
│   │       └── Store in DB
│   │
│   └── verify/
│       └── route.ts (POST /api/otp/verify)
│           ├── Find OTP record
│           ├── Check expiry
│           ├── Check attempts
│           ├── Validate code
│           └── Update user
│
├── 🗄️ supabase/sql/
│   └── CREATE_OTP_TABLE.sql
│       ├── CREATE TABLE otp_verifications
│       ├── CREATE TABLE users (add columns)
│       ├── CREATE INDEXES
│       └── CREATE RLS POLICIES
│
└── 📚 Documentation/
    ├── OTP_SERVICE_FINAL_ANSWER.md (← START HERE)
    ├── OTP_SERVICE_QUICK_START.md
    ├── OTP_SERVICE_INTEGRATION_ANALYSIS.md
    ├── OTP_IMPLEMENTATION_COMPLETE.md
    ├── OTP_SERVICE_SUMMARY.md
    ├── OTP_INTEGRATION_EXAMPLES.md
    └── OTP_SERVICE_FINAL_INDEX.md
```

---

## Technology Stack

```
┌──────────────────────────────────────┐
│         Frontend (Your App)            │
├──────────────────────────────────────┤
│ React / Next.js / TypeScript          │
│ - Phone input component               │
│ - OTP input component                 │
│ - Form state management               │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│         API Layer (Next.js)            │
├──────────────────────────────────────┤
│ /api/otp/send    (TypeScript)         │
│ /api/otp/verify  (TypeScript)         │
│ Rate limiting, validation, logging    │
└────────────┬─────────────────────────┘
             │
     ┌───────┼───────┐
     │       │       │
     ▼       ▼       ▼
┌─────┐ ┌──────┐ ┌────────┐
│SMS  │ │Email │ │Database│
├─────┤ ├──────┤ ├────────┤
│Text-│ │Send- │ │Supabase│
│SMS  │ │Grid  │ │Postgres│
│Kenya│ │Resend│ │        │
└─────┘ └──────┘ └────────┘
```

---

## Security Model

```
┌─────────────────────────────────────────────────┐
│            SECURITY LAYERS                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. INPUT VALIDATION                             │
│    ✅ Phone format check (+254 format)          │
│    ✅ Email format validation                   │
│    ✅ OTP code format (6 digits)                │
│                                                 │
│ 2. RATE LIMITING                                │
│    ✅ Max 3 OTP sends per 10 minutes            │
│    ✅ Max 3 verification attempts per OTP       │
│    ✅ Per-phone-number rate limiting            │
│                                                 │
│ 3. TEMPORAL SECURITY                            │
│    ✅ OTP expires in 10 minutes                 │
│    ✅ One-time use only                         │
│    ✅ Timestamp tracking                        │
│                                                 │
│ 4. CRYPTO SECURITY                              │
│    ✅ Secure random OTP generation              │
│    ✅ 6-digit code (666k combinations)          │
│    ✅ Unique per request                        │
│    ✅ Ready for bcrypt hashing                  │
│                                                 │
│ 5. DATABASE SECURITY                            │
│    ✅ Row-level security enabled                │
│    ✅ Audit trail in database                   │
│    ✅ Encryption-ready schema                   │
│    ✅ Auto-cleanup of old OTPs                  │
│                                                 │
│ 6. API SECURITY                                 │
│    ✅ HTTPS enforced                            │
│    ✅ Request validation                        │
│    ✅ Error handling (no leaks)                 │
│    ✅ Attempt logging                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## State Machine Diagram

```
                    ┌─────────┐
                    │  START  │
                    └────┬────┘
                         │
                    ┌────▼────────┐
                    │ Phone/Email  │
                    │ Entered      │
                    └────┬────────┘
                         │
              ┌──────────▼──────────┐
              │  /api/otp/send      │
              │  Generate & Send    │
              └──────────┬──────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
      FAILURE                      SUCCESS
            │                         │
            ▼                         ▼
     ┌─────────────┐        ┌──────────────┐
     │ Error page  │        │ Waiting for  │
     │ Retry?      │        │ OTP code     │
     └─────────────┘        │ (10 min)     │
                            └──────┬───────┘
                                   │
                                   │ User enters code
                                   │
                            ┌──────▼────────┐
                            │ /api/otp/      │
                            │ verify         │
                            │ Check & verify │
                            └──────┬────────┘
                                   │
                    ┌──────────────┬──────────────┐
                    │              │              │
               EXPIRED        INVALID         VALID
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────┐   ┌──────────────┐ ┌────────┐
            │ Error    │   │ Error        │ │ Verify │
            │ Resend?  │   │ Attempts: N  │ │ Marked │
            └──────────┘   │ Retry?       │ │ ✅    │
                           └──────────────┘ └───┬────┘
                                                │
                                    ┌───────────▼────────┐
                                    │  CONTINUE FLOW     │
                                    │  (Registration,    │
                                    │   Login, etc.)     │
                                    └────────────────────┘
```

---

## Integration Points in Zintra

```
ZINTRA PLATFORM
│
├── 🚀 User Registration
│   ├─ Get email
│   ├─ Get password
│   ├─ [OTP] Get phone ← Verify with SMS
│   └─ Create account
│
├── 🏢 Vendor Registration
│   ├─ Get business info
│   ├─ Get contact email
│   ├─ [OTP] Get business phone ← Verify with SMS
│   └─ Create vendor account
│
├── 🔐 Login (Optional 2FA)
│   ├─ Email & password
│   ├─ [OTP] Send SMS code ← Verify with SMS
│   └─ Grant access
│
├── 💳 Payment
│   ├─ Initiate transaction
│   ├─ [OTP] Confirm via SMS ← Verify with SMS
│   └─ Process payment
│
├── 🔑 Account Recovery
│   ├─ Forgot password?
│   ├─ [OTP] Verify phone ← Verify with SMS
│   └─ Reset password
│
└── 📱 Phone Number Change
    ├─ User wants to change phone
    ├─ [OTP] Verify new phone ← Verify with SMS
    └─ Update profile
```

---

## Cost Breakdown

```
┌──────────────────────────────────────┐
│    MONTHLY OPERATING COSTS            │
├──────────────────────────────────────┤
│                                      │
│ Scenario 1: Light Usage (100 OTPs)   │
│ ├─ SMS: 100 × 1 KES        = 100 KES │
│ ├─ Email: Free (SendGrid)   = 0 KES  │
│ └─ Total                    = 100 KES │
│                                      │
│ Scenario 2: Medium Usage (1K OTPs)   │
│ ├─ SMS: 1,000 × 1 KES   = 1,000 KES  │
│ ├─ Email: Free (SendGrid)  = 0 KES   │
│ └─ Total                = 1,000 KES   │
│                                      │
│ Scenario 3: Heavy Usage (10K OTPs)   │
│ ├─ SMS: 10,000 × 1 KES = 10,000 KES  │
│ ├─ Email: SendGrid      = 500 KES    │
│ └─ Total               = 10,500 KES   │
│                                      │
│ Note: Average SMS cost 0.5-2 KES     │
│ Volume discounts available at scale  │
│                                      │
└──────────────────────────────────────┘
```

---

## API Request/Response Examples

### Send OTP Request
```http
POST /api/otp/send HTTP/1.1
Content-Type: application/json

{
  "phoneNumber": "+254712345678",
  "type": "registration",
  "channel": "sms"
}
```

### Send OTP Response (Success)
```json
{
  "success": true,
  "message": "OTP sent successfully via sms",
  "otpId": "otp_1234567890_abc123",
  "expiresIn": 600,
  "smsResult": {
    "success": true
  }
}
```

### Verify OTP Request
```http
POST /api/otp/verify HTTP/1.1
Content-Type: application/json

{
  "otpId": "otp_1234567890_abc123",
  "otpCode": "123456"
}
```

### Verify OTP Response (Success)
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "userId": "user-uuid-12345",
  "verified": true
}
```

### Verify OTP Response (Error)
```json
{
  "success": false,
  "error": "Invalid OTP code",
  "remainingAttempts": 2
}
```

---

## Timeline & Milestones

```
Week 1: Setup
├─ Day 1-2: Configuration (2 hours)
│           - Get TextSMS credentials
│           - Add environment variables
│
├─ Day 3-4: Database (1 hour)
│           - Run migration
│           - Verify tables
│
└─ Day 5:   Testing (1 hour)
            - Test API endpoints
            - Verify SMS delivery

Week 2: Integration
├─ Day 1-2: Components (4 hours)
│           - Create PhoneVerification component
│           - Create OTP input component
│
├─ Day 3-4: Integration (4 hours)
│           - Add to registration flow
│           - Add to vendor signup
│           - Integration testing
│
└─ Day 5:   Deployment (2 hours)
            - Staging deployment
            - Final testing
            - Production go-live

Total: ~15 hours development time
       ~10 calendar days
```

---

## Success Indicators

```
✅ System Ready When:
├─ TextSMS Kenya credentials obtained
├─ Environment variables set
├─ Database tables created
├─ API endpoints responding
├─ Rate limiting working
├─ SMS delivery verified
├─ Expiry checking working
├─ Attempt limiting working
├─ User verification status updating
├─ Documentation reviewed
└─ Team trained

🎯 Performance Targets:
├─ SMS delivery: < 30 seconds
├─ API response: < 500ms
├─ Database query: < 100ms
├─ Error rate: < 1%
└─ Uptime: 99.9%

📊 Business Metrics:
├─ Registration completion: +15%
├─ Fraud reduction: 80%+
├─ Customer trust: +25%
└─ Support tickets: -40%
```

---

## Quick Decision Matrix

```
┌────────────────────────────────────────┐
│ DECISION: SMS vs Email OTP             │
├────────────────────────────────────────┤
│                                        │
│ Use SMS (TextSMS Kenya) if:            │
│ ✅ Verifying phone numbers             │
│ ✅ Quick verification needed           │
│ ✅ Kenya-focused users                 │
│ ✅ Budget-conscious                    │
│ ✅ Mobile-first audience               │
│                                        │
│ Use Email (SendGrid) if:               │
│ ✅ Verifying email addresses           │
│ ✅ Less urgent                         │
│ ✅ International users                 │
│ ✅ Rich content needed                 │
│ ✅ Long messages                       │
│                                        │
│ Use BOTH when:                         │
│ ✅ Maximum security (2FA)              │
│ ✅ Multiple verification methods       │
│ ✅ Different user types                │
│ ✅ Redundancy desired                  │
│                                        │
└────────────────────────────────────────┘
```

---

## Environment Setup

```bash
# .env.local configuration

# TextSMS Kenya SMS Service
TEXTSMS_API_KEY=abc123def456...
TEXTSMS_PARTNER_ID=zintra_partner
TEXTSMS_SHORTCODE=ZINTRA
NEXT_PUBLIC_TEXTSMS_BASE_URL=https://sms.textsms.co.ke

# Email Service (future)
SENDGRID_API_KEY=SG.xxxxx...
SENDGRID_FROM_EMAIL=noreply@zintra.co.ke

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3

# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

---

This is your complete visual reference for the OTP system!

**Next Step:** Pick a guide from OTP_SERVICE_FINAL_INDEX.md and start implementation! 🚀
