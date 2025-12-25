# 🔧 Fix for RLS Permission Error

**Error**: "permission denied for table users"

**Root Cause**: Trigger function was trying to query `auth.users` table which has RLS and the trigger doesn't have permission

**Solution**: Updated trigger to avoid accessing `auth.users` - uses only public tables

---

## What Changed

The trigger function `notify_on_message_insert()` has been updated:

### Before (❌ Error)
```sql
SELECT u.email INTO v_user_name FROM auth.users u WHERE u.id = NEW.user_id;
```

This tried to access auth.users which is protected by RLS.

### After (✅ Works)
```sql
SELECT user_id INTO v_vendor_user_id FROM public.vendors WHERE id = NEW.vendor_id;
```

Now it only queries public tables (vendors), no auth.users access needed.

---

## How to Apply Fix

### Option 1: Just Update the Function (Quickest)
Copy and execute ONLY this in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION public.notify_on_message_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_name varchar;
  v_user_email varchar;
  v_message_preview text;
  v_vendor_user_id uuid;
BEGIN
  v_message_preview := SUBSTRING(NEW.message_text, 1, 100);
  
  IF NEW.sender_type = 'vendor' THEN
    SELECT company_name INTO v_vendor_name FROM public.vendors WHERE id = NEW.vendor_id;
    PERFORM create_message_notification(
      NEW.user_id,
      NEW.vendor_id,
      NEW.id,
      v_vendor_name,
      v_message_preview
    );
  ELSE
    SELECT user_id INTO v_vendor_user_id FROM public.vendors WHERE id = NEW.vendor_id;
    IF v_vendor_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, type, title, body, related_id, related_type
      ) VALUES (
        v_vendor_user_id, 'message', 'New message from a customer',
        v_message_preview, NEW.id, 'vendor_message'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Option 2: Run Full SQL File
If you want to be thorough, run the entire `NOTIFICATIONS_SYSTEM.sql` file again - it will update the function.

---

## After Fix

After updating the function:

1. ✅ Try sending a message again
2. ✅ Should NOT get permission error
3. ✅ Toast notification should appear
4. ✅ Badge should update
5. ✅ Dashboard should show notification

---

## Technical Details

**Why This Works**:
- Trigger functions run with elevated permissions by default
- But accessing `auth.users` bypasses RLS, which Supabase blocks
- Solution: Use only public tables (vendors, notifications)
- Get vendor's user_id from public.vendors table instead

**Result**:
- No RLS violations
- Cleaner code
- Better security
- No auth.users access needed

---

## Testing After Fix

```bash
# 1. Send message from user to vendor
# 2. Check for toast notification (should appear without error)
# 3. Verify navbar badge updated
# 4. Check dashboard notifications panel
```

---

## Files Updated

✅ `NOTIFICATIONS_SYSTEM.sql` - Updated trigger function

---

Ready to test! Just update the function and try sending a message again. 🚀
