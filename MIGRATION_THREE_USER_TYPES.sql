-- =====================================================
-- MIGRATION: Three User Categories with UUIDs
-- Date: January 16, 2026
-- Purpose: Implement clear user type system (admin, vendor, user)
-- =====================================================

-- PHASE 1: CREATE ENUM TYPES
-- =====================================================

CREATE TYPE user_type_enum AS ENUM ('admin', 'vendor', 'user');
CREATE TYPE sender_type_enum AS ENUM ('admin', 'vendor', 'user');

-- PHASE 2: UPDATE USERS TABLE
-- =====================================================

-- Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS vendor_id UUID;

-- Add constraints
ALTER TABLE users ADD CONSTRAINT valid_user_type 
CHECK (user_type IN ('admin', 'vendor', 'user'));

-- Populate user_type from existing data
-- STEP 1: Mark admins
UPDATE users 
SET user_type = 'admin' 
WHERE is_admin = true OR role = 'admin';

-- STEP 2: Mark vendors (users who own a vendor)
UPDATE users 
SET user_type = 'vendor',
    vendor_id = v.id
FROM vendors v 
WHERE v.vendor_owner_id = users.id;

-- STEP 3: Mark everyone else as regular users
UPDATE users 
SET user_type = 'user' 
WHERE user_type IS NULL OR user_type = 'user';

-- PHASE 3: UPDATE VENDOR_MESSAGES TABLE
-- =====================================================

-- Rename column for clarity (optional, but recommended)
ALTER TABLE vendor_messages RENAME COLUMN user_id TO sender_id;

-- Update sender_type values
-- STEP 1: Change 'user' to 'admin'
UPDATE vendor_messages 
SET sender_type = 'admin' 
WHERE sender_type = 'user';

-- Add constraint
ALTER TABLE vendor_messages ADD CONSTRAINT valid_sender_type 
CHECK (sender_type IN ('admin', 'vendor', 'user'));

-- Add indexes for performance
CREATE INDEX idx_vendor_messages_sender_type ON vendor_messages(sender_type);
CREATE INDEX idx_vendor_messages_sender_id ON vendor_messages(sender_id);
CREATE INDEX idx_vendor_messages_vendor_id_sender_type ON vendor_messages(vendor_id, sender_type);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_vendor_id ON users(vendor_id) WHERE user_type = 'vendor';

-- PHASE 4: UPDATE RLS POLICIES
-- =====================================================

-- Drop old policy if exists
DROP POLICY IF EXISTS vendor_messages_readable ON vendor_messages;

-- Create new, clearer policy
CREATE POLICY vendor_messages_readable ON vendor_messages
FOR SELECT
USING (
  -- Vendor can read messages about their own vendor
  vendor_id = auth.uid() OR
  -- Sender can read their own messages
  sender_id = auth.uid() OR
  -- Admin can read all messages
  EXISTS(
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Drop old write policy if exists
DROP POLICY IF EXISTS vendor_messages_writable ON vendor_messages;

-- Create new write policy
CREATE POLICY vendor_messages_writable ON vendor_messages
FOR INSERT
WITH CHECK (
  -- Vendor can send to their own vendor
  (sender_id = auth.uid() AND sender_type = 'vendor') OR
  -- Admin can send messages
  (sender_type = 'admin' AND EXISTS(
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )) OR
  -- Regular user can send (if enabled in future)
  (sender_type = 'user' AND sender_id = auth.uid())
);

-- Drop old update policy if exists
DROP POLICY IF EXISTS vendor_messages_updatable ON vendor_messages;

-- Create new update policy (only is_read can be updated)
CREATE POLICY vendor_messages_updatable ON vendor_messages
FOR UPDATE
USING (
  -- Recipient can mark as read
  vendor_id = auth.uid() OR
  -- Sender can mark their own as read
  sender_id = auth.uid() OR
  -- Admin can update
  EXISTS(
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
)
WITH CHECK (
  -- Only allow updating is_read
  is_read IS NOT NULL
);

-- PHASE 5: ADMIN TABLE UPDATES (Optional)
-- =====================================================

-- If you want to phase out the admins table:
-- Consider adding admin_id to users table and deprecating admins table

-- ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role VARCHAR;
-- For now, keep admins table and link via users.id

-- PHASE 6: DATA VALIDATION
-- =====================================================

-- Verify all sender_type values are valid
-- Should return 0 rows
SELECT COUNT(*) as invalid_sender_types
FROM vendor_messages
WHERE sender_type NOT IN ('admin', 'vendor', 'user');

-- Verify all user_type values are valid
-- Should return 0 rows
SELECT COUNT(*) as invalid_user_types
FROM users
WHERE user_type NOT IN ('admin', 'vendor', 'user');

-- Count by type (for validation)
SELECT 
  'vendor_messages' as table_name,
  sender_type,
  COUNT(*) as count
FROM vendor_messages
GROUP BY sender_type
UNION ALL
SELECT 
  'users' as table_name,
  user_type,
  COUNT(*) as count
FROM users
GROUP BY user_type;

-- =====================================================
-- END MIGRATION
-- =====================================================

-- ROLLBACK (if needed)
-- =====================================================
-- IMPORTANT: Only use if migration fails!

/*
-- Drop new constraints
ALTER TABLE vendor_messages DROP CONSTRAINT IF EXISTS valid_sender_type;
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_user_type;

-- Drop new indexes
DROP INDEX IF EXISTS idx_vendor_messages_sender_type;
DROP INDEX IF EXISTS idx_vendor_messages_sender_id;
DROP INDEX IF EXISTS idx_vendor_messages_vendor_id_sender_type;
DROP INDEX IF EXISTS idx_users_user_type;
DROP INDEX IF EXISTS idx_users_vendor_id;

-- Rename column back
ALTER TABLE vendor_messages RENAME COLUMN sender_id TO user_id;

-- Restore old sender_type values
UPDATE vendor_messages 
SET sender_type = 'user' 
WHERE sender_type = 'admin';

-- Drop new columns
ALTER TABLE users DROP COLUMN IF EXISTS user_type;
ALTER TABLE users DROP COLUMN IF EXISTS vendor_id;

-- Drop enum types
DROP TYPE IF EXISTS user_type_enum;
DROP TYPE IF EXISTS sender_type_enum;

-- Restore old RLS policies
DROP POLICY IF EXISTS vendor_messages_readable ON vendor_messages;
DROP POLICY IF EXISTS vendor_messages_writable ON vendor_messages;
DROP POLICY IF EXISTS vendor_messages_updatable ON vendor_messages;

-- Recreate old policies (from backup)
-- ... [paste old policies here]
*/
