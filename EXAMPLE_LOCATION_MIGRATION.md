# 📝 Example: Migrating to LocationSelector

This document shows a **complete before/after example** of migrating from free-text location inputs to the new standardized LocationSelector component.

---

## Example: Vendor Registration Form

**File**: `app/vendor-registration/page.js`

---

### 🔴 BEFORE (Old Implementation)

```javascript
'use client';

import { useState } from 'react';

export default function VendorRegistration() {
  const [formData, setFormData] = useState({
    businessName: '',
    county: '',                    // ❌ Free text input
    specificLocation: '',           // ❌ Free text input
    phone: '',
    // ... other fields
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <form>
      {/* Business Info Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3>Location Details</h3>

        {/* ❌ OLD: Free text input for county */}
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-1">
            County*
          </label>
          <input
            type="text"
            name="county"
            value={formData.county}
            onChange={handleInputChange}
            placeholder="e.g., Nairobi"
            className={`w-full rounded-lg border px-4 py-2.5 text-sm ${
              errors.county ? 'border-red-400' : 'border-slate-300'
            }`}
          />
          {errors.county && (
            <p className="text-xs text-red-500 mt-1">{errors.county}</p>
          )}
        </div>

        {/* ❌ OLD: Free text input for specific location */}
        <div>
          <label className="block text-sm font-medium text-slate-800 mb-1">
            Specific Location*
          </label>
          <input
            type="text"
            name="specificLocation"
            value={formData.specificLocation}
            onChange={handleInputChange}
            placeholder="e.g., Thika, Ruiru"
            className={`w-full rounded-lg border px-4 py-2.5 text-sm ${
              errors.specificLocation ? 'border-red-400' : 'border-slate-300'
            }`}
          />
          {errors.specificLocation && (
            <p className="text-xs text-red-500 mt-1">{errors.specificLocation}</p>
          )}
        </div>
      </div>
    </form>
  );
}
```

**Problems with OLD implementation:**
- ❌ Users can type anything: "Niarobi", "nbi", "Nairobi City"
- ❌ Inconsistent data in database
- ❌ Hard to filter and search
- ❌ Poor mobile experience
- ❌ No validation
- ❌ Spelling mistakes common

---

### ✅ AFTER (New Implementation)

```javascript
'use client';

import { useState } from 'react';
import LocationSelector from '@/components/LocationSelector';  // ✅ Import new component

export default function VendorRegistration() {
  const [formData, setFormData] = useState({
    businessName: '',
    county: '',                    // ✅ Now stores standardized value (e.g., 'nairobi')
    specificLocation: '',          // ✅ Now stores standardized town (e.g., 'Thika')
    phone: '',
    // ... other fields
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user makes changes
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <form>
      {/* Business Info Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3>Location Details</h3>

        {/* ✅ NEW: LocationSelector component */}
        <LocationSelector
          county={formData.county}
          town={formData.specificLocation}
          onCountyChange={(e) => handleInputChange({
            target: { name: 'county', value: e.target.value }
          })}
          onTownChange={(e) => handleInputChange({
            target: { name: 'specificLocation', value: e.target.value }
          })}
          countyError={errors.county}
          townError={errors.specificLocation}
          countyLabel="County"
          townLabel="Specific Location"
          required={true}
          layout="row"  // Places county and town side-by-side on desktop
        />
      </div>
    </form>
  );
}
```

**Benefits of NEW implementation:**
- ✅ Standardized data (no typos)
- ✅ Easy to filter and search
- ✅ Better UX (dropdowns)
- ✅ Mobile-friendly
- ✅ Built-in validation
- ✅ Auto-filtering (town based on county)

---

## Alternative: Even Simpler Implementation

If you want even less code, you can use inline handlers:

```javascript
<LocationSelector
  county={formData.county}
  town={formData.specificLocation}
  onCountyChange={(e) => setFormData({...formData, county: e.target.value, specificLocation: ''})}
  onTownChange={(e) => setFormData({...formData, specificLocation: e.target.value})}
  countyError={errors.county}
  townError={errors.specificLocation}
  required={true}
/>
```

---

## Validation Example

Update your validation function:

### 🔴 BEFORE

```javascript
const validateStep = () => {
  const newErrors = {};

  // ❌ Can't validate free text properly
  if (!formData.county.trim()) {
    newErrors.county = 'County is required';
  }

  if (!formData.specificLocation.trim()) {
    newErrors.specificLocation = 'Specific location is required';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### ✅ AFTER

```javascript
import { isValidCounty, isValidTown } from '@/lib/kenyaLocations';

const validateStep = () => {
  const newErrors = {};

  // ✅ Validate against known counties
  if (!formData.county) {
    newErrors.county = 'County is required';
  } else if (!isValidCounty(formData.county)) {
    newErrors.county = 'Please select a valid county';
  }

  // ✅ Validate town belongs to selected county
  if (!formData.specificLocation) {
    newErrors.specificLocation = 'Town is required';
  } else if (!isValidTown(formData.county, formData.specificLocation)) {
    newErrors.specificLocation = 'Please select a valid town for this county';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

---

## Form Submission Example

### Database Save

The form data now contains standardized values:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  // Data is now standardized!
  const vendorData = {
    company_name: formData.businessName,
    county: formData.county,              // e.g., 'nairobi'
    location: formData.specificLocation,  // e.g., 'Thika'
    phone: formData.phone,
    // ...
  };

  const { error } = await supabase
    .from('vendors')
    .insert([vendorData]);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Vendor saved with standardized location!');
  }
};
```

---

## Display Example

When displaying the location back to users:

### 🔴 BEFORE

```javascript
// Might display: "nbi" or "Nairobi City" or "nairobi"
<p>{vendor.county}</p>
```

### ✅ AFTER

```javascript
import { getCountyByValue } from '@/lib/kenyaLocations';

// Always displays: "Nairobi County"
const countyData = getCountyByValue(vendor.county);
<p>{countyData?.label || vendor.county}</p>
```

---

## Complete Migration Checklist for One Form

- [ ] 1. Import `LocationSelector` component
- [ ] 2. Import helper functions if needed
- [ ] 3. Replace input fields with `LocationSelector`
- [ ] 4. Update change handlers
- [ ] 5. Update validation logic
- [ ] 6. Test form submission
- [ ] 7. Test on mobile devices
- [ ] 8. Verify database saves correctly

---

## Quick Copy-Paste Template

```javascript
// 1. Add import at top of file
import LocationSelector from '@/components/LocationSelector';

// 2. Replace your location inputs with this:
<LocationSelector
  county={formData.county}
  town={formData.town}
  onCountyChange={(e) => setFormData({...formData, county: e.target.value, town: ''})}
  onTownChange={(e) => setFormData({...formData, town: e.target.value})}
  countyError={errors.county}
  townError={errors.town}
  required={true}
/>

// 3. That's it! You're done.
```

---

## Time Estimate

**Per form migration**: 10-15 minutes
- 5 min: Copy/paste and update props
- 5 min: Test locally
- 5 min: Fix any styling issues

**Total for all 7 forms**: ~2 hours

---

## Need Help?

If you get stuck:
1. Check [`LOCATION_IMPLEMENTATION_GUIDE.md`](LOCATION_IMPLEMENTATION_GUIDE.md)
2. Look at component JSDoc in [`components/LocationSelector.js`](components/LocationSelector.js)
3. Review helper functions in [`lib/kenyaLocations.js`](lib/kenyaLocations.js)

---

**Happy coding! 🚀**
