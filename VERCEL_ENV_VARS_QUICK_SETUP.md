# 🎯 QUICK SETUP: Add PesaPal Credentials to Vercel

**Problem:** Error: `Server not configured: PesaPal credentials missing`  
**Solution:** Add 4 environment variables to Vercel dashboard  
**Time:** 5 minutes

---

## 📝 Your Credentials (From Earlier)

```
Consumer Key:    N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC
Consumer Secret: nC8XtQjNgAaoTC2gL6M4bNJzAnY=
```

---

## ✅ Step-by-Step

### 1️⃣ Open Vercel Dashboard
```
https://vercel.com/dashboard
```

### 2️⃣ Find Your Project
Look for "zintra" or "zintra-sandy" in the projects list

### 3️⃣ Click Settings
```
Project Name → Settings (tab at top)
```

### 4️⃣ Click Environment Variables
```
Left sidebar → Environment Variables
```

You should see a screen with existing variables like:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- etc.

### 5️⃣ Add First Variable: Consumer Key

**Click:** "Add New" button

**Fill in:**
```
Name:  NEXT_PUBLIC_PESAPAL_CONSUMER_KEY
Value: N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC
```

**Environment:** Select `Production` (or all)

**Click:** "Save"

### 6️⃣ Add Second Variable: Consumer Secret

**Click:** "Add New" button

**Fill in:**
```
Name:  PESAPAL_CONSUMER_SECRET
Value: nC8XtQjNgAaoTC2gL6M4bNJzAnY=
```

**Environment:** Select `Production` (or all)

**Click:** "Save"

### 7️⃣ Add Third Variable: API URL

**Click:** "Add New" button

**Fill in:**
```
Name:  NEXT_PUBLIC_PESAPAL_API_URL
Value: https://sandbox.pesapal.com/api/v3
```

**Environment:** Select `Production` (or all)

**Click:** "Save"

### 8️⃣ Add Fourth Variable: Webhook URL

**Click:** "Add New" button

**Fill in:**
```
Name:  PESAPAL_WEBHOOK_URL
Value: https://zintra-sandy.vercel.app/api/webhooks/pesapal
```

(Replace `zintra-sandy.vercel.app` with your actual Vercel domain if different)

**Environment:** Select `Production` (or all)

**Click:** "Save"

### 9️⃣ Redeploy

**Click:** "Deployments" tab

**Click:** Latest deployment (should be at top)

**Click:** "Redeploy" button

**Wait:** For deployment to complete (should see green checkmark ✓)

---

## 🧪 Test Payment Flow

After redeploy completes:

1. Go to: **https://zintra-sandy.vercel.app/subscription-plans**
2. **Log in** if needed
3. **Click** "Subscribe Now"
4. Should redirect to **PesaPal checkout** ✅

---

## ✨ All 4 Variables Summary

| # | Name | Value | Type |
|---|------|-------|------|
| 1 | `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY` | `N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC` | Public |
| 2 | `PESAPAL_CONSUMER_SECRET` | `nC8XtQjNgAaoTC2gL6M4bNJzAnY=` | Secret |
| 3 | `NEXT_PUBLIC_PESAPAL_API_URL` | `https://sandbox.pesapal.com/api/v3` | Public |
| 4 | `PESAPAL_WEBHOOK_URL` | `https://zintra-sandy.vercel.app/api/webhooks/pesapal` | Server |

---

## ❓ Common Questions

**Q: Where do I find these values?**
A: 
- Consumer Key & Secret: PesaPal Developer Dashboard
- API URL: Already provided (sandbox URL)
- Webhook URL: Your Vercel domain + `/api/webhooks/pesapal`

**Q: Should I include the "NEXT_PUBLIC_" prefix when entering?**
A: Yes! The full name is `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY`

**Q: What if I make a mistake?**
A: Just edit it - click the variable → Edit → Change value → Save

**Q: How long until it works?**
A: After redeploy completes (~1-2 minutes), wait another 1-2 minutes for propagation

**Q: Still getting error?**
A: Hard refresh browser: `Ctrl+Shift+R` or `Cmd+Shift+R`

---

## 🎉 When It Works

You'll see:
```
✅ Redirect to PesaPal checkout page
✅ No "credentials missing" error
✅ Payment form appears
```

---

**Go set up the credentials now!** 🚀

Then test the payment flow and let me know it worked! ✅

