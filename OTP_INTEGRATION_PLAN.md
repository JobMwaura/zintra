# 🎯 OTP Integration Points - Zintra Platform

## Overview

OTP (One-Time Password) will be integrated across **6 major user flows** in Zintra:

```
┌─────────────────────────────────────────────────────────┐
│              ZINTRA OTP INTEGRATION MAP                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Buyer Registration (Phone + Email)                  │
│  2. Vendor Registration (Phone + Email)                 │
│  3. Admin Registration (Phone + Email)                  │
│  4. Login Security (Optional 2FA)                       │
│  5. Password Recovery (Phone or Email)                  │
│  6. Critical Actions (Payment verification)            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 1. BUYER REGISTRATION FLOW

### Current Pages to Modify:
- `app/(auth)/register/buyer/page.tsx`
- `app/(auth)/register/buyer/step-1/page.tsx`
- `app/(auth)/register/buyer/step-2/page.tsx`
- `app/(auth)/register/buyer/step-3/page.tsx`

### Where OTP Goes:
```
Step 1: Enter Email
  ↓
Send Email OTP
  ↓
Verify Email OTP ← [NEW: OTP Verification Modal]
  ↓
Step 2: Enter Phone
  ↓
Send SMS OTP
  ↓
Verify SMS OTP ← [NEW: OTP Verification Modal]
  ↓
Step 3: Complete Profile
  ↓
Success
```

### Components to Create:
```
src/components/auth/
├── OTPVerificationModal.tsx
│   ├── Phone OTP variant
│   └── Email OTP variant
├── PhoneInput.tsx
│   ├── Country code selector
│   └── Validation feedback
└── EmailOTPInput.tsx
    ├── Resend button
    └── Timer display
```

### Database Updates:
```
buyers table:
├── email_verified (boolean) ✅ Ready
├── email_verified_at (timestamp) ✅ Ready
├── phone_verified (boolean) ✅ Ready
└── phone_verified_at (timestamp) ✅ Ready
```

---

## 2. VENDOR REGISTRATION FLOW

### Current Pages to Modify:
- `app/(auth)/register/vendor/page.tsx`
- `app/(auth)/register/vendor/step-1/page.tsx`
- `app/(auth)/register/vendor/step-2/page.tsx`
- `app/(auth)/register/vendor/step-3/page.tsx`
- `app/(auth)/register/vendor/step-4/page.tsx`

### Where OTP Goes:
```
Step 1: Business Email
  ↓
Send Email OTP
  ↓
Verify Email OTP ← [OTP Modal]
  ↓
Step 2: Contact Phone
  ↓
Send SMS OTP
  ↓
Verify SMS OTP ← [OTP Modal]
  ↓
Step 3: Business Details
  ↓
Step 4: Verification Documents
  ↓
Success
```

### Additional OTP Use:
- **Business Phone Verification** (more critical for vendors)
- **Email + SMS both required** (vendors need both)

### Components:
```
src/components/vendor/
├── VendorPhoneOTP.tsx
│   ├── Business phone format
│   ├── Country validation
│   └── SMS delivery confirmation
└── VendorEmailOTP.tsx
    ├── Business email validation
    └── Custom email template
```

---

## 3. ADMIN/SUPER ADMIN REGISTRATION

### Current Pages to Modify:
- `app/admin/register/page.tsx` (if exists)
- Admin panel setup flow

### Where OTP Goes:
```
Admin Email
  ↓
Send Email OTP
  ↓
Verify Email OTP ← [OTP Modal - Admin themed]
  ↓
Admin Phone
  ↓
Send SMS OTP
  ↓
Verify SMS OTP ← [OTP Modal]
  ↓
2FA Setup (Optional)
  ↓
Admin Dashboard Access
```

### Special Requirements:
- **2FA Mandatory** for admins (higher security)
- Both email and SMS required
- Rate limiting stricter for admin accounts

---

## 4. LOGIN WITH 2FA (OPTIONAL)

### Current Pages to Modify:
- `app/(auth)/login/page.tsx`
- `app/(auth)/login/admin/page.tsx`

### Where OTP Goes:
```
Email + Password
  ↓
✓ Credentials Valid
  ↓
2FA Enabled? → YES
  ↓
Send SMS OTP to registered phone
  ↓
Enter OTP ← [OTP Modal]
  ↓
✓ Login Successful
  ↓
Dashboard
```

### User Settings Page:
- `app/profile/settings/security/page.tsx` (new)
- Toggle 2FA on/off
- Manage registered phone number
- View login history

### Components:
```
src/components/auth/
├── LoginOTPModal.tsx
│   ├── SMS OTP input
│   ├── Resend option
│   └── Fallback email option
└── TwoFactorSetup.tsx
    ├── Enable/Disable toggle
    ├── Phone configuration
    └── Backup codes (future)
```

---

## 5. PASSWORD RECOVERY

### Current Pages to Modify:
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/reset-password/page.tsx`

### Where OTP Goes:
```
Enter Email/Phone
  ↓
User Found?
  ↓
Send OTP (via user's preferred method)
  ↓
Verify OTP ← [OTP Modal]
  ↓
Set New Password
  ↓
Success
```

### User Choice:
- Send OTP to email
- Send OTP to phone
- User selects preference

### Components:
```
src/components/auth/
├── PasswordRecoveryOTP.tsx
│   ├── Method selector (email/SMS)
│   ├── OTP input field
│   └── New password reset
└── OTPResendButton.tsx
```

---

## 6. PAYMENT/SENSITIVE ACTIONS (Future Enhancement)

### Where OTP Goes:
```
Large Transaction Initiated
  ↓
Require OTP Verification
  ↓
Send SMS OTP
  ↓
User confirms transaction
  ↓
Payment processes
```

### Pages to Add:
- `app/quotes/[id]/checkout/page.tsx`
- `app/payment/confirm/page.tsx`

---

## SHARED COMPONENTS TO CREATE

### Location: `src/components/otp/`

```
src/components/otp/
├── OTPInput.tsx
│   ├── 6-digit input field
│   ├── Auto-focus between digits
│   ├── Paste support
│   └── Timer display (10 min countdown)
│
├── OTPModal.tsx
│   ├── Modal wrapper
│   ├── Title/description
│   ├── OTPInput component
│   ├── Resend button (60 sec cooldown)
│   ├── Loading state
│   └── Error messages
│
├── OTPResendButton.tsx
│   ├── Countdown timer (60 seconds)
│   ├── Disabled state while on cooldown
│   ├── Resend logic
│   └── Error handling
│
├── PhoneNumberInput.tsx
│   ├── Country code selector
│   ├── Phone number validation
│   ├── Format: +254712345678
│   └── Helpful placeholder
│
└── OTPStatusDisplay.tsx
    ├── Success/Error states
    ├── Attempt counter (3 max)
    └── Time remaining display
```

### Location: `src/hooks/`

```
src/hooks/
├── useOTP.ts
│   ├── Send OTP logic
│   ├── Verify OTP logic
│   ├── State management
│   ├── Timer logic
│   └── Error handling
│
├── usePhoneValidation.ts
│   ├── Kenya phone format validation
│   ├── Country code handling
│   └── Normalization
│
└── useOTPTimer.ts
    ├── 10-minute countdown
    ├── 60-second resend cooldown
    └── Expiry handling
```

---

## API ROUTES (Already Created ✅)

### Send OTP:
```
POST /api/otp/send
Body: {
  phoneNumber?: "+254712345678",
  email?: "user@example.com",
  channel: "sms" | "email" | "both",
  type: "registration" | "login" | "password_reset" | "payment"
}
Response: { success: true, otpId: "...", expiresIn: 600 }
```

### Verify OTP:
```
POST /api/otp/verify
Body: {
  otpId: "otp_xxx",
  otpCode: "123456"
}
Response: { success: true, verified: true, userId: "..." }
```

---

## FLOW DIAGRAMS

### Buyer Registration OTP Flow:
```
┌─────────────────────┐
│ Buyer Registration  │
└──────────┬──────────┘
           ↓
    ┌─────────────────┐
    │ Enter Email     │
    └────────┬────────┘
             ↓
    ┌─────────────────────────┐
    │ POST /api/otp/send      │
    │ (email, registration)   │
    └────────┬────────────────┘
             ↓
    ┌─────────────────┐
    │ OTP Modal       │
    │ Verify Email    │
    └────────┬────────┘
             ↓
    ┌──────────────────────────┐
    │ POST /api/otp/verify     │
    │ Mark email_verified=true │
    └────────┬─────────────────┘
             ↓
    ┌─────────────────┐
    │ Enter Phone     │
    └────────┬────────┘
             ↓
    ┌──────────────────────┐
    │ POST /api/otp/send   │
    │ (phone, registration)│
    └────────┬─────────────┘
             ↓
    ┌─────────────────┐
    │ OTP Modal       │
    │ Verify Phone    │
    └────────┬────────┘
             ↓
    ┌────────────────────────┐
    │ POST /api/otp/verify   │
    │ Mark phone_verified=true
    └────────┬────────────────┘
             ↓
    ┌──────────────┐
    │ Continue to  │
    │ Next Step    │
    └──────────────┘
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: High Priority (Week 1)
1. ✅ **Buyer Registration Email OTP**
   - Most common flow
   - Highest user volume
   - Impact: Prevent spam registrations

2. ✅ **Vendor Registration Phone OTP**
   - Critical for vendor verification
   - Phone more trusted in Kenya market
   - Impact: Verify real vendors

### Phase 2: Medium Priority (Week 2)
3. ⏳ **Password Recovery OTP**
   - User support critical
   - Both email and SMS options
   - Impact: Account security

4. ⏳ **Admin Registration OTP**
   - Security critical
   - Both email and SMS required
   - Impact: Prevent unauthorized admin access

### Phase 3: Lower Priority (Week 3+)
5. ⏳ **Login 2FA (Optional)**
   - Enhanced security feature
   - Optional for users
   - Impact: Account protection

6. ⏳ **Payment Verification OTP**
   - Future enhancement
   - Requires payment integration
   - Impact: Transaction security

---

## USER EXPERIENCE GUIDELINES

### OTP Modal Should:
✅ Show time remaining (10 minutes)
✅ Show attempt counter (3 max)
✅ Have clear, large input field
✅ Support paste from clipboard
✅ Auto-focus to next digit
✅ Show helpful error messages
✅ Have "Resend" button (60 sec cooldown)
✅ Show spinner while verifying
✅ Close on success
✅ Allow closing/canceling

### Error Messages:
```
"Invalid OTP. Please try again. (2 attempts remaining)"
"OTP has expired. Request a new one."
"Too many failed attempts. Please try again in 10 minutes."
"SMS delivery failed. Try email instead."
"Network error. Please check your connection."
```

### Success Messages:
```
"Email verified! ✓"
"Phone verified! ✓"
"OTP verified. Proceeding..."
"You're all set!"
```

---

## DATABASE SCHEMA (Already Created ✅)

```
otp_verifications table:
├── id (text, PK)
├── user_id (uuid, FK)
├── phone_number (text)
├── email_address (text)
├── otp_code (text, UNIQUE)
├── method (text: sms|email)
├── verified (boolean)
├── attempts (int, max 3)
├── created_at (timestamp)
├── expires_at (timestamp, 10 min)
└── verified_at (timestamp)

users/buyers/vendors table:
├── phone_verified (boolean) ✅ Added
├── phone_verified_at (timestamp) ✅ Added
├── email_verified (boolean) ✅ Added
└── email_verified_at (timestamp) ✅ Added
```

---

## ENVIRONMENT VARIABLES (Already Ready ✅)

```env
# .env.local (already created)
TEXTSMS_API_KEY=9c53d293fb384c98894370e4f9314406
TEXTSMS_PARTNER_ID=12487
TEXTSMS_SHORTCODE=EVENTS GEAR

# Future (for email OTP)
SENDGRID_API_KEY=... (when needed)
SMTP_HOST=... (when using Nodemailer)
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1 Tasks:
- [ ] Create `src/components/otp/OTPInput.tsx`
- [ ] Create `src/components/otp/OTPModal.tsx`
- [ ] Create `src/components/otp/PhoneNumberInput.tsx`
- [ ] Create `src/hooks/useOTP.ts`
- [ ] Create `src/hooks/usePhoneValidation.ts`
- [ ] Update buyer registration pages
- [ ] Update vendor registration pages
- [ ] Test email OTP flow
- [ ] Test SMS OTP flow
- [ ] Deploy to staging

### Phase 2 Tasks:
- [ ] Create password recovery pages
- [ ] Create admin registration flow
- [ ] Create security settings page
- [ ] Test all flows
- [ ] Deploy to staging

### Phase 3 Tasks:
- [ ] Create 2FA settings page
- [ ] Create payment verification flow
- [ ] Test all flows
- [ ] Deploy to production

---

## TESTING CHECKLIST

### SMS OTP Testing:
- [ ] Send OTP to valid Kenya number (+254...)
- [ ] Verify code within 10 minutes
- [ ] Test max 3 attempts
- [ ] Test resend button (60 sec cooldown)
- [ ] Test expired OTP (after 10 min)

### Email OTP Testing:
- [ ] Send OTP to valid email
- [ ] Verify code within 10 minutes
- [ ] Test max 3 attempts
- [ ] Test resend button
- [ ] Test expired OTP

### User Flow Testing:
- [ ] Complete full buyer registration
- [ ] Complete full vendor registration
- [ ] Test password recovery
- [ ] Test login with 2FA
- [ ] Test all error scenarios

---

## NEXT STEPS

### Week 1: Build Components
1. Create OTP components (`OTPInput.tsx`, `OTPModal.tsx`, etc.)
2. Create hooks (`useOTP.ts`, `usePhoneValidation.ts`)
3. Create TypeScript types/interfaces

### Week 2: Integrate into Registration
1. Update buyer registration flow
2. Update vendor registration flow
3. Add to password recovery

### Week 3: Polish & Deploy
1. Test all flows thoroughly
2. Handle edge cases
3. Deploy to staging
4. Get user feedback
5. Deploy to production

---

## SUMMARY

| Feature | Pages | Priority | Status |
|---------|-------|----------|--------|
| Buyer Email OTP | Register | High | ⏳ To implement |
| Vendor Phone OTP | Register | High | ⏳ To implement |
| Password Recovery | Forgot Pass | Medium | ⏳ To implement |
| Admin Registration | Admin Setup | Medium | ⏳ To implement |
| Login 2FA | Login | Low | ⏳ To implement |
| Payment Verification | Checkout | Low | ⏳ Future |

---

**Status: Ready to start integration! Components and hooks are designed. API is production-ready. Database is set up. Let's build! 🚀**
