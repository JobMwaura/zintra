# Login Authentication Debugging Guide

## Issue Summary
Users are unable to log in on both user and vendor accounts. Login page appears to process the request but doesn't authenticate users.

**Status**: 🔴 INVESTIGATING - Session persistence fixes applied

---

## Root Cause Analysis

### Potential Issues (Priority Order)

#### 1. **CRITICAL: Supabase Environment Variables on Vercel** ❌ UNCHECKED
- **Problem**: The `.env.local` file has Supabase credentials, but Vercel deployment might not have them configured
- **Symptoms**: Login fails silently, auth always returns null
- **Check**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Vercel Project Settings
- **Solution**: Add environment variables to Vercel deployment

#### 2. **Session Persistence Not Working** ⚠️ PARTIALLY FIXED
- **Problem**: Supabase session wasn't persisting to localStorage
- **Fix Applied**: Added explicit `persistSession: true` and `storage: window.localStorage` to supabaseClient.js
- **Status**: ✓ Code fix applied, needs testing

#### 3. **Redirect Timing Issue** ⚠️ PARTIALLY FIXED
- **Problem**: `window.location.href` redirect happening before session established
- **Fix Applied**: Increased delay to 800ms and added explicit wait for persistence
- **Status**: ✓ Code fix applied, needs testing

#### 4. **CORS/Security Issues** ❌ UNCHECKED
- **Problem**: Supabase may reject auth requests from Vercel domain
- **Check**: Verify Vercel domain is in Supabase Redirect URLs whitelist
- **Location**: Supabase Dashboard → Authentication → URL Configuration
- **Required URLs**:
  - Local: `http://localhost:3000`
  - Vercel: `https://zintra-sandy.vercel.app`
  - Any custom domains

---

## Applied Fixes (Commit: a1fd869)

### 1. **supabaseClient.js** - Session Persistence
```javascript
// Before: Basic client creation
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// After: With explicit auth config
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
```

**What This Does**:
- `persistSession: true` - Saves auth token to localStorage
- `autoRefreshToken: true` - Automatically refreshes expired tokens
- `storage: window.localStorage` - Explicitly uses browser localStorage instead of memory

### 2. **AuthContext.js** - Enhanced Logging
- Added debug logs for:
  - Initial session check
  - Auth state changes (events)
  - Sign in/up/out operations
  - Session restoration across page loads

**Debug Output**:
```
🔹 AuthProvider mounted, checking initial session...
✓ No active session  (or)  ✓ Found active session, user: test@example.com
🔹 Auth state changed: SIGNED_IN
✓ Session restored/updated for: test@example.com
```

### 3. **login/page.js** - Better Timing & Logging
```javascript
// Added explicit wait for session persistence
await new Promise(resolve => setTimeout(resolve, 500));

// Increased redirect delay to ensure complete setup
setTimeout(() => {
  window.location.href = redirectUrl;
}, 800);

// Added session token logging
console.log('🔹 Session tokens:', { 
  accessToken: data.session?.access_token ? '✓ present' : '✗ missing',
  refreshToken: data.session?.refresh_token ? '✓ present' : '✗ missing'
});
```

---

## Testing Checklist

### Step 1: Local Testing
```bash
# Terminal 1: Start dev server
cd /Users/macbookpro2/Desktop/zintra-platform
npm run dev

# Opens at http://localhost:3000
```

**Test Instructions**:
1. Go to http://localhost:3000/login
2. Select "User Login" or "Vendor Login" tab
3. Enter valid credentials:
   - Email: `test@example.com` (or existing account)
   - Password: `YourSecurePassword123`
4. Click "Sign In"
5. **Expected**: Redirect to `/browse` or `/user-dashboard` without errors
6. **Check Console**: Look for:
   - ✅ Green logs: "✓ Sign in successful"
   - ✅ No red errors: "❌ Supabase login error"
   - ✅ Session token logs showing present tokens

### Step 2: Verify Session Persistence
1. After successful login, open DevTools (F12)
2. Go to Application → Local Storage
3. Look for `supabase.auth.token` key
4. Verify it contains the session data with:
   - `access_token` field present
   - `user` object with your email

### Step 3: Vercel Deployment Testing
1. Visit https://zintra-sandy.vercel.app/login
2. Repeat Step 1 above
3. **If fails**: Check Vercel logs for errors
4. **If fails**: Check that env vars are set in Vercel

---

## Debugging Commands

### Check Supabase Connection
```javascript
// Run in browser console on login page
import { supabase } from '@/lib/supabaseClient';

// Check if supabase is initialized
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase ready:', supabase ? 'Yes' : 'No');

// Check localStorage for existing session
console.log('Stored session:', localStorage.getItem('supabase.auth.token'));
```

### Manual Supabase Auth Test
```javascript
// In browser console
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
});
console.log('Result:', { data, error });
console.log('Session after:', localStorage.getItem('supabase.auth.token'));
```

### Check Vercel Environment Variables
```bash
# List all Vercel env vars (requires Vercel CLI)
vercel env list

# Or check in Vercel Dashboard:
# 1. Go to vercel.com → Project → Settings
# 2. Look for Environment Variables section
# 3. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY exist
```

---

## Vercel Configuration Checklist

### ❌ Must Check:

1. **Environment Variables Set**
   - [ ] `NEXT_PUBLIC_SUPABASE_URL=https://zeomgqlnztcdqtespsjx.supabase.co`
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

2. **Supabase Redirect URLs Configured**
   - [ ] Local: `http://localhost:3000/**`
   - [ ] Vercel: `https://zintra-sandy.vercel.app/**`
   - Location: Supabase → Authentication → URL Configuration

3. **CORS Enabled on Supabase**
   - [ ] Check Supabase Dashboard for any CORS errors
   - [ ] Verify Vercel domain is whitelisted

---

## Next Steps

### Immediate Actions:
1. ✅ Push code fixes (Commit: a1fd869)
2. ⏳ Test login locally at http://localhost:3000/login
3. ⏳ Verify Vercel env vars are set
4. ⏳ Test login on Vercel deployment
5. ⏳ Check browser console for error messages
6. ⏳ Verify localStorage has session tokens

### If Login Still Broken:
1. Check Vercel logs: `vercel logs --follow`
2. Check browser Network tab for failed requests
3. Check Supabase Dashboard for error logs
4. Try manual Supabase auth test in console
5. Verify Supabase credentials are correct

---

## Code Files Modified

| File | Changes | Status |
|------|---------|--------|
| `/lib/supabaseClient.js` | Added auth persistence config | ✅ DEPLOYED |
| `/contexts/AuthContext.js` | Added debug logging | ✅ DEPLOYED |
| `/app/login/page.js` | Improved timing & logging | ✅ DEPLOYED |

---

## Resources

- **Supabase Docs**: https://supabase.com/docs/guides/auth/managing-user-data
- **Session Persistence**: https://supabase.com/docs/guides/auth/sessions
- **Next.js Integration**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Vercel Deployment**: https://vercel.com/docs/environment-variables

---

**Last Updated**: Commit a1fd869  
**Status**: 🔴 Awaiting test results on local and Vercel
