# 🔍 Debug: Check Vercel Function Logs

The code now has detailed logging. Let's check the logs to see exactly what's happening.

---

## 📋 Steps to Check Logs

### 1. Go to Vercel Dashboard
```
https://vercel.com/dashboard
```

### 2. Select Your Project
Click on `zintra` or `zintra-sandy`

### 3. Go to Deployments
Click the **Deployments** tab (at the top)

### 4. Open Latest Deployment
Click the **latest deployment** (should be at top with recent timestamp)

### 5. Click "Logs" or "Functions"
You should see a section showing API function logs

### 6. Find the Payment API Logs
Look for logs from `/api/payments/pesapal/initiate`

---

## 📊 What to Look For

After you click "Subscribe Now", you should see logs like:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 POST /api/payments/pesapal/initiate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 PesaPal Credentials Check:
  - API URL: ✓ Set (https://sandbox.pesapal.com...)
  - Consumer Key: ✓ Set (N+hSPBcUkJuLOx4...)
  - Consumer Secret: ✓ Set (length: 24)

🔍 All PESAPAL env vars: ['NEXT_PUBLIC_PESAPAL_CONSUMER_KEY', 'PESAPAL_CONSUMER_SECRET', ...]

📊 Credentials loaded: { url: '...', key: '...', secret: '...' }

✅ Credentials verified
```

---

## ✅ If You See This
Great! The credentials are loaded. The issue is somewhere else in the flow.

## ❌ If You See This
```
❌ PesaPal credentials not configured
   - Key present: false
   - Secret present: false
   - URL: https://sandbox.pesapal.com/api/v3
```

This means the environment variables aren't being loaded. Solutions:

1. **Check Vercel Dashboard** - Are the variables actually saved?
2. **Hard refresh** after they're saved (takes 2-3 minutes)
3. **Click Redeploy** on the latest deployment
4. **Wait 5 minutes** - Vercel can be slow

---

## 🆘 Can't Find Logs?

Try this alternative:

1. Go to Deployment
2. Click the **"Logs"** button at top right
3. Select "**Runtime Logs**" (not Build Logs)
4. Filter by function name: `initiate`

---

## 📱 Report Back

Once you check the logs, tell me:
1. **Are credentials showing as ✓ Set or ❌ Not set?**
2. **What's the value of each?** (first few characters is fine)
3. **Do you see an error message?**

This will help us fix the issue! 🔧

