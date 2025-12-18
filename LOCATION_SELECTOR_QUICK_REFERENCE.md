# LocationSelector - Quick Reference Guide

## Overview
The LocationSelector component provides a two-level dropdown for selecting Kenya counties and towns. It's fully integrated into the RFQ Wizard (Step 4) and other key pages of the Zintra platform.

---

## Quick Start

### Import
```javascript
import LocationSelector from '@/components/LocationSelector';
```

### Basic Usage
```javascript
<LocationSelector
  county={formData.county}
  town={formData.town}
  onCountyChange={(e) => setFormData({ ...formData, county: e.target.value })}
  onTownChange={(e) => setFormData({ ...formData, town: e.target.value })}
  required={true}
/>
```

---

## Props Reference

### Essential Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `county` | string | Yes | '' | Selected county value |
| `town` | string | Yes | '' | Selected town value |
| `onCountyChange` | function | Yes | - | Handler for county change |
| `onTownChange` | function | Yes | - | Handler for town change |

### Optional Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `required` | boolean | false | Makes fields required |
| `disabled` | boolean | false | Disables selectors |
| `layout` | string | 'row' | 'row' or 'column' layout |
| `size` | string | 'default' | 'default' or 'compact' size |
| `countyLabel` | string | 'County' | Custom county label |
| `townLabel` | string | 'Town/City' | Custom town label |
| `countyError` | string | '' | County error message |
| `townError` | string | '' | Town error message |
| `className` | string | '' | Additional CSS classes |

---

## Data Available

### Countries
All 47 Kenya counties alphabetically sorted:
```javascript
import { KENYA_COUNTIES } from '@/lib/kenyaLocations';
// [
//   { value: 'baringo', label: 'Baringo County', region: 'Rift Valley', code: '030' },
//   { value: 'bomet', label: 'Bomet County', region: 'Rift Valley', code: '036' },
//   ...
// ]
```

### Towns by County
```javascript
import { KENYA_TOWNS_BY_COUNTY } from '@/lib/kenyaLocations';
// {
//   nairobi: ['Nairobi City', 'Langata', 'Kasarani', ...],
//   mombasa: ['Mombasa', 'Kwa Jomvu', 'Likoni', ...],
//   ...
// }
```

---

## Examples

### Example 1: RFQ Wizard
```javascript
// In /app/post-rfq/wizard/page.js
<LocationSelector
  county={formData.county}
  town={formData.location}
  onCountyChange={(e) => {
    setFormData({ ...formData, county: e.target.value });
    setErrors({ ...errors, county: '' });
  }}
  onTownChange={(e) => {
    setFormData({ ...formData, location: e.target.value });
    setErrors({ ...errors, location: '' });
  }}
  required={true}
  errorMessage={errors.county || errors.location}
/>
```

### Example 2: Vendor Registration
```javascript
// Compact size for registration form
<LocationSelector
  county={formData.county}
  town={formData.town}
  onCountyChange={(e) => handleCountyChange(e)}
  onTownChange={(e) => handleTownChange(e)}
  size="compact"
  required={true}
  layout="column"
/>
```

### Example 3: With Custom Labels
```javascript
<LocationSelector
  county={formData.serviceCounty}
  town={formData.serviceCity}
  onCountyChange={(e) => setFormData({ ...formData, serviceCounty: e.target.value })}
  onTownChange={(e) => setFormData({ ...formData, serviceCity: e.target.value })}
  countyLabel="Service County"
  townLabel="Service City"
  required={true}
/>
```

---

## Validation

### Form Validation Pattern
```javascript
const validateLocation = () => {
  const errors = {};
  
  if (required) {
    if (!formData.county) errors.county = 'County is required';
    if (!formData.town) errors.town = 'Town is required';
  }
  
  return errors;
};
```

### Usage in Form
```javascript
const nextStep = () => {
  const errors = validateLocation();
  if (Object.keys(errors).length === 0) {
    // Proceed to next step
  } else {
    setErrors(errors);
  }
};
```

---

## Styling

### CSS Classes
The component uses Tailwind CSS classes:
- `grid grid-cols-1 md:grid-cols-2 gap-4` - Two-column layout on desktop
- `space-y-4` - Vertical layout option
- `rounded-lg border px-3` - Input styling
- `focus:ring-amber-500` - Focus color

### Custom Styling
```javascript
<LocationSelector
  {...props}
  className="my-custom-class"
/>
```

---

## Common Issues & Solutions

### Issue: Town dropdown empty after county selection
**Solution:** Ensure the county value matches the key in KENYA_TOWNS_BY_COUNTY

### Issue: Form not submitting
**Solution:** Check that both county and town are selected if required={true}

### Issue: Styles not applying
**Solution:** Ensure Tailwind CSS is properly configured in your project

### Issue: County changes but towns don't update
**Solution:** Clear the town value when county changes:
```javascript
const handleCountyChange = (e) => {
  setFormData({ ...formData, county: e.target.value, town: '' });
};
```

---

## Files Reference

### Component File
**Location:** `/components/LocationSelector.js`
- Main component implementation
- All UI and logic

### Data File
**Location:** `/lib/kenyaLocations.js`
- KENYA_COUNTIES - All 47 counties
- KENYA_TOWNS_BY_COUNTY - Towns by county mapping

---

## Integration Checklist

When integrating into new page:
- [ ] Import LocationSelector component
- [ ] Import location data if needed
- [ ] Add county and town to form state
- [ ] Create change handlers
- [ ] Add to JSX with required props
- [ ] Add validation logic
- [ ] Test county selection
- [ ] Test town filtering
- [ ] Test error messages
- [ ] Test form submission
- [ ] Test on mobile device

---

## Performance Tips

1. **Avoid Re-renders:** Memoize the component if using in list
2. **Validate on Change:** Clear errors as user types
3. **Debounce:** Not needed (dropdown, not search)
4. **Cache Data:** Data is imported once and reused

---

## Accessibility Features

✅ Semantic HTML labels
✅ Proper form field structure
✅ Error message associations
✅ Keyboard navigation support
✅ Screen reader compatible
✅ ARIA attributes where needed

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Related Components

- **RFQ Wizard:** `/app/post-rfq/wizard/page.js`
- **Vendor Registration:** `/app/vendor-registration/page.js`
- **Direct RFQ:** `/app/post-rfq/direct/page.js`

---

## Support

For issues or questions:
1. Check this quick reference
2. Review component source: `/components/LocationSelector.js`
3. Check integration examples in referenced files
4. Review validation patterns above

---

**Last Updated:** December 17, 2024
**Status:** ✅ Production Ready
**Version:** 1.0
