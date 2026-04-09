# ⚡ SQL QUICK REFERENCE CARD
## Copy-Paste SQL Commands for Supabase

**Date:** January 16, 2026  
**Format:** Ready to copy and paste into Supabase SQL Editor  

---

## 🚀 FASTEST PATH (Just Copy & Paste Everything)

### Copy this entire block and paste into Supabase SQL Editor:

```sql
-- PHASE 1: Admin UUID
ALTER TABLE public.vendor_messages ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_messages_admin_id ON public.vendor_messages(admin_id);
UPDATE public.vendor_messages vm SET admin_id = (SELECT au.id FROM public.admin_users au WHERE au.user_id = vm.sender_id AND vm.sender_type = 'admin' LIMIT 1) WHERE vm.sender_type = 'admin' AND vm.admin_id IS NULL;

-- PHASE 2: Three-Tier System
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN CREATE TYPE user_type_enum AS ENUM ('admin', 'vendor', 'user'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_type_enum') THEN CREATE TYPE sender_type_enum AS ENUM ('admin', 'vendor', 'user'); END IF; END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type VARCHAR DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vendor_id UUID;
ALTER TABLE public.users ADD CONSTRAINT valid_user_type CHECK (user_type IN ('admin', 'vendor', 'user'));
ALTER TABLE public.vendor_messages ADD CONSTRAINT valid_sender_type CHECK (sender_type IN ('admin', 'vendor', 'user'));
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_vendor_id ON public.users(vendor_id) WHERE user_type = 'vendor';
CREATE INDEX IF NOT EXISTS idx_vendor_messages_vendor_id_sender_type ON public.vendor_messages(vendor_id, sender_type);

-- PHASE 3: Data Migration
UPDATE public.users SET user_type = 'admin' WHERE is_admin = true AND user_type != 'admin';
UPDATE public.users u SET user_type = 'vendor', vendor_id = v.id FROM public.vendors v WHERE v.vendor_owner_id = u.id AND u.user_type != 'vendor';
UPDATE public.users SET user_type = 'user' WHERE user_type IS NULL OR user_type = '';
UPDATE public.vendor_messages SET sender_type = 'admin' WHERE sender_type = 'user' AND sender_type != 'admin';

-- PHASE 4: RLS Policies
DROP POLICY IF EXISTS vendor_messages_readable ON public.vendor_messages;
CREATE POLICY vendor_messages_readable ON public.vendor_messages FOR SELECT USING (vendor_id = auth.uid() OR sender_id = auth.uid() OR EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin'));
DROP POLICY IF EXISTS vendor_messages_writable ON public.vendor_messages;
CREATE POLICY vendor_messages_writable ON public.vendor_messages FOR INSERT WITH CHECK ((sender_id = auth.uid() AND sender_type = 'vendor') OR (sender_type = 'admin' AND EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')) OR (sender_type = 'user' AND sender_id = auth.uid()));
DROP POLICY IF EXISTS vendor_messages_updatable ON public.vendor_messages;
CREATE POLICY vendor_messages_updatable ON public.vendor_messages FOR UPDATE USING (vendor_id = auth.uid() OR sender_id = auth.uid() OR EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')) WITH CHECK (is_read IS NOT NULL);
```

---

## 🔍 VERIFY IT WORKED

Run these checks:

```sql
-- Check admin_id column
SELECT COUNT(*) as admin_messages_tracked FROM public.vendor_messages WHERE admin_id IS NOT NULL AND sender_type = 'admin';

-- Check user_type populated
SELECT user_type, COUNT(*) as count FROM public.users GROUP BY user_type;

-- Check sender_type updated
SELECT sender_type, COUNT(*) as count FROM public.vendor_messages GROUP BY sender_type;

-- Check all constraints in place
SELECT constraint_name FROM information_schema.table_constraints WHERE table_name IN ('users', 'vendor_messages') AND constraint_name LIKE '%valid%';
```

---

## 📦 MODULAR APPROACH (Run Each Section Separately)

### Option 1: Only Admin UUID (Without Three-Tier System)

```sql
-- Add admin_id column
ALTER TABLE public.vendor_messages ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_vendor_messages_admin_id ON public.vendor_messages(admin_id);

-- Populate existing messages
UPDATE public.vendor_messages vm SET admin_id = (SELECT au.id FROM public.admin_users au WHERE au.user_id = vm.sender_id AND vm.sender_type = 'admin' LIMIT 1) WHERE vm.sender_type = 'admin' AND vm.admin_id IS NULL;
```

### Option 2: Only Three-Tier System (Without Admin UUID)

```sql
-- Create enums
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN CREATE TYPE user_type_enum AS ENUM ('admin', 'vendor', 'user'); END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_type_enum') THEN CREATE TYPE sender_type_enum AS ENUM ('admin', 'vendor', 'user'); END IF; END $$;

-- Add columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type VARCHAR DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vendor_id UUID;

-- Add constraints
ALTER TABLE public.users ADD CONSTRAINT valid_user_type CHECK (user_type IN ('admin', 'vendor', 'user'));
ALTER TABLE public.vendor_messages ADD CONSTRAINT valid_sender_type CHECK (sender_type IN ('admin', 'vendor', 'user'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_vendor_id ON public.users(vendor_id) WHERE user_type = 'vendor';
CREATE INDEX IF NOT EXISTS idx_vendor_messages_vendor_id_sender_type ON public.vendor_messages(vendor_id, sender_type);

-- Populate user_type
UPDATE public.users SET user_type = 'admin' WHERE is_admin = true AND user_type != 'admin';
UPDATE public.users u SET user_type = 'vendor', vendor_id = v.id FROM public.vendors v WHERE v.vendor_owner_id = u.id AND u.user_type != 'vendor';
UPDATE public.users SET user_type = 'user' WHERE user_type IS NULL OR user_type = '';

-- Update sender_type
UPDATE public.vendor_messages SET sender_type = 'admin' WHERE sender_type = 'user' AND sender_type != 'admin';
```

---

## 🧹 IF YOU NEED TO ROLLBACK

Copy and paste to undo everything:

```sql
-- Drop indexes
DROP INDEX IF EXISTS idx_vendor_messages_admin_id;
DROP INDEX IF EXISTS idx_users_user_type;
DROP INDEX IF EXISTS idx_users_vendor_id;
DROP INDEX IF EXISTS idx_vendor_messages_vendor_id_sender_type;

-- Drop constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS valid_user_type;
ALTER TABLE public.vendor_messages DROP CONSTRAINT IF EXISTS valid_sender_type;

-- Drop columns
ALTER TABLE public.vendor_messages DROP COLUMN IF EXISTS admin_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS user_type;
ALTER TABLE public.users DROP COLUMN IF EXISTS vendor_id;

-- Revert data (optional)
UPDATE public.vendor_messages SET sender_type = 'user' WHERE sender_type = 'admin';

-- Drop types (CAREFUL - only if not used elsewhere)
-- DROP TYPE IF EXISTS user_type_enum;
-- DROP TYPE IF EXISTS sender_type_enum;
```

---

## 📝 INDIVIDUAL COMMANDS (Copy One at a Time)

### 1. Add Admin ID Column
```sql
ALTER TABLE public.vendor_messages ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;
```

### 2. Index Admin ID
```sql
CREATE INDEX IF NOT EXISTS idx_vendor_messages_admin_id ON public.vendor_messages(admin_id);
```

### 3. Populate Admin ID
```sql
UPDATE public.vendor_messages vm SET admin_id = (SELECT au.id FROM public.admin_users au WHERE au.user_id = vm.sender_id AND vm.sender_type = 'admin' LIMIT 1) WHERE vm.sender_type = 'admin' AND vm.admin_id IS NULL;
```

### 4. Create User Type Enum
```sql
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN CREATE TYPE user_type_enum AS ENUM ('admin', 'vendor', 'user'); END IF; END $$;
```

### 5. Create Sender Type Enum
```sql
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_type_enum') THEN CREATE TYPE sender_type_enum AS ENUM ('admin', 'vendor', 'user'); END IF; END $$;
```

### 6. Add User Type Column
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type VARCHAR DEFAULT 'user';
```

### 7. Add Vendor ID Column
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS vendor_id UUID;
```

### 8. Add User Type Constraint
```sql
ALTER TABLE public.users ADD CONSTRAINT valid_user_type CHECK (user_type IN ('admin', 'vendor', 'user'));
```

### 9. Add Sender Type Constraint
```sql
ALTER TABLE public.vendor_messages ADD CONSTRAINT valid_sender_type CHECK (sender_type IN ('admin', 'vendor', 'user'));
```

### 10. Create Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_vendor_id ON public.users(vendor_id) WHERE user_type = 'vendor';
CREATE INDEX IF NOT EXISTS idx_vendor_messages_vendor_id_sender_type ON public.vendor_messages(vendor_id, sender_type);
```

### 11. Update Admins
```sql
UPDATE public.users SET user_type = 'admin' WHERE is_admin = true AND user_type != 'admin';
```

### 12. Update Vendors
```sql
UPDATE public.users u SET user_type = 'vendor', vendor_id = v.id FROM public.vendors v WHERE v.vendor_owner_id = u.id AND u.user_type != 'vendor';
```

### 13. Update Regular Users
```sql
UPDATE public.users SET user_type = 'user' WHERE user_type IS NULL OR user_type = '';
```

### 14. Update Sender Type
```sql
UPDATE public.vendor_messages SET sender_type = 'admin' WHERE sender_type = 'user' AND sender_type != 'admin';
```

### 15. Update RLS Policies
```sql
DROP POLICY IF EXISTS vendor_messages_readable ON public.vendor_messages;
CREATE POLICY vendor_messages_readable ON public.vendor_messages FOR SELECT USING (vendor_id = auth.uid() OR sender_id = auth.uid() OR EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin'));

DROP POLICY IF EXISTS vendor_messages_writable ON public.vendor_messages;
CREATE POLICY vendor_messages_writable ON public.vendor_messages FOR INSERT WITH CHECK ((sender_id = auth.uid() AND sender_type = 'vendor') OR (sender_type = 'admin' AND EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')) OR (sender_type = 'user' AND sender_id = auth.uid()));

DROP POLICY IF EXISTS vendor_messages_updatable ON public.vendor_messages;
CREATE POLICY vendor_messages_updatable ON public.vendor_messages FOR UPDATE USING (vendor_id = auth.uid() OR sender_id = auth.uid() OR EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'admin')) WITH CHECK (is_read IS NOT NULL);
```

---

## 🎯 STEP-BY-STEP EXECUTION

1. **Backup Database** (Supabase → Settings → Backups)
2. **Open Supabase SQL Editor**
3. **Copy** the "FASTEST PATH" section above
4. **Paste** into SQL Editor
5. **Review** for syntax errors
6. **Execute** (Ctrl+Enter or Execute button)
7. **Wait** for completion
8. **Check** for errors in output
9. **Run** verification queries
10. **Confirm** all checks passed
11. **Test** application
12. ✅ **Done!**

---

## ⏱️ TIMING

- **Copy/Paste:** 2 minutes
- **Execution:** 5-10 minutes
- **Verification:** 3-5 minutes
- **Total:** ~15 minutes

---

## 📞 WHAT EACH SECTION DOES

| Section | Purpose | Impact |
|---------|---------|--------|
| Admin UUID | Tracks which admin sent messages | Messages get admin_id column |
| Three-Tier | Clear user categorization | Users get user_type column |
| Data Migration | Populates new columns | Existing data updated |
| RLS Policies | Updates permissions | Security rules refreshed |
| Verification | Confirms success | Check for errors |

---

## 🚨 IF SOMETHING GOES WRONG

1. **Copy** the ROLLBACK section
2. **Paste** into SQL Editor
3. **Execute** to undo changes
4. **Fix** the issue
5. **Try** again

---

**Ready to run? Open Supabase and paste the FASTEST PATH section! 🚀**
