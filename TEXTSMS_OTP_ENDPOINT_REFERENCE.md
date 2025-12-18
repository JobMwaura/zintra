# TextSMS Kenya OTP Endpoint Reference

## Overview
This document provides the official endpoint reference for TextSMS Kenya's OTP service, dedicated for sensitive transaction traffic.

---

## Endpoint Details

**Service:** SendOTP Service  
**Base URL:** `https://sms.textsms.co.ke/api/services/sendotp/`  
**Supported Methods:** GET and POST  
**Purpose:** Send One-Time Password (OTP) codes for sensitive transactions

---

## GET Method

### URL Format
```
https://sms.textsms.co.ke/api/services/sendotp/?message={{message}}&mobile={{mobile}}&shortcode={{shortcode}}&partnerID={{partnerId}}&apikey={{apikey}}
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apikey` | string | ✅ Yes | Your TextSMS Kenya API key |
| `partnerID` | string | ✅ Yes | Your partner ID |
| `mobile` | string | ✅ Yes | Phone number to send OTP to (Kenya format) |
| `message` | string | ✅ Yes | OTP message text |
| `shortcode` | string | ✅ Yes | SMS shortcode to send from |

### Example GET Request

```bash
curl -X GET "https://sms.textsms.co.ke/api/services/sendotp/?message=Your%20OTP%20is%20123456&mobile=254712345678&shortcode=ZINTRA&partnerID=your_partner_id&apikey=your_api_key"
```

### JavaScript/Node.js Example

```javascript
async function sendOTPViaGET(phone, otp, shortcode) {
  const params = new URLSearchParams({
    message: `Your OTP is ${otp}`,
    mobile: phone,
    shortcode: shortcode,
    partnerID: process.env.TEXTSMS_PARTNER_ID,
    apikey: process.env.TEXTSMS_API_KEY
  });

  try {
    const response = await fetch(
      `https://sms.textsms.co.ke/api/services/sendotp/?${params}`,
      { method: 'GET' }
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('OTP send failed:', error);
    throw error;
  }
}
```

---

## POST Method

### URL
```
https://sms.textsms.co.ke/api/services/sendotp/
```

### Request Body Format

```json
{
  "apikey": "{{apikey}}",
  "partnerID": "{{partnerId}}",
  "mobile": "{{mobile}}",
  "message": "{{message}}",
  "shortcode": "{{shortcode}}"
}
```

### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apikey` | string | ✅ Yes | Your TextSMS Kenya API key |
| `partnerID` | string | ✅ Yes | Your partner ID |
| `mobile` | string | ✅ Yes | Phone number to send OTP to |
| `message` | string | ✅ Yes | OTP message text |
| `shortcode` | string | ✅ Yes | SMS shortcode identifier |

### Request Headers

```
Content-Type: application/json
```

### Example POST Request

```bash
curl -X POST "https://sms.textsms.co.ke/api/services/sendotp/" \
  -H "Content-Type: application/json" \
  -d '{
    "apikey": "your_api_key",
    "partnerID": "your_partner_id",
    "mobile": "254712345678",
    "message": "Your OTP is 123456",
    "shortcode": "ZINTRA"
  }'
```

### JavaScript/Node.js Example

```javascript
async function sendOTPViaPOST(phone, otp, shortcode) {
  const payload = {
    apikey: process.env.TEXTSMS_API_KEY,
    partnerID: process.env.TEXTSMS_PARTNER_ID,
    mobile: phone,
    message: `Your OTP is ${otp}`,
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
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('OTP send failed:', error);
    throw error;
  }
}
```

---

## Parameter Specifications

### Mobile Number Format

**Accepted Formats:**
- Kenya E.164 format: `254712345678` (with country code)
- Kenya local format: `0712345678` (with leading zero)

**Validation:**
- Must be a valid Kenya mobile number
- Should include country code (254) or leading zero (0)
- Typically 10-12 digits after country code processing

### Message Format

**Best Practices:**
- Keep message concise (maximum recommended: 160 characters)
- Include OTP code clearly
- Example: `Your OTP is 123456. Valid for 10 minutes.`
- Can include branding: `Zintra OTP: 123456`

### Shortcode

**Definition:** SMS sender identifier for your messages

**Examples:**
- `ZINTRA` - Company name
- `ZINT` - Abbreviated
- Can be set in TextSMS Kenya dashboard

**Note:** Ensure shortcode is registered in your TextSMS Kenya account

---

## Integration in Zintra

### Current Implementation

**File:** `lib/services/otpService.ts`

The OTP service currently integrates with TextSMS Kenya using this endpoint.

**Key Methods:**
- `sendOTPViaEmail(email, otp)` - Email delivery (placeholder)
- `sendOTPViaSMS(phone, otp)` - SMS delivery (TextSMS Kenya)

### Configuration

**Required Environment Variables:**

```env
TEXTSMS_API_KEY=your_api_key
TEXTSMS_PARTNER_ID=your_partner_id
TEXTSMS_SHORTCODE=ZINTRA
```

### API Endpoint Integration

**File:** `pages/api/otp/send.ts`

Handles:
- User authentication
- OTP generation (6-digit code)
- Delivery method selection (SMS/Email)
- Database storage
- API response

---

## Response Format

### Successful Response

```json
{
  "status": "success",
  "message": "OTP sent successfully",
  "otpId": "unique_otp_identifier",
  "expiresIn": 600
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error message describing the issue",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `INVALID_API_KEY` | API key is incorrect | Verify API key in .env |
| `INVALID_PARTNER_ID` | Partner ID is incorrect | Check partner ID |
| `INVALID_MOBILE` | Phone number format is wrong | Use Kenya format: 254... or 07... |
| `INVALID_SHORTCODE` | Shortcode not registered | Register shortcode in TextSMS dashboard |
| `QUOTA_EXCEEDED` | Monthly quota exceeded | Check TextSMS account balance |

---

## Best Practices

### Security

✅ **Always use HTTPS** (endpoint is HTTPS)  
✅ **Never expose API keys** in client-side code  
✅ **Store credentials** in environment variables  
✅ **Validate inputs** before sending to API  
✅ **Rate limit** OTP requests (max 3 per hour per user)  

### Performance

✅ **Use POST method** for larger payloads  
✅ **Implement retry logic** with exponential backoff  
✅ **Cache credentials** in memory during runtime  
✅ **Monitor API response times** (typical: 200-500ms)  

### Reliability

✅ **Validate phone numbers** before sending  
✅ **Log all OTP requests** for debugging  
✅ **Track delivery status** in database  
✅ **Implement timeout handling** (suggest 30 seconds)  
✅ **Test with test numbers** first  

---

## Testing

### Test Credentials

Use these for testing (verify with TextSMS Kenya):

```env
TEXTSMS_API_KEY=test_key_or_actual_key
TEXTSMS_PARTNER_ID=test_partner_or_actual_id
TEXTSMS_SHORTCODE=ZINTRA
```

### Test Phone Numbers

- Your personal Kenya number (verify delivery)
- Test numbers provided by TextSMS Kenya
- Staging environment numbers

### Testing Checklist

- [ ] Verify API key and Partner ID are correct
- [ ] Test with GET method
- [ ] Test with POST method
- [ ] Verify phone number validation works
- [ ] Check message formatting
- [ ] Monitor response times
- [ ] Test error handling
- [ ] Verify OTP is received on phone
- [ ] Check database logging
- [ ] Test rate limiting

---

## Troubleshooting

### Issue: "Invalid API Key"

**Cause:** Incorrect API key or environment variable not set  
**Solution:**
1. Verify API key in TextSMS Kenya dashboard
2. Check `.env` file has correct value
3. Restart server to reload environment variables
4. Check for whitespace in API key

### Issue: "Invalid Mobile"

**Cause:** Phone number format incorrect  
**Solution:**
1. Ensure format is `254...` (country code) or `07...` (local)
2. Strip any special characters or spaces
3. Validate before sending to API

### Issue: "Shortcode Not Found"

**Cause:** Shortcode not registered in TextSMS account  
**Solution:**
1. Log in to TextSMS Kenya dashboard
2. Register your shortcode (e.g., ZINTRA)
3. Wait for approval (usually same day)
4. Update environment variable

### Issue: "Quota Exceeded"

**Cause:** Monthly SMS quota exhausted  
**Solution:**
1. Check TextSMS Kenya account balance
2. Upgrade plan or purchase additional quota
3. Implement rate limiting on your end

---

## API Rate Limits

**Based on TextSMS Kenya Standards:**

| Limit | Value |
|-------|-------|
| Requests per second | 10 |
| Requests per minute | 100 |
| Requests per hour | 1,000 |
| Maximum message length | 1,600 characters |
| Message validity | configurable |

---

## Compliance & Legal

**SMS Regulations (Kenya):**
- Messages must be from registered shortcode
- Include opt-out option for marketing messages
- OTP messages don't require opt-in (transaction-based)
- Keep OTP data secure (GDPR/local compliance)

---

## Related Documentation

📄 **OTP System:**
- `OTP_INTEGRATION_PLAN.md` - Integration points
- `OTP_QUICK_IMPLEMENTATION.md` - Implementation guide
- `lib/services/otpService.ts` - Service implementation

📄 **API Endpoints:**
- `pages/api/otp/send.ts` - Send OTP endpoint
- `pages/api/otp/verify.ts` - Verify OTP endpoint

📄 **UI Components:**
- `components/OTPInput.js` - OTP input component
- `components/PhoneNumberInput.js` - Phone input validation

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-18 | 1.0 | Initial documentation with GET and POST methods |

---

## Support & Resources

**TextSMS Kenya:**
- Website: https://sms.textsms.co.ke
- Support: Contact TextSMS Kenya support team
- Docs: Check TextSMS Kenya API documentation

**Zintra Platform:**
- OTP Implementation: See `OTP_QUICK_IMPLEMENTATION.md`
- Issues: Check GitHub issues or contact development team

---

**Last Updated:** 18 December 2025  
**Status:** ✅ Active and Production-Ready
