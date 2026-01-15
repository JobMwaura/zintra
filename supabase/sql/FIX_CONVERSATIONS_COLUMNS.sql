-- Fix Conversations Table Structure
-- The table has participant_1_id and participant_2_id instead of admin_id and vendor_id
-- This migration adds the missing columns OR renames existing ones

-- First, let's check what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Option 1: If the table has participant_1_id and participant_2_id, add admin_id and vendor_id
DO $$ 
BEGIN
    -- Add admin_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'admin_id'
    ) THEN
        ALTER TABLE public.conversations 
        ADD COLUMN admin_id uuid;
        
        -- Copy data from participant_1_id if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'participant_1_id'
        ) THEN
            UPDATE public.conversations 
            SET admin_id = participant_1_id;
        END IF;
        
        -- Make it NOT NULL after populating
        ALTER TABLE public.conversations 
        ALTER COLUMN admin_id SET NOT NULL;
    END IF;
    
    -- Add vendor_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'vendor_id'
    ) THEN
        ALTER TABLE public.conversations 
        ADD COLUMN vendor_id uuid;
        
        -- Copy data from participant_2_id if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'conversations' 
            AND column_name = 'participant_2_id'
        ) THEN
            UPDATE public.conversations 
            SET vendor_id = participant_2_id;
        END IF;
        
        -- Make it NOT NULL after populating
        ALTER TABLE public.conversations 
        ALTER COLUMN vendor_id SET NOT NULL;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON public.conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id ON public.conversations(vendor_id);

-- Verify the structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- ✅ Migration Complete
-- The conversations table now has both admin_id and vendor_id columns
-- The code should work correctly now
