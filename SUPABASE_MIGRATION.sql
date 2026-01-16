-- ============================================================================
-- COMPLETE SQL MIGRATION PACKAGE
-- Admin UUID Auto-Generation + Three-Tier User System
-- Date: January 16, 2026
-- ============================================================================

-- ============================================================================
-- PHASE 1: ADMIN UUID IMPLEMENTATION
-- ============================================================================

-- Add admin_id column to vendor_messages
ALTER TABLE public.vendor_messages 
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL;

-- Create index on admin_id for performance
CREATE INDEX IF NOT EXISTS idx_vendor_messages_admin_id ON public.vendor_messages(admin_id);

-- Populate existing admin messages with admin_id
UPDATE public.vendor_messages vm
SET admin_id = (
  SELECT au.id 
  FROM public.admin_users au 
  WHERE au.user_id = vm.sender_id 
  AND vm.sender_type = 'admin'
  LIMIT 1
)
WHERE vm.sender_type = 'admin' 
AND vm.admin_id IS NULL;


-- ============================================================================
-- PHASE 2: THREE-TIER USER SYSTEM
-- ============================================================================

-- Create user_type enum for clear user categorization
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
    CREATE TYPE user_type_enum AS ENUM ('admin', 'vendor', 'user');
  END IF;
END $$;

-- Create sender_type enum for messages
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sender_type_enum') THEN
    CREATE TYPE sender_type_enum AS ENUM ('admin', 'vendor', 'user');
  END IF;
END $$;

-- Add user_type column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_type VARCHAR DEFAULT 'user';

-- Add vendor_id column to users table for vendor references
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS vendor_id UUID;

-- Add constraint to ensure valid user types
ALTER TABLE public.users 
ADD CONSTRAINT valid_user_type 
CHECK (user_type IN ('admin', 'vendor', 'user'));

-- Create indexes for user_type lookups (before adding constraints)
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_vendor_id ON public.users(vendor_id) 
WHERE user_type = 'vendor';

-- Create composite index for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_messages_vendor_id_sender_type 
ON public.vendor_messages(vendor_id, sender_type);


-- ============================================================================
-- PHASE 3: DATA MIGRATION (Must run BEFORE adding constraints)
-- ============================================================================

-- Drop the old constraint first (safely remove it)
ALTER TABLE public.vendor_messages 
DROP CONSTRAINT IF EXISTS vendor_messages_sender_type_check;

-- Now we can clean up the data without constraint violations
UPDATE public.vendor_messages 
SET sender_type = 'user' 
WHERE sender_type NOT IN ('admin', 'vendor', 'user');

-- Update sender_type from 'user' to 'admin' in vendor_messages (after cleanup)
UPDATE public.vendor_messages 
SET sender_type = 'admin' 
WHERE sender_type = 'user';

-- Populate user_type for admins (from admin_users table)
UPDATE public.users u
SET user_type = 'admin' 
WHERE EXISTS (
  SELECT 1 FROM public.admin_users au 
  WHERE au.user_id = u.id
)
AND u.user_type != 'admin';

-- Populate user_type for vendors (users who own vendors)
UPDATE public.users u
SET user_type = 'vendor',
    vendor_id = v.id
FROM public.vendors v 
WHERE v.user_id = u.id
AND u.user_type != 'vendor';

-- Populate user_type for regular users (default to 'user')
UPDATE public.users 
SET user_type = 'user' 
WHERE user_type IS NULL OR user_type = '';

-- ============================================================================
-- PHASE 3B: ADD CONSTRAINTS (After data is clean)
-- ============================================================================

-- Verify all sender_type values are now valid
SELECT COUNT(*) as invalid_sender_type_count
FROM public.vendor_messages 
WHERE sender_type NOT IN ('admin', 'vendor', 'user');

-- Add the new sender_type constraint
ALTER TABLE public.vendor_messages 
ADD CONSTRAINT valid_sender_type 
CHECK (sender_type IN ('admin', 'vendor', 'user'));


-- ============================================================================
-- PHASE 4: UPDATE RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS vendor_messages_readable ON public.vendor_messages;
DROP POLICY IF EXISTS vendor_messages_writable ON public.vendor_messages;
DROP POLICY IF EXISTS vendor_messages_updatable ON public.vendor_messages;

-- Create new message reading policy
CREATE POLICY vendor_messages_readable ON public.vendor_messages
FOR SELECT
USING (
  vendor_id = auth.uid() OR
  sender_id = auth.uid() OR
  EXISTS(
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Create new message writing policy with user_type validation
CREATE POLICY vendor_messages_writable ON public.vendor_messages
FOR INSERT
WITH CHECK (
  (sender_id = auth.uid() AND sender_type = 'vendor') OR
  (sender_type = 'admin' AND EXISTS(
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )) OR
  (sender_type = 'user' AND sender_id = auth.uid())
);

-- Create new message update policy
CREATE POLICY vendor_messages_updatable ON public.vendor_messages
FOR UPDATE
USING (
  vendor_id = auth.uid() OR
  sender_id = auth.uid() OR
  EXISTS(
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
)
WITH CHECK (
  is_read IS NOT NULL
);


-- ============================================================================
-- PHASE 5: VERIFICATION QUERIES
-- ============================================================================

-- Verify admin_id column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vendor_messages' AND column_name = 'admin_id';

-- Count messages by sender_type
SELECT 
  sender_type,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN admin_id IS NOT NULL THEN 1 END) as with_admin_id
FROM public.vendor_messages
GROUP BY sender_type;

-- Count users by user_type
SELECT 
  user_type,
  COUNT(*) as total_users
FROM public.users
GROUP BY user_type
ORDER BY user_type;

-- Check for any invalid user_type values
SELECT DISTINCT user_type, COUNT(*) as count
FROM public.users
WHERE user_type NOT IN ('admin', 'vendor', 'user')
GROUP BY user_type;

-- Check for any invalid sender_type values
SELECT DISTINCT sender_type, COUNT(*) as count
FROM public.vendor_messages
WHERE sender_type NOT IN ('admin', 'vendor', 'user')
GROUP BY sender_type;

-- Verify admin_id references are valid
SELECT COUNT(*) as invalid_references
FROM public.vendor_messages vm
WHERE vm.admin_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.admin_users au WHERE au.id = vm.admin_id
);

-- Sample of messages with admin references
SELECT 
  vm.id,
  vm.sender_id,
  vm.admin_id,
  au.email as admin_email,
  vm.sender_type,
  vm.created_at
FROM public.vendor_messages vm
LEFT JOIN public.admin_users au ON vm.admin_id = au.id
WHERE vm.sender_type = 'admin'
ORDER BY vm.created_at DESC
LIMIT 10;

-- Check constraints exist
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints
WHERE table_name IN ('users', 'vendor_messages')
AND constraint_name LIKE '%valid%';

-- Check all indexes were created
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('users', 'vendor_messages')
ORDER BY indexname;
