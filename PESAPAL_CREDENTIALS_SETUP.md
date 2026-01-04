# 🔍 Troubleshooting: PesaPal Credentials Missing

**Error:** `Server not configured: PesaPal credentials missing`

**Status:** This is GOOD! The error message means the code is working, but credentials aren't set on Vercel.

---

## ✅ Solution: Set Environment Variables on Vercel

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Select your project: `zintra` (or `zintra-sandy`)

### Step 2: Navigate to Settings
1. Click the project name
2. Go to **Settings** tab
3. Click **Environment Variables** (left sidebar)

### Step 3: Add Each Variable

Add these 4 variables with your PesaPal credentials:

| Variable Name | Value | Where to Find |
|---------------|-------|---------------|
| `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY` | `N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC` | PesaPal Dashboard |
| `PESAPAL_CONSUMER_SECRET` | `nC8XtQjNgAaoTC2gL6M4bNJzAnY=` | PesaPal Dashboard |
| `NEXT_PUBLIC_PESAPAL_API_URL` | `https://sandbox.pesapal.com/api/v3` | (or production URL) |
| `PESAPAL_WEBHOOK_URL` | `https://zintra-sandy.vercel.app/api/webhooks/pesapal` | (your domain) |

### Step 4: For Each Variable:

1. Click **"Add New"** button
2. Enter the variable name
3. Enter the value
4. Select environment: `Production` (or all)
5. Click **"Save"**

**Repeat for all 4 variables**

### Step 5: Redeploy

After adding variables:
1. Go to **Deployments** tab
2. Click the latest deployment
3. Click **Redeploy** button
4. Wait for deployment to complete

---

## 🔐 Security Note

- ✅ `NEXT_PUBLIC_*` variables - Safe to expose (public keys)
- ⚠️ `PESAPAL_CONSUMER_SECRET` - **NEVER** share, only in Vercel settings
- ⚠️ Never commit secrets to git

---

## 🧪 Verify Variables Are Set

After redeploying, test:

1. Go to: https://zintra-sandy.vercel.app/subscription-plans
2. Click "Subscribe Now"
3. Check browser console (F12) for logs showing:
   ```
   🔐 PesaPal Credentials Check:
     - API URL: ✓ Set
     - Consumer Key: ✓ Set
     - Consumer Secret: ✓ Set
   ```

---

## 📋 Vercel Environment Variables Checklist

- [ ] Logged into Vercel dashboard
- [ ] Selected correct project
- [ ] Went to Settings → Environment Variables
- [ ] Added `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY`
- [ ] Added `PESAPAL_CONSUMER_SECRET`
- [ ] Added `NEXT_PUBLIC_PESAPAL_API_URL`
- [ ] Added `PESAPAL_WEBHOOK_URL`
- [ ] Clicked "Save" on each variable
- [ ] Went to Deployments tab
- [ ] Clicked "Redeploy" on latest
- [ ] Waited for deployment to complete (green checkmark)

---

## 🆘 Still Getting Error?

1. **Hard refresh** browser: `Ctrl+Shift+R` (or `Cmd+Shift+R`)
2. **Clear cache** browser (Ctrl+Shift+Del)
3. **Wait 2-3 minutes** after redeploy for Vercel to propagate
4. **Check Vercel logs**: Go to Deployments → Functions → check for errors

---

## 📞 If Variables Still Missing

Check with PesaPal:
1. Log into PesaPal Developer Console
2. Find your Consumer Key & Secret
3. Copy both exactly (no extra spaces!)
4. Paste into Vercel exactly

---

**Once variables are set, the payment flow should work!** 🚀

