-- COPY AND PASTE THIS ENTIRE SQL BLOCK INTO SUPABASE SQL EDITOR AND RUN

ALTER TABLE IF EXISTS public.rfq_requests
ADD COLUMN IF NOT EXISTS project_title text;

ALTER TABLE IF EXISTS public.rfq_requests
ADD COLUMN IF NOT EXISTS project_description text;

-- Then run this to verify:
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'rfq_requests'
ORDER BY ordinal_position;

-- You should see these columns:
-- id, rfq_id, vendor_id, user_id, status, created_at, project_title, project_description
