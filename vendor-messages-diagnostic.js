// ============================================================================
// VENDOR MESSAGES - BROWSER CONSOLE DIAGNOSTIC SCRIPT
// ============================================================================
//
// Usage:
// 1. Go to /vendor-messages in your app
// 2. Open DevTools (F12)
// 3. Go to Console tab
// 4. Copy-paste this entire script
// 5. Press Enter
// 6. Check the output
//
// ============================================================================

console.group('🔍 VENDOR MESSAGES DIAGNOSTIC');
console.log('Time:', new Date().toISOString());

// Get current auth state
const { data: { user } } = await supabase.auth.getUser();
console.group('👤 Current User');
console.log('ID:', user?.id);
console.log('Email:', user?.email);
console.groupEnd();

// Check vendor profile
const { data: vendor, error: vendorError } = await supabase
  .from('vendors')
  .select('id, user_id, company_name')
  .eq('user_id', user.id)
  .maybeSingle();

console.group('🏢 Vendor Profile');
if (vendorError) {
  console.error('Error:', vendorError.message);
} else if (vendor) {
  console.log('ID:', vendor.id);
  console.log('Name:', vendor.company_name);
  console.log('Linked to user:', vendor.user_id === user.id ? '✅ Yes' : '❌ No');
} else {
  console.warn('⚠️ No vendor profile found');
}
console.groupEnd();

// Check vendor messages
const { data: allMessages, error: messagesError } = await supabase
  .from('vendor_messages')
  .select('*')
  .eq('vendor_id', vendor?.id || 'null')
  .order('created_at', { ascending: false })
  .limit(20);

console.group('💬 Messages');
console.log('Total messages:', allMessages?.length || 0);
if (messagesError) {
  console.error('Error:', messagesError.message);
} else if (allMessages && allMessages.length > 0) {
  console.log('Recent messages:');
  allMessages.slice(0, 5).forEach(msg => {
    console.log(`- [${msg.sender_type}] ${msg.message_text.substring(0, 50)}...`);
  });
  
  // Analyze conversations
  const conversations = {};
  allMessages.forEach(msg => {
    if (!conversations[msg.user_id]) {
      conversations[msg.user_id] = { count: 0, unread: 0, latest: null };
    }
    conversations[msg.user_id].count++;
    if (!msg.is_read && msg.sender_type === 'user') {
      conversations[msg.user_id].unread++;
    }
    if (!conversations[msg.user_id].latest) {
      conversations[msg.user_id].latest = msg.created_at;
    }
  });
  
  console.log('Conversations by user:', Object.keys(conversations).length);
  Object.entries(conversations).forEach(([userId, conv]) => {
    console.log(`  - User ${userId.substring(0, 8)}...: ${conv.count} messages, ${conv.unread} unread`);
  });
} else {
  console.warn('⚠️ No messages found');
}
console.groupEnd();

// Check notifications
const { data: notifications, error: notifError } = await supabase
  .from('notifications')
  .select('*')
  .eq('type', 'message')
  .order('created_at', { ascending: false })
  .limit(10);

console.group('🔔 Notifications');
console.log('Total message notifications:', notifications?.length || 0);
if (notifError) {
  console.error('Error:', notifError.message);
} else if (notifications && notifications.length > 0) {
  notifications.slice(0, 3).forEach(notif => {
    console.log(`- ${notif.title}: ${notif.body?.substring(0, 40)}...`);
  });
} else {
  console.log('No notifications (might be okay if no messages yet)');
}
console.groupEnd();

// Summary
console.group('📊 Summary');
const status = {
  'User logged in': user ? '✅' : '❌',
  'Vendor profile exists': vendor ? '✅' : '❌',
  'Messages in database': (allMessages?.length || 0) > 0 ? '✅' : '⚠️',
  'Notifications created': (notifications?.length || 0) > 0 ? '✅' : '⚠️',
};
Object.entries(status).forEach(([key, value]) => {
  console.log(`${value} ${key}`);
});
console.groupEnd();

// Recommendations
console.group('🎯 Next Steps');
if (!user) {
  console.log('❌ User not logged in - Login first');
} else if (!vendor) {
  console.log('⚠️ No vendor profile - Create one at /vendor-onboarding');
} else if (!allMessages || allMessages.length === 0) {
  console.log('⚠️ No messages yet:');
  console.log('1. Send a test message from user account');
  console.log('2. Refresh this page');
  console.log('3. Run this script again');
} else {
  console.log('✅ Data looks good!');
  console.log('Check if conversations appear in the UI');
  console.log('If not, it might be a RLS issue - see VENDOR_MESSAGES_DEBUG_STEPS.md');
}
console.groupEnd();

console.groupEnd();

console.log('');
console.log('📖 Full debugging guide: VENDOR_MESSAGES_DEBUG_STEPS.md');
console.log('🚀 Quick reference: VENDOR_INBOX_QUICK_START.md');
