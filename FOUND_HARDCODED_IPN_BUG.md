# 🎯 FOUND THE BUG - Hardcoded Invalid IPN ID

**Status:** 🔴 ROOT CAUSE FOUND  
**Date:** January 5, 2026

---

## The Problem

In our code, there's a **hardcoded IPN (notification_id)** that doesn't exist in your PesaPal account:

```javascript
// ❌ WRONG - Hardcoded fake ID
notification_id: '4e4af0b6-3758-40d8-8e22-0c1f21847e15',
```

When PesaPal receives the order request with an invalid notification_id, it rejects it with "Invalid Access Token" (misleading error message, but actually means invalid IPN).

---

## The Solution

### Step 1: Get Your Real IPN ID

You need to register your webhook URL with PesaPal and get the IPN ID.

**In your PesaPal merchant dashboard:**

1. Go to **API Settings** or **Developer Settings**
2. Look for **IPN (Instant Payment Notification)** setup
3. You should see a registered IPN URL: `https://zintra-sandy.vercel.app/api/webhooks/pesapal`
4. Find the **IPN ID** (it's a UUID that looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
5. **Copy that IPN ID**

### Step 2: Add to Vercel Environment Variables

1. **Vercel Settings → Environment Variables**
2. **Click "Add New"**
3. **Add:**
   ```
   Variable Name: NEXT_PUBLIC_PESAPAL_NOTIFICATION_ID
   Value: [paste your actual IPN ID here]
   Environment: Production
   ```
4. **Save**
5. **Redeploy** your deployment

### Step 3: Update Code

Once you've added the environment variable, the code will automatically use it. We've already updated the code to read from this variable instead of using the hardcoded one.

---

## Why This Works

PesaPal requires that when you submit an order, you must specify which webhook endpoint should receive notifications. The notification_id links the order to your registered webhook.

- ✅ Your webhook is registered: `https://zintra-sandy.vercel.app/api/webhooks/pesapal`
- ✅ It has a valid IPN ID: You need to find this
- ❌ We were using a fake ID: That's why orders were being rejected

---

## Where to Find Your IPN ID

### In PesaPal Dashboard:

1. Log in to https://dashboard.pesapal.com
2. Look for:
   - **Settings → Notifications** OR
   - **API → IPN Settings** OR
   - **Developer → Webhooks**
3. Find the URL: `https://zintra-sandy.vercel.app/api/webhooks/pesapal`
4. Next to it should be the **IPN ID**

It looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### If You Don't See It Registered:

You may need to register it:

1. In PesaPal dashboard, find **Register IPN** or similar option
2. Enter webhook URL: `https://zintra-sandy.vercel.app/api/webhooks/pesapal`
3. Choose notification type: **POST**
4. Register/Save
5. PesaPal will give you the IPN ID

---

## Quick Checklist

- [ ] Found your actual IPN ID in PesaPal dashboard
- [ ] Added `NEXT_PUBLIC_PESAPAL_NOTIFICATION_ID` to Vercel with the real IPN ID
- [ ] Set environment to "Production"
- [ ] Redeployed latest deployment
- [ ] Hard refreshed browser (Cmd+Shift+R)
- [ ] Tested payment flow again

---

## Expected Result

Once you add the correct IPN ID:

1. Click "Subscribe Now"
2. Should redirect to PesaPal payment page ✅
3. Can select payment method and complete payment ✅

---

## If You Can't Find IPN ID

Let me know and I can add a debug endpoint to help you identify it, or we can register a new one.

