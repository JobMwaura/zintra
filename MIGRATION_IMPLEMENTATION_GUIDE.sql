-- # THREE USER TYPES IMPLEMENTATION GUIDE
-- ## Step-by-Step Code Updates

-- =====================================================
-- COMPONENT 1: Authentication Context
-- =====================================================
-- FILE: /app/context/AuthContext.js
-- PURPOSE: Update user type detection and storage

-- BEFORE:
/*
const user = {
  id: authUser.id,
  email: authUser.email,
  full_name: profile?.full_name,
  is_admin: profile?.is_admin,
  role: profile?.role
};
*/

-- AFTER:
/*
const user = {
  id: authUser.id,
  email: authUser.email,
  full_name: profile?.full_name,
  user_type: profile?.user_type || 'user',  // NEW: explicit type
  is_admin: profile?.user_type === 'admin', // DEPRECATED: keep for compatibility
  role: profile?.role,
  vendor_id: profile?.vendor_id // NEW: vendor reference if applicable
};
*/

-- =====================================================
-- COMPONENT 2: Vendor Profile Notification Fix
-- =====================================================
-- FILE: /app/vendor-profile/[id]/page.js
-- PURPOSE: Fix notification fetch query

-- BEFORE:
/*
const fetchUnreadMessages = async () => {
  if (!authUser?.id) return;
  try {
    const { data, error } = await supabase
      .from('vendor_messages')
      .select('id')
      .eq('user_id', authUser.id)        // ❌ WRONG: Checking admin ID
      .eq('is_read', false);
*/

-- AFTER:
/*
const fetchUnreadMessages = async () => {
  if (!authUser?.id) return;
  try {
    const { data, error } = await supabase
      .from('vendor_messages')
      .select('id')
      .eq('vendor_id', authUser.id)      // ✅ CORRECT: Check vendor ID
      .eq('sender_type', 'admin')        // ✅ FILTER: Only admin messages
      .eq('is_read', false);
*/

-- =====================================================
-- COMPONENT 3: Vendor Inbox Modal
-- =====================================================
-- FILE: /components/VendorInboxModal.js
-- PURPOSE: Update message filtering and display

-- BEFORE:
/*
const unreadConversations = Object.entries(groupedMessages)
  .filter(([senderId, messages]) =>
    messages.some(m => !m.is_read && m.sender_type === 'user')  // ❌ 'user' = admin
  )
*/

-- AFTER:
/*
const unreadConversations = Object.entries(groupedMessages)
  .filter(([senderId, messages]) =>
    messages.some(m => !m.is_read && m.sender_type === 'admin')  // ✅ 'admin' type
  )
*/

-- =====================================================
-- COMPONENT 4: Admin Panel Message Sending
-- =====================================================
-- FILE: /app/admin-panel/messages/page.js
-- PURPOSE: Update sender_type when creating messages

-- BEFORE:
/*
const response = await fetch('/api/vendor-messages/send', {
  method: 'POST',
  body: JSON.stringify({
    vendor_id: selectedVendor,
    sender_id: authUser.id,
    sender_type: 'user',  // ❌ WRONG: Should be 'admin'
    message_text: messageContent
  })
});
*/

-- AFTER:
/*
const response = await fetch('/api/vendor-messages/send', {
  method: 'POST',
  body: JSON.stringify({
    vendor_id: selectedVendor,
    sender_id: authUser.id,
    sender_type: 'admin',  // ✅ CORRECT: Admin is sending
    message_text: messageContent
  })
});
*/

-- =====================================================
-- COMPONENT 5: API Endpoints
-- =====================================================
-- FILE: /pages/api/vendor-messages/send.js
-- PURPOSE: Validate sender_type based on user_type

-- BEFORE:
/*
const { vendor_id, sender_id, message_text } = req.body;
// No sender_type validation
const { data, error } = await supabase
  .from('vendor_messages')
  .insert([{
    vendor_id,
    sender_id,
    message_text,
    sender_type: 'user'  // ❌ Hardcoded, always 'user'
  }]);
*/

-- AFTER:
/*
const { vendor_id, sender_id, message_text } = req.body;

// Get user type from database
const { data: userData } = await supabase
  .from('users')
  .select('user_type')
  .eq('id', sender_id)
  .single();

// Validate sender_type matches user_type
const validSenderType = userData?.user_type || 'user';

const { data, error } = await supabase
  .from('vendor_messages')
  .insert([{
    vendor_id,
    sender_id,
    message_text,
    sender_type: validSenderType  // ✅ Uses actual user_type
  }]);
*/

-- =====================================================
-- COMPONENT 6: Admin Message Display
-- =====================================================
-- FILE: /components/VendorInboxModal.js (Admin Name Display)
-- PURPOSE: Update to handle new user_type

-- BEFORE:
/*
// Fetch admin/sender info
const adminName = 
  messages[0]?.admin_name || 
  senderInfo?.full_name ||
  'Unknown Admin';
*/

-- AFTER:
/*
// Fetch sender info (now works for admin, vendor, or user)
const senderInfo = await supabase
  .from('users')
  .select('full_name, user_type, role')
  .eq('id', senderId)
  .single();

const senderName = 
  senderInfo?.full_name ||
  `${senderInfo?.user_type || 'user'} User` ||
  'Unknown Sender';

const senderType = senderInfo?.user_type || 'user';
*/

-- =====================================================
-- COMPONENT 7: Dashboard/Analytics
-- =====================================================
-- FILE: /app/admin-panel/dashboard/page.js
-- PURPOSE: Filter users by new user_type system

-- BEFORE:
/*
// Count admins
const { count: adminCount } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('is_admin', true);

// Count vendors  
const { count: vendorCount } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('role', 'vendor');
*/

-- AFTER:
/*
// Count by user_type (cleaner!)
const { count: adminCount } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('user_type', 'admin');

const { count: vendorCount } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('user_type', 'vendor');

const { count: userCount } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('user_type', 'user');
*/

-- =====================================================
-- COMPONENT 8: Type Safety Utilities (NEW)
-- =====================================================
-- FILE: /lib/userTypes.js
-- PURPOSE: Central place for user type constants and helpers

/*
// User type constants
export const USER_TYPES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  USER: 'user'
};

// Sender type constants (same as user_type)
export const SENDER_TYPES = USER_TYPES;

// Helper functions
export function isAdmin(user) {
  return user?.user_type === USER_TYPES.ADMIN;
}

export function isVendor(user) {
  return user?.user_type === USER_TYPES.VENDOR;
}

export function isRegularUser(user) {
  return user?.user_type === USER_TYPES.USER;
}

export function getSenderTypeDisplay(senderType) {
  const display = {
    admin: '🔐 Admin',
    vendor: '🏢 Vendor',
    user: '👤 User'
  };
  return display[senderType] || senderType;
}
*/

-- =====================================================
-- COMPONENT 9: Validation Helper
-- =====================================================
-- FILE: /lib/userTypes.js (continued)
-- PURPOSE: Validate user can perform action

/*
export function canSendMessage(userType) {
  // Both admins and vendors can send messages
  return [USER_TYPES.ADMIN, USER_TYPES.VENDOR].includes(userType);
}

export function canReceiveMessage(userType) {
  // Everyone can receive messages
  return true;
}

export function canArchiveMessage(user, message) {
  // User can archive their own messages
  return user?.id === message?.vendor_id || user?.id === message?.sender_id;
}
*/

-- =====================================================
-- IMPLEMENTATION CHECKLIST
-- =====================================================

-- PHASE 1: DATABASE (30 minutes)
-- ✅ Run migration script (MIGRATION_THREE_USER_TYPES.sql)
--   - Create enum types
--   - Add columns to users table
--   - Update vendor_messages table
--   - Create indexes
--   - Update RLS policies

-- PHASE 2: CODE UPDATES (2-3 hours)
-- ✅ Update AuthContext.js
--   - Add user_type detection
--   - Keep is_admin for compatibility
--   - Add vendor_id reference

-- ✅ Fix vendor notification bug (CRITICAL)
--   - File: app/vendor-profile/[id]/page.js
--   - Change: user_id → vendor_id
--   - Add filter: sender_type = 'admin'

-- ✅ Update VendorInboxModal.js
--   - Change filter from 'user' to 'admin'
--   - Update unread conversation detection
--   - Update display logic

-- ✅ Update all API endpoints
--   - /pages/api/vendor-messages/send.js
--   - /pages/api/vendor-messages/upload-file.js
--   - Query user_type from database
--   - Use actual type instead of hardcoded

-- ✅ Update AdminPanel messaging
--   - Set sender_type from user_type
--   - Add validation

-- ✅ Create utility file (userTypes.js)
--   - Constants and helpers
--   - Type checking functions
--   - Display helpers

-- PHASE 3: TESTING (4-6 hours)
-- ✅ Test admin sending message
--   - Verify sender_type = 'admin'
--   - Verify vendor receives notification

-- ✅ Test vendor notification
--   - Badge shows correct count
--   - Modal displays messages
--   - Real-time updates work

-- ✅ Test vendor sending message
--   - Verify sender_type = 'vendor'
--   - Verify admin receives message

-- ✅ Test RLS policies
--   - Admin can read all messages
--   - Vendor can only read own messages
--   - Can't read other vendor's messages

-- PHASE 4: DEPLOYMENT (1 hour)
-- ✅ Run migration on production database
-- ✅ Deploy code changes to Vercel
-- ✅ Monitor for errors
-- ✅ Verify notifications working

-- PHASE 5: CLEANUP (30 minutes)
-- ✅ Remove deprecated is_admin checks (future)
-- ✅ Update documentation
-- ✅ Archive old code references

-- =====================================================
-- ESTIMATED TIMELINE
-- =====================================================
-- Database migration: 30 minutes
-- Code updates: 2-3 hours  
-- Testing: 4-6 hours
-- Deployment: 1 hour
-- Cleanup: 30 minutes
-- ─────────────────────
-- TOTAL: 8-11 hours (1 business day)

-- =====================================================
-- RISK MITIGATION
-- =====================================================
-- 1. BACKUP: Take database backup before migration
-- 2. TEST: Run all changes on staging first
-- 3. MONITOR: Watch error logs after deployment
-- 4. ROLLBACK: Keep rollback script ready
-- 5. COMMUNICATION: Notify team before deployment
