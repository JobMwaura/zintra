# Message Display Fix - Data Type Handling

## Problem
Messages with images/attachments were displaying as raw JSON instead of formatted text:

```json
{"body":"Hello. Is there something wrong with this floor?...","attachments":[...]}
```

Instead of:
```
Hello. Is there something wrong with this floor?

[image display]
```

## Root Cause
The issue was **not** with AWS S3 URL generation or message storage, but with how the frontend components were **parsing** the message data from Supabase.

### Why It Happened
1. **Database Schema**: `message_text` is stored as a TEXT field containing JSON
2. **Supabase Behavior**: When returning data, Supabase might return:
   - A JSON **string**: `'{"body":"text","attachments":[]}'` (TEXT field behavior)
   - A pre-parsed **object**: `{body: "text", attachments: []}` (JSON auto-parsing)
3. **Frontend Code**: Was only handling the string case, not the object case
4. **Result**: When `message_text` was an object, `JSON.parse()` would fail and the entire object would display as a string

### The Bug
```javascript
// OLD CODE - Only handles string type
const parseMessageContent = (messageText) => {
  try {
    const parsed = JSON.parse(messageText);  // ❌ Fails if messageText is already an object
    return parsed.body || messageText;
  } catch {
    return messageText;  // ❌ Returns the entire object/string if parsing fails
  }
};
```

When `messageText` is an object, the code flow:
1. `JSON.parse(object)` throws an error (can't parse an object)
2. Catch block executes
3. Returns the entire `messageText` (the full JSON object as a string)
4. Display shows raw JSON ❌

## Solution
Updated **all** message parsing components to handle **both** data types:

```javascript
// NEW CODE - Handles both string and object types
const parseMessageContent = (messageText) => {
  // Handle null/undefined
  if (!messageText) return '';
  
  // If it's already an object, extract body directly
  if (typeof messageText === 'object') {
    return messageText.body || JSON.stringify(messageText);
  }
  
  // If it's a string, try to parse it
  try {
    const parsed = JSON.parse(messageText);
    if (parsed && typeof parsed === 'object' && parsed.body) {
      return parsed.body;
    }
    if (parsed) return String(parsed);
  } catch (e) {
    // Not JSON, return as-is
  }
  
  return messageText;
};
```

## Changes Made

### 1. User-Side Component
**File**: `components/UserVendorMessagesTab.js`
- Updated `parseMessageContent()` to handle both string and object types
- Fixed attachment parsing to check type before calling `JSON.parse()`
- Now properly displays body text and renders images inline

### 2. Vendor-Side Components  
**Files**: 
- `components/VendorInboxMessagesTabV2.js`
- `components/VendorInboxModal.js`
- `components/VendorInboxMessagesTab.js`

All updated to:
- Return `{body, attachments}` object
- Handle both string and object input types
- Check attachment arrays exist before rendering

### 3. Vendor Reply Component
**File**: `components/VendorMessagingModal.js`
- Added object type handling in message parsing
- Now correctly extracts body and attachments from both data formats

## How AWS URLs Factor In
The AWS S3 URLs are actually **working correctly**:
- Images upload successfully to S3
- URLs are properly generated and returned
- URLs are stored correctly in the message JSON attachments

The problem was purely in **display parsing**, not in AWS integration.

### URL Format (Correct)
```json
{
  "attachments": [{
    "name": "Logo Colors.jpg",
    "url": "https://zintra-images-prod.s3.us-east-1.amazonaws.com/user-messages/1769173802053_t2um3if5x_Logo Colors.jpg",
    "type": "image/jpeg",
    "size": 110569
  }]
}
```

## Test Checklist
- [ ] User sends message with image
- [ ] Message body displays as text (not raw JSON) ✅
- [ ] Images render inline in user view ✅
- [ ] Vendor receives message with proper formatting ✅
- [ ] Vendor can reply with images ✅
- [ ] User sees vendor's reply correctly ✅
- [ ] Plain text messages (no images) still work ✅
- [ ] Multiple images in single message display properly ✅

## Related Commits
- `c55294b` - Initial double JSON wrapping fix
- `148bf0f` - Added comprehensive logging
- `bc9d4c8` - Handle both string/object in user component  
- `6b1f0aa` - Handle both string/object in all vendor components

## Technical Details

### Message Flow
1. **Frontend** → Create JSON: `{body: "text", attachments: [...]}`
2. **Frontend** → Stringify: `JSON.stringify(messagePayload)`
3. **API** → Receive & validate JSON structure
4. **Database** → Store as TEXT: `'{"body":"...","attachments":[...]}'`
5. **Supabase** → Return as either string or object
6. **Frontend** → Parse with dual-type handling
7. **Display** → Extract body and render images

### Why Both Data Types Occur
- **Text Field**: Supabase might return raw string from TEXT columns
- **JSON-like Content**: Supabase might auto-detect JSON and return parsed object
- **Consistency**: Our code now handles both cases transparently

## Impact
✅ Messages now display correctly for both:
- Users sending to vendors
- Vendors replying to users

✅ Images display as inline images, not text

✅ AWS S3 integration works seamlessly

✅ Backward compatible with plain text messages
