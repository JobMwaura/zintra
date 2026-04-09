# Reactions Tables Setup Guide

## Overview
The reactions feature requires two new tables in Supabase to track emoji reactions on status updates and comments. These tables are currently missing, causing the reactions API endpoints to return empty responses.

## Problem Summary
- **GET /api/status-updates/reactions** returns 400 Bad Request (missing table)
- **POST /api/status-updates/reactions** returns 400 Bad Request (missing table)
- **GET /api/status-updates/comments/reactions** returns 400 Bad Request (missing table)
- **POST /api/status-updates/comments/reactions** returns 400 Bad Request (missing table)

## Root Cause
The two required tables do not exist in the Supabase database:
1. `vendor_status_update_reactions` - stores emoji reactions on status updates
2. `vendor_status_update_comment_reactions` - stores emoji reactions on comments

## Solution - Execute SQL Migration

### Step 1: Open Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project (zintra-db or similar)
3. Navigate to the SQL Editor

### Step 2: Run Migration SQL
Copy and paste the complete SQL from `migrations/create_reactions_tables.sql` into the SQL Editor and execute it.

**SQL Location:** `/migrations/create_reactions_tables.sql`

### What This SQL Does
- Creates `vendor_status_update_reactions` table with columns:
  - `id` (UUID Primary Key)
  - `update_id` (UUID, Foreign Key to vendor_status_updates)
  - `emoji` (TEXT, the emoji reaction)
  - `user_id` (UUID, Foreign Key to auth.users)
  - `created_at` (TIMESTAMP)
  - **Constraint:** One reaction per user per emoji per update (UNIQUE)

- Creates `vendor_status_update_comment_reactions` table with columns:
  - `id` (UUID Primary Key)
  - `comment_id` (UUID, Foreign Key to vendor_status_update_comments)
  - `emoji` (TEXT, the emoji reaction)
  - `user_id` (UUID, Foreign Key to auth.users)
  - `created_at` (TIMESTAMP)
  - **Constraint:** One reaction per user per emoji per comment (UNIQUE)

- Creates indexes for performance optimization
- Enables Row Level Security (RLS) with appropriate policies:
  - Anyone can read reactions
  - Users can only create reactions for themselves
  - Users can only delete their own reactions

### Step 3: Verify Tables Were Created
After running the SQL, you should see:
- ✅ `vendor_status_update_reactions` table in the Tables list
- ✅ `vendor_status_update_comment_reactions` table in the Tables list

### Step 4: Test the Feature
After the tables are created:
1. Go to a vendor profile page
2. Navigate to a status update
3. Click the React button (Smile emoji icon)
4. Select an emoji to add a reaction
5. The reaction should appear immediately

## Recent API Changes
The reactions API endpoints have been updated to handle missing tables gracefully:
- **Commit:** 4826342
- **Changes:**
  - Improved error detection to recognize "Could not find the table" error messages
  - Returns HTTP 200 with empty reactions array if table doesn't exist
  - Returns HTTP 500 for actual database errors (not 400)
  - Properly differentiates between validation errors (400) and database errors (500)

## Why This Matters
Without these tables:
- Emoji reactions cannot be stored or retrieved
- The UI won't show any reactions
- The feature appears to be broken

With these tables:
- Users can react to updates and comments with emoji
- Reactions are persisted in the database
- Multiple users can react with the same emoji
- Users can toggle reactions on/off

## Supported Emojis
The reactions system supports 10 emoji options:
👍, 👎, ❤️, 😂, 🔥, 😮, 😢, 🤔, ✨, 🎉

## Next Steps After Setup
1. Run the SQL migration from `migrations/create_reactions_tables.sql`
2. Wait for Vercel to auto-redeploy (usually within 1-2 minutes)
3. Test reactions on a vendor profile
4. Verify reactions appear and persist correctly

## Troubleshooting

### If reactions still don't work after creating tables:
1. Clear browser cache (Cmd+Shift+R on Mac)
2. Check Supabase for any SQL errors in the migration
3. Verify the foreign key relationships are correct
4. Check that RLS policies are properly configured

### If you see "Failed to fetch reactions" error:
1. Open browser DevTools (F12)
2. Check the Network tab for API response status codes
3. Should see 200 OK responses after tables are created
4. If still seeing 400, verify tables exist in Supabase

### Database Foreign Key References
The SQL assumes these tables already exist:
- `auth.users` (built-in Supabase auth table)
- `vendor_status_updates` (must exist)
- `vendor_status_update_comments` (must exist)

If you get foreign key errors, ensure the referenced tables exist first.
