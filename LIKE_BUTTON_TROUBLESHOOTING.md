# Like Button Troubleshooting Guide

## Issue Reported
- Like button not functional on vendor profiles
- Sign out/Sign in state confusion when viewing own vendor profile

## Root Cause Analysis

### Issue 1: Like Button Not Showing for Own Profile (CORRECT BEHAVIOR)
When you view your own vendor profile (e.g., Franschoek), the like button is intentionally hidden because:

```javascript
const canEdit = !!currentUser && (!!vendor?.user_id ? vendor.user_id === currentUser.id : vendor?.email === currentUser.email);

{currentUser && !canEdit && (
  <button onClick={handleLikeProfile}>❤️ Like</button>
)}
```

**Explanation:**
- `canEdit = true` when you're viewing YOUR vendor profile
- The button only shows when `currentUser && !canEdit`
- So when `canEdit = true`, the button is hidden ✓ (This is correct)

**This is by design** - you can't like your own profile. When you see your Franschoek profile without a like button, it means you're successfully authenticated as the vendor owner.

### Issue 2: Like Button Not Functional (Now Enhanced)
The improvements made:

1. **Enhanced Error Logging**: Console now shows detailed logs
   ```javascript
   console.log('🔹 Toggling like for vendor:', vendor.id)
   console.log('→ Attempting to unlike...')
   console.log('✅ Unlike successful')
   console.error('❌ Unlike error:', error)
   ```

2. **Validation Checks**: Added checks to prevent:
   - Liking without currentUser
   - Liking your own profile (canEdit check)

3. **Error Alerts**: Users now see error messages if like fails:
   ```javascript
   alert(`Error: ${err.message || 'Failed to update like'}`)
   ```

4. **Better UX**: Button now shows loading state and helpful tooltips

## How to Test the Like Button

### Test 1: Like as Different User
1. Log out from vendor account
2. Log in as a regular user (non-vendor)
3. Browse vendor profiles
4. Click the heart button on a vendor profile (NOT your own)
5. Check browser console (F12) for success messages

### Test 2: View Your Own Profile
1. Log out
2. Log in to your vendor account
3. Navigate to your vendor profile
4. **Like button should NOT appear** (this is correct)
5. Check browser console - should show logs about canEdit=true

### Test 3: Debug Console Logs
Open browser console (F12) and look for:

#### Success Case:
```
🔹 Toggling like for vendor: [vendor-id] user: [user-id] currently liked: false
→ Attempting to like...
✅ Like successful, inserted: [{...}]
```

#### Error Case:
```
❌ Like error: {message: "..."} 
Error: Failed to update like
```

## Common Issues & Solutions

### Issue: "No likes" shows but button appears inactive
**Check:**
1. Are you logged in? (Check top-left user menu)
2. Is this your own profile? (Like button hidden on own profile = correct)
3. Are you viewing someone else's profile? (Like button should appear)

**Solution:**
- Make sure you're logged in as a different user than the vendor
- Check console for error messages
- If "Cannot like your own profile" appears in console, you're viewing your own vendor profile

### Issue: Click does nothing, no error message
**Check:**
1. Open browser DevTools (F12 → Console tab)
2. Click like button
3. Look for console messages
4. If no messages appear, the button click isn't registering

**Solution:**
- Hard refresh page (Cmd+Shift+R on Mac)
- Check that JavaScript is enabled
- Try a different browser
- Check RLS policies in Supabase

### Issue: "RLS policy violation" error appears
**This means:** Your Supabase RLS policy isn't allowing the insert/delete operation

**Solution:**
1. Go to Supabase → SQL Editor
2. Run this to verify the table exists:
   ```sql
   SELECT * FROM vendor_profile_likes LIMIT 1;
   ```
3. If it fails, you need to re-run the VENDOR_PROFILE_LIKES_AND_VIEWS_CLEAN.sql

4. Check RLS policies are enabled:
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'vendor_profile_likes';
   ```
   Should show `rowsecurity = true`

## RLS Policy Checklist

The like button requires these RLS policies to work:

### For vendor_profile_likes table:

✅ **Policy 1:** "Allow read profile likes"
```sql
CREATE POLICY "Allow read profile likes" ON vendor_profile_likes
FOR SELECT USING (true);
```
- Allows anyone to see who liked profiles
- **Purpose**: Display like counts to everyone

✅ **Policy 2:** "Allow insert profile likes"
```sql
CREATE POLICY "Allow insert profile likes" ON vendor_profile_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);
```
- Allows authenticated users to add their own likes
- **Purpose**: User can only like as themselves

✅ **Policy 3:** "Allow delete own profile likes"
```sql
CREATE POLICY "Allow delete own profile likes" ON vendor_profile_likes
FOR DELETE USING (auth.uid() = user_id);
```
- Allows users to remove only their own likes
- **Purpose**: User can only unlike their own like

### For vendor_profile_stats table:

✅ **Policy 1:** "Allow read profile stats"
```sql
CREATE POLICY "Allow read profile stats" ON vendor_profile_stats
FOR SELECT USING (true);
```
- Everyone can view stats
- **Purpose**: Display like counts publicly

## Frontend Code Flow

```
User clicks like button
  ↓
handleLikeProfile() called
  ↓
Check: currentUser exists? ✓
Check: vendor.id exists? ✓
Check: !canEdit (not own profile)? ✓
  ↓
If already liked:
  → DELETE from vendor_profile_likes WHERE vendor_id=X AND user_id=Y
  → Decrement local count
  → Set userLiked=false
  ↓
If not liked:
  → INSERT into vendor_profile_likes (vendor_id, user_id)
  → Increment local count
  → Set userLiked=true
  ↓
Update button UI with new count and color
```

## Database Flow

When you click like:

1. **Frontend:** INSERT triggered
   ```javascript
   supabase.from('vendor_profile_likes').insert({
     vendor_id: vendor.id,
     user_id: currentUser.id
   })
   ```

2. **Database:** RLS Policy Checks
   - Is user authenticated? ✓
   - Does user_id match auth.uid()? ✓
   - Does vendor exist? ✓
   - Is this a duplicate like? ✗ (UNIQUE constraint)

3. **Database:** Trigger Fires
   ```sql
   trigger_increment_profile_likes AFTER INSERT
   EXECUTE FUNCTION increment_profile_likes()
   ```

4. **Trigger:** Updates Stats
   ```sql
   INSERT INTO vendor_profile_stats (vendor_id, likes_count)
   VALUES (NEW.vendor_id, 1)
   ON CONFLICT (vendor_id)
   DO UPDATE SET likes_count = likes_count + 1
   ```

5. **Frontend:** Re-fetches Stats
   ```javascript
   const { data: stats } = await supabase
     .from('vendor_profile_stats')
     .select('likes_count')
     .eq('vendor_id', vendor.id)
     .maybeSingle()
   ```

## Browser DevTools Debugging

### Step 1: Open Console
Press `F12` → Click "Console" tab

### Step 2: Try to Like
Click the heart button on any vendor profile

### Step 3: Look for Logs
You should see messages like:
```
🔹 Toggling like for vendor: [uuid] user: [uuid] currently liked: false
→ Attempting to like...
✅ Like successful, inserted: [{id: ..., vendor_id: ..., user_id: ..., created_at: ...}]
```

### Step 4: Verify Database
Open Supabase Dashboard → SQL Editor:
```sql
-- Check if your like was inserted
SELECT * FROM vendor_profile_likes 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC LIMIT 5;

-- Check if stats were updated
SELECT * FROM vendor_profile_stats 
WHERE vendor_id = 'vendor-you-liked-id';
```

## Expected Behavior

### When NOT logged in:
- Like button shows as gray outlined button
- Click → Redirects to login page
- ✓ Correct

### When logged in, viewing someone else's profile:
- Like button visible
- Unfilled heart = not liked (gray)
- Filled red heart = you liked it (red)
- Click → Toggles like/unlike instantly
- Count updates immediately
- ✓ Correct

### When logged in, viewing YOUR OWN vendor profile:
- Like button is HIDDEN
- No like button visible anywhere
- ✓ Correct - you can't like yourself

### When logged in, viewing ANOTHER vendor's profile:
- "Sign out, then sign in as user" scenario
- Log out from vendor account
- Log in with user account
- Browse and view other vendor profiles
- Like button SHOULD appear and work
- ✓ Correct

## Quick Test Checklist

- [ ] I'm logged in as a regular user (not vendor account)
- [ ] I'm viewing a vendor's profile (not my own)
- [ ] The like button is visible and clickable
- [ ] Clicking it changes the heart color to red
- [ ] The number increments
- [ ] Browser console shows success message
- [ ] Refresh page - count persists and heart stays red
- [ ] Click again to unlike
- [ ] Count decrements
- [ ] Heart returns to gray outline
- [ ] Supabase shows the like in vendor_profile_likes table

## Still Not Working?

1. **Hard refresh your browser** (Cmd+Shift+R or Ctrl+Shift+F5)
2. **Check browser console for errors** (F12 → Console)
3. **Verify you have the latest code**:
   ```bash
   git pull origin main
   ```
4. **Check RLS policies exist** in Supabase
5. **Verify vendor_profile_stats table has data** for that vendor
6. **Check your authentication state** - are you really logged in?

---

**Last Updated:** December 21, 2025  
**Latest Commit:** 96f225c (Improved like button with error logging)
