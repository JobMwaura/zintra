-- ============================================================================
-- SUPABASE SQL: INSERT TEST PUBLIC RFQs FOR VENDOR BIDDING (FIXED)
-- ============================================================================
-- Date: January 5, 2026
-- Purpose: Populate public RFQs so vendors can see opportunities and compete
-- Schema: public.rfqs table with correct column names
-- Status: Ready for immediate execution in Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: INSERT 10 PUBLIC RFQs WITH VARIOUS CATEGORIES
-- ============================================================================
-- These RFQs will be visible to all vendors in matching categories
-- Each RFQ has realistic details and different urgency/budget levels

INSERT INTO public.rfqs (
  id,
  title,
  description,
  category,
  rfq_type,
  visibility,
  status,
  budget_range,
  location,
  county,
  urgency,
  deadline,
  expires_at,
  created_at,
  user_id,
  timeline,
  material_requirements
) VALUES

-- 1. Residential Electrical Installation (Nairobi)
(
  gen_random_uuid(),
  'Residential Electrical Rewiring - Westlands Estate',
  'Complete electrical system rewiring for a 5-bedroom residential property. Current system is outdated and needs full replacement with modern wiring, circuit breaker installation, and safety compliance. Property area is approximately 500 sqm. Works include installation of new distribution board, wiring to all rooms, kitchen appliances connection, and safety testing.',
  'electrician',
  'public',
  'public',
  'open',
  '150000-250000',
  'Westlands, Nairobi',
  'Nairobi',
  'high',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1),
  '7-10 days',
  'Modern wiring, circuit breaker, distribution board'
),

-- 2. Plumbing Installation - Hotel Water System
(
  gen_random_uuid(),
  'Hotel Water Supply System Installation - Midtown Nairobi',
  'Installation of comprehensive water supply system for new 4-star hotel in Nairobi CBD. Project includes: main water line installation from source, underground piping network, rooftop tank installation (100,000L capacity), pressure tank system, water treatment plant connection, and all fixtures installation. Building has 8 floors with 150 rooms.',
  'plumber',
  'public',
  'public',
  'open',
  '800000-1200000',
  'Nairobi CBD',
  'Nairobi',
  'critical',
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '10 days',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1),
  '14-21 days',
  'Water piping, tanks, fixtures, water treatment connection'
),

-- 3. Roofing Project - Industrial Warehouse
(
  gen_random_uuid(),
  'Industrial Warehouse Roofing - Athi River',
  'Complete roofing replacement for large industrial warehouse in Athi River. Current asbestos roof needs removal and replacement with modern metal roofing sheets. Building dimensions: 50m x 40m (2000 sqm roof area). Project includes: asbestos removal (with proper disposal), roof structure reinforcement, new metal sheet installation, guttering system, and waterproofing treatment.',
  'roofer',
  'public',
  'public',
  'open',
  '400000-600000',
  'Athi River, Machakos',
  'Machakos',
  'normal',
  NOW() + INTERVAL '21 days',
  NOW() + INTERVAL '21 days',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1),
  '10-14 days',
  'Metal roofing sheets, guttering system, waterproofing'
),

-- 4. General Construction - New Office Building
(
  gen_random_uuid(),
  'Office Building Construction - Kikuyu Town',
  'Construction of new 3-story office building in Kikuyu town center. Project scope includes: site preparation, foundation, concrete frame, external walls (both brick and glass partitions), internal walls, flooring, ceiling, and basic MEP rough-in. Building footprint: 60m x 45m per floor. Client seeks contractor capable of managing all sub-trades and site supervision.',
  'general_contractor',
  'public',
  'public',
  'open',
  '3000000-5000000',
  'Kikuyu Town, Kiambu',
  'Kiambu',
  'normal',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '30 days',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1),
  '60-90 days',
  'Concrete, bricks, glass, steel, MEP materials'
),

-- 5. Carpentry - Custom Interior Fitout
(
  gen_random_uuid(),
  'Residential Interior Carpentry - Lavington Estate',
  'Custom carpentry work for luxury residential unit. Scope includes: high-end kitchen cabinet installation, built-in wardrobes for 4 bedrooms, custom shelving systems, wooden door frames, false ceiling installation in specific areas, and finishing. Unit is 300 sqm with open-plan living area. All materials will be supplied by client (designer selection).',
  'carpenter',
  'public',
  'public',
  'open',
  '200000-350000',
  'Lavington, Nairobi',
  'Nairobi',
  'high',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1),
  '10-15 days',
  'Wood materials (client supplied), hardware, finishing'
),

-- 6. Painting - Commercial Complex
(
  gen_random_uuid(),
  'Commercial Complex Interior Painting - Karen',
  'Interior painting for new commercial complex in Karen (5 office spaces). Project includes wall preparation, priming, and finishing with premium paint. Work covers approximately 3,000 sqm of wall area across 5 office units, each 600 sqm. Color scheme pre-selected by client (neutral corporate colors). Timeline is tight - 2-week deadline.',
  'painter',
  'public',
  'public',
  'open',
  '150000-200000',
  'Karen, Nairobi',
  'Nairobi',
  'critical',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1),
  '8-10 days',
  'Premium paint, primer, preparation materials'
),

-- 7. Masonry Work - Residential Boundary Wall
(
  gen_random_uuid(),
  'Boundary Wall Construction - Ruaka, Kiambu',
  'Construction of residential boundary wall for 1-acre property in Ruaka. Wall specifications: 2.2m height, concrete block construction with reinforced concrete columns every 2m, plastered finish, and painted. Total wall length: 200m. Project includes: foundation excavation, concrete footings, block laying, plaster finish, and exterior paint.',
  'mason',
  'public',
  'public',
  'open',
  '200000-300000',
  'Ruaka, Kiambu',
  'Kiambu',
  'normal',
  NOW() + INTERVAL '21 days',
  NOW() + INTERVAL '21 days',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1),
  '7-10 days',
  'Concrete blocks, cement, sand, reinforcing steel'
),

-- 8. HVAC Installation - Hospital Facility
(
  gen_random_uuid(),
  'Hospital HVAC System Installation - Mombasa',
  'Installation of complete HVAC system for new hospital wing in Mombasa. Project scope: design and installation of air conditioning system for 20 hospital rooms (each 35 sqm), 5 operation theaters (each 60 sqm), diagnostic center (200 sqm), and corridors. System must meet hospital infection control standards and 24/7 operational reliability. Medical-grade components required.',
  'hvac_technician',
  'public',
  'public',
  'open',
  '1500000-2000000',
  'Mombasa',
  'Mombasa',
  'high',
  NOW() + INTERVAL '21 days',
  NOW() + INTERVAL '21 days',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1),
  '21-30 days',
  'Medical-grade HVAC units, ducting, controls, filters'
),

-- 9. Tiling Work - Residential Bathroom
(
  gen_random_uuid(),
  'Luxury Bathroom Tiling - Riverside Drive',
  'Complete bathroom tiling for luxury residential unit in Riverside. Scope includes: wall tiling (marble tiles, 600x600mm), floor tiling (heated stone tiles, anti-slip finish), shower enclosure tiling, custom waterproofing, and grouting. Bathroom size: 25 sqm. Designer-selected premium Italian tiles. All prep work (substrate preparation, plumbing rough-in) completed.',
  'tiler',
  'public',
  'public',
  'open',
  '100000-150000',
  'Riverside Drive, Nairobi',
  'Nairobi',
  'high',
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '10 days',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1),
  '5-7 days',
  'Premium marble tiles, grout, waterproofing sealant'
),

-- 10. Landscaping - Resort Development
(
  gen_random_uuid(),
  'Resort Landscaping - Diani Beach',
  'Comprehensive landscaping for new beach resort in Diani. Project includes: site grading and leveling, irrigation system design and installation, hardscape (pathways, seating areas, water features), plant selection and installation (tropical species suitable for coastal climate), garden maintenance plan setup. Resort grounds: 5 acres. Client seeks experienced landscape designer-contractor for high-end finish.',
  'landscaper',
  'public',
  'public',
  'open',
  '800000-1200000',
  'Diani Beach, Kwale',
  'Kwale',
  'normal',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '30 days',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1),
  '21-35 days',
  'Plants, irrigation system, hardscape materials, soil'
);

-- ============================================================================
-- STEP 2: VERIFY INSERTIONS
-- ============================================================================

SELECT 
  COUNT(*) as total_rfqs_inserted,
  COUNT(DISTINCT category) as categories_represented,
  COUNT(DISTINCT county) as counties_represented
FROM public.rfqs
WHERE rfq_type = 'public' 
  AND visibility = 'public'
  AND status = 'open'
  AND created_at > NOW() - INTERVAL '1 hour';

-- ============================================================================
-- STEP 3: VIEW ALL INSERTED RFQs (for verification)
-- ============================================================================

SELECT 
  id,
  title,
  category,
  county,
  budget_range,
  urgency,
  status,
  deadline,
  created_at
FROM public.rfqs
WHERE rfq_type = 'public' 
  AND visibility = 'public'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY urgency DESC, created_at DESC;

-- ============================================================================
-- STEP 4: RFQ COUNT BY CATEGORY (Distribution Check)
-- ============================================================================

SELECT 
  category,
  COUNT(*) as rfq_count
FROM public.rfqs
WHERE rfq_type = 'public' 
  AND visibility = 'public'
  AND status = 'open'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY category
ORDER BY rfq_count DESC;

-- ============================================================================
-- STEP 5: RFQ COUNT BY COUNTY (Geographic Distribution)
-- ============================================================================

SELECT 
  county,
  COUNT(*) as rfq_count
FROM public.rfqs
WHERE rfq_type = 'public' 
  AND visibility = 'public'
  AND status = 'open'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY county
ORDER BY rfq_count DESC;

-- ============================================================================
-- STEP 6: URGENCY DISTRIBUTION
-- ============================================================================

SELECT 
  urgency,
  COUNT(*) as rfq_count,
  budget_range
FROM public.rfqs
WHERE rfq_type = 'public' 
  AND visibility = 'public'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY urgency, budget_range
ORDER BY 
  CASE urgency
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    ELSE 4
  END;

COMMIT;

-- ============================================================================
-- SUMMARY INFORMATION
-- ============================================================================
-- 
-- 10 Test Public RFQs Inserted with:
-- ✅ 10 Different Categories (electrician, plumber, roofer, general_contractor, 
--    carpenter, painter, mason, hvac_technician, tiler, landscaper)
-- ✅ 5 Different Kenyan Counties (Nairobi, Machakos, Kiambu, Mombasa, Kwale)
-- ✅ 3 Different Urgency Levels (critical: 2, high: 4, normal: 4)
-- ✅ Budget Range: KES 100,000 to KES 5,000,000
-- ✅ Realistic Project Descriptions & Scopes
-- ✅ Deadlines: 10-30 days from today
-- ✅ All RFQs visible to vendors in matching categories
--
-- NEXT STEPS FOR USER:
-- 1. Run all SQL above in Supabase SQL Editor (Copy → Paste → Run)
-- 2. Verify output shows "10 rows inserted" in verification queries
-- 3. Vendors can now log in and see available RFQ opportunities
-- 4. Each vendor sees RFQs matching their category
-- 5. Test complete RFQ response flow: View → Details → Submit Quote
--
-- ============================================================================
