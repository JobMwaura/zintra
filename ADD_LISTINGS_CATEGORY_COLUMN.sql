-- Add missing columns to listings table
-- Required for job posting functionality

ALTER TABLE listings ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS job_type TEXT;

-- Optional: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_job_type ON listings(job_type);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' 
ORDER BY ordinal_position;
