# 📍 Kenya Locations Implementation Guide

**Last Updated**: December 17, 2025
**Status**: ✅ Ready to Deploy

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Files Created](#files-created)
3. [Quick Start](#quick-start)
4. [Usage Examples](#usage-examples)
5. [Migration Steps](#migration-steps)
6. [Database Updates](#database-updates)
7. [Testing Checklist](#testing-checklist)

---

## Overview

This implementation standardizes location data across the Zintra platform by:

- ✅ Providing all 47 Kenya counties
- ✅ Including 300+ major towns and cities
- ✅ Offering reusable React components
- ✅ Ensuring data consistency
- ✅ Improving user experience

---

## Files Created

### 1. **Master Data File**
**File**: [`lib/kenyaLocations.js`](lib/kenyaLocations.js)

Contains:
- All 47 Kenya counties with metadata
- 300+ towns organized by county
- Helper functions for validation and search
- Export utilities for easy import

### 2. **Reusable Components**
**File**: [`components/LocationSelector.js`](components/LocationSelector.js)

Includes:
- `LocationSelector` - Two-level county/town selector
- `CountySelect` - Single county dropdown
- `TownSelect` - Single town dropdown (county-dependent)
- `GroupedCountySelect` - County selector grouped by region

---

## Quick Start

### Step 1: Import the Data

```javascript
import {
  KENYA_COUNTIES,
  KENYA_TOWNS_BY_COUNTY,
  POPULAR_TOWNS
} from '@/lib/kenyaLocations';
```

### Step 2: Use in Your Component

```javascript
import LocationSelector from '@/components/LocationSelector';

function MyForm() {
  const [formData, setFormData] = useState({
    county: '',
    town: ''
  });

  return (
    <LocationSelector
      county={formData.county}
      town={formData.town}
      onCountyChange={(e) => setFormData({...formData, county: e.target.value})}
      onTownChange={(e) => setFormData({...formData, town: e.target.value})}
      required={true}
    />
  );
}
```

---

## Usage Examples

### Example 1: Vendor Registration Form

**File**: `app/vendor-registration/page.js`

**Before**:
```javascript
<input
  type="text"
  name="county"
  value={formData.county}
  onChange={handleInputChange}
  placeholder="e.g., Nairobi"
/>
```

**After**:
```javascript
import LocationSelector from '@/components/LocationSelector';

<LocationSelector
  county={formData.county}
  town={formData.specificLocation}
  onCountyChange={(e) => setFormData({...formData, county: e.target.value})}
  onTownChange={(e) => setFormData({...formData, specificLocation: e.target.value})}
  countyError={errors.county}
  townError={errors.specificLocation}
  required={true}
/>
```

---

### Example 2: RFQ Forms

**Files**:
- `app/post-rfq/direct/page.js`
- `app/post-rfq/wizard/page.js`
- `app/post-rfq/public/page.js`

**Implementation**:
```javascript
import LocationSelector from '@/components/LocationSelector';

// In your form
<LocationSelector
  county={formData.county}
  town={formData.specificLocation}
  onCountyChange={(e) => setFormData({...formData, county: e.target.value})}
  onTownChange={(e) => setFormData({...formData, specificLocation: e.target.value})}
  countyLabel="Project County"
  townLabel="Project Location"
  required={true}
/>
```

---

### Example 3: Browse/Filter Page

**File**: `app/browse/page.js`

**For Filters**:
```javascript
import { CountySelect } from '@/components/LocationSelector';

<CountySelect
  value={selectedCounty}
  onChange={(e) => setSelectedCounty(e.target.value)}
  includeAllOption={true}
  allOptionLabel="All Counties"
  label="Filter by County"
/>
```

---

### Example 4: Vendor Profile Edit

**File**: `app/vendor-profile/[id]/page.js`

**Replace lines 945-955 and 980**:
```javascript
import LocationSelector from '@/components/LocationSelector';

<LocationSelector
  county={form.county}
  town={form.location}
  onCountyChange={(e) => handleFieldChange(e)}
  onTownChange={(e) => handleFieldChange(e)}
  layout="column"
/>
```

---

### Example 5: DirectRFQ Popup

**File**: `components/DirectRFQPopup.js`

**Replace line 235**:
```javascript
import { CountySelect } from '@/components/LocationSelector';

<CountySelect
  value={form.county}
  onChange={(e) => setForm({ ...form, county: e.target.value })}
  label="County / Location"
  required={false}
/>
```

---

### Example 6: Admin Dashboard Filters

**File**: `app/admin/dashboard/vendors/page.js`

```javascript
import { CountySelect } from '@/components/LocationSelector';

<CountySelect
  value={filters.county}
  onChange={(e) => setFilters({...filters, county: e.target.value})}
  includeAllOption={true}
/>
```

---

## Migration Steps

### Phase 1: Update Forms (Priority: HIGH)

Replace all free-text location inputs with dropdowns:

| File | Lines | Status |
|------|-------|--------|
| `app/vendor-registration/page.js` | 458-470 | ⏳ Pending |
| `app/post-rfq/direct/page.js` | 147-148 | ⏳ Pending |
| `app/post-rfq/wizard/page.js` | 131-132 | ⏳ Pending |
| `app/post-rfq/public/page.js` | 142-150 | ⏳ Replace array |
| `components/DirectRFQPopup.js` | 235-242 | ⏳ Pending |
| `app/vendor-profile/[id]/page.js` | 945-955, 980 | ⏳ Pending |
| `components/dashboard/MyProfileTab.js` | 428-443 | ⏳ Pending |

### Phase 2: Update Filters (Priority: MEDIUM)

| File | Purpose | Status |
|------|---------|--------|
| `app/browse/page.js` | Vendor browsing filters | ⏳ Pending |
| `app/admin/dashboard/vendors/page.js` | Admin vendor filters | ⏳ Pending |

### Phase 3: Database Cleanup (Priority: MEDIUM)

Standardize existing data in database (see next section)

---

## Database Updates

### Option 1: Standardization Script (Recommended)

Create file: `scripts/standardize-locations.js`

```javascript
import { supabase } from '@/lib/supabaseClient';
import { KENYA_COUNTIES } from '@/lib/kenyaLocations';

async function standardizeLocations() {
  // Map old values to new standardized values
  const countyMappings = {
    'nairobi': 'nairobi',
    'nbi': 'nairobi',
    'nairobi city': 'nairobi',
    'nairobi county': 'nairobi',
    'mombasa': 'mombasa',
    'msa': 'mombasa',
    'mombasa city': 'mombasa',
    'kisumu': 'kisumu',
    'ksm': 'kisumu',
    // Add more mappings...
  };

  // Update vendors table
  for (const [oldValue, newValue] of Object.entries(countyMappings)) {
    const { error } = await supabase
      .from('vendors')
      .update({ county: newValue })
      .ilike('county', oldValue);

    if (error) console.error(`Error updating ${oldValue}:`, error);
    else console.log(`✅ Updated ${oldValue} → ${newValue}`);
  }

  // Update rfqs table
  for (const [oldValue, newValue] of Object.entries(countyMappings)) {
    const { error } = await supabase
      .from('rfqs')
      .update({ county: newValue })
      .ilike('county', oldValue);

    if (error) console.error(`Error updating ${oldValue}:`, error);
    else console.log(`✅ Updated ${oldValue} → ${newValue}`);
  }

  console.log('🎉 Location standardization complete!');
}

// Run: node scripts/standardize-locations.js
standardizeLocations();
```

### Option 2: SQL Migration (Alternative)

Create file: `supabase/sql/STANDARDIZE_LOCATIONS.sql`

```sql
-- ============================================================================
-- STANDARDIZE LOCATION DATA
-- ============================================================================
-- Updates existing county data to match standardized values
-- ============================================================================

-- Update vendors table
UPDATE vendors
SET county = 'nairobi'
WHERE LOWER(TRIM(county)) IN ('nairobi', 'nbi', 'nairobi city', 'nairobi county');

UPDATE vendors
SET county = 'mombasa'
WHERE LOWER(TRIM(county)) IN ('mombasa', 'msa', 'mombasa city', 'mombasa county');

UPDATE vendors
SET county = 'kisumu'
WHERE LOWER(TRIM(county)) IN ('kisumu', 'ksm', 'kisumu city', 'kisumu county');

UPDATE vendors
SET county = 'nakuru'
WHERE LOWER(TRIM(county)) IN ('nakuru', 'nakuru town', 'nakuru city', 'nakuru county');

UPDATE vendors
SET county = 'kiambu'
WHERE LOWER(TRIM(county)) IN ('kiambu', 'kiambu county');

-- Add more UPDATE statements for other counties...

-- Update rfqs table
UPDATE rfqs
SET county = 'nairobi'
WHERE LOWER(TRIM(county)) IN ('nairobi', 'nbi', 'nairobi city', 'nairobi county');

UPDATE rfqs
SET county = 'mombasa'
WHERE LOWER(TRIM(county)) IN ('mombasa', 'msa', 'mombasa city', 'mombasa county');

-- Add more UPDATE statements...

-- Verification queries
SELECT county, COUNT(*) as count
FROM vendors
GROUP BY county
ORDER BY count DESC;

SELECT county, COUNT(*) as count
FROM rfqs
GROUP BY county
ORDER BY count DESC;
```

---

## Testing Checklist

### ✅ Component Testing

- [ ] **LocationSelector renders correctly**
  - [ ] County dropdown shows all 47 counties
  - [ ] Town dropdown disabled until county selected
  - [ ] Town dropdown auto-filters based on county
  - [ ] Required validation works
  - [ ] Error messages display correctly

- [ ] **CountySelect works standalone**
  - [ ] Dropdown shows all counties
  - [ ] "All Counties" option appears when enabled
  - [ ] onChange callback fires correctly

- [ ] **TownSelect works with county**
  - [ ] Shows correct towns for selected county
  - [ ] Disabled when no county selected
  - [ ] Validation works

### ✅ Form Integration Testing

- [ ] **Vendor Registration**
  - [ ] Can select county and town
  - [ ] Form validates properly
  - [ ] Data saves to database correctly
  - [ ] Mobile responsive

- [ ] **RFQ Forms (Direct, Wizard, Public)**
  - [ ] County/town selection works
  - [ ] Form submission successful
  - [ ] Location data persists

- [ ] **Vendor Profile Edit**
  - [ ] Existing locations load correctly
  - [ ] Can update county/town
  - [ ] Changes save properly

- [ ] **Browse Page Filters**
  - [ ] County filter dropdown works
  - [ ] Filtering by county returns correct results
  - [ ] "All Counties" shows all vendors

### ✅ Data Validation Testing

- [ ] **Database Constraints**
  - [ ] County values are valid
  - [ ] Town values match county
  - [ ] No typos or invalid entries

- [ ] **Helper Functions**
  - [ ] `getCountyByValue()` returns correct data
  - [ ] `getTownsByCounty()` returns correct towns
  - [ ] `searchTowns()` finds matches
  - [ ] `isValidCounty()` validates correctly

### ✅ Browser Testing

- [ ] Chrome (Desktop & Mobile)
- [ ] Firefox
- [ ] Safari (Desktop & Mobile)
- [ ] Edge

---

## API Reference

### Master Data Exports

```javascript
import {
  KENYA_COUNTIES,           // Array of all 47 counties
  KENYA_TOWNS_BY_COUNTY,    // Object mapping counties to towns
  POPULAR_TOWNS,            // Array of most popular towns
  COUNTIES_BY_REGION,       // Counties grouped by region

  // Helper functions
  getCountyByValue,         // Get county object by value
  getTownsByCounty,         // Get towns for a county
  getCountiesByRegion,      // Get counties by region
  searchTowns,              // Search towns across all counties
  getAllRegions,            // Get unique region names
  isValidCounty,            // Validate county value
  isValidTown,              // Validate town in county
} from '@/lib/kenyaLocations';
```

### Component Props

#### LocationSelector

```typescript
{
  county: string,              // Selected county value
  town: string,                // Selected town value
  onCountyChange: Function,    // County change handler
  onTownChange: Function,      // Town change handler
  countyError?: string,        // County error message
  townError?: string,          // Town error message
  countyLabel?: string,        // County label text
  townLabel?: string,          // Town label text
  countyPlaceholder?: string,  // County placeholder
  townPlaceholder?: string,    // Town placeholder
  required?: boolean,          // Required validation
  disabled?: boolean,          // Disable inputs
  className?: string,          // Custom CSS class
  layout?: 'row' | 'column',   // Layout direction
  size?: 'default' | 'compact' // Input size
}
```

#### CountySelect

```typescript
{
  value: string,               // Selected county
  onChange: Function,          // Change handler
  error?: string,              // Error message
  label?: string,              // Label text
  placeholder?: string,        // Placeholder text
  required?: boolean,          // Required validation
  disabled?: boolean,          // Disable input
  className?: string,          // Custom CSS class
  includeAllOption?: boolean,  // Show "All" option
  allOptionLabel?: string      // "All" option text
}
```

---

## Performance Notes

- **Component Size**: ~5KB gzipped
- **Data Size**: ~15KB for all counties and towns
- **Load Time**: Negligible (static data)
- **Bundle Impact**: Minimal (tree-shakeable)

---

## Future Enhancements

### Phase 4: Advanced Features (Optional)

1. **Autocomplete Search**
   - Implement searchable dropdowns
   - Use libraries like `react-select` or `@headlessui/react`

2. **Location Analytics**
   - Track most popular locations
   - Generate regional insights

3. **Map Integration**
   - Add Google Maps/Mapbox integration
   - Show vendor locations visually

4. **Internationalization**
   - Add support for other languages (Swahili)

---

## Support & Documentation

**Questions?** Check:
- This guide
- Component JSDoc comments
- Helper function documentation in `lib/kenyaLocations.js`

**Need Help?** Contact the development team

---

## Changelog

### December 17, 2025
- ✅ Created master location data file
- ✅ Built reusable LocationSelector component
- ✅ Added helper functions and validation
- ✅ Documented implementation guide

---

**Status**: ✅ Ready for Implementation
**Next Steps**: Begin Phase 1 form updates
