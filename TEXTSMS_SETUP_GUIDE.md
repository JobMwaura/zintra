# TextSMS Kenya Configuration Guide

## Problem Summary
SMS OTP is failing with 500 errors because TextSMS environment variables are not configured in Vercel.

## What's Happening
When you request an SMS OTP:
1. The code checks for `TEXTSMS_API_KEY`, `TEXTSMS_PARTNER_ID`, and `TEXTSMS_SHORTCODE`
2. If ANY of these are missing, it returns: `{ success: false, error: 'SMS service not configured' }`
3. Since SMS fails and no email is provided, the endpoint returns HTTP 500

## Solution: Add TextSMS Credentials to Vercel

### Step 1: Get Your TextSMS Kenya Credentials

You need three pieces of information from TextSMS Kenya:

1. **API Key** - Your authentication key for the API
2. **Partner ID** - Your partner/account ID with TextSMS Kenya
3. **Shortcode** - The SMS sender shortcode (appears as sender name in SMS)

**Where to find them:**
- Log in to your TextSMS Kenya account dashboard
- Navigate to: API Settings or Integration Settings
- Look for: API Key, Partner ID, and Shortcode
- If you don't have these yet, contact TextSMS Kenya support

### Step 2: Add to Vercel Environment Variables

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project (Zintra Platform)
3. Go to: **Settings** → **Environment Variables**
4. Add three new environment variables:

   | Variable Name | Value | Example |
   |---|---|---|
   | `TEXTSMS_API_KEY` | Your API Key from TextSMS | `your-api-key-here` |
   | `TEXTSMS_PARTNER_ID` | Your Partner ID from TextSMS | `your-partner-id` |
   | `TEXTSMS_SHORTCODE` | Your Shortcode from TextSMS | `ZINTRA` or `SMS123` |

5. Click **Save**
6. The environment will automatically redeploy with new variables

### Step 3: Verify Configuration

After adding variables and the deployment completes:

1. Visit your app at: `https://zintra-platform.vercel.app/api/debug/sms-config`
2. You should see:
   ```json
   {
     "apiKey": "configured",
     "partnerId": "configured", 
     "shortcode": "configured",
     "allConfigured": true
   }
   ```

3. If any show as "not configured", go back to Step 2 and add them

### Step 4: Test SMS OTP

1. Go to your app's phone verification modal
2. Enter your phone number (e.g., +254712345678)
3. Click "Send OTP"
4. Check your phone for the SMS

**Expected Result:**
- ✅ SMS arrives within seconds
- ✅ Message format: "Your Zintra registration code is: 123456. Valid for 10 minutes."
- ✅ API returns: `{ "success": true, "otpId": "..." }`

## Troubleshooting

### Still Getting 500 Error?

1. **Check Vercel Deployment**
   - Go to Vercel Dashboard → Deployments
   - Wait for the green checkmark (deployment complete)
   - Environment changes trigger automatic redeployment

2. **Check Variable Names**
   - Must be exactly: `TEXTSMS_API_KEY`, `TEXTSMS_PARTNER_ID`, `TEXTSMS_SHORTCODE`
   - Case-sensitive! Must be ALL CAPS
   - No spaces before/after values

3. **Check Credentials**
   - Verify values are correct in TextSMS Kenya account
   - Try logging into TextSMS Kenya dashboard
   - Confirm account has SMS balance/credits

4. **Check Browser Console**
   - Open DevTools (F12) → Console tab
   - Look for error messages
   - Share the error details if contacting support

### SMS Sends But Contains Wrong Sender Name?

- The sender name comes from your `TEXTSMS_SHORTCODE`
- Update the shortcode in Vercel to match desired name
- Wait for redeployment to take effect

### API Response Shows "SMS service not configured"?

- You missed Step 2
- Variables are not saved in Vercel
- Or variable names are incorrect (case-sensitive!)

## TextSMS Kenya API Details

**Endpoint Used:**
```
POST https://sms.textsms.co.ke/api/services/sendotp/
```

**Message Format:**
- Registration: "Your Zintra registration code is: 123456. Valid for 10 minutes."
- Login: "Your Zintra login code is: 123456. Valid for 10 minutes."
- Password Reset: "Your Zintra password reset code is: 123456. Valid for 30 minutes."
- Payment: "Your Zintra payment confirmation code is: 123456. Valid for 5 minutes."

**Payload Sent:**
```json
{
  "apikey": "TEXTSMS_API_KEY",
  "partnerID": "TEXTSMS_PARTNER_ID",
  "mobile": "+254712345678",
  "message": "Your Zintra registration code is: 123456. Valid for 10 minutes.",
  "shortcode": "TEXTSMS_SHORTCODE",
  "pass_type": "plain"
}
```

## Success Indicators

✅ SMS OTP Working When:
1. No 500 error when clicking "Send OTP"
2. API returns `{ success: true }`
3. SMS arrives on phone within seconds
4. Message comes from configured shortcode
5. User can enter the code in the verification modal
6. Code validates successfully

## Support

If you need help:
1. Check the debug endpoint: `/api/debug/sms-config`
2. Review browser console errors (F12 → Console)
3. Check Vercel deployment logs (Vercel Dashboard → Deployments → View logs)
4. Contact TextSMS Kenya support if credentials issue
