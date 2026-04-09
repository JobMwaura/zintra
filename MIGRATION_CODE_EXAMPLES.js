// =====================================================
// THREE USER TYPES IMPLEMENTATION - CODE EXAMPLES
// =====================================================

// =====================================================
// FILE 1: /lib/userTypes.js (NEW FILE - Create this)
// =====================================================

/**
 * User and Sender Type Constants & Utilities
 * Centralized place for type definitions and helpers
 */

export const USER_TYPES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  USER: 'user'
};

export const SENDER_TYPES = USER_TYPES;

export const USER_TYPE_LABELS = {
  admin: 'Administrator',
  vendor: 'Vendor/Supplier',
  user: 'Buyer/User'
};

export const SENDER_TYPE_LABELS = {
  admin: '🔐 Admin',
  vendor: '🏢 Vendor',
  user: '👤 User'
};

/**
 * Check if user is an admin
 * @param {Object} user - User object from auth context
 * @returns {boolean}
 */
export function isAdmin(user) {
  return user?.user_type === USER_TYPES.ADMIN;
}

/**
 * Check if user is a vendor
 * @param {Object} user - User object from auth context
 * @returns {boolean}
 */
export function isVendor(user) {
  return user?.user_type === USER_TYPES.VENDOR;
}

/**
 * Check if user is a regular user
 * @param {Object} user - User object from auth context
 * @returns {boolean}
 */
export function isRegularUser(user) {
  return user?.user_type === USER_TYPES.USER;
}

/**
 * Get display label for sender type
 * @param {string} senderType - The sender type ('admin', 'vendor', 'user')
 * @returns {string} - Display label with emoji
 */
export function getSenderTypeLabel(senderType) {
  return SENDER_TYPE_LABELS[senderType] || senderType;
}

/**
 * Validate if user can send messages
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function canSendMessage(user) {
  return [USER_TYPES.ADMIN, USER_TYPES.VENDOR].includes(user?.user_type);
}

/**
 * Validate if user can receive messages
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function canReceiveMessage(user) {
  // Everyone can receive messages
  return !!user?.id;
}

/**
 * Validate if user can archive a specific message
 * @param {Object} user - Current user object
 * @param {Object} message - Message object
 * @returns {boolean}
 */
export function canArchiveMessage(user, message) {
  if (!user || !message) return false;
  return (
    user.id === message.vendor_id || 
    user.id === message.sender_id ||
    isAdmin(user) // Admins can always archive
  );
}

/**
 * Validate if user can delete a specific message
 * @param {Object} user - Current user object
 * @param {Object} message - Message object
 * @returns {boolean}
 */
export function canDeleteMessage(user, message) {
  if (!user || !message) return false;
  return (
    user.id === message.sender_id ||
    isAdmin(user) // Admins can always delete
  );
}

/**
 * Get the appropriate sender_type for a user when sending a message
 * @param {Object} user - User object from auth context
 * @returns {string} - Appropriate sender_type value
 */
export function getUserSenderType(user) {
  // Map user_type to sender_type (they're the same)
  return user?.user_type || USER_TYPES.USER;
}


// =====================================================
// FILE 2: /app/context/AuthContext.js (UPDATED)
// =====================================================

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && profile) {
            // ✅ NEW: Include user_type from database
            setAuthUser({
              id: session.user.id,
              email: session.user.email,
              full_name: profile.full_name,
              user_type: profile.user_type || 'user', // NEW: explicit type
              vendor_id: profile.vendor_id, // NEW: vendor reference
              role: profile.role,
              is_admin: profile.user_type === 'admin', // DEPRECATED: for compatibility
            });
          }
        } else {
          setAuthUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ authUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};


// =====================================================
// FILE 3: VENDOR NOTIFICATION FIX - vendor-profile/[id]/page.js
// =====================================================

// SEARCH FOR THIS SECTION (around line 114-135):

// ❌ BEFORE:
/*
const fetchUnreadMessages = async () => {
  if (!authUser?.id) return;

  try {
    const { data, error } = await supabase
      .from('vendor_messages')
      .select('id')
      .eq('user_id', authUser.id)           // ❌ WRONG: Checking admin ID
      .eq('is_read', false);                // Vendor won't have admin IDs in user_id field

    if (error) throw error;

    setUnreadMessageCount(data?.length || 0);
  } catch (err) {
    console.error('Error fetching unread messages:', err);
  }
};
*/

// ✅ AFTER:
/*
const fetchUnreadMessages = async () => {
  if (!authUser?.id) return;

  try {
    const { data, error } = await supabase
      .from('vendor_messages')
      .select('id')
      .eq('vendor_id', authUser.id)         // ✅ CORRECT: Check vendor ID
      .eq('sender_type', 'admin')           // ✅ FILTER: Only admin messages
      .eq('is_read', false);                // ✅ Only unread messages

    if (error) throw error;

    setUnreadMessageCount(data?.length || 0);
  } catch (err) {
    console.error('Error fetching unread messages:', err);
  }
};
*/


// =====================================================
// FILE 4: /components/VendorInboxModal.js (UPDATED FILTERS)
// =====================================================

// SEARCH FOR THIS SECTION (around line 250-280):

// ❌ BEFORE:
/*
const unreadConversations = Object.entries(groupedMessages)
  .filter(([senderId, messages]) =>
    messages.some(m => !m.is_read && m.sender_type === 'user')  // ❌ 'user' = admin (confusing!)
  )
  .reduce((acc, [senderId, messages]) => ({
    ...acc,
    [senderId]: messages
  }), {});
*/

// ✅ AFTER:
/*
const unreadConversations = Object.entries(groupedMessages)
  .filter(([senderId, messages]) =>
    messages.some(m => !m.is_read && m.sender_type === 'admin')  // ✅ 'admin' type (clear!)
  )
  .reduce((acc, [senderId, messages]) => ({
    ...acc,
    [senderId]: messages
  }), {});
*/

// ALSO UPDATE (around line 180-200):

// ❌ BEFORE:
/*
const filteredMessages = messages.filter(m => {
  switch (filterType) {
    case 'unread':
      return !m.is_read && m.sender_type === 'user';  // ❌ 'user' = admin
    case 'read':
      return m.is_read && m.sender_type === 'user';
    case 'archived':
      return m.archived === true;
    default:
      return m.sender_type === 'user';  // Show all admin messages
  }
});
*/

// ✅ AFTER:
/*
const filteredMessages = messages.filter(m => {
  switch (filterType) {
    case 'unread':
      return !m.is_read && m.sender_type === 'admin';  // ✅ 'admin' type
    case 'read':
      return m.is_read && m.sender_type === 'admin';
    case 'archived':
      return m.archived === true;
    default:
      return m.sender_type === 'admin';  // Show all admin messages
  }
});
*/


// =====================================================
// FILE 5: /pages/api/vendor-messages/send.js (UPDATED)
// =====================================================

// REPLACE THE ENTIRE MESSAGE INSERT SECTION:

// ❌ BEFORE:
/*
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  const { vendor_id, message_text, file_attachment_url } = req.body;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError) throw authError;

    // ❌ HARDCODED SENDER TYPE
    const { data, error } = await supabase
      .from('vendor_messages')
      .insert([{
        vendor_id,
        sender_id: user.id,
        sender_type: 'user',  // ❌ WRONG: Always 'user' (means admin)
        message_text,
        file_attachment_url,
        is_read: false
      }]);

    if (error) throw error;
    return res.status(200).json({ data });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
*/

// ✅ AFTER:
/*
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  const { vendor_id, message_text, file_attachment_url } = req.body;

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError) throw authError;

    // ✅ NEW: Get user type from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    // ✅ Use actual user_type as sender_type
    const senderType = userData?.user_type || 'user';

    // Validate: only admins and vendors can send messages
    if (!['admin', 'vendor'].includes(senderType)) {
      return res.status(403).json({ 
        error: 'User type does not have permission to send messages' 
      });
    }

    const { data, error } = await supabase
      .from('vendor_messages')
      .insert([{
        vendor_id,
        sender_id: user.id,
        sender_type: senderType,  // ✅ CORRECT: Actual user type
        message_text,
        file_attachment_url,
        is_read: false
      }]);

    if (error) throw error;
    return res.status(200).json({ data });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
*/


// =====================================================
// FILE 6: /pages/api/vendor-messages/upload-file.js (UPDATED)
// =====================================================

// ✅ UPDATE TO USE userTypes HELPER:
/*
import { getUserSenderType } from '@/lib/userTypes';

export default async function handler(req, res) {
  // ... existing code ...

  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    
    // ✅ Get user type for metadata tracking
    const { data: userData } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    const senderType = getUserSenderType(userData);

    // Generate presigned URL with metadata
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: sanitizeFilename(file.name),
      Expires: 3600,
      Metadata: {
        'user-id': user.id,
        'sender-type': senderType,  // ✅ Track sender type
        'vendor-id': vendor_id,
        'timestamp': new Date().toISOString()
      }
    };

    // ... rest of code ...
  }
}
*/


// =====================================================
// FILE 7: ADMIN PANEL MESSAGE SENDING
// =====================================================

// FILE: /app/admin-panel/messages/page.js

// ❌ BEFORE (around line 150-170):
/*
const handleSendMessage = async (e) => {
  e.preventDefault();
  
  const response = await fetch('/api/vendor-messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.user.user_metadata.sub}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      vendor_id: selectedVendor,
      message_text: messageContent
      // ❌ MISSING: sender_type and sender_id not explicitly set
    })
  });
};
*/

// ✅ AFTER (with explicit sender info):
/*
import { useAuth } from '@/app/context/AuthContext';
import { getUserSenderType } from '@/lib/userTypes';

export default function AdminMessages() {
  const { authUser } = useAuth();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // ✅ NEW: Get sender type from auth context
    const senderType = getUserSenderType(authUser);

    const response = await fetch('/api/vendor-messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authUser?.id}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vendor_id: selectedVendor,
        message_text: messageContent
        // ✅ API will look up sender_type from database
      })
    });

    // ... handle response ...
  };
}
*/


// =====================================================
// MIGRATION HELPER FUNCTION
// =====================================================

/**
 * Utility to safely check sender type with backward compatibility
 * Use this while transitioning to new system
 * @param {Object} message - Message object
 * @returns {string} - Normalized sender type
 */
export function normalizeSenderType(message) {
  const senderType = message?.sender_type;
  
  // Handle old 'user' type (was actually admin)
  if (senderType === 'user') {
    return 'admin'; // Map old 'user' to 'admin'
  }
  
  return senderType || 'user';
}

/**
 * Check if message is from admin (handle both old and new format)
 * Use during migration period
 * @param {Object} message - Message object
 * @returns {boolean}
 */
export function isAdminMessage(message) {
  const normalizedType = normalizeSenderType(message);
  return normalizedType === 'admin';
}


// =====================================================
// TESTING CHECKLIST
// =====================================================

/*
[ ] Test admin sending message
    - Verify sender_type stored as 'admin'
    - Verify vendor receives notification
    - Verify message appears in vendor inbox

[ ] Test vendor sending message (if enabled)
    - Verify sender_type stored as 'vendor'
    - Verify admin receives message
    - Verify message appears in admin message center

[ ] Test notification badge
    - Vendor opens profile
    - Badge shows unread count
    - After message is read, badge updates

[ ] Test modal display
    - Click inbox button
    - Modal opens with threads
    - Can see admin messages
    - Can reply to messages

[ ] Test file uploads
    - Select file in modal
    - Upload to AWS S3
    - File appears in message
    - Can download file

[ ] Test RLS policies
    - Admin can read all vendor messages
    - Vendor can only read own messages
    - Can't read other vendor's messages

[ ] Test real-time updates
    - Send message from admin
    - Vendor receives notification in real-time
    - Modal updates in real-time
*/


// =====================================================
// ROLLBACK CHECKLIST
// =====================================================

/*
If migration fails or causes issues:

1. Revert database migration (run rollback SQL)
   - Restores old sender_type values ('user' instead of 'admin')
   - Removes new columns (user_type, vendor_id)
   - Restores old indexes and RLS policies

2. Revert code changes (git checkout previous commit)
   - Remove userTypes.js helpers
   - Revert AuthContext.js changes
   - Revert notification fix
   - Revert VendorInboxModal filters
   - Revert API endpoint changes

3. Test thoroughly before re-attempting migration
   - Run tests on staging
   - Check database constraints
   - Verify RLS policies
   - Monitor error logs
*/
