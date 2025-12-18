# OTP Existing System Analysis

## From Your Other GitHub Account (Events Gear)

### 📊 Current Implementation

**Project:** Events Gear (Node.js/Express/MongoDB)
**Email OTP:** ✅ Implemented via Nodemailer (SMTP)
**SMS OTP:** ❌ Not found in uploaded code

---

## 1. Email OTP System (Currently Working)

### Overview:
- **Method:** Nodemailer (SMTP transporter)
- **Template Engine:** EJS
- **OTP Type:** 4-digit numeric codes
- **Storage:** MongoDB (field: `check_admin_otp`)
- **From Email:** `otp@eventsgear.co.ke` (custom domain)
- **Template:** `views/templates/admin_otp.ejs`

### Routes Implemented:
```
POST /send_tfa_otp          → Send 2FA OTP
POST /verify_tfa_otp        → Verify 2FA OTP
POST /check_admin_otp       → Verify admin login OTP
POST /resend_admin_otp      → Resend OTP
POST /login                 → Login with OTP (if 2FA enabled)
```

### Key Code Patterns:

**Generate OTP:**
```javascript
const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
```

**Send Email:**
```javascript
const html = await ejs.renderFile(templatePath, { title: "...", otp });
transporter.sendMail({
  from: `"EVENTS GEAR" <otp@eventsgear.co.ke>`,
  to: email,
  subject: "Welcome to EVENTS GEAR!",
  html
});
```

**Verify OTP:**
```javascript
if (!user || user.check_admin_otp !== otp) {
  return res.json({ success: false, message: "Invalid OTP" });
}
user.check_admin_otp = null; // Clear after use
await user.save();
```

### Database Fields Used:
```javascript
check_admin_otp         // Stores 4-digit OTP code
two_factor_auth_email   // User's 2FA email address
role                    // User role (0=admin, 2=sub-admin, 1=buyer, 3=vendor)
isDeleted               // Soft delete flag
```

---

## 2. Missing Components

### SMS OTP: ❌ NOT FOUND
- No SMS provider imported (Twilio, Termii, Africa's Talking, etc.)
- No SMS sending code in AdminController
- Likely in:
  - `SignupController.js` (if new user registration has SMS)
  - `utils/sms.js` (if exists)
  - Different controller file

### SMTP Configuration: ❓ UNKNOWN
- Nodemailer transporter defined in `utils/mailer.js`
- Details needed:
  - SMTP Host
  - SMTP Port
  - SMTP Username
  - SMTP Password
  - Is it Gmail, SendGrid, or custom server?

---

## 3. Key Differences: Events Gear vs Zintra

| Aspect | Events Gear | Zintra |
|--------|------------|--------|
| **Framework** | Express.js | Next.js |
| **Database** | MongoDB | Supabase (PostgreSQL) |
| **OTP Length** | 4-digit | 6-digit |
| **Email Method** | Nodemailer (SMTP) | SendGrid/Resend (ready) |
| **SMS Method** | Unknown/Missing | TextSMS Kenya |
| **Templating** | EJS files | React/HTML strings |
| **Route Type** | Express routes | Next.js API routes |
| **Auth** | Sessions | Supabase Auth + JWT |

---

## 4. What We Need to Do

### Option A: Use Events Gear's SMTP Setup in Zintra
**Pros:**
- Consistent with existing infrastructure
- Same email sending from `otp@eventsgear.co.ke`
- Lower cost (SMTP is cheaper than SendGrid)

**Cons:**
- Need SMTP credentials (host, port, user, pass)
- Need to configure Node.js Nodemailer in Next.js

**Implementation:**
1. Get SMTP details from `utils/mailer.js`
2. Add to `.env.local`:
   ```
   SMTP_HOST=...
   SMTP_PORT=...
   SMTP_USER=...
   SMTP_PASS=...
   ```
3. Create Node.js mailer in `/lib/services/mailer.ts`
4. Use same OTP email template

### Option B: Use SendGrid (Recommended for Next.js)
**Pros:**
- Native Next.js support
- Better for serverless (Next.js)
- SendGrid is more robust
- Easier scaling

**Cons:**
- Different from Events Gear
- Small cost (but free tier available)

**Implementation:**
1. Keep Events Gear's SMTP for Events Gear
2. Use SendGrid for Zintra (separate)
3. Both can coexist

---

## 5. SMS OTP Strategy for Zintra

### Current Plan: TextSMS Kenya ✅
- Already implemented in `lib/services/otpService.ts`
- 6-digit codes
- 10-minute expiry
- Rate limiting

### If Events Gear Had SMS:
- Would need to match that provider
- But since it doesn't exist, TextSMS Kenya is good choice for Zintra

---

## 6. OTP Length Discrepancy

**Events Gear:** 4-digit OTP
```javascript
const otp = Math.floor(1000 + Math.random() * 9000).toString();
```

**Zintra (Current):** 6-digit OTP
```javascript
const code = Math.random().toString().slice(2, 2 + 6).padStart(6, '0');
```

**Recommendation:**
- Keep Zintra at 6-digit (more secure)
- 4-digit is weaker for production
- Update Events Gear to 6-digit if desired

---

## 7. Questions to Answer

### 🔴 Critical (Need ASAP):
1. **What SMTP server does Events Gear use?**
   - Gmail's SMTP? (`smtp.gmail.com:587`)
   - SendGrid's SMTP? (`smtp.sendgrid.net:587`)
   - Custom domain mail server?
   
2. **SMTP Credentials:**
   - Username for `otp@eventsgear.co.ke`?
   - Password?
   - Is it app-specific password or account password?

3. **Does Events Gear have SMS OTP anywhere?**
   - If yes, which provider? (Twilio, Termii, Africa's Talking, etc.)
   - If no, should Zintra use TextSMS Kenya?

### 🟡 Important (For consistency):
4. Should Zintra use same SMTP as Events Gear or separate?
5. Should email be from same domain (`otp@eventsgear.co.ke`) or Zintra's domain?
6. Should OTP be 4-digit or 6-digit?

### 🟢 Nice-to-have:
7. Any other OTP logic/rules from Events Gear?
8. Rate limiting rules?
9. Max attempts before lockout?

---

## 8. Next Steps

### Immediate Action:
1. **Upload `utils/mailer.js`** from Events Gear repo
2. **Confirm:** Is there any SMS OTP code anywhere?
3. **Provide:** SMTP host, port, username, password

### Once We Have That:
1. Update `lib/services/otpService.ts` to use your SMTP
2. Update email template to match Events Gear style
3. Keep SMS as TextSMS Kenya
4. Create integration examples for Zintra

### Timeline:
- Get credentials: 15 min
- Update code: 30 min
- Test: 15 min
- **Total: 1 hour**

---

## 9. Summary Table

| Component | Events Gear | Zintra Status |
|-----------|-------------|---------------|
| Email OTP | ✅ Works (Nodemailer) | 🟡 Placeholder (needs SMTP) |
| SMS OTP | ❌ Missing | ✅ TextSMS Kenya ready |
| Database | MongoDB | ✅ Supabase (PostgreSQL) |
| OTP Storage | `check_admin_otp` field | ✅ `otp_verifications` table |
| Verification | String comparison | ✅ + Expiry + Attempts |
| Rate Limiting | None visible | ✅ 3 per 10 minutes |
| Templates | EJS files | ✅ HTML strings |

---

## Files Needed From Events Gear

Please share:
1. ✅ **`utils/mailer.js`** - SMTP configuration
2. ✅ **`SignupController.js`** - Check for SMS OTP
3. ✅ **`views/templates/admin_otp.ejs`** - Email template
4. ✅ **.env** or **.env.example** - See SMTP setup

This will take 5 minutes to find and copy!

---

**Status:** Ready to integrate Events Gear's email system into Zintra once we have the credentials.
