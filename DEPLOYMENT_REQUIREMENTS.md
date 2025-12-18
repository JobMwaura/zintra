# Deployment Requirements & Setup Guide

## Issue Found: Missing Environment Variables

Your build is failing because **server-side environment variables** are missing from `.env.local`. These are required for the OTP API routes to initialize.

---

## 🔴 Required Environment Variables for Deployment

### Server-Side Variables (CRITICAL - Must be set in Vercel)

These variables are used by API routes and **must be kept secret** (never commit to git):

```bash
# Supabase Server Admin Key (Service Role)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# TextSMS Kenya API Credentials (for SMS OTP)
TEXT_SMS_API_KEY=your_textsms_api_key
TEXT_SMS_SENDER_ID=your_sender_id

# Email Service (if using email OTP)
RESEND_API_KEY=your_resend_api_key  # Optional, if email OTP enabled

# Admin Email
ADMIN_EMAIL=admin@zintra.co
```

### Public Variables (Client-side, OK to commit)

Already in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://zeomgqlnztcdqtespsjx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Step-by-Step Setup for Local Development

### 1. Get Your Supabase Service Role Key

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: **zintra-platform**
3. Go to **Settings → API**
4. Copy the **Service Role** secret key (under "Project API Keys")
   - ⚠️ This is a secret - never commit it to git!

### 2. Update `.env.local` File

Edit `/Users/macbookpro2/Desktop/zintra-platform/.env.local`:

```bash
# Public Client Keys (can be in git)
NEXT_PUBLIC_SUPABASE_URL=https://zeomgqlnztcdqtespsjx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplb21ncWxuenRjZHF0ZXNwc2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODUyMTAsImV4cCI6MjA3NDk2MTIxMH0.Q2Lng1HtSVZtky1nuINq2R48Yy_BEYZvbHT0h8GRGr4

# Server-Side Secrets (NEVER commit these!)
SUPABASE_SERVICE_ROLE_KEY=<PASTE_YOUR_SERVICE_ROLE_KEY_HERE>
TEXT_SMS_API_KEY=<PASTE_YOUR_TEXT_SMS_API_KEY>
TEXT_SMS_SENDER_ID=<YOUR_SENDER_ID>
RESEND_API_KEY=<PASTE_YOUR_RESEND_API_KEY>  # Optional
ADMIN_EMAIL=admin@zintra.co
```

### 3. Add to `.gitignore` (Already included?)

Make sure `.gitignore` has:
```
.env.local
.env*.local
```

Check:
```bash
cat .gitignore | grep env
```

### 4. Test Local Build

```bash
npm run build
```

Should compile successfully with all environment variables set.

---

## 🚀 Step-by-Step Setup for Vercel Deployment

### 1. Push to GitHub

```bash
git add -A
git commit -m "fix: Remove src directory, prepare for deployment"
git push origin main
```

### 2. Connect to Vercel

If not already connected:
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Import the **zintra** repository
4. Select **Next.js** as framework
5. Click "Deploy"

### 3. Add Environment Variables to Vercel

Go to your Vercel project → **Settings → Environment Variables**

Add each variable as a secret (toggle the lock icon):

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: <paste from Supabase>
Environments: Production, Preview, Development
```

```
Name: TEXT_SMS_API_KEY
Value: <your text sms api key>
Environments: Production, Preview, Development
```

```
Name: TEXT_SMS_SENDER_ID
Value: <your sender id>
Environments: Production, Preview, Development
```

```
Name: RESEND_API_KEY
Value: <optional - only if using email OTP>
Environments: Production, Preview, Development
```

```
Name: ADMIN_EMAIL
Value: admin@zintra.co
Environments: Production, Preview, Development
```

### 4. Verify Deployment

After adding environment variables:
1. Trigger a new deployment: **Settings → Deployments → Redeploy**
2. Watch the build logs
3. Verify success: "Deployment ready at [your-domain]"

---

## ⚠️ Common Issues & Solutions

### Issue 1: "supabaseKey is required"
**Cause:** `SUPABASE_SERVICE_ROLE_KEY` is missing  
**Fix:** Add it to `.env.local` and Vercel environment variables

### Issue 2: "Cannot find module '@supabase/supabase-js'"
**Cause:** Dependencies not installed  
**Fix:** Run `npm install` then `npm run build`

### Issue 3: Build succeeds but API routes fail at runtime
**Cause:** Environment variables not available at runtime  
**Fix:** Ensure variables are set in Vercel, not just locally

### Issue 4: "TEXT_SMS_API_KEY is not defined"
**Cause:** SMS API credentials missing  
**Fix:** Get API key from TextSMS Kenya, add to environment variables

---

## 📊 Current Status

| Component | Status | Action |
|-----------|--------|--------|
| Code Build | ✅ Ready | Remove `src/` directory - DONE |
| `.env.local` | ❌ Missing SUPABASE_SERVICE_ROLE_KEY | Get from Supabase |
| Git Push | ⏳ Pending | Push after local build succeeds |
| Vercel Deploy | ⏳ Pending | Add env vars, trigger deploy |
| OTP Service | ⏳ Blocked by env vars | Will work after env vars set |

---

## 🔐 Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Never share `SUPABASE_SERVICE_ROLE_KEY` in messages
- [ ] Use Vercel's secret management for all sensitive keys
- [ ] Verify `.gitignore` excludes all `.env*` files
- [ ] Rotate keys periodically
- [ ] Use different keys for dev/staging/production (if available)

---

## 📞 Where to Get Each Key

| Variable | Source | URL |
|----------|--------|-----|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | app.supabase.com → Settings → API |
| `TEXT_SMS_API_KEY` | TextSMS Kenya | textsms.co.ke → Dashboard → API Keys |
| `RESEND_API_KEY` | Resend (if using) | resend.com → API Keys |
| `NEXT_PUBLIC_SUPABASE_*` | Supabase Dashboard | app.supabase.com → Settings → API |

---

## Next Steps

1. **Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase**
   - Go to [Supabase Project](https://app.supabase.com/)
   - Copy the Service Role key

2. **Update `.env.local`**
   - Add the service role key
   - Add TextSMS API credentials (if not already done)

3. **Test locally:**
   ```bash
   npm run build
   ```

4. **Push to GitHub:**
   ```bash
   git add -A
   git commit -m "fix: Remove src directory and prepare for deployment"
   git push origin main
   ```

5. **Deploy to Vercel:**
   - Add environment variables in Vercel console
   - Trigger redeploy

---

**Questions?** Check the API route files:
- `/app/api/otp/send/route.ts` - Shows required env vars
- `/app/api/otp/verify/route.ts` - Shows required env vars
