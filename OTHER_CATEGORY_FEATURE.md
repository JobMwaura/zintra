# "Other" Category Feature for RFQs

## Overview

The "Other" category feature allows users to specify custom categories and detailed specifications for RFQs when the predefined category list doesn't match their needs. This provides flexibility for users with unique or specialized project requirements.

## User Experience

### For Buyers (Users Creating RFQs)

1. **Category Selection**
   - When creating an RFQ (Direct, Public, or Matched), users select from predefined categories
   - At the bottom of the category dropdown, they see: `Other (Please specify)`
   - Selecting "Other" reveals two additional fields:
     - **Custom Category Name** (required): e.g., "Plumbing", "Electrical", "Roofing"
     - **Additional Details** (optional): e.g., "Specific floor types, materials, or specifications"

2. **Form Validation**
   - If user selects "Other", they MUST provide a custom category name
   - The additional details field is optional but recommended for clarity
   - Form won't submit without custom category specified

3. **Submitted RFQ Display**
   - RFQs with custom categories show a "Custom" badge next to the category name
   - Custom details are visible to vendors receiving the RFQ
   - This helps vendors understand specialized requirements

### For Vendors (Users Responding to RFQs)

1. **RFQ Details View**
   - When viewing an RFQ with a custom category, vendors see:
     - The custom category name in the Category field
     - A "Custom" badge indicating it's user-specified
     - A dedicated "ADDITIONAL SPECIFICATIONS" section showing custom details

2. **Responding to Custom RFQs**
   - Vendors use the standard quote form (no changes needed)
   - They can reference custom specifications in their proposal description
   - Standard quote fields work the same way as for predefined categories

## Technical Implementation

### Database Schema Changes

Two new columns added to the `rfqs` table:

```sql
ALTER TABLE public.rfqs
ADD COLUMN custom_details text,
ADD COLUMN is_custom_category boolean DEFAULT false;
```

**Column Definitions:**
- `custom_details` (text, nullable): Additional specifications provided by buyer for custom categories
  - Example: "Terracotta floor tiles, not ceramic. Must be original designs from the 1950s."
- `is_custom_category` (boolean): Flag indicating if category is user-specified
  - `true` = Custom category from "Other" option
  - `false` = Standard predefined category

### Related Changes

A new column was also added to `rfq_responses` table:

```sql
ALTER TABLE public.rfq_responses
ADD COLUMN custom_response_details text;
```

This allows vendors to provide custom response details for specialized RFQs, though it's not required.

### Migration Script

The migration file `supabase/sql/ADD_CUSTOM_RFQ_FIELDS.sql` includes:
- Column additions with proper constraints
- Indexes for performance on `is_custom_category` and combined `category + is_custom_category`
- Backward compatibility notes

## Modified Components

### 1. DirectRFQPopup.js

**Changes:**
- Added `custom_category` and `custom_details` to form state
- Updated category dropdown to include "Other" option with value `"other"`
- Added conditional rendering: when `form.category === 'other'`, shows:
  - Text input for custom category name
  - Textarea for additional details
  - Blue info box explaining the field
- Form validation ensures custom category is filled if "Other" is selected
- RFQ submission includes:
  - `is_custom_category: form.category === 'other'`
  - `custom_details: form.custom_details || null`

**Example Form Data:**
```javascript
{
  title: "Flooring Restoration",
  description: "Need to restore 1950s tile floors",
  category: "Plumbing",  // User provided
  custom_details: "Terracotta tiles, original patterns, must preserve authenticity",
  is_custom_category: true,
  budget: "500,000 – 1,000,000",
  location: "Nairobi"
}
```

### 2. RFQ Respond Page (`app/vendor/rfq/[rfq_id]/respond/page.js`)

**Changes:**
- Enhanced RFQ summary card to show custom details
- Added "Custom" badge next to category when `rfq.is_custom_category === true`
- New conditional section displaying custom details in blue box
- Vendors see additional context for specialized projects

**Display Example:**
```
Category: Plumbing [Custom badge]
...
ADDITIONAL SPECIFICATIONS
Terracotta tiles, original patterns, must preserve authenticity
```

## Data Flow

```
User Creates RFQ with "Other" Category
           ↓
Form validates custom category name
           ↓
RFQ submitted with:
  - category: "Custom Category Name"
  - is_custom_category: true
  - custom_details: "specifications text"
           ↓
Stored in rfqs table
           ↓
Vendors search/browse RFQs
           ↓
Vendor views RFQ with custom details
           ↓
Vendor submits quote response
           ↓
RFQ Inbox shows all responses
```

## Benefits

1. **Flexibility**: Handles any category users might need, not just predefined ones
2. **Specificity**: Custom details field allows users to provide precise specifications
3. **Clarity**: Vendors understand non-standard requirements upfront
4. **Discoverability**: "Other" category RFQs are still searchable by custom category name
5. **Scalability**: Predefined categories can be expanded without system changes

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic "Other" category support
- ✅ Custom details field
- ✅ Display to vendors

### Phase 2 (Recommended)
- Aggregate custom categories used by buyers
- When same custom category used 5+ times, consider adding to predefined list
- Track vendor ratings by custom category
- Custom category analytics dashboard

### Phase 3 (Advanced)
- Allow vendors to create their own "Other" category responses
- Categorization suggestions based on custom details (ML/NLP)
- Template suggestions for custom categories
- Category synonym matching (e.g., "Plumbing" = "Pipes" = "Water Systems")

## Testing Checklist

- [ ] Direct RFQ with "Other" category submits successfully
- [ ] Custom category name validation works
- [ ] Custom details appear in vendor view
- [ ] "Custom" badge displays correctly
- [ ] Existing predefined category RFQs still work
- [ ] Search/filter includes custom categories
- [ ] Public RFQs with "Other" category work
- [ ] Matched RFQs with "Other" category work
- [ ] Database migration runs without errors
- [ ] Vendor response form doesn't break with custom categories

## Migration Instructions

### For Administrators

1. **Run the SQL Migration:**
   ```
   1. Go to Supabase dashboard
   2. Open SQL Editor
   3. Copy contents of supabase/sql/ADD_CUSTOM_RFQ_FIELDS.sql
   4. Run the migration
   5. Verify: Check rfqs table structure - should have custom_details and is_custom_category columns
   ```

2. **Deploy Code Changes:**
   ```
   git add components/DirectRFQPopup.js
   git add app/vendor/rfq/[rfq_id]/respond/page.js
   git add supabase/sql/ADD_CUSTOM_RFQ_FIELDS.sql
   git commit -m "FEATURE: Add 'Other' category support for custom RFQ specifications"
   git push origin main
   ```

3. **Verify Deployment:**
   - Test creating RFQ with "Other" category
   - Test viewing RFQ as vendor
   - Check that existing RFQs still display correctly

### For Developers

**API Contract Changes:**
When inserting into `rfqs` table, you can now include:
```javascript
{
  // ... existing fields ...
  category: string, // Can be custom value when is_custom_category=true
  custom_details: string | null, // Optional detailed specs
  is_custom_category: boolean // Flag for custom vs. predefined
}
```

**Querying Custom RFQs:**
```javascript
// Get only custom category RFQs
const { data } = await supabase
  .from('rfqs')
  .select('*')
  .eq('is_custom_category', true);

// Get specific custom category
const { data } = await supabase
  .from('rfqs')
  .select('*')
  .eq('category', 'Plumbing')
  .eq('is_custom_category', true);

// Get both custom and predefined
const { data } = await supabase
  .from('rfqs')
  .select('*')
  .eq('category', 'Electrical');
```

## FAQ

**Q: What if the custom category name is too long?**
A: The input field has no max length constraint, but ideally keep it under 50 characters for display purposes.

**Q: Can vendors search for custom categories?**
A: Yes, the category field is searchable. Custom categories are indexed the same way.

**Q: What happens if we add a predefined category later that matches a custom one?**
A: No automatic migration happens. Existing custom RFQs keep their custom flag. New users would see the predefined version. A future admin tool could consolidate if needed.

**Q: How do I filter to show only custom categories?**
A: Use `is_custom_category = true` in your SQL/API queries.

**Q: Should vendors also have custom categories?**
A: Currently vendors don't use the "Other" category. If needed in future, use the same approach: add `is_custom_category` to vendors table.

## Support

For questions or issues with the "Other" category feature:
1. Check this documentation first
2. Review modified component code (DirectRFQPopup.js)
3. Check database migration file for schema changes
4. Test the feature in staging environment before production
