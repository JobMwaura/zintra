-- Fix Conversations Table Constraints
-- The table has both participant_1_id/participant_2_id AND admin_id/vendor_id columns
-- We're using the participant_* columns, so remove NOT NULL from admin_id/vendor_id

-- Drop NOT NULL constraint from admin_id column
ALTER TABLE public.conversations
ALTER COLUMN admin_id DROP NOT NULL;

-- Drop NOT NULL constraint from vendor_id column
ALTER TABLE public.conversations
ALTER COLUMN vendor_id DROP NOT NULL;

-- Verify the changes
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name IN ('admin_id', 'vendor_id', 'participant_1_id', 'participant_2_id')
ORDER BY column_name;

-- ✅ Complete
-- Now the conversations table will accept inserts with only participant_1_id and participant_2_id
-- The legacy admin_id and vendor_id columns are now optional
