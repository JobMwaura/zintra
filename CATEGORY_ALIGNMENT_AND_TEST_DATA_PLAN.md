# Category Alignment & Test Data Setup Guide

**Status:** 🔴 ACTION REQUIRED - Before Phase 1 Testing  
**Priority:** HIGH - Without this, vendor matching won't work correctly  
**Time to Complete:** 30-45 minutes

---

## 📊 THE SITUATION

You have **TWO DIFFERENT CATEGORY SYSTEMS** that need to be aligned:

### System 1: Homepage Display (GENERIC)
Currently showing on `app/page.js`:
```
Design & Planning
Building & Construction
Electrical
Plumbing
Finishing & Interior
HVAC & Mechanical
Landscaping & Outdoor
Structural Materials
Roofing Materials
```
**Total: 9 generic categories** (useful for browsing, not for matching)

### System 2: RFQ Template Categories (SPECIFIC)
Used for creating RFQs - **20 detailed categories** in `/lib/rfqTemplates/categories/`:
```
1. architectural_design
2. building_masonry
3. carpentry_joinery
4. doors_windows_glass
5. electrical_solar
6. equipment_hire
7. fencing_gates
8. flooring_wall_finishes
9. hvac_climate
10. interior_decor
11. kitchens_wardrobes
12. landscaping_outdoor
13. painting_decorating
14. plumbing_drainage
15. pools_water_features
16. project_management_qs
17. roofing_waterproofing
18. security_smart
19. special_structures
20. waste_cleaning
```

### System 3: Vendor Categories (OLD)
Vendors currently using:
- `primaryCategorySlug` (single category string)
- `secondaryCategories` (array of strings)

---

## 🎯 THE PROBLEM

When testing Phase 1 (job assignment), you need:

1. **Test vendors** with categories that match the **20 RFQ templates**
2. **Test RFQs** created using the **20 template categories**
3. **Vendor matching** to find correct vendors for RFQs

**Current issue:** 
- Vendors have old/generic categories
- RFQs will be created with specific template categories
- Matching will fail because categories don't align

---

## ✅ THE SOLUTION (3 STEPS)

### STEP 1: Update Homepage to Show All 20 Categories

**File:** `/app/page.js`

Replace the static `CATEGORY_CARDS` array (lines 99-134) with dynamic categories:

```javascript
// OLD CODE (lines 99-134) - Replace with:
// Category cards - now dynamic from templates
const CATEGORY_CARDS = [
  {
    name: 'Architectural Design',
    icon: Building2,
    slug: 'architectural_design',
    description: 'Professional architects and design services'
  },
  {
    name: 'Building & Masonry',
    icon: Building2,
    slug: 'building_masonry',
    description: 'Masonry, concrete, and structural builders'
  },
  {
    name: 'Carpentry & Joinery',
    icon: Home,
    slug: 'carpentry_joinery',
    description: 'Custom carpentry and woodwork specialists'
  },
  {
    name: 'Doors, Windows & Glass',
    icon: DoorOpen,
    slug: 'doors_windows_glass',
    description: 'Door and window installation and finishing'
  },
  {
    name: 'Electrical & Solar',
    icon: Zap,
    slug: 'electrical_solar',
    description: 'Electrical systems and solar solutions'
  },
  {
    name: 'Equipment Hire',
    icon: Layers,
    slug: 'equipment_hire',
    description: 'Equipment and machinery rental services'
  },
  {
    name: 'Fencing & Gates',
    icon: DoorOpen,
    slug: 'fencing_gates',
    description: 'Fencing, gates, and boundary solutions'
  },
  {
    name: 'Flooring & Wall Finishes',
    icon: Home,
    slug: 'flooring_wall_finishes',
    description: 'Flooring, tiling, and wall finishing'
  },
  {
    name: 'HVAC & Climate Control',
    icon: Wind,
    slug: 'hvac_climate',
    description: 'Heating, cooling, and ventilation systems'
  },
  {
    name: 'Interior Decoration',
    icon: ChefHat,
    slug: 'interior_decor',
    description: 'Interior design and decoration services'
  },
  {
    name: 'Kitchens & Wardrobes',
    icon: ChefHat,
    slug: 'kitchens_wardrobes',
    description: 'Kitchen and wardrobe installation specialists'
  },
  {
    name: 'Landscaping & Outdoor',
    icon: Trees,
    slug: 'landscaping_outdoor',
    description: 'Landscaping design and outdoor construction'
  },
  {
    name: 'Painting & Decorating',
    icon: DoorOpen,
    slug: 'painting_decorating',
    description: 'Painting, wallpaper, and decoration services'
  },
  {
    name: 'Plumbing & Drainage',
    icon: Droplet,
    slug: 'plumbing_drainage',
    description: 'Plumbing systems and water drainage'
  },
  {
    name: 'Pools & Water Features',
    icon: Droplet,
    slug: 'pools_water_features',
    description: 'Pool construction and water feature design'
  },
  {
    name: 'Project Management',
    icon: Layers,
    slug: 'project_management_qs',
    description: 'Project management and quantity surveying'
  },
  {
    name: 'Roofing & Waterproofing',
    icon: Home,
    slug: 'roofing_waterproofing',
    description: 'Roofing materials and waterproofing solutions'
  },
  {
    name: 'Security & Smart Systems',
    icon: Shield,
    slug: 'security_smart',
    description: 'Security systems and smart building tech'
  },
  {
    name: 'Special Structures',
    icon: Layers,
    slug: 'special_structures',
    description: 'Specialized structural construction'
  },
  {
    name: 'Waste Management & Cleaning',
    icon: Trees,
    slug: 'waste_cleaning',
    description: 'Construction waste removal and site cleaning'
  },
];
```

**Time to update:** 2 minutes

---

### STEP 2: Create Test Vendor Data (For Supabase)

You need to add **test vendors** in Supabase that match the 20 categories. 

**Two options:**

#### Option A: SQL Insert (EASIEST - Recommended) ⭐

Run this SQL in Supabase SQL Editor. It creates 20 test vendors, one for each category:

```sql
-- Create test vendors matching all 20 RFQ template categories
INSERT INTO public.vendor_profiles (
  id,
  business_name,
  business_type,
  primary_category_slug,
  secondary_categories,
  description,
  phone_number,
  email,
  county,
  town,
  service_radius_km,
  years_in_business,
  team_size,
  certifications,
  is_verified,
  created_at
) VALUES

-- 1. Architectural Design
(
  gen_random_uuid(),
  'Design Masters Kenya',
  'vendor',
  'architectural_design',
  '["interior_design", "project_management"]'::jsonb,
  'Professional architectural design and 3D visualization services',
  '+254700000001',
  'designs@designmasters.ke',
  'Nairobi',
  'Westlands',
  50,
  8,
  12,
  '["Registered Architect"]'::jsonb,
  true,
  NOW()
),

-- 2. Building & Masonry
(
  gen_random_uuid(),
  'Sturdy Builders Limited',
  'vendor',
  'building_masonry',
  '["structural_engineering"]'::jsonb,
  'Expert masonry and concrete construction services',
  '+254700000002',
  'info@sturdybuilders.ke',
  'Nairobi',
  'Donholm',
  40,
  12,
  25,
  '["ISO 9001"]'::jsonb,
  true,
  NOW()
),

-- 3. Carpentry & Joinery
(
  gen_random_uuid(),
  'Craft Woodworks',
  'vendor',
  'carpentry_joinery',
  '["kitchens_wardrobes", "interior_decor"]'::jsonb,
  'Custom carpentry and fine woodwork specialist',
  '+254700000003',
  'craft@woodworks.ke',
  'Nairobi',
  'Embakasi',
  35,
  10,
  8,
  '["Master Carpenter"]'::jsonb,
  true,
  NOW()
),

-- 4. Doors, Windows & Glass
(
  gen_random_uuid(),
  'Precision Glass & Doors',
  'vendor',
  'doors_windows_glass',
  '["security_smart"]'::jsonb,
  'High-quality doors, windows, and glass solutions',
  '+254700000004',
  'sales@precisionglass.ke',
  'Nairobi',
  'Kilimani',
  45,
  7,
  10,
  '["Safety Glass Certified"]'::jsonb,
  true,
  NOW()
),

-- 5. Electrical & Solar
(
  gen_random_uuid(),
  'SunEnergy Solutions',
  'vendor',
  'electrical_solar',
  '["security_smart", "hvac_climate"]'::jsonb,
  'Electrical installation and solar energy systems',
  '+254700000005',
  'info@sunenergy.ke',
  'Nairobi',
  'South C',
  50,
  6,
  15,
  '["KEBS Approved", "Solar Expert"]'::jsonb,
  true,
  NOW()
),

-- 6. Equipment Hire
(
  gen_random_uuid(),
  'BuildEquip Rental',
  'vendor',
  'equipment_hire',
  '["project_management_qs"]'::jsonb,
  'Construction equipment and machinery rental',
  '+254700000006',
  'rent@buildequip.ke',
  'Nairobi',
  'Industrial Area',
  60,
  9,
  20,
  '["ISO Certified"]'::jsonb,
  true,
  NOW()
),

-- 7. Fencing & Gates
(
  gen_random_uuid(),
  'Secure Fencing Ltd',
  'vendor',
  'fencing_gates',
  '["security_smart"]'::jsonb,
  'Custom fencing and gate installation services',
  '+254700000007',
  'sales@securefencing.ke',
  'Nairobi',
  'Runda',
  40,
  5,
  9,
  '["Licensed"]'::jsonb,
  true,
  NOW()
),

-- 8. Flooring & Wall Finishes
(
  gen_random_uuid(),
  'Premium Flooring Co',
  'vendor',
  'flooring_wall_finishes',
  '["interior_decor", "kitchens_wardrobes"]'::jsonb,
  'Flooring, tiling, and wall finishing solutions',
  '+254700000008',
  'info@premiumflooring.ke',
  'Nairobi',
  'Lavington',
  35,
  8,
  12,
  '["Master Tiler"]'::jsonb,
  true,
  NOW()
),

-- 9. HVAC & Climate Control
(
  gen_random_uuid(),
  'Climate Control Experts',
  'vendor',
  'hvac_climate',
  '["electrical_solar"]'::jsonb,
  'AC, heating, and ventilation system installation',
  '+254700000009',
  'tech@climatecontrol.ke',
  'Nairobi',
  'Westlands',
  45,
  7,
  8,
  '["HVAC Certified"]'::jsonb,
  true,
  NOW()
),

-- 10. Interior Decoration
(
  gen_random_uuid(),
  'Elegant Interiors',
  'vendor',
  'interior_decor',
  '["kitchens_wardrobes", "painting_decorating"]'::jsonb,
  'Complete interior design and decoration services',
  '+254700000010',
  'design@elegantinteriors.ke',
  'Nairobi',
  'Kilimani',
  30,
  6,
  7,
  '["Interior Design Diploma"]'::jsonb,
  true,
  NOW()
),

-- 11. Kitchens & Wardrobes
(
  gen_random_uuid(),
  'Custom Kitchens Kenya',
  'vendor',
  'kitchens_wardrobes',
  '["carpentry_joinery", "interior_decor"]'::jsonb,
  'Bespoke kitchen and wardrobe solutions',
  '+254700000011',
  'sales@customkitchens.ke',
  'Nairobi',
  'South B',
  35,
  9,
  11,
  '["Master Craftsman"]'::jsonb,
  true,
  NOW()
),

-- 12. Landscaping & Outdoor
(
  gen_random_uuid(),
  'Garden Design Specialists',
  'vendor',
  'landscaping_outdoor',
  '["pools_water_features"]'::jsonb,
  'Professional landscaping and outdoor design',
  '+254700000012',
  'gardens@landscapedesign.ke',
  'Nairobi',
  'Muthaiga',
  40,
  8,
  10,
  '["Landscape Architect"]'::jsonb,
  true,
  NOW()
),

-- 13. Painting & Decorating
(
  gen_random_uuid(),
  'Perfect Paint Solutions',
  'vendor',
  'painting_decorating',
  '["flooring_wall_finishes", "interior_decor"]'::jsonb,
  'Professional painting and wall decoration',
  '+254700000013',
  'paint@perfectpaint.ke',
  'Nairobi',
  'Embakasi',
  35,
  10,
  14,
  '["Master Painter"]'::jsonb,
  true,
  NOW()
),

-- 14. Plumbing & Drainage
(
  gen_random_uuid(),
  'Expert Plumbing Services',
  'vendor',
  'plumbing_drainage',
  '["pools_water_features"]'::jsonb,
  'Complete plumbing and drainage solutions',
  '+254700000014',
  'service@expertplumbing.ke',
  'Nairobi',
  'Donholm',
  45,
  11,
  9,
  '["Master Plumber"]'::jsonb,
  true,
  NOW()
),

-- 15. Pools & Water Features
(
  gen_random_uuid(),
  'Luxury Pools Kenya',
  'vendor',
  'pools_water_features',
  '["plumbing_drainage", "landscaping_outdoor"]'::jsonb,
  'Pool construction and water feature design',
  '+254700000015',
  'info@luxurypools.ke',
  'Nairobi',
  'Runda',
  50,
  7,
  12,
  '["Pool Engineer"]'::jsonb,
  true,
  NOW()
),

-- 16. Project Management & QS
(
  gen_random_uuid(),
  'Premier Project Solutions',
  'vendor',
  'project_management_qs',
  '["building_masonry"]'::jsonb,
  'Professional project management and quantity surveying',
  '+254700000016',
  'pm@projectsolutions.ke',
  'Nairobi',
  'Westlands',
  60,
  13,
  18,
  '["QS Certified", "PMBOK"]'::jsonb,
  true,
  NOW()
),

-- 17. Roofing & Waterproofing
(
  gen_random_uuid(),
  'Reliable Roofing Ltd',
  'vendor',
  'roofing_waterproofing',
  '["building_masonry"]'::jsonb,
  'Roofing and waterproofing solutions',
  '+254700000017',
  'roofs@reliableroofing.ke',
  'Nairobi',
  'Kilimani',
  40,
  12,
  15,
  '["Master Roofer"]'::jsonb,
  true,
  NOW()
),

-- 18. Security & Smart Systems
(
  gen_random_uuid(),
  'Smart Security Systems',
  'vendor',
  'security_smart',
  '["electrical_solar"]'::jsonb,
  'Advanced security and smart building technology',
  '+254700000018',
  'tech@smartsecurity.ke',
  'Nairobi',
  'South C',
  50,
  6,
  10,
  '["CCTV Expert", "Smart Tech Certified"]'::jsonb,
  true,
  NOW()
),

-- 19. Special Structures
(
  gen_random_uuid(),
  'Specialized Construction Ltd',
  'vendor',
  'special_structures',
  '["project_management_qs"]'::jsonb,
  'Specialized and complex structural work',
  '+254700000019',
  'special@specialized.ke',
  'Nairobi',
  'Westlands',
  70,
  15,
  30,
  '["Structural Engineer", "ISO 9001"]'::jsonb,
  true,
  NOW()
),

-- 20. Waste Management & Cleaning
(
  gen_random_uuid(),
  'Eco Clean Solutions',
  'vendor',
  'waste_cleaning',
  '["building_masonry"]'::jsonb,
  'Construction waste management and site cleaning',
  '+254700000020',
  'eco@eclean.ke',
  'Nairobi',
  'Industrial Area',
  100,
  5,
  25,
  '["EPA Certified"]'::jsonb,
  true,
  NOW()
);
```

**To execute:**
1. Go to Supabase dashboard → SQL Editor
2. Copy & paste the SQL above
3. Click "Run"
4. **Verify:** Should see "20 rows inserted" message

**Time to execute:** 1 minute

#### Option B: CSV Upload (Alternative)

If you prefer uploading a CSV:
1. I can create a CSV file for you
2. You upload it via Supabase dashboard
3. Takes 2-3 minutes

---

### STEP 3: Verify Test Data

After adding vendors, run these verification queries:

```sql
-- Count vendors by category
SELECT 
  primary_category_slug,
  COUNT(*) as vendor_count
FROM public.vendor_profiles
WHERE is_verified = true
GROUP BY primary_category_slug
ORDER BY primary_category_slug;

-- Expected result: 20 rows, each with count=1
-- Shows all 20 categories have test vendors
```

**Should show:**
```
architectural_design        | 1
building_masonry            | 1
carpentry_joinery           | 1
... (20 total categories)
```

---

## 🧪 NOW YOU'RE READY FOR PHASE 1 TESTING!

### Test Scenario: Complete Job Assignment Flow

1. **Create RFQ** (using one of the 20 template categories)
   - Category: "Electrical & Solar"
   - Other details...

2. **System finds matching vendor** automatically
   - Vendor "SunEnergy Solutions" has `primary_category_slug = 'electrical_solar'`
   - ✅ Match found!

3. **Assign vendor to RFQ**
   - Create project entry
   - Send notification to vendor
   - ✅ Phase 1 complete

4. **Verify in database**
   - Check `projects` table has entry
   - Check `notifications` table has vendor notification
   - ✅ All working!

---

## 📋 QUICK CHECKLIST

- [ ] **Step 1:** Update `app/page.js` - Replace CATEGORY_CARDS (2 min)
- [ ] **Step 2:** Run SQL in Supabase - Create 20 test vendors (1 min)
- [ ] **Step 3:** Run verification query - Confirm all categories have vendors (30 sec)
- [ ] **Commit to Git** - `git add . && git commit -m "Add test vendors for all 20 RFQ categories"`
- [ ] **Test Phase 1** - Create RFQ, assign vendor, verify notifications

**Total time:** ~30-45 minutes

---

## 🎯 AFTER THIS IS DONE

You'll have:
- ✅ Homepage showing all 20 categories (not 9)
- ✅ Test vendors matching each category
- ✅ Ready to test Phase 1 job assignment workflow
- ✅ Vendor matching will work correctly
- ✅ Notification system will have real recipients

---

## 💡 LONG-TERM CONSIDERATIONS

Once you're live with real vendors:

1. **Vendor signup** will set `primaryCategorySlug` from one of the 20
2. **RFQs** created will use one of the 20 template categories
3. **Matching algorithm** will find vendors with matching categories
4. **Secondary categories** allow vendors to handle multiple types

The 20-category system ensures:
- ✅ Consistent categorization
- ✅ Better vendor matching
- ✅ Clear RFQ templates per category
- ✅ Professional UX

**Questions?** This plan gets you Phase 1 testing-ready! 🚀
