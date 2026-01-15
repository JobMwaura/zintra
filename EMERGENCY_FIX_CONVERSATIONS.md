# 🚨 EMERGENCY FIX: Conversations Table Column Mismatch

## ❌ ERROR:
```
null value in column "participant_1_id" of relation "conversations" 
violates not-null constraint
```

## 🔍 ROOT CAUSE:
Your Supabase `conversations` table has **different column names** than the code expects:

**Code expects:**
- `admin_id`
- `vendor_id`

**Database has:**
- `participant_1_id`
- `participant_2_id`

## ✅ QUICK FIX (Run in Supabase SQL Editor):

```sql
-- Add admin_id column
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS admin_id uuid;

-- Copy data from participant_1_id (if exists)
UPDATE public.conversations 
SET admin_id = participant_1_id
WHERE admin_id IS NULL AND participant_1_id IS NOT NULL;

-- Make it required
ALTER TABLE public.conversations 
ALTER COLUMN admin_id SET NOT NULL;

-- Add vendor_id column
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS vendor_id uuid;

-- Copy data from participant_2_id (if exists)
UPDATE public.conversations 
SET vendor_id = participant_2_id
WHERE vendor_id IS NULL AND participant_2_id IS NOT NULL;

-- Make it required
ALTER TABLE public.conversations 
ALTER COLUMN vendor_id SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id 
ON public.conversations(admin_id);

CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id 
ON public.conversations(vendor_id);
```

## 🎯 AFTER RUNNING THIS:

1. **Refresh the page**
2. **Click "Message" button**
3. **Type test message**
4. **Click "Send Message"**
5. **Should work!** ✅

---

## 📚 MIGRATIONS TO RUN (IN ORDER):

### **1. Fix Column Names** (URGENT - RUN THIS FIRST!)
File: `supabase/sql/FIX_CONVERSATIONS_COLUMNS.sql`

### **2. Fix RLS Policies** (RUN SECOND)
File: `supabase/sql/FIX_CONVERSATIONS_RLS.sql`

### **3. Add Attachments Support** (RUN THIRD - Optional)
File: `supabase/sql/ADD_MESSAGE_ATTACHMENTS.sql`

---

## ⚡ FASTEST FIX:

Copy and run this in **Supabase SQL Editor** right now:

```sql
-- Fix conversations table columns
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS admin_id uuid;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS vendor_id uuid;
UPDATE public.conversations SET admin_id = participant_1_id WHERE admin_id IS NULL;
UPDATE public.conversations SET vendor_id = participant_2_id WHERE vendor_id IS NULL;
ALTER TABLE public.conversations ALTER COLUMN admin_id SET NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN vendor_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON public.conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id ON public.conversations(vendor_id);

-- Fix RLS policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admins_insert_conversations ON public.conversations;
DROP POLICY IF EXISTS admins_select_conversations ON public.conversations;
DROP POLICY IF EXISTS admins_update_conversations ON public.conversations;

CREATE POLICY admins_insert_conversations ON public.conversations
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY admins_select_conversations ON public.conversations
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

CREATE POLICY admins_update_conversations ON public.conversations
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
```

**Then refresh the page and try sending a message!** 🚀

