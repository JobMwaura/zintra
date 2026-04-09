# IMMEDIATE ACTION REQUIRED: SMS OTP Configuration

## 🎯 Your SMS OTP is Failing - Here's Why & How to Fix

### The Issue
SMS OTP returns **500 error** because three required environment variables are **missing from Vercel**:
- `TEXTSMS_API_KEY`
- `TEXTSMS_PARTNER_ID`  
- `TEXTSMS_SHORTCODE`

### The Fix (Takes 5 Minutes)

#### Step 1️⃣: Get Your TextSMS Credentials
1. Log into your **TextSMS Kenya account dashboard**
2. Find these three values:
   - **API Key** (looks like a long string of characters)
   - **Partner ID** (your account identifier)
   - **Shortcode** (the sender name for SMS, e.g., "ZINTRA")
3. Copy them down

#### Step 2️⃣: Add to Vercel Environment Variables
1. Visit: https://vercel.com/dashboard
2. Select your project: **"Zintra Platform"**
3. Click: **Settings** (left sidebar)
4. Click: **Environment Variables**
5. Click the **"Add new"** button three times and enter:

   **First Variable:**
   - Name: `TEXTSMS_API_KEY`
   - Value: [paste your API Key]
   - Click **Save**

   **Second Variable:**
   - Name: `TEXTSMS_PARTNER_ID`
   - Value: [paste your Partner ID]
   - Click **Save**

   **Third Variable:**
   - Name: `TEXTSMS_SHORTCODE`
   - Value: [paste your Shortcode]
   - Click **Save**

#### Step 3️⃣: Verify Configuration
1. Wait 2-3 minutes for Vercel to redeploy with new environment variables
2. Visit this URL in your browser: 
   ```
   https://your-vercel-app-url.vercel.app/api/debug/sms-config
   ```
   *(Replace with your actual Vercel URL)*

3. You should see JSON like:
   ```json
   {
     "textsms": {
       "apiKeyConfigured": true,
       "partnerIdConfigured": true,
       "shortcodeConfigured": true,
       "allConfigured": true
     }
   }
   ```

4. If any show `false`, go back to Step 2 and add the missing variable

#### Step 4️⃣: Test SMS OTP
1. Go to your app
2. Try the **Phone Verification** feature
3. Enter your phone number
4. Click **"Send OTP"**
5. Check your phone for the SMS
6. You should receive it within seconds!

### What Should Happen When Fixed ✅

**Before Fix:**
```
Error: HTTP 500
Message: "SMS: SMS service not configured"
```

**After Fix:**
```
Success: HTTP 200
SMS arrives: "Your Zintra registration code is: 123456. Valid for 10 minutes."
User can enter code and verify
```

### Troubleshooting

**Still showing 500 error?**
- [ ] Check Vercel deployment completed (green checkmark on Deployments page)
- [ ] Confirm all 3 environment variables are added with exact names (case-sensitive!)
- [ ] Reload the page and try again after waiting 2-3 minutes
- [ ] Check `/api/debug/sms-config` endpoint - what does it show?

**SMS sending but shows wrong sender name?**
- [ ] Your `TEXTSMS_SHORTCODE` might be different than expected
- [ ] Update the shortcode in Vercel to match desired sender name
- [ ] Wait for redeployment to take effect

**SMS not arriving at all?**
- [ ] Verify your phone number includes country code (e.g., +254712345678)
- [ ] Check your TextSMS Kenya account has SMS credits available
- [ ] Verify credentials are correct in TextSMS Kenya dashboard
- [ ] Contact TextSMS Kenya support if credentials are valid

### Email OTP (Already Working!) ✅

Good news: Your **email OTP is fully functional**! 
- Sends real emails via EventsGear SMTP
- Professional HTML templates configured
- Just needs database columns for tracking (migration files ready)

When you're done with SMS, run this SQL to finish email setup:
- See: `ADD_EMAIL_VERIFICATION_COLUMNS.sql` in repository
- Or follow: `EMAIL_VERIFICATION_MIGRATION_GUIDE.md`

### Next Steps After SMS Fixed

1. ✅ **SMS working?** → Verify both SMS and email OTP functional
2. [ ] **Run email database migration** → Adds `email_verified` column
3. [ ] **Test complete email verification flow** → Modal → OTP → Verify
4. [ ] **Mark SMS issue resolved** → Feature complete!

### Need Help?

1. Check detailed guide: `TEXTSMS_SETUP_GUIDE.md`
2. Check fix summary: `SMS_OTP_FIX_SUMMARY.md`
3. Open your browser's Developer Tools (F12) → Console tab for detailed errors
4. Check Vercel logs: Dashboard → Deployments → Latest → View logs

---

**Questions?** The answer is almost always: "Add the 3 TextSMS environment variables to Vercel" 🚀

Start with Step 1 above and you'll have SMS OTP working in less than 10 minutes!
