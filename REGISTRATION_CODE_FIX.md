# 🔧 Registration Code Fix - Use INSERT Instead of UPSERT

## The Problem

The `upsert` with RLS might be too strict. When INSERT is attempted, the RLS policy checks `auth.uid() = id`. But with upsert, there might be timing or session issues.

## Solution: Use Direct INSERT

Replace your `handleStep3` function with this code that uses INSERT instead of UPSERT:

```javascript
const handleStep3 = async () => {
  setLoading(true);
  setOtpMessage('');

  try {
    // Get the authenticated user
    let user = currentUser;
    
    if (!user) {
      const { data: { user: fetchedUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !fetchedUser) {
        setOtpMessage('❌ Error: Not authenticated. Please log in again.');
        setLoading(false);
        return;
      }
      user = fetchedUser;
    }

    console.log('User ID:', user.id);
    console.log('Auth UID should be:', user.id);

    // Try INSERT first (will fail if row exists, that's ok)
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        full_name: formData.fullName,
        phone: formData.phone,
        bio: formData.bio || null,
      })
      .select();

    // If insert failed because row exists, try update
    if (insertError && insertError.code === '23505') {
      // Duplicate key error - row exists, so update it
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          bio: formData.bio || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('Update error:', updateError);
        setOtpMessage(`❌ Error updating profile: ${updateError.message}`);
        setLoading(false);
        return;
      }
    } else if (insertError) {
      console.error('Insert error:', insertError);
      setOtpMessage(`❌ Error saving profile: ${insertError.message}`);
      setLoading(false);
      return;
    }

    // Success
    setOtpMessage('✅ Profile saved successfully! Redirecting...');
    
    setTimeout(() => {
      setCurrentStep(4);
      setLoading(false);
    }, 1000);

  } catch (err) {
    console.error('Unexpected error:', err);
    setOtpMessage(`❌ Unexpected error: ${err.message}`);
    setLoading(false);
  }
};
```

---

## Why This Works Better

1. ✅ **Explicit INSERT** - Clearly tells the policy we're inserting
2. ✅ **Handles duplicates** - Catches the error if row exists, then updates
3. ✅ **Better error logging** - Console shows exactly what's happening
4. ✅ **Cleaner RLS flow** - Policies apply correctly to INSERT and UPDATE separately

---

## Alternative: Disable RLS Temporarily

If the code change doesn't work, you could also temporarily disable RLS for debugging:

```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

Then test registration. If it works without RLS, we know it's a policy issue, not a code issue.

To re-enable:

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

---

## 🎯 Next Steps

1. **Option A**: Copy the new `handleStep3` code and replace your current one
2. **Option B**: Run the "disable RLS" SQL to test if that's the issue
3. **Test registration** again
4. **Let me know what happens!**

I think the INSERT approach will fix it! 💪
