# 📝 VendorCard Component - Code Walkthrough

## File Location
`/components/VendorCard.jsx`

## Component Overview

A reusable, data-driven vendor card component that displays vendor information in a professional, responsive card layout. Pulls all data directly from vendor profile records.

---

## Component Structure

### 1. Import Statements
```jsx
'use client';

import Link from 'next/link';
import { Star, MapPin, Clock, Zap } from 'lucide-react';
import { VerificationMini } from '@/app/components/VerificationBadge';
```

**Why Each Import:**
- `'use client'` - Client component (needs interactivity and hooks)
- `Link` - Next.js navigation (fast client-side routing)
- `Lucide Icons` - Star (ratings), MapPin (location), Clock (response time), Zap (featured)
- `VerificationMini` - Reusable verification badge component

---

### 2. Component Declaration & Destructuring

```jsx
export function VendorCard({ vendor, className = '' }) {
  if (!vendor) return null;
```

**Props:**
- `vendor` - The vendor data object (required)
- `className` - Optional additional Tailwind classes for customization

**Safety Check:**
- Returns `null` if vendor is missing (graceful fallback)

---

### 3. Destructuring Vendor Data

```jsx
const {
  id,                          // For links
  company_name,                // Display as heading
  primary_category_slug,       // Preferred category field
  category,                    // Fallback category field
  rating = 0,                  // Default if missing
  rating_count = 0,            // Number of ratings
  response_time_minutes = 30,  // Default 30 mins
  location,                    // City/area
  county,                      // Region (fallback for location)
  logo_url,                    // URL to company logo
  is_verified = false,         // Verification status
  featured = false,            // Featured vendor flag
  description,                 // Company description (first words used)
  delivery_available = false,  // Delivery capability
  cover_image,                 // Reserved for future use
} = vendor;
```

**Default Values:**
- `rating = 0` - Shows 0.0 if no rating yet
- `rating_count = 0` - Shows (0) if no reviews
- `response_time_minutes = 30` - Standard response time
- `is_verified = false` - Not verified by default
- `featured = false` - Not featured by default
- `delivery_available = false` - No delivery by default

**Why Defaults Matter:**
- Prevents undefined/null rendering errors
- Shows realistic defaults
- No bad data breaks the card

---

### 4. Helper Functions

#### Function: Get Category Label
```jsx
const getCategoryLabel = () => {
  if (!primary_category_slug && !category) return 'Construction';
  const slug = primary_category_slug || category;
  return slug
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
```

**Purpose:** Convert slug to readable text  
**Example:**
- Input: `electrical-work`
- Output: `Electrical Work`

**Logic:**
1. Check if slug/category exists
2. Default to "Construction" if missing
3. Split slug by hyphens
4. Capitalize first letter of each word
5. Join with spaces

---

#### Function: Get Initials
```jsx
const getInitials = () => {
  return company_name
    ?.split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'V';
};
```

**Purpose:** Generate fallback logo text  
**Examples:**
- Input: `Johnson & Sons Ltd` → Output: `JS`
- Input: `ACME Corp` → Output: `AC`
- Input: Missing → Output: `V` (default)

**Logic:**
1. Split company name by spaces
2. Get first letter of each word
3. Join letters together
4. Convert to uppercase
5. Take first 2 letters only
6. Default to 'V' if company_name is missing

---

### 5. Calculate Display Values

```jsx
const categoryLabel = getCategoryLabel();
```

Pre-calculate the category label so it's ready for rendering.

---

## JSX Rendering Structure

### Main Card Container
```jsx
return (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full ${className}`}>
```

**Styling Breakdown:**
- `bg-white` - White background
- `rounded-xl` - Extra large rounded corners (16px)
- `shadow-sm` - Subtle shadow (default)
- `border border-gray-200` - Light gray border
- `hover:shadow-lg` - Larger shadow on hover (elevation effect)
- `transition-all duration-300` - Smooth 300ms hover animation
- `overflow-hidden` - Clip content to border radius
- `flex flex-col` - Vertical layout for sections
- `h-full` - Full height of grid cell
- `${className}` - Allow customization

---

### Section 1: Gradient Cover with Logo

```jsx
{/* Cover/Gradient + Logo Circle */}
<div className="relative h-32 sm:h-40 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden">
```

**Styling:**
- `relative` - Position context for absolute-positioned logo
- `h-32 sm:h-40` - 128px (mobile) / 160px (desktop)
- `bg-gradient-to-br` - Gradient from top-left to bottom-right
- `from-orange-400 to-orange-600` - Orange gradient colors
- `flex items-center justify-center` - Center content
- `overflow-hidden` - Clip pattern and logo overflow

---

#### Decorative Pattern
```jsx
<div
  className="absolute inset-0 opacity-10"
  style={{
    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
  }}
/>
```

**Purpose:** Add visual texture to gradient  
**What It Does:**
- Creates diagonal white lines (10px spacing)
- Opacity 10% for subtle effect
- Adds professional polish without clutter
- Uses inline style for complex CSS

---

#### Logo Circle
```jsx
<div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 z-10">
```

**Positioning:**
- `absolute` - Position relative to cover
- `bottom-0 left-1/2` - Bottom-center of cover
- `-translate-x-1/2` - Center horizontally
- `translate-y-1/3` - Move down 1/3 (overlaps cover/content)
- `z-10` - Stack above cover

**Logo with Image:**
```jsx
{logo_url ? (
  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center overflow-hidden">
    <img
      src={logo_url}
      alt={company_name}
      className="w-full h-full object-contain p-2"
    />
  </div>
```

**Sizing:**
- Mobile: `w-20 h-20` (80px)
- Desktop: `w-24 h-24` (96px)
- Always rounded-full (circle)
- White border for contrast
- Shadow for depth
- Image: `object-contain` keeps aspect ratio

**Logo Fallback (Initials):**
```jsx
) : (
  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center font-bold text-lg sm:text-2xl text-orange-600">
    {getInitials()}
  </div>
)}
```

**Features:**
- Same sizing as image version
- Orange text on white background
- Large bold text (text-lg/text-2xl)
- High contrast for readability

---

### Section 2: Content Area

```jsx
<div className="px-4 sm:px-6 pt-14 sm:pt-16 pb-4 sm:pb-6 flex-1 flex flex-col">
```

**Spacing:**
- `px-4 sm:px-6` - 16px (mobile) / 24px (desktop) horizontal
- `pt-14 sm:pt-16` - 56px (mobile) / 64px (desktop) top (space for logo)
- `pb-4 sm:pb-6` - 16px (mobile) / 24px (desktop) bottom
- `flex-1` - Takes remaining space
- `flex flex-col` - Vertical layout

---

#### Featured/Verified Chips

```jsx
<div className="flex items-center gap-2 mb-3">
  {featured && (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-semibold text-yellow-700">
      <Zap className="w-3.5 h-3.5" />
      Featured
    </span>
  )}
  {is_verified && (
    <VerificationMini size="sm" className="flex-shrink-0" />
  )}
</div>
```

**Logic:**
- Only show if `featured === true`
- Only show if `is_verified === true`
- Can show both simultaneously
- Flex layout for horizontal alignment
- Gap between chips

**Featured Chip Styling:**
- Yellow background (yellow-50)
- Yellow border and text (yellow-200, yellow-700)
- Zap icon with text
- Rounded pill shape (rounded-full)
- Extra small font (text-xs)

**Verified Chip:**
- Uses reusable VerificationMini component
- Matches design system
- Compact size (size="sm")

---

#### Vendor Name

```jsx
<h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
  {company_name}
</h3>
```

**Styling:**
- `text-lg sm:text-xl` - Large, prominent heading
- `font-bold` - Bold weight
- `text-gray-900` - Dark gray (high contrast)
- `mb-2` - Margin below
- `line-clamp-2` - Max 2 lines (prevents overflow)

---

#### Category Chips

```jsx
<div className="flex flex-wrap gap-2 mb-4">
  <span className="inline-flex items-center px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full text-xs font-medium text-orange-700">
    {categoryLabel}
  </span>
  {description && (
    <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 line-clamp-1">
      {description.split(' ').slice(0, 3).join(' ')}
    </span>
  )}
</div>
```

**Primary Category Chip:**
- Orange styling (consistent with brand)
- Rounded pill (rounded-full)
- Icon with text
- Extra small font

**Description Chip:**
- Only shows if description exists
- Gray styling (secondary)
- First 3 words only (slice(0, 3))
- Line clamp to prevent overflow

---

#### Rating & Response Time

```jsx
<div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
  {/* Rating */}
  <div className="flex items-center gap-1">
    <div className="flex items-center">
      <Star className="w-4 h-4 text-yellow-400 fill-current" />
      <span className="ml-1 font-semibold text-gray-900">
        {rating.toFixed(1)}
      </span>
      {rating_count > 0 && (
        <span className="ml-1 text-gray-500">
          ({rating_count})
        </span>
      )}
    </div>
  </div>

  {/* Response Time */}
  <div className="flex items-center gap-1 text-gray-600">
    <Clock className="w-4 h-4" />
    <span className="text-xs sm:text-sm">Responds in {response_time_minutes}m</span>
  </div>
</div>
```

**Rating Section:**
- Yellow star icon (filled)
- Rating number: `toFixed(1)` format (e.g., 4.9)
- Rating count: Only shows if > 0
- Bold number for emphasis

**Response Time Section:**
- Clock icon
- Text: "Responds in Xm"
- Responsive text size

---

#### Location & Delivery

```jsx
<div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
  {/* Location */}
  <div className="flex items-center gap-1">
    <MapPin className="w-4 h-4" />
    <span className="text-xs sm:text-sm font-medium">{location || county || 'Kenya'}</span>
  </div>

  {/* Delivery Available */}
  {delivery_available && (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
      ✓ Delivery available
    </span>
  )}
</div>
```

**Location:**
- MapPin icon
- Priority: location > county > "Kenya"
- Font medium weight
- Responsive sizing

**Delivery Badge:**
- Only shows if `delivery_available === true`
- Green styling (positive/success color)
- Checkmark icon
- Rounded pill design

---

#### Action Buttons

```jsx
<div className="flex gap-3 mt-auto">
  {/* Request Quote Button */}
  <Link href={`/post-rfq?vendor_id=${id}`} className="flex-1">
    <button className="w-full px-4 py-2.5 sm:py-3 bg-white border-2 border-orange-500 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors text-sm">
      Request Quote
    </button>
  </Link>

  {/* View Profile Button */}
  <Link href={`/vendor-profile/${id}`} className="flex-1">
    <button className="w-full px-4 py-2.5 sm:py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors text-sm">
      View Profile
    </button>
  </Link>
</div>
```

**Container:**
- `flex gap-3` - Two equal buttons with 12px spacing
- `mt-auto` - Pushes buttons to bottom (flexbox property)

**Request Quote Button (Secondary):**
- White background
- Orange border (2px)
- Orange text
- Hover: Orange-50 background
- Links to `/post-rfq?vendor_id={id}`

**View Profile Button (Primary):**
- Orange background
- White text
- Hover: Darker orange-700
- Links to `/vendor-profile/{id}`

**Both Buttons:**
- `flex-1` - Equal width
- `w-full` - Full container width
- `py-2.5 sm:py-3` - 10px (mobile) / 12px (desktop) padding
- `font-semibold` - Bold text
- `transition-colors` - Smooth color change on hover
- `text-sm` - Small but readable text

---

## Component Usage Examples

### Basic Usage
```jsx
import { VendorCard } from '@/components/VendorCard';

// In a grid
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {vendors.map(vendor => (
    <VendorCard key={vendor.id} vendor={vendor} />
  ))}
</div>
```

### With Custom Styling
```jsx
<VendorCard 
  vendor={vendorData} 
  className="md:col-span-2 lg:col-span-1"
/>
```

### In Browse Page
```jsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredVendors.map((vendor) => (
    <VendorCard key={vendor.id} vendor={vendor} />
  ))}
</div>
```

### In Home Page
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {featuredVendors.map((vendor) => (
    <VendorCard key={vendor.id} vendor={vendor} />
  ))}
</div>
```

---

## Component Flow Diagram

```
VendorCard Component
    │
    ├─ Props: { vendor, className? }
    │
    ├─ Safety Check
    │   └─ Return null if vendor missing
    │
    ├─ Destructure vendor data
    │   ├─ id, company_name, rating...
    │   └─ Apply default values
    │
    ├─ Calculate helpers
    │   ├─ getCategoryLabel()
    │   └─ getInitials()
    │
    ├─ Render card
    │   ├─ Cover section
    │   │   ├─ Gradient background
    │   │   ├─ Decorative pattern
    │   │   └─ Logo circle
    │   │
    │   ├─ Content section
    │   │   ├─ Featured/Verified chips
    │   │   ├─ Vendor name
    │   │   ├─ Category chips
    │   │   ├─ Rating & response time
    │   │   ├─ Location & delivery
    │   │   └─ Action buttons
    │   │
    │   └─ Return JSX
    │
    └─ Export component
```

---

## Performance Characteristics

### Time Complexity
- **Rendering:** O(1) - No loops or nested data processing
- **Calculations:** O(1) - String operations on fixed data
- **DOM Updates:** O(1) - Static content

### Space Complexity
- **Props:** Small object (< 20 fields)
- **Component:** Single render output
- **Memory:** Minimal, no large data structures

### Optimization Opportunities
1. Could add React.memo() for optimization
   ```jsx
   export const VendorCard = React.memo(function VendorCard({ vendor, className }) {
     // ... component code
   });
   ```

2. Could extract helper functions to useMemo():
   ```jsx
   const categoryLabel = useMemo(() => getCategoryLabel(), [vendor.category]);
   ```

3. Currently optimized for simplicity - optimization not needed

---

## Browser Compatibility

✅ Works in:
- Chrome/Chromium (all versions)
- Safari (15+)
- Firefox (latest)
- Edge (latest)
- Mobile browsers

🎯 Uses modern CSS:
- CSS Grid ✓
- Flexbox ✓
- CSS Transitions ✓
- CSS Gradients ✓
- Border Radius ✓

---

## Testing Strategy

### Unit Tests (If needed)
```javascript
describe('VendorCard', () => {
  it('renders null when vendor is missing', () => {
    const { container } = render(<VendorCard vendor={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays vendor name', () => {
    const vendor = { company_name: 'Test Co' };
    render(<VendorCard vendor={vendor} />);
    expect(screen.getByText('Test Co')).toBeInTheDocument();
  });

  it('shows featured badge when featured=true', () => {
    const vendor = { featured: true, company_name: 'Test' };
    render(<VendorCard vendor={vendor} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist
- [ ] All data displays correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Buttons navigate to correct URLs
- [ ] Hover effects work smoothly
- [ ] Missing data handled gracefully
- [ ] Logo displays from URL
- [ ] Fallback initials work
- [ ] All badges show/hide correctly
- [ ] Card aligns properly in grid

---

## Related Files

- **Pages Using:** `/app/browse/page.js`, `/app/page.js`
- **Components Used:** `VerificationMini` from `@/app/components/VerificationBadge`
- **Icons From:** `lucide-react`
- **Navigation:** `next/link`
- **Database:** Vendors table from Supabase

---

**Component Status:** ✅ Production Ready  
**Last Updated:** 28 January 2026  
**Version:** 1.0  
**Lines of Code:** ~180 lines (with comments)
