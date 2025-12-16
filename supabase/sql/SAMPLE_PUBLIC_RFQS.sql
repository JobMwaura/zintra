-- Sample Public RFQ Data for Marketplace Testing
-- Run this SQL in Supabase SQL Editor to add sample data to test the Public RFQ Marketplace
-- This will create 8 sample public RFQs with various projects, budgets, and locations

-- This version automatically uses the first user from your auth.users table
-- No manual UUID replacement needed - just copy and paste!

WITH user_id AS (
  SELECT id FROM auth.users LIMIT 1
)
INSERT INTO rfqs (
  user_id,
  buyer_id,
  title,
  description,
  category,
  rfq_type,
  visibility,
  budget_range,
  timeline,
  location,
  county,
  status,
  deadline,
  created_at,
  published_at
) 
SELECT
  user_id.id,
  user_id.id,
  'Modern Kitchen Renovation with New Cabinets',
  'Looking for a professional kitchen renovation including installation of new cabinets, countertops, backsplash, and modern lighting. Property is a 3-bedroom apartment in Westlands. Need completion within 6 weeks.',
  'Kitchen & Interior Fittings',
  'public',
  'public',
  'KSh 500,000 - 1,000,000',
  'medium',
  'Westlands, Nairobi',
  'Nairobi',
  'open',
  NOW() + INTERVAL '14 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
FROM user_id
UNION ALL
SELECT
  user_id.id,
  user_id.id,
  'Complete House Electrical Rewiring',
  'Need complete electrical rewiring for a 4-bedroom house built in 1995. Existing wiring is outdated and unsafe. Property in Kilimani, Nairobi. Must include new circuit breaker panel, outlets, and switches throughout house.',
  'Electrical & Lighting',
  'public',
  'public',
  'KSh 150,000 - 300,000',
  'short',
  'Kilimani, Nairobi',
  'Nairobi',
  'open',
  NOW() + INTERVAL '21 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
FROM user_id
UNION ALL
SELECT
  user_id.id,
  user_id.id,
  'Bathroom Plumbing Renovation and Tiling',
  'Complete bathroom renovation including new plumbing fixtures, water pipes, drainage system, and ceramic tiling. Master bedroom bathroom in a townhouse. Must be completed before end of month.',
  'Plumbing & Sanitation',
  'public',
  'public',
  'KSh 100,000 - 250,000',
  'urgent',
  'Karen, Nairobi',
  'Nairobi',
  'open',
  NOW() + INTERVAL '7 days',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
FROM user_id
UNION ALL
SELECT
  user_id.id,
  user_id.id,
  'Office Partition Installation and Painting',
  'Need to partition a large open office space (800 sq ft) into 4 separate rooms. Requires installation of glass partition walls, repainting, and finishing. Location: CBD, Nairobi. Project must be completed within 2 weeks.',
  'Building & Structural Materials',
  'public',
  'public',
  'KSh 200,000 - 500,000',
  'short',
  'CBD, Nairobi',
  'Nairobi',
  'open',
  NOW() + INTERVAL '10 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
FROM user_id
UNION ALL
SELECT
  user_id.id,
  user_id.id,
  'Roof Replacement - Residential House',
  'Complete roof replacement for 5-bedroom house. Current roof is over 20 years old and leaking. Need new roofing material (tiles), supporting structure inspection, and waterproofing. Located in Runda estate.',
  'Roofing & Waterproofing',
  'public',
  'public',
  'KSh 800,000 - 1,500,000',
  'medium',
  'Runda, Nairobi',
  'Nairobi',
  'open',
  NOW() + INTERVAL '30 days',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days'
FROM user_id
UNION ALL
SELECT
  user_id.id,
  user_id.id,
  'Commercial Kitchen Equipment Installation',
  'Need professional installation of commercial kitchen equipment for a new restaurant in Mombasa. Includes installation of stove, oven, ventilation system, and plumbing. Equipment already procured, only installation and connection needed.',
  'Kitchen & Interior Fittings',
  'public',
  'public',
  'KSh 250,000 - 500,000',
  'short',
  'Old Town, Mombasa',
  'Mombasa',
  'open',
  NOW() + INTERVAL '14 days',
  NOW(),
  NOW()
FROM user_id
UNION ALL
SELECT
  user_id.id,
  user_id.id,
  'Solar Panel Installation - Residential',
  'Install 10kW solar panel system on the roof of a residential property in Kisumu. System will include panels, inverter, battery storage, and wiring. Need experienced technician with solar installation background.',
  'Electrical & Lighting',
  'public',
  'public',
  'KSh 500,000 - 800,000',
  'medium',
  'Milimani, Kisumu',
  'Kisumu',
  'open',
  NOW() + INTERVAL '21 days',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
FROM user_id
UNION ALL
SELECT
  user_id.id,
  user_id.id,
  'Interior Wall Painting and Finishing',
  'Paint all interior walls of a 3-bedroom house using high-quality paint. Includes wall preparation, primer, two coats of paint, and finishing touches. Preferably eco-friendly paint. Location in Nakuru.',
  'Flooring & Wall Finishes',
  'public',
  'public',
  'KSh 80,000 - 150,000',
  'flexible',
  'Nairobi Area, Nakuru',
  'Nakuru',
  'open',
  NOW() + INTERVAL '28 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
FROM user_id;

-- Verification Query:
-- After inserting, verify the data appears in the /post-rfq marketplace
-- SELECT id, title, category, budget_range, location FROM rfqs WHERE rfq_type = 'public' AND visibility = 'public';
