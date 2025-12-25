#!/bin/bash

# ============================================================================
# VENDOR MESSAGE DEBUGGING SCRIPT
# ============================================================================
# This script helps diagnose why vendors aren't receiving messages from users
# 
# Prerequisites:
# 1. Have supabase CLI installed: npm install -g supabase
# 2. Have your Supabase project credentials
# 3. Be in the zintra-platform directory
#
# Usage:
# chmod +x debug-vendor-messages.sh
# ./debug-vendor-messages.sh
# ============================================================================

echo "🔍 VENDOR MESSAGES DEBUGGING SCRIPT"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# STEP 1: Check if messages exist in database
# ============================================================================
echo -e "${BLUE}STEP 1: Checking vendor_messages table${NC}"
echo "Run this SQL query in Supabase dashboard:"
echo ""
echo -e "${YELLOW}SELECT 
  id,
  vendor_id,
  user_id,
  sender_type,
  message_text,
  is_read,
  created_at
FROM public.vendor_messages
ORDER BY created_at DESC
LIMIT 20;${NC}"
echo ""
echo "Expected: You should see messages with sender_type='user'"
echo ""

# ============================================================================
# STEP 2: Check vendor profiles
# ============================================================================
echo -e "${BLUE}STEP 2: Check vendor profiles exist${NC}"
echo "Run this SQL query:"
echo ""
echo -e "${YELLOW}SELECT 
  id,
  user_id,
  company_name
FROM public.vendors
LIMIT 10;${NC}"
echo ""
echo "Expected: At least one vendor with a valid user_id"
echo ""

# ============================================================================
# STEP 3: Check if vendor can see their messages
# ============================================================================
echo -e "${BLUE}STEP 3: Verify RLS policies allow vendor to read messages${NC}"
echo "Run this SQL query as a vendor user (set auth.uid() in Supabase):"
echo ""
echo -e "${YELLOW}-- Replace VENDOR_ID with an actual vendor id from Step 2
SELECT 
  vm.*,
  v.company_name
FROM public.vendor_messages vm
JOIN public.vendors v ON vm.vendor_id = v.id
WHERE vm.vendor_id = 'VENDOR_ID'
ORDER BY vm.created_at DESC;${NC}"
echo ""
echo "Expected: Messages show up. If empty, RLS policy may be blocking"
echo ""

# ============================================================================
# STEP 4: Test the notification trigger
# ============================================================================
echo -e "${BLUE}STEP 4: Check if notifications are being created${NC}"
echo "Run this SQL query:"
echo ""
echo -e "${YELLOW}SELECT 
  id,
  user_id,
  type,
  title,
  body,
  related_id,
  related_type,
  created_at
FROM public.notifications
WHERE type = 'message'
ORDER BY created_at DESC
LIMIT 20;${NC}"
echo ""
echo "Expected: Notifications should exist for recent messages"
echo ""

# ============================================================================
# STEP 5: Check MessagesTab component data
# ============================================================================
echo -e "${BLUE}STEP 5: Debug MessagesTab component${NC}"
echo "1. Open browser DevTools (F12)"
echo "2. Go to /vendor-messages"
echo "3. In Console, you should see logs like:"
echo ""
echo -e "${YELLOW}Current user: {...}
Vendor data: {id: '...', user_id: '...', company_name: '...'}
All messages: [{id: '...', vendor_id: '...', user_id: '...', ...}, ...]${NC}"
echo ""
echo "If these logs are missing or empty:"
echo "- Check Network tab for API errors"
echo "- Check RLS policies"
echo "- Verify vendor profile exists for the user"
echo ""

# ============================================================================
# STEP 6: Manual API test
# ============================================================================
echo -e "${BLUE}STEP 6: Test message send API directly${NC}"
echo "Use curl or Postman to test:"
echo ""
echo -e "${YELLOW}POST /api/vendor/messages/send
Headers:
  Content-Type: application/json
  Authorization: Bearer [YOUR_JWT_TOKEN]

Body:
{
  \"vendorId\": \"[VENDOR_ID]\",
  \"messageText\": \"Test message\",
  \"senderType\": \"user\"
}${NC}"
echo ""
echo "Expected: Status 201 with success: true"
echo ""

# ============================================================================
# STEP 7: Test vendor inbox fetch
# ============================================================================
echo -e "${BLUE}STEP 7: Test vendor inbox API${NC}"
echo "Use curl or Postman to test the GET endpoint:"
echo ""
echo -e "${YELLOW}GET /api/vendor/messages/get?vendorId=[VENDOR_ID]&userId=[USER_ID]
Headers:
  Authorization: Bearer [VENDOR_JWT_TOKEN]${NC}"
echo ""
echo "Expected: Array of messages in the conversation"
echo ""

# ============================================================================
# QUICK DIAGNOSIS CHECKLIST
# ============================================================================
echo ""
echo -e "${BLUE}==== QUICK DIAGNOSIS CHECKLIST ====${NC}"
echo ""
echo "[ ] Messages exist in vendor_messages table"
echo "[ ] Vendor profile exists and is linked to user"
echo "[ ] Notifications are being created"
echo "[ ] Browser console shows successful data fetch"
echo "[ ] No JavaScript errors in console"
echo "[ ] RLS allows vendor to read their messages"
echo "[ ] Message API endpoints work"
echo ""

# ============================================================================
# COMMON ISSUES AND FIXES
# ============================================================================
echo -e "${BLUE}==== COMMON ISSUES ====${NC}"
echo ""

echo "1️⃣ Issue: Messages don't appear in vendor inbox"
echo "   Likely cause: RLS policy blocking vendor access"
echo "   Fix: Check policy 'Allow vendors to read messages to their profile'"
echo "   Should have: WHERE auth.uid() IN (SELECT user_id FROM vendors WHERE id = vendor_id)"
echo ""

echo "2️⃣ Issue: No messages in vendor_messages table"
echo "   Likely cause: User component not sending to correct endpoint"
echo "   Fix: Verify UserVendorMessagesTab.js calls /api/vendor/messages/send"
echo "   Check: senderType is 'user' and vendorId is correct"
echo ""

echo "3️⃣ Issue: Vendor profile not found"
echo "   Likely cause: Vendor hasn't been created for this user"
echo "   Fix: Create a vendor profile at /vendor-onboarding or vendor dashboard"
echo "   Check: vendors.user_id matches auth.users.id"
echo ""

echo "4️⃣ Issue: MessagesTab shows 'No vendor profile found'"
echo "   Likely cause: User logged in as vendor doesn't have a vendor profile"
echo "   Fix: User must be both a vendor owner AND have a vendor profile"
echo "   Check: Query 'SELECT * FROM vendors WHERE user_id = current_user_id'"
echo ""

echo "5️⃣ Issue: Notifications work but messages don't show"
echo "   Likely cause: Fetch query wrong or RLS blocking SELECT"
echo "   Fix: Check fetchData() in MessagesTab.js logs"
echo "   Debug: Manually query vendor_messages with vendor's auth.uid()"
echo ""

# ============================================================================
# NEXT STEPS
# ============================================================================
echo ""
echo -e "${GREEN}==== NEXT STEPS ====${NC}"
echo ""
echo "1. Run the SQL queries above in Supabase dashboard"
echo "2. Check MessagesTab component console logs (F12)"
echo "3. Verify data exists with the queries"
echo "4. If data exists but not showing, check RLS policies"
echo "5. Add more console.log() statements to debug"
echo ""
echo "Debug guide: /VENDOR_INBOX_DEBUG_GUIDE.md"
echo ""

echo -e "${GREEN}✅ Debug checklist complete!${NC}"
