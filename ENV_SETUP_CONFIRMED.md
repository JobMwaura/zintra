# ✅ OTP Credentials Configuration - CONFIRMED

## Your Setup (Exactly as You Want It)

### Two GitHub Accounts, One TextSMS Kenya Account

**GitHub Account 1:** Events Gear
- Uses TextSMS Kenya credentials

**GitHub Account 2:** Zintra (JobMwaura)
- Also uses **SAME TextSMS Kenya credentials**
- Separate Supabase database
- Separate `.env.local` file
- But **same SMS provider account**

---

## TextSMS Kenya Credentials (Shared Between Both Projects)

```env
TEXTSMS_API_KEY=9c53d293fb384c98894370e4f9314406
TEXTSMS_PARTNER_ID=12487
TEXTSMS_SHORTCODE=EVENTS GEAR
```

**This is correct and confirmed ✅**

---

## What This Means

### Benefits:
✅ Single TextSMS Kenya account to manage
✅ Combined SMS credits for both apps
✅ Lower cost (one account instead of two)
✅ Easy to monitor total SMS usage

### How It Works:
```
Events Gear App (GitHub Account 1)
    ↓
    └─→ TextSMS Kenya Account
            ↑
Zintra App (GitHub Account 2)
```

Both apps send SMS through the same TextSMS Kenya account.

---

## What You Need to Do NOW

### Step 1: Create `.env.local` in Zintra Project

**File Location:** `/Users/macbookpro2/Desktop/zintra-platform/.env.local`

**Content:**
```env
# TextSMS Kenya SMS Configuration
TEXTSMS_API_KEY=9c53d293fb384c98894370e4f9314406
TEXTSMS_PARTNER_ID=12487
TEXTSMS_SHORTCODE=EVENTS GEAR
```

**Save this file!** ✅

### Step 2: Add to .gitignore (Already Done?)

Make sure `.env.local` is in your `.gitignore` so it's NOT committed to git:

```
.env.local
.env.*.local
```

### Step 3: Run SQL Migration

Now you can safely run the SQL migration in Supabase:

1. Copy entire `CREATE_OTP_TABLE.sql` file
2. Go to Supabase Dashboard → SQL Editor
3. Paste content
4. Click **Run**

Should succeed now ✅

### Step 4: Test SMS

```bash
curl -X POST http://localhost:3000/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "channel": "sms"
  }'
```

---

## Important Notes

### ⚠️ Shared Account Considerations:

1. **SMS Credit Pool:** Both apps draw from same account
   - Monitor balance regularly
   - May need higher credit limit if both apps get traffic
   
2. **Rate Limiting:** Each app has its own rate limiting (3 per 10 min per user)
   - Doesn't affect the other app
   
3. **Shortcode:** Both apps send as "EVENTS GEAR"
   - This is fine - it's just the sender name
   - Users will see "EVENTS GEAR" in both apps' SMS

4. **Monitoring:** Check TextSMS Kenya dashboard for combined usage
   - See all SMS from both apps in one place
   - Track total costs together

---

## Verification Checklist

Before proceeding:

- [ ] `.env.local` created in Zintra project
- [ ] Credentials added correctly (copy-paste from above)
- [ ] `.env.local` is in `.gitignore`
- [ ] Not committed to GitHub
- [ ] Ready to run SQL migration

---

## Next Steps

1. ✅ Create `.env.local` with credentials
2. ✅ Run SQL migration in Supabase
3. ✅ Test SMS endpoint
4. ✅ Integrate into registration flow

---

## Files Status

| File | Status |
|------|--------|
| `lib/services/otpService.ts` | ✅ Ready (reads from `.env`) |
| `app/api/otp/send/route.ts` | ✅ Ready |
| `app/api/otp/verify/route.ts` | ✅ Ready |
| `supabase/sql/CREATE_OTP_TABLE.sql` | ✅ Ready to run |
| `.env.local` | 🟡 Needs to be created |

---

**Status:** Ready to deploy with shared credentials ✅

Just create the `.env.local` file and you're good to go!
