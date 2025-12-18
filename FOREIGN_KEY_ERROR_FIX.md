# 🔧 Foreign Key Issue - Auth User Not Created

## The Problem

Error: `insert or update on table "users" violates foreign key constraint "users_id_fkey"`

This means:
- We're trying to insert into `public.users` with a user ID
- But that user ID **doesn't exist in `auth.users`**
- The foreign key constraint requires it to exist

## Why This Happens

When `supabase.auth.signUp()` is called, it should create a row in `auth.users`. But something might be preventing that:
1. Email confirmation required (default in Supabase)
2. User object not returned properly
3. User ID is null or invalid

## ✅ Solution: Check Auth User Before Inserting

Let me update your code to **verify the auth user exists** before trying to insert:

---

## Updated Code

Replace your `handleStep3` with this:

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

    // CRITICAL: Verify user ID exists
    if (!user.id) {
      setOtpMessage('❌ Error: User ID not found. Please try signing up again.');
      setLoading(false);
      return;
    }

    console.log('Attempting to insert for user:', user.id);

    // Try INSERT first
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
      console.log('Row exists, updating instead...');
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
      // Check if it's a foreign key error
      if (insertError.code === '23503') {
        console.error('Foreign key error - auth user not found:', insertError);
        setOtpMessage('❌ Error: User account not created properly. Please try signing up again.');
        setLoading(false);
        return;
      }
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

## Also Check: Step 1 Signup

Make sure the signup is working:

```javascript
const handleStep1 = async () => {
  if (validateStep1()) {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'user',
          },
        },
      });

      if (error) {
        setOtpMessage(`❌ Signup failed: ${error.message}`);
        setLoading(false);
        return;
      }

      // IMPORTANT: Check if user was created
      if (!data?.user?.id) {
        setOtpMessage('❌ Error: Account created but user ID not returned. This may be a Supabase configuration issue.');
        setLoading(false);
        return;
      }

      console.log('User created with ID:', data.user.id);
      
      // Store user data for use in later steps
      setCurrentUser(data.user);

      // Account created, move to phone verification
      setCurrentStep(2);
    } catch (err) {
      setOtpMessage('❌ Error creating account: ' + err.message);
    } finally {
      setLoading(false);
    }
  }
};
```

---

## 🔍 Check Your Supabase Settings

The foreign key error suggests **Supabase isn't creating auth.users rows for signups**.

Check in Supabase Dashboard:
1. Go to **Authentication → Providers → Email**
2. Check the **"Confirm email"** setting
3. If it's **ON**, emails must be confirmed before the user is "confirmed"
4. Consider temporarily turning it **OFF** for development

---

## 🚀 Next Steps

1. **Update handleStep3** with the code above
2. **Update handleStep1** with validation
3. **Hard refresh**: Cmd+Shift+R
4. **Test registration again**
5. **Check browser console** for logs showing user ID

---

## Alternative: Disable Foreign Key Temporarily

If the signup absolutely won't create the auth user, temporarily disable the foreign key:

```sql
ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;
```

Then re-enable after testing:

```sql
ALTER TABLE public.users 
ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

But let's try the code fix first! 💪
