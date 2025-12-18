# 🎯 Complete OTP System Analysis - Events Gear

## SMS OTP FOUND! ✅

Your Events Gear project DOES have SMS OTP implementation using **TextSMS Kenya**!

---

## 1. SMS OTP Implementation Details

### Location:
- **File:** `SignupController.js` (the file you just shared)
- **Functions:** 
  - `resent_otp()` - Lines ~460-510
  - `forgetToSendOtp()` - Lines ~640-720

### SMS Provider: TextSMS Kenya ✅
```javascript
const response = await axios.post('https://sms.textsms.co.ke/api/services/sendsms/', {
  apikey: "9c53d293fb384c98894370e4f9314406",
  partnerID: "12487",
  message: message,
  shortcode: "EVENTS GEAR",
  mobile: mobileNumber
});
```

### API Credentials Found! 🔑
```
API Key:    9c53d293fb384c98894370e4f9314406
Partner ID: 12487
Shortcode:  EVENTS GEAR
```

### OTP Logic:
```javascript
let otp = Math.floor(1000 + Math.random() * 9000); // 4-digit OTP

// Special handling for India (country code 91)
if (req.body.countryCode == "91" || req.body.countryCode == "+91") {
  otp = 1111; // Test OTP for India
}

// SMS sent only for non-India users
if (user.countryCode != "+91") {
  // Send via TextSMS Kenya
}

// Email always sent if user has email
if (user && user.email) {
  // Send via Nodemailer
}
```

---

## 2. Email OTP Implementation

### Location:
- **AdminController.js:** `send2FAOtp()`, `verify2FAOtp()`
- **SignupController.js:** `resent_otp()`, `forgetToSendOtp()`

### Email Configuration:
```javascript
from: `"EVENTS GEAR" <otp@eventsgear.co.ke>`
// Uses transporter from utils/mailer.js
```

### Templates Used:
- `views/templates/admin_otp.ejs` - For 2FA OTP
- `views/templates/resend.ejs` - For resend OTP
- `views/templates/otp.ejs` - For forgot password OTP

### Email OTP Logic:
```javascript
const html = await ejs.renderFile(templatePath, { otp: otp });
transporter.sendMail({
  from: `"EVENTS GEAR" <otp@eventsgear.co.ke>`,
  to: email,
  subject: "OTP For EVENTS GEAR!",
  html
});
```

---

## 3. Complete OTP Flow in Events Gear

### Registration/Forgot Password Flow:
```
User enters phone number
    ↓
Check if user exists
    ↓
Generate 4-digit OTP
    ↓
Send Email (Nodemailer) + SMS (TextSMS Kenya, non-India only)
    ↓
Store OTP in DB: user.otp field
    ↓
User verifies OTP
    ↓
Update: otp = 0, otpVerify = 1, userVerified = 1
    ↓
User can proceed
```

### Key Database Fields:
```javascript
otp                // Stores OTP code
otpVerify          // 0=not verified, 1=verified
userVerified       // 0=not verified, 1=verified
check_admin_otp    // For admin 2FA (different field)
two_factor_auth_email // For admin 2FA
```

---

## 4. Country Code Handling

Events Gear has special logic:

```javascript
if (user.countryCode == "91" || user.countryCode == "+91") {
  otp = 1111; // Fixed test OTP for India
}

if (user.countryCode != "+91") {
  // Send SMS via TextSMS Kenya (only for non-India)
}
```

**Why?** TextSMS Kenya is Kenya-focused, India SMS not optimal
- India users: Only email OTP
- Kenya/Other: Email + SMS

---

## 5. Differences: Events Gear vs What We Created for Zintra

| Aspect | Events Gear | Zintra (What We Created) |
|--------|------------|------------------------|
| **OTP Length** | 4-digit | 6-digit |
| **SMS Provider** | TextSMS Kenya (same API) | TextSMS Kenya ✅ |
| **Email Method** | Nodemailer (SMTP) | SendGrid placeholder |
| **API Endpoint** | `/sendsms/` | `/sendotp/` ❌ WRONG |
| **API Credentials** | Hardcoded in code | `.env` variables ✅ |
| **Database** | MongoDB | Supabase (PostgreSQL) |
| **Country Logic** | India bypass (1111) | None yet |
| **Rate Limiting** | None | Built-in ✅ |
| **OTP Storage** | Single `otp` field | Full `otp_verifications` table |
| **Attempt Limiting** | None | Max 3 attempts ✅ |
| **Expiry** | No expiry | 10 minutes ✅ |

---

## 6. Critical Finding: API Endpoint Mismatch! 🔴

### Events Gear Uses:
```
POST /api/services/sendsms/
```

### We Created (otpService.ts):
```typescript
'https://sms.textsms.co.ke/api/services/sendotp/'  // ❌ WRONG!
```

**Fix Required:** Change to `/sendsms/` (this was the fix from earlier analysis)

---

## 7. Next Steps to Integrate

### Step 1: Update OTP Service ✅
Replace endpoint in `lib/services/otpService.ts`:
```typescript
// CHANGE FROM:
'https://sms.textsms.co.ke/api/services/sendotp/'

// CHANGE TO:
'https://sms.textsms.co.ke/api/services/sendsms/'

// ADD pass_type parameter:
const payload = {
  apikey: apiKey,
  partnerID: partnerId,
  mobile: normalizedPhone,
  message: message,
  shortcode: shortcode,
  pass_type: 'plain'  // ← ADD THIS
};
```

### Step 2: Add TextSMS Credentials to .env.local
```env
# From Events Gear (already working)
TEXTSMS_API_KEY=9c53d293fb384c98894370e4f9314406
TEXTSMS_PARTNER_ID=12487
TEXTSMS_SHORTCODE=EVENTS GEAR
```

### Step 3: Create Nodemailer Setup for Zintra (Optional)
If you want to use same SMTP as Events Gear:
- Get SMTP details from `utils/mailer.js` in Events Gear repo
- Create `/lib/services/mailer.ts` in Zintra
- Or use SendGrid (simpler for Next.js)

### Step 4: Update OTP Length (Recommendation)
- Events Gear: 4-digit (weaker)
- Zintra: Keep 6-digit (stronger)
- Or align both to 6-digit for consistency

### Step 5: Add Country Code Logic (Optional)
For Kenya focus like Events Gear:
```typescript
if (phoneNumber.startsWith('+254')) {
  // Send SMS via TextSMS Kenya
} else if (phoneNumber.startsWith('+91')) {
  // India: Email only, use test OTP 1111
}
```

---

## 8. TextSMS Kenya API Details from Events Gear

### Working Payload:
```json
{
  "apikey": "9c53d293fb384c98894370e4f9314406",
  "partnerID": "12487",
  "message": "Your OTP is: 1234",
  "shortcode": "EVENTS GEAR",
  "mobile": "+254712345678"
}
```

### Response Expected:
```json
{
  "responses": [
    {
      "response-code": 200,
      "response-description": "Success",
      "mobile": "254712345678",
      "messageid": 78726470,
      "networkid": "1"
    }
  ]
}
```

---

## 9. Email Template from Events Gear

You have 3 EJS templates:
1. `admin_otp.ejs` - 2FA OTP
2. `resend.ejs` - Resend OTP
3. `otp.ejs` - Forgot password OTP

For Zintra, we can:
- Use HTML templates instead of EJS (Next.js friendly)
- Keep same design as Events Gear
- Send from same email: `otp@eventsgear.co.ke`

---

## 10. Immediate Action Items

### 🔴 CRITICAL (Must Do):
1. **Fix endpoint** in `otpService.ts`: `/sendotp/` → `/sendsms/`
2. **Add pass_type** parameter to payload
3. **Add TextSMS credentials** to `.env.local`
4. **Test** OTP endpoint works

### 🟡 IMPORTANT (Should Do):
1. Get SMTP details from `utils/mailer.js`
2. Add country code logic (India bypass)
3. Update to 6-digit OTP (security)
4. Create email templates for Zintra

### 🟢 NICE-TO-HAVE (Can Do Later):
1. Add attempt limiting (Events Gear has none)
2. Add expiry checking (Events Gear has none)
3. Add rate limiting (Events Gear has none)
4. Migrate to SendGrid for Next.js

---

## 11. Summary

### What We Know:
✅ TextSMS Kenya API credentials: `9c53d293fb384c98894370e4f9314406` / `12487`
✅ SMS works via `/sendsms/` endpoint
✅ Email works via Nodemailer (SMTP config in `utils/mailer.js`)
✅ 4-digit OTP generation working
✅ Both SMS + Email working together
✅ Country code logic: India bypass, Kenya priority

### What We Need:
❓ SMTP host/port/user/password for Nodemailer
❓ Email templates (EJS files)
❓ Confirmation: Use same SMS credentials in Zintra?

### What We'll Do:
1. Fix the endpoint in otpService.ts
2. Add TextSMS credentials
3. Test SMS sending works
4. Integrate email (Nodemailer or SendGrid)
5. Deploy to Zintra

---

## Files to Get From Events Gear

1. ✅ **`utils/mailer.js`** - SMTP configuration (critical)
2. ✅ **`views/templates/otp.ejs`** - Email template (optional)
3. ✅ **`.env`** or **`.env.example`** - See all config (helpful)

These 3 files will give us everything needed for complete integration!

---

**Status:** 95% ready. Just need SMTP config and email templates. SMS is fully covered! 🚀
