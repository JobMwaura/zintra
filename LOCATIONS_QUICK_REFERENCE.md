# 🗺️ Location Data - Quick Reference Guide

**Last Updated**: December 17, 2025

---

## 📦 Available Files

| File | Purpose | Coverage |
|------|---------|----------|
| `lib/kenyaLocations.js` | Kenya data | 47 counties, 300+ towns |
| `lib/southAfricaLocations.js` | South Africa data | 9 provinces, 180+ cities |
| `lib/zimbabweLocations.js` | Zimbabwe data | 10 provinces, 130+ cities |
| `components/LocationSelector.js` | Kenya component | Single country |
| `components/MultiCountryLocationSelector.js` | Multi-country component | All 3 countries |

---

## 🚀 Quick Start

### For Kenya Only

```javascript
import LocationSelector from '@/components/LocationSelector';

<LocationSelector
  county={formData.county}
  town={formData.town}
  onCountyChange={(e) => setFormData({...formData, county: e.target.value})}
  onTownChange={(e) => setFormData({...formData, town: e.target.value})}
  required={true}
/>
```

### For Multiple Countries

```javascript
import MultiCountryLocationSelector from '@/components/MultiCountryLocationSelector';

<MultiCountryLocationSelector
  country={formData.country}
  region={formData.region}
  city={formData.city}
  onCountryChange={(e) => handleCountryChange(e.target.value)}
  onRegionChange={(e) => handleRegionChange(e.target.value)}
  onCityChange={(e) => handleCityChange(e.target.value)}
  required={true}
  showFlags={true}
/>
```

---

## 📊 Data Overview

### Kenya 🇰🇪
- **Regions**: 8 (Nairobi, Central, Coast, Eastern, North Eastern, Western, Nyanza, Rift Valley)
- **Counties**: 47
- **Major Towns**: 300+
- **Top Cities**: Nairobi, Mombasa, Kisumu, Nakuru, Eldoret

### South Africa 🇿🇦
- **Regions**: 4 (Central, Eastern, Northern, Western)
- **Provinces**: 9
- **Major Cities**: 180+
- **Top Cities**: Johannesburg, Cape Town, Durban, Pretoria, Port Elizabeth

### Zimbabwe 🇿🇼
- **Regions**: 5 (Northern, Eastern, Southern, Western, Central)
- **Provinces**: 10
- **Major Cities**: 130+
- **Top Cities**: Harare, Bulawayo, Mutare, Gweru, Kwekwe

---

## 🔧 Common Helper Functions

### Kenya
```javascript
import {
  getCountyByValue,      // Get county object
  getTownsByCounty,      // Get towns array
  isValidCounty,         // Validate county
  isValidTown,           // Validate town
  searchTowns            // Search across all
} from '@/lib/kenyaLocations';
```

### South Africa
```javascript
import {
  getProvinceByValue,    // Get province object
  getCitiesByProvince,   // Get cities array
  isValidProvince,       // Validate province
  isValidCity,           // Validate city
  searchCities           // Search across all
} from '@/lib/southAfricaLocations';
```

### Zimbabwe
```javascript
import {
  getProvinceByValue,    // Get province object
  getCitiesByProvince,   // Get cities array
  isValidProvince,       // Validate province
  isValidCity,           // Validate city
  searchCities           // Search across all
} from '@/lib/zimbabweLocations';
```

---

## 💡 Common Use Cases

### 1. Vendor Registration Form
```javascript
// Kenya-only
<LocationSelector
  county={county}
  town={town}
  onCountyChange={handleCountyChange}
  onTownChange={handleTownChange}
  required={true}
/>

// Multi-country
<MultiCountryLocationSelector
  country={country}
  region={region}
  city={city}
  onCountryChange={handleCountryChange}
  onRegionChange={handleRegionChange}
  onCityChange={handleCityChange}
  required={true}
/>
```

### 2. RFQ Location Selection
```javascript
<LocationSelector
  county={formData.county}
  town={formData.location}
  onCountyChange={(e) => setFormData({...formData, county: e.target.value})}
  onTownChange={(e) => setFormData({...formData, location: e.target.value})}
  countyLabel="Project County"
  townLabel="Project Location"
  required={true}
/>
```

### 3. Browse/Filter Page
```javascript
import { CountySelect } from '@/components/LocationSelector';

<CountySelect
  value={filters.county}
  onChange={(e) => setFilters({...filters, county: e.target.value})}
  includeAllOption={true}
  allOptionLabel="All Counties"
/>
```

### 4. Display Location
```javascript
import { getCountyByValue } from '@/lib/kenyaLocations';

const countyData = getCountyByValue(vendor.county);
<p>{countyData?.label || vendor.county}</p>
```

---

## 🎨 Component Props

### LocationSelector (Kenya)
```typescript
{
  county: string,              // Selected county
  town: string,                // Selected town
  onCountyChange: Function,    // Change handler
  onTownChange: Function,      // Change handler
  countyError?: string,        // Error message
  townError?: string,          // Error message
  required?: boolean,          // Required validation
  disabled?: boolean,          // Disable inputs
  layout?: 'row' | 'column',   // Layout direction
}
```

### MultiCountryLocationSelector
```typescript
{
  country: string,             // Selected country
  region: string,              // Selected region/province/county
  city: string,                // Selected city
  onCountryChange: Function,   // Change handler
  onRegionChange: Function,    // Change handler
  onCityChange: Function,      // Change handler
  countryError?: string,       // Error message
  regionError?: string,        // Error message
  cityError?: string,          // Error message
  required?: boolean,          // Required validation
  disabled?: boolean,          // Disable inputs
  layout?: 'row' | 'column',   // Layout direction
  showFlags?: boolean,         // Show country flags
}
```

---

## 📋 Validation Example

```javascript
import { isValidCounty, isValidTown } from '@/lib/kenyaLocations';

const validateLocation = () => {
  const errors = {};
  
  if (!formData.county) {
    errors.county = 'County is required';
  } else if (!isValidCounty(formData.county)) {
    errors.county = 'Please select a valid county';
  }
  
  if (!formData.town) {
    errors.town = 'Town is required';
  } else if (!isValidTown(formData.county, formData.town)) {
    errors.town = 'Please select a valid town for this county';
  }
  
  return errors;
};
```

---

## 🗃️ Database Schema

### Recommended Columns

```sql
-- For Kenya-only platform
county VARCHAR(50),        -- e.g., 'nairobi'
location VARCHAR(100),     -- e.g., 'Thika'

-- For multi-country platform
country VARCHAR(20),       -- e.g., 'kenya', 'south_africa', 'zimbabwe'
region VARCHAR(50),        -- county/province value
city VARCHAR(100),         -- city/town name
```

---

## 🔍 Search Example

```javascript
import { searchTowns } from '@/lib/kenyaLocations';

const results = searchTowns('Nai');
// Returns: [
//   { town: 'Nairobi City', county: 'Nairobi County', countyValue: 'nairobi' },
//   { town: 'Naivasha', county: 'Nakuru County', countyValue: 'nakuru' }
// ]
```

---

## 📱 Mobile Optimization

All components use native `<select>` elements:
- ✅ Native mobile UI
- ✅ Touch-friendly
- ✅ Accessibility built-in
- ✅ Works offline once loaded

---

## 🌍 Country Codes

| Country | Code | Flag | Currency |
|---------|------|------|----------|
| Kenya | `kenya` | 🇰🇪 | KSh |
| South Africa | `south_africa` | 🇿🇦 | ZAR |
| Zimbabwe | `zimbabwe` | 🇿🇼 | USD/ZWL |

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `KENYA_LOCATIONS_SUMMARY.md` | Kenya overview |
| `MULTI_COUNTRY_LOCATIONS_SUMMARY.md` | Multi-country overview |
| `LOCATION_IMPLEMENTATION_GUIDE.md` | Full implementation guide |
| `EXAMPLE_LOCATION_MIGRATION.md` | Code examples |
| `LOCATIONS_QUICK_REFERENCE.md` | This file |

---

## ⚡ Performance

- **Load Time**: < 100ms (static data)
- **Bundle Size**: ~23KB gzipped (all 3 countries)
- **Memory**: Negligible
- **No API Calls**: All data client-side

---

## ✅ Checklist

### Implementation
- [ ] Choose single or multi-country
- [ ] Import appropriate component
- [ ] Add to form
- [ ] Handle change events
- [ ] Add validation
- [ ] Test thoroughly

### Database
- [ ] Add location columns
- [ ] Update existing forms
- [ ] Create indexes
- [ ] Test queries

### Testing
- [ ] Desktop browsers
- [ ] Mobile devices
- [ ] Form submission
- [ ] Data saves correctly
- [ ] Filters work

---

## 🆘 Troubleshooting

### Issue: Dropdown not showing options
**Solution**: Check that country/county is selected first

### Issue: Cities not filtering
**Solution**: Ensure region value matches data structure

### Issue: Validation failing
**Solution**: Use helper functions (isValidCounty, isValidCity)

### Issue: Mobile not working
**Solution**: Native selects should work everywhere - check disabled prop

---

## 💬 Quick Tips

1. **Always validate** using helper functions
2. **Reset dependent fields** when parent changes
3. **Use standardized values** (e.g., 'nairobi' not 'Nairobi')
4. **Display labels** to users (e.g., 'Nairobi County')
5. **Store values** in database (e.g., 'nairobi')

---

**Need More Help?**
- Read full guides in documentation files
- Check component JSDoc comments
- Review example migrations

---

**Status**: ✅ Ready to Use
**Last Updated**: December 17, 2025
