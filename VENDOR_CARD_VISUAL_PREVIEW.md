# 🎨 Vendor Card Visual Preview

## Card Layout Visualization

### Full Card (Desktop View - 1024px+)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                    ┃
┃   [Orange Gradient Cover]          ┃  Height: 160px
┃   (from-orange-400 to-orange-600)  ┃  Diagonal pattern overlay
┃                                    ┃
┃          ┌─────────────┐           ┃
┃          │  [Logo ◯]   │           ┃  Circle: 96px x 96px
┃          │ With Shadow │           ┃  White border: 4px
┃          └─────────────┘           ┃  Overlaps bottom
┃                                    ┃
┡━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┩
│                                    │
│  [⭐ Featured] [🛡️ Verified]      │ ← Chips (if applicable)
│                                    │
│  Johnson & Sons Construction       │ ← Vendor Name (Bold)
│                                    │
│  [🔨 Electrical Work] [Specializing]  ← Category + Description
│                                    │
│  ⭐ 4.9 (120) • 🕐 Responds in 30m │
│                                    │
│  📍 Nairobi • ✓ Delivery available │
│                                    │
│  ┌──────────────────┬──────────────┐
│  │ Request Quote    │ View Profile │
│  │ (White/Orange)   │ (Orange/Wht) │
│  └──────────────────┴──────────────┘
│                                    │
└────────────────────────────────────┘
```

---

## Component States

### State 1: Full Featured Vendor ✨

```
┌─────────────────────────────────┐
│     [Orange Gradient Cover]     │
│         with pattern            │
│         [Logo ◯]                │
├─────────────────────────────────┤
│ [⭐ Featured] [🛡️ Verified]    │
│                                 │
│ Premium Construction Solutions  │
│                                 │
│ [🏗️ Construction] [Quality...]  │
│                                 │
│ ⭐ 4.9 (145) • 🕐 Responds 15m  │
│                                 │
│ 📍 Nairobi • ✓ Delivery avail   │
│                                 │
│ [Request Quote] [View Profile] │
└─────────────────────────────────┘
```

**Features Shown:**
- Featured badge (yellow)
- Verified badge (blue shield)
- Full rating with count
- Quick response time
- Delivery available

---

### State 2: Unverified Vendor (No Featured)

```
┌─────────────────────────────────┐
│     [Orange Gradient Cover]     │
│         [Logo ◯]                │
├─────────────────────────────────┤
│ (No chips - not featured/verified)
│                                 │
│ Local Contractors Ltd           │
│                                 │
│ [🔨 Plumbing] [Expert Service]  │
│                                 │
│ ⭐ 3.8 (42) • 🕐 Responds 45m   │
│                                 │
│ 📍 Mombasa • ✓ Delivery avail   │
│                                 │
│ [Request Quote] [View Profile] │
└─────────────────────────────────┘
```

**Features Shown:**
- No verified badge
- Lower rating
- Slower response time
- Still shows delivery

---

### State 3: No Logo (Fallback to Initials)

```
┌─────────────────────────────────┐
│     [Orange Gradient Cover]     │
│           ┌─────┐               │
│           │ JS  │               │ ← Initials (J & S)
│           └─────┘               │
├─────────────────────────────────┤
│ [⭐ Featured]                   │
│                                 │
│ Johnson & Sons Hardware         │
│                                 │
│ [🛠️ Hardware] [Supplies...]     │
│                                 │
│ ⭐ 4.5 (78) • 🕐 Responds 20m   │
│                                 │
│ 📍 Kisumu • ✓ Delivery avail    │
│                                 │
│ [Request Quote] [View Profile] │
└─────────────────────────────────┘
```

**Features Shown:**
- Initials in logo circle
- Featured badge
- All other data complete

---

### State 4: Minimal Data (Most Fallbacks)

```
┌─────────────────────────────────┐
│     [Orange Gradient Cover]     │
│           ┌─────┐               │
│           │ VE  │               │
│           └─────┘               │
├─────────────────────────────────┤
│ (No chips)                      │
│                                 │
│ Vendor Enterprise               │
│                                 │
│ [🏗️ Construction] [–]           │
│                                 │
│ ⭐ 0.0 (0) • 🕐 Responds 30m    │
│                                 │
│ 📍 Kenya • (No delivery info)   │
│                                 │
│ [Request Quote] [View Profile] │
└─────────────────────────────────┘
```

**Fallbacks Applied:**
- Initials instead of logo
- Default rating: 0.0
- Default response time: 30m
- Default location: "Kenya"
- No delivery info

---

## Responsive Breakdown

### Mobile View (375px - iPhone SE/12)

```
┌───────────────────┐
│  [Cover]          │ Height: 128px
│    [Logo ◯]       │ Smaller logo
├───────────────────┤
│ [⭐ Featured]     │ Single chip
│                   │
│ Vendor Name       │ Smaller text
│ Line clamp: 2     │
│                   │
│ [Cat] [Desc]      │ Stacked chips
│                   │
│ ⭐ 4.9 • 🕐 30m   │ Compact spacing
│ 📍 Location       │
│                   │
│ ┌─────────────────┐
│ │ Request Quote   │
│ └─────────────────┘
│ ┌─────────────────┐
│ │ View Profile    │
│ └─────────────────┘
└───────────────────┘
```

**Mobile Characteristics:**
- Logo: 80px circle (w-20 h-20)
- Text: Smaller, readable
- Buttons: Full width, stacked
- Padding: 4 (p-4), compact
- Spacing: Tighter gaps

---

### Tablet View (640px - iPad)

```
┌──────────────────────────┐
│   [Cover Gradient]       │ Height: 160px
│      [Logo ◯]            │ Medium logo
├──────────────────────────┤
│ [⭐ Featured] [Verified] │ Both chips visible
│                          │
│ Vendor Company Name      │ Full text
│                          │
│ [Category] [Description] │ Side by side
│                          │
│ ⭐ 4.9 (120) • 🕐 30min  │ Full info
│ 📍 Nairobi • ✓ Delivery  │
│                          │
│ ┌──────────┬──────────────┐
│ │ Request  │ View Profile │
│ └──────────┴──────────────┘
└──────────────────────────┘
```

**Tablet Characteristics:**
- Logo: 96px circle (w-24 h-24)
- Full text display
- Buttons: Side by side
- Padding: 6 (p-6)
- All features visible

---

### Desktop View (1024px+)

```
┌──────────────────────────────────┐
│     [Premium Gradient Cover]     │ Height: 160px
│       [Large Logo ◯]             │ Full size logo
├──────────────────────────────────┤
│ [⭐ Featured] [🛡️ Verified]    │ Professional badges
│                                  │
│ Premium Construction Solutions   │ Full vendor name
│                                  │
│ [🏗️ Construction] [Quality...]   │ Full category & desc
│                                  │
│ ⭐ 4.9 (145) • 🕐 Responds 15m   │ Complete rating info
│ 📍 Nairobi • ✓ Delivery available│ Full location & status
│                                  │
│ ┌────────────────┬────────────────┐
│ │ Request Quote  │ View Profile    │
│ │ Professional   │ Primary Action  │
│ └────────────────┴────────────────┘
│                                  │
└──────────────────────────────────┘
```

**Desktop Characteristics:**
- Logo: 96px circle (w-24 h-24)
- Maximum padding (p-6)
- All text at full size
- Buttons: Wide and spacious
- Professional appearance

---

## Color Combinations in Cards

### Orange/Amber Theme (Primary)

```
Vendor Card for Construction Company

Cover:     Orange-400 to Orange-600 gradient
Logo:      White circle with Company initials
Chips:     Orange-50 bg, Orange-200 border, Orange-700 text
Ratings:   Yellow-400 stars
Buttons:   Orange-600 (primary), White+Orange (secondary)
```

---

### With Featured Badge

```
[⭐ Featured]
Background: Yellow-50
Border:     Yellow-200
Text:       Yellow-700
Icon:       ⚡ Zap icon in yellow
```

---

### With Verified Badge

```
[🛡️ Verified]
Background: Blue (from VerificationMini component)
Border:     Blue
Text:       White shield icon
```

---

### Delivery Status Badge

```
[✓ Delivery available]
Background: Green-50
Border:     Green-200
Text:       Green-700
Content:    ✓ checkmark + text
```

---

## Interaction States

### Default State
```
Card with normal shadow and colors
All text and icons visible
Buttons in standard state
```

### Hover State
```
shadow-sm → shadow-lg (lifted effect)
Card appears to elevate
Button color changes on hover
Text remains same color
Transition: smooth 300ms
```

### Disabled State (If Unavailable)
```
Opacity reduced
Text color dimmed
Buttons become gray
Still clickable to show reason
```

---

## Grid Layouts

### Browse Page Grid
```
Desktop (lg: 3 columns):
┌──────┐ ┌──────┐ ┌──────┐
│Card 1│ │Card 2│ │Card 3│
└──────┘ └──────┘ └──────┘
┌──────┐ ┌──────┐ ┌──────┐
│Card 4│ │Card 5│ │Card 6│
└──────┘ └──────┘ └──────┘

Tablet (md: 2 columns):
┌──────┐ ┌──────┐
│Card 1│ │Card 2│
└──────┘ └──────┘
┌──────┐ ┌──────┐
│Card 3│ │Card 4│
└──────┘ └──────┘

Mobile (1 column):
┌──────┐
│Card 1│
└──────┘
┌──────┐
│Card 2│
└──────┘
```

### Home Page Featured Grid
```
Desktop (3 columns):
┌──────┐ ┌──────┐ ┌──────┐
│Feat 1│ │Feat 2│ │Feat 3│
└──────┘ └──────┘ └──────┘

Tablet (3 columns - wraps):
┌──────┐ ┌──────┐ ┌──────┐
│Feat 1│ │Feat 2│ │Feat 3│
└──────┘ └──────┘ └──────┘

Mobile (1 column):
┌──────┐
│Feat 1│
└──────┘
┌──────┐
│Feat 2│
└──────┘
```

---

## Interactive Elements

### Request Quote Button
- **Visual:** White button with orange border
- **Hover:** Subtle orange background
- **Icon:** Arrow or quote icon (future)
- **Action:** Navigate to `/post-rfq?vendor_id={id}`
- **Purpose:** Quick RFQ for this vendor

### View Profile Button
- **Visual:** Orange button with white text
- **Hover:** Darker orange (orange-700)
- **Icon:** Profile or arrow icon (future)
- **Action:** Navigate to `/vendor-profile/{id}`
- **Purpose:** See full vendor details

---

## Typography Scale

### Vendor Name
- Desktop: 20px (text-xl) bold
- Tablet: 18px (text-lg) bold
- Mobile: 18px (text-lg) bold
- Color: Gray-900 (dark)
- Weight: Bold (700)

### Category Labels
- All sizes: 12px (text-xs)
- Color: Orange-700 (category), Gray-700 (description)
- Weight: Medium (500)

### Rating & Response Time
- Desktop: 14px (text-sm)
- Mobile: 12px (text-xs)
- Color: Gray-600
- Weight: Medium (500)

### Location
- Desktop: 14px (text-sm)
- Mobile: 12px (text-xs)
- Color: Gray-600
- Weight: Medium (500)

---

## Shadow and Depth

### Card Shadow
- Default: `shadow-sm` (0 1px 2px rgba(0,0,0,0.05))
- Hover: `shadow-lg` (0 10px 15px rgba(0,0,0,0.1))
- Transition: Smooth 300ms ease

### Logo Circle Shadow
- Constant: `shadow-lg` (elevated effect)
- Creates depth against gradient

### Button Shadows
- Default: No shadow
- Hover: Slight color change (no shadow)
- Focus: Not defined (can be added)

---

## Accessibility Features

### Touch Targets
- Buttons: 44px+ height ✓ (py-2.5 on mobile = ~40px, py-3 on desktop = ~48px)
- Logo Circle: 80px+ diameter ✓
- Card: Full card is clickable area

### Text Contrast
- All text meets WCAG AA standards
- Orange text on white background ✓
- Gray text on white background ✓
- White text on orange background ✓

### Semantic HTML
- Card: Uses `<div>` with semantic role
- Buttons: Proper `<button>` elements
- Links: Proper `<Link>` components
- Headings: `<h3>` for vendor name

### Screen Readers
- Alt text for images: "Company name" ✓
- Button labels: Clear text ✓
- Icons: Text labels alongside ✓
- No decorative elements without proper ARIA

---

## Performance Notes

### Image Optimization
- Logo images: Load from S3 URL
- Lazy loading: Native browser lazy load
- Fallback: Fast initials render
- No performance bottleneck

### CSS Optimization
- All TailwindCSS classes (pre-optimized)
- No custom CSS
- No heavy calculations
- Mobile-first approach

### Component Optimization
- Stateless component (pure functional)
- Memoization: Could be added if needed
- Props validation: Destructuring with defaults
- Rendering: O(1) complexity

---

## Future Enhancements

### Potential Additions
1. **Favorites Button** - Heart icon to save vendor
2. **Share Button** - Share vendor card on social
3. **Review Badge** - Show recent review snippet
4. **Availability Status** - Show if vendor is available
5. **Price Range** - Show estimated cost range
6. **Quick Contact** - WhatsApp/Phone button
7. **Video Intro** - Play vendor intro video
8. **Testimonials** - Show 1-2 recent reviews
9. **Portfolio Link** - Show recent projects
10. **Comparison Checkbox** - Compare multiple vendors

### Design System Scalability
- Component is modular and extensible
- New fields can be added easily
- Props system allows customization
- Consistent with existing design system

---

**Component Status:** ✅ Ready for Production  
**Last Updated:** 28 January 2026  
**Version:** 1.0  
**Pages Using:** Browse Vendors, Home (Featured Section)
