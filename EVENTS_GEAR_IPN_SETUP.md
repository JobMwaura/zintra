# Use Events Gear IPN ID - Quick Setup

**Status:** Ready to configure  
**Date:** January 5, 2026

---

## What You Need To Do

You already have an IPN registered in PesaPal for Events Gear:
```
https://app.eventsgear.co.ke/api/pesapal/ipn
```

We'll use that same IPN ID for Zintra payments.

---

## Step 1: Find the IPN ID

In PesaPal dashboard where you saw the screenshot:

1. Look at the registered URL: `https://app.eventsgear.co.ke/api/pesapal/ipn`
2. There should be an **IPN ID** next to it (a UUID)
3. It looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
4. **Copy this ID**

---

## Step 2: Add to Vercel

1. **Vercel Settings → Environment Variables**
2. **Click "Add New"**
3. **Fill in:**
   ```
   Variable Name: NEXT_PUBLIC_PESAPAL_NOTIFICATION_ID
   Value: [paste the IPN ID from Events Gear]
   Environment: Production
   ```
4. **Save**

---

## Step 3: Redeploy

1. **Deployments → Latest**
2. **Click "..." → "Redeploy"**
3. **Wait 2-3 minutes**

---

## Step 4: Test

1. **Hard refresh:** `Cmd+Shift+R`
2. **Go to:** https://zintra-sandy.vercel.app/subscription-plans
3. **Click:** "Subscribe Now"
4. **Expected:** Should now redirect to PesaPal payment page! ✅

---

## How It Works

- Payments submitted to PesaPal will use the Events Gear IPN ID
- When payment completes, PesaPal will notify the Events Gear webhook
- You can create a separate webhook handler if needed, or integrate with Events Gear's system

---

**That's it! Just 4 quick steps.** Let me know once you add the IPN ID and test! 🚀

