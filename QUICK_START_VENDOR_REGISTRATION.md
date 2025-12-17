# Quick Start: Implement Kenya Locations in Vendor Registration

**Time Required**: 10-15 minutes  
**Difficulty**: Easy  
**File**: `app/vendor-registration/page.js`

---

## 🎯 What You're Doing

Replacing two free text inputs:
- ❌ `county` (text input) → ✅ County dropdown
- ❌ `location` (text input) → ✅ Town dropdown

---

## 📋 Step-by-Step

### Step 1: Add Import (Line 1-20 area)

Find the import statements at the top and add:

```javascript
import LocationSelector from '@/components/LocationSelector';
```

**Location**: After other component imports

### Step 2: Check Current State (Search for "useState")

You should already have:
```javascript
const [county, setCounty] = useState('');
const [location, setLocation] = useState('');
```

If not, add them. Keep the same names!

### Step 3: Find the Current Inputs

Search for:
```javascript
<input
  ...
  name="county"
  ...
/>

<input
  ...
  name="location"
  ...
/>
```

These are the two you'll replace.

### Step 4: Replace with LocationSelector

Replace BOTH inputs with this single component:

```javascript
<LocationSelector
  county={county}
  town={location}
  onCountyChange={(e) => setCounty(e.target.value)}
  onTownChange={(e) => setLocation(e.target.value)}
  required={true}
/>
```

⚠️ **Important**: 
- `county={county}` - Use your state name
- `town={location}` - Maps to your location field
- `onCountyChange` and `onTownChange` - Keep these names

### Step 5: Update Form Submission

Find where you submit the form. Look for:

```javascript
const formData = {
  county: county,
  location: location,
  // ... other fields
}
```

**No changes needed!** The component uses the same state variable names.

### Step 6: Test

```bash
npm run build
```

- Open vendor registration form
- Select a county from dropdown
- Verify towns appear
- Select a town
- Submit form
- Verify data saves to database

---

## ✅ Done!

You've successfully:
- ✅ Replaced free text with dropdowns
- ✅ Added Kenya locations data
- ✅ Improved data consistency
- ✅ Made form faster (no typing)

---

## 🔍 Quick Reference

| What | Where | Status |
|------|-------|--------|
| LocationSelector component | `components/LocationSelector.js` | ✅ Exists |
| Kenya locations data | `lib/kenyaLocations.js` | ✅ Exists |
| Vendor registration form | `app/vendor-registration/page.js` | 🔴 Need to update |

---

## 🆘 Troubleshooting

**Problem**: Component not found  
**Solution**: Check import path is correct: `@/components/LocationSelector`

**Problem**: Dropdowns not showing  
**Solution**: Make sure you added the import statement

**Problem**: County state not clearing town  
**Solution**: Component handles this automatically

**Problem**: Data not saving  
**Solution**: Check form submission - you might need to add console.log to debug

---

## 🎬 Next Steps

After vendor registration works:

1. Do RFQ Direct (`app/post-rfq/direct/page.js`) - Same pattern
2. Do RFQ Wizard (`app/post-rfq/wizard/page.js`) - Same pattern
3. Do RFQ Public (`app/post-rfq/public/page.js`) - Same pattern
4. Do DirectRFQPopup (`components/DirectRFQPopup.js`) - Same pattern

All follow the exact same pattern!

---

**Need more details?** See `LOCATION_IMPLEMENTATION_GUIDE.md`

