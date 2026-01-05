# Update PesaPal Credentials in Vercel

**Status:** Credential Update Required  
**Date:** January 5, 2026

---

## New Credentials

```
NEXT_PUBLIC_PESAPAL_CONSUMER_KEY: GlThzGgd42q6+p3rK54I3tt3wBQrChWK
PESAPAL_CONSUMER_SECRET: mnd3ISYKxS7stye7VxsPkhnxpJU=
```

---

## Steps to Update in Vercel

### Step 1: Go to Vercel Settings
1. Open Vercel Dashboard
2. Select your project (zintra-sandy)
3. Go to **Settings → Environment Variables**

### Step 2: Update NEXT_PUBLIC_PESAPAL_CONSUMER_KEY

1. Find `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY` in the list
2. Click on it to edit
3. Change the value from:
   ```
   N+hSPBcUkJuLOx4hzO9rwRAR0k6lDGuC
   ```
   To:
   ```
   GlThzGgd42q6+p3rK54I3tt3wBQrChWK
   ```
4. Click **Save**

### Step 3: Update PESAPAL_CONSUMER_SECRET

1. Find `PESAPAL_CONSUMER_SECRET` in the list
2. Click on it to edit
3. Change the value from:
   ```
   nC8XtQjNgAaoTC2gL6M4bNJzAnY=
   ```
   To:
   ```
   mnd3ISYKxS7stye7VxsPkhnxpJU=
   ```
4. Click **Save**

### Step 4: Redeploy

1. Go to **Deployments**
2. Find your latest deployment
3. Click the **"..."** menu
4. Click **"Redeploy"**
5. Wait 2-3 minutes for the new deployment to complete

### Step 5: Hard Refresh Browser

```
Cmd+Shift+R  (Mac)
Ctrl+Shift+R (Windows)
```

### Step 6: Test Payment Flow

1. Go to: https://zintra-sandy.vercel.app/subscription-plans
2. Click: "Subscribe Now"
3. Should redirect to PesaPal with the new credentials

---

## Verification

After updating and redeploying, visit the debug endpoint to confirm the new credentials are loaded:

```
https://zintra-sandy.vercel.app/api/debug/pesapal-env
```

You should see:
```json
{
  "expectedVars": {
    "NEXT_PUBLIC_PESAPAL_CONSUMER_KEY": {
      "present": true,
      "preview": "GlThzGg..."
    },
    "PESAPAL_CONSUMER_SECRET": {
      "present": true,
      "preview": "SET (length: 24)"
    }
  }
}
```

---

## Summary

- [ ] Updated `NEXT_PUBLIC_PESAPAL_CONSUMER_KEY` to `GlThzGgd42q6+p3rK54I3tt3wBQrChWK`
- [ ] Updated `PESAPAL_CONSUMER_SECRET` to `mnd3ISYKxS7stye7VxsPkhnxpJU=`
- [ ] Redeployed latest deployment
- [ ] Hard refreshed browser
- [ ] Tested payment flow

Let me know once you've updated the credentials and tested! 🚀

