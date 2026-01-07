# SelectWithOther Component - Visual Guide

## Component Overview

The `SelectWithOther` component provides "Other" option + text input for ANY dropdown in your RFQ forms.

## Visual Layout

### Before User Selects "Other"

```
┌─────────────────────────────────────────┐
│ Roof Type *                             │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Select an option                  ▼ │ │
│ └─────────────────────────────────────┘ │
│ Select the main roof type               │
└─────────────────────────────────────────┘
```

### Dropdown Expanded

```
┌─────────────────────────────────────────┐
│ ┌─────────────────────────────────────┐ │
│ │ Select an option                    │ │
│ │ Metal Roof                          │ │
│ │ Clay Tiles                          │ │
│ │ Asphalt Shingles                    │ │
│ │ Concrete Tiles                      │ │
│ │ Slate                               │ │
│ │ Other (Please specify) ← USER CLICKS│ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### After User Selects "Other"

```
┌─────────────────────────────────────────┐
│ Roof Type *                             │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Other (Please specify)            ▼ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ✨ ORANGE BOX APPEARS BELOW ✨          │
│ ┌─────────────────────────────────────┐ │
│ │ Orange 50 Background               │ │
│ │ Orange Border                       │ │
│ │                                     │ │
│ │ Please specify *                    │ │
│ │ ┌─────────────────────────────────┐ │
│ │ │ e.g., Slate, Thatch, Solar...  │ │
│ │ │ [Green roof with solar panels..]│ │
│ │ └─────────────────────────────────┘ │
│ │                                     │ │
│ │ ℹ️ This field is required when      │ │
│ │    selecting "Other"                │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Component States

### State 1: Predefined Option Selected
```
Form State:
{
  roof_type: "Metal Roof",      // Standard option
  roof_type_other: ""           // Empty custom text
}

Display:
- Dropdown shows: "Metal Roof"
- Custom text input: HIDDEN
- No validation error
```

### State 2: "Other" Selected (Empty)
```
Form State:
{
  roof_type: "other",           // Special marker
  roof_type_other: ""           // Empty custom text
}

Display:
- Dropdown shows: "Other (Please specify)"
- Orange box appears
- Text input shown: EMPTY
- Validation: ❌ REQUIRED - show error if submit

Error Message: "Please specify the Roof Type"
```

### State 3: "Other" Selected (Filled)
```
Form State:
{
  roof_type: "other",                        // Special marker
  roof_type_other: "Green roof with solar"   // Custom text
}

Display:
- Dropdown shows: "Other (Please specify)"
- Orange box shows
- Text input filled: "Green roof with solar"
- Validation: ✅ VALID - can submit

Message: "ℹ️ This field is required when selecting 'Other'"
```

## Integration Example: Roofing Form

### Before (Standard Dropdown)
```
┌─────────────────────────────────────────┐
│ Roof Type                               │
│ ┌─────────────────────────────────────┐ │
│ │ Metal Roof                        ▼ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Problem: What if user has "Thatch"?     │
│         or "Green roof"?                │
│         Options are limited!            │
└─────────────────────────────────────────┘
```

### After (With SelectWithOther)
```
┌─────────────────────────────────────────┐
│ Roof Type *                             │
│ ┌─────────────────────────────────────┐ │
│ │ Select an option                  ▼ │ │
│ ├─────────────────────────────────────┤ │
│ │ ✓ Metal Roof                        │ │
│ │   Clay Tiles                        │ │
│ │   Asphalt Shingles                  │ │
│ │   Concrete Tiles                    │ │
│ │   Slate                             │ │
│ │   Other (Please specify) ← NEW      │ │
│ └─────────────────────────────────────┘ │
│ Select the main roof type               │
│                                         │
│ Solution: User can now select "Other"   │
│          and type "Green roof"!         │
└─────────────────────────────────────────┘
```

## Form State Management

### Using SelectWithOther Component

```javascript
// In your form component
const [formData, setFormData] = useState({
  roof_type: '',
  roof_type_other: '',
  fencing_type: '',
  fencing_type_other: '',
  floor_type: '',
  floor_type_other: '',
});

// Render component
<SelectWithOther
  label="Roof Type"
  options={['Metal Roof', 'Clay Tiles', 'Asphalt']}
  value={formData.roof_type}
  onChange={(val) => setFormData({...formData, roof_type: val})}
  onOtherChange={(val) => setFormData({...formData, roof_type_other: val})}
  otherValue={formData.roof_type_other}
  placeholder="e.g., Thatch, Green roof..."
  required={true}
/>
```

## Data Flow Diagram

```
USER INTERACTION
    │
    ├─ Clicks dropdown
    │
    ├─ Selects predefined option
    │  └─ onChange("Metal Roof")
    │     ├─ setFormData({ roof_type: "Metal Roof" })
    │     └─ Component: Custom input HIDDEN
    │
    └─ Selects "Other (Please specify)"
       └─ onChange("other")
          ├─ setFormData({ roof_type: "other" })
          └─ Component: Custom input VISIBLE
             │
             ├─ User types in custom input
             │  └─ onOtherChange("Green roof...")
             │     └─ setFormData({ roof_type_other: "Green roof..." })
             │
             └─ Validation on Submit
                ├─ If empty: ❌ REJECT
                └─ If filled: ✅ ACCEPT
                   └─ Send roof_type_other value to backend

BACKEND RECEIVES
{
  roof_type: "other",  // Marker that this is custom
  roof_type_other: "Green roof with solar panels",  // Custom value
  roof_type_is_custom: true  // Flag for tracking
}
```

## Side-by-Side Comparison

### Multiple Detail Dropdowns in One Form

```
┌────────────────────────────────────────────────┐
│ Create Roofing RFQ                             │
├────────────────────────────────────────────────┤
│                                                │
│ Roof Type *                                    │
│ ┌──────────────────────────────────────────┐  │
│ │ Select an option                       ▼ │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Roof Pitch *                                   │
│ ┌──────────────────────────────────────────┐  │
│ │ Select an option                       ▼ │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ Load Bearing *                                 │
│ ┌──────────────────────────────────────────┐  │
│ │ Select an option                       ▼ │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│           [SUBMIT RFQ]                        │
└────────────────────────────────────────────────┘

Each dropdown includes "Other (Please specify)"
Each has its own custom text input that appears
when "Other" is selected!
```

## Component Features Checklist

✅ **Flexible** - Works with any dropdown options  
✅ **Reusable** - Use same component for all detail fields  
✅ **Responsive** - Orange highlight makes custom selection clear  
✅ **Validated** - Requires text when "Other" selected  
✅ **Accessible** - Clear labels and helper text  
✅ **Focused** - Scrolls to error on validation fail  
✅ **Mobile-Friendly** - Works on all screen sizes  
✅ **Intuitive** - Shows input only when needed  

## Real-World Usage Examples

### Example 1: Roofing Project

```
User: "I have a green roof project"
Step 1: Selects "Roofing" category
Step 2: Form shows roofing details
Step 3: Selects "Roof Type" dropdown
Step 4: Sees options: Metal, Tile, Asphalt, Slate, Other
Step 5: Selects "Other (Please specify)"
Step 6: Orange box appears with text input
Step 7: Types: "Green roof with vegetation and drainage"
Step 8: Form submits with custom roof type
Step 9: Vendor sees: Roof Type: Green roof with vegetation...
```

### Example 2: Fencing Project

```
User: "I want bamboo fencing"
Step 1: Selects "Fencing" category
Step 2: Form shows fencing details
Step 3: Selects "Type of Fencing" dropdown
Step 4: Sees: Masonry wall, Chain-link, Metal panel, Other
Step 5: Selects "Other (Please specify)"
Step 6: Types: "Bamboo screening fence, 2m height, natural finish"
Step 7: Form submits with custom type
Step 8: Vendor sees custom specifications
Step 9: Vendor can quote accordingly
```

## Styling

The component uses:
- **Normal state**: Blue 50 background (when "Other" appears)
- **Wait, actually**: Orange 50 background (for consistency with your orange brand)
- **Border**: Orange 200 border
- **Text input**: Rounded gray border, orange focus ring
- **Label**: Slate 800 text with red * for required

## Accessibility

- Semantic HTML `<label>` and `<select>` tags
- Clear, descriptive labels
- Helper text explains the field
- Required indicator (*) for mandatory fields
- Focus states for keyboard navigation
- Error messages are clear and specific

---

**Next: Apply this component to all your category-specific detail dropdowns!**

See `ADDING_OTHER_TO_DETAIL_DROPDOWNS.md` for implementation guide.
