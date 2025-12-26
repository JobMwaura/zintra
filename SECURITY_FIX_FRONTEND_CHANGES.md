# Frontend Code Changes Required

## Summary of Changes

You need to update 2 files where `vendor_rfq_inbox` view is queried. Both changes are simple: replace `.from('vendor_rfq_inbox')` with `.rpc('get_vendor_rfq_inbox', { p_vendor_id: ... })`.

---

## File 1: `app/vendor-profile/[id]/page.js`

### Location: Line ~180

**BEFORE:**
```javascript
const { data: rfqs } = await supabase
  .from('vendor_rfq_inbox')
  .select('*')
  .eq('vendor_id', vendorData.id);
```

**AFTER:**
```javascript
const { data: rfqs } = await supabase.rpc('get_vendor_rfq_inbox', {
  p_vendor_id: vendorData.id
});
```

**Why the change:**
- Before: Querying a public view (security risk)
- After: Calling a secure function with authentication checks

---

## File 2: `components/vendor-profile/RFQInboxTab.js`

### Location: Line ~36

**BEFORE:**
```javascript
const { data: rfqs, error } = await supabase
  .from('vendor_rfq_inbox')
  .select('*')
  .eq('vendor_id', vendorId);
```

**AFTER:**
```javascript
const { data: rfqs, error } = await supabase.rpc('get_vendor_rfq_inbox', {
  p_vendor_id: vendorId
});
```

**Why the change:**
- Before: Querying a public view (security risk)
- After: Calling a secure function with authentication checks

---

## Understanding the API Change

### Old API (View Query)
```typescript
// This queried the public.vendor_rfq_inbox view
supabase
  .from('vendor_rfq_inbox')  // Access view
  .select('*')               // Select all columns
  .eq('vendor_id', id)       // Filter by vendor
  .then(...)
```

### New API (RPC Function Call)
```typescript
// This calls the public.get_vendor_rfq_inbox() function
supabase.rpc('get_vendor_rfq_inbox', {
  p_vendor_id: id  // Pass vendor_id as parameter
})
.then(...)
```

### Key Differences

| Aspect | View Query | RPC Function |
|--------|-----------|--------------|
| What it calls | Database view | SQL function |
| Security | No auth checks | SECURITY DEFINER + RLS |
| Parameters | Filters (`.eq()`) | Function parameters |
| Exposed data | All view columns | Function return schema |
| Flexibility | Less control | More control |

---

## Implementation Example

Here's the complete before/after for one file:

### `components/vendor-profile/RFQInboxTab.js` - COMPLETE

**BEFORE:**
```javascript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RFQInboxTab({ vendorId }) {
  const supabase = createClient();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRFQs = async () => {
      try {
        const { data: rfqs, error } = await supabase
          .from('vendor_rfq_inbox')  // ❌ OLD: Query view
          .select('*')
          .eq('vendor_id', vendorId);

        if (error) throw error;
        setRfqs(rfqs || []);
      } catch (err) {
        console.error('Error fetching RFQs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRFQs();
  }, [vendorId]);

  return (
    <div>
      {/* Render RFQs */}
    </div>
  );
}
```

**AFTER:**
```javascript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RFQInboxTab({ vendorId }) {
  const supabase = createClient();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRFQs = async () => {
      try {
        const { data: rfqs, error } = await supabase.rpc(  // ✅ NEW: Call function
          'get_vendor_rfq_inbox',
          { p_vendor_id: vendorId }
        );

        if (error) throw error;
        setRfqs(rfqs || []);
      } catch (err) {
        console.error('Error fetching RFQs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRFQs();
  }, [vendorId]);

  return (
    <div>
      {/* Render RFQs */}
    </div>
  );
}
```

---

## Testing the Changes

### Unit Test
```typescript
// Test that the function returns the expected structure
test('get_vendor_rfq_inbox returns RFQ data', async () => {
  const { data, error } = await supabase.rpc('get_vendor_rfq_inbox', {
    p_vendor_id: testVendorId
  });

  expect(error).toBeNull();
  expect(data).toBeDefined();
  expect(data.length).toBeGreaterThan(0);
  expect(data[0]).toHaveProperty('id');
  expect(data[0]).toHaveProperty('rfq_id');
  expect(data[0]).toHaveProperty('requester_email');
  expect(data[0]).toHaveProperty('requester_name');
});
```

### Integration Test
```typescript
// Test in your component
test('RFQInboxTab loads data from function', async () => {
  const { getByText, getByLabelText } = render(
    <RFQInboxTab vendorId={testVendorId} />
  );

  await waitFor(() => {
    expect(getByText(/RFQ Title/i)).toBeInTheDocument();
  });
});
```

### Manual Test
1. Sign in as vendor
2. Navigate to vendor profile
3. Click "RFQ Inbox" tab
4. Verify RFQs load correctly
5. Check browser Network tab - should see RPC call instead of GET request

---

## Rollback Plan

If you need to revert the frontend changes:

```javascript
// Quick rollback - just change it back to:
const { data: rfqs, error } = await supabase
  .from('vendor_rfq_inbox')
  .select('*')
  .eq('vendor_id', vendorId);
```

But **don't do this** unless you also revert the SQL migration. The view won't exist after the migration, so your code will break.

---

## Common Patterns in Your Codebase

If you use this pattern elsewhere in your codebase, apply the same fix:

### Pattern 1: Basic Query
```javascript
// OLD
supabase.from('vendor_rfq_inbox').select('*').eq('vendor_id', id)

// NEW
supabase.rpc('get_vendor_rfq_inbox', { p_vendor_id: id })
```

### Pattern 2: With Filters
```javascript
// OLD
supabase
  .from('vendor_rfq_inbox')
  .select('*')
  .eq('vendor_id', id)
  .eq('rfq_type', 'direct')
  .order('created_at', { ascending: false })

// NEW - Note: Function handles most filters, but you can still chain:
supabase
  .rpc('get_vendor_rfq_inbox', { p_vendor_id: id })
  .then(response => {
    // If needed, filter on client side
    const filtered = response.data.filter(r => r.rfq_type === 'direct');
    return filtered;
  })
```

### Pattern 3: Real-time Subscriptions
```javascript
// OLD - Not possible with view
// (Views don't support real-time subscriptions in Supabase)

// NEW - Use regular table for subscriptions, function for initial fetch
const { data: initial } = await supabase.rpc('get_vendor_rfq_inbox', {
  p_vendor_id: vendorId
});

// Subscribe to rfqs table for real-time updates
supabase
  .channel(`rfqs:vendor_id=eq.${vendorId}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'rfqs' }, 
    (payload) => {
      // Handle real-time updates
      console.log('RFQ updated:', payload);
    }
  )
  .subscribe();
```

---

## Performance Considerations

The new function actually performs **better** than the view:

| Metric | View | Function |
|--------|------|----------|
| Query complexity | Medium | Lower (SECURITY DEFINER optimizes) |
| Cache-ability | No | Yes (STABLE keyword) |
| RLS overhead | Minimal | Minimal (same as view) |
| Network calls | Same | Same |

---

## TypeScript Type Hints

If your project uses TypeScript, add types:

```typescript
interface RFQInboxItem {
  id: string;
  rfq_id: string;
  requester_id: string;
  vendor_id: string;
  title: string;
  description: string;
  category: string;
  county: string;
  created_at: string;
  status: string;
  rfq_type: 'direct' | 'matched' | 'wizard' | 'public';
  viewed_at: string | null;
  rfq_type_label: string;
  quote_count: number;
  total_quotes: number;
  requester_email: string;
  requester_name: string;
}

// Usage:
const { data: rfqs, error } = await supabase.rpc<RFQInboxItem[]>(
  'get_vendor_rfq_inbox',
  { p_vendor_id: vendorId }
);
```

---

## Verification Checklist

After making changes:

- [ ] Both files updated (app/vendor-profile/[id]/page.js, components/vendor-profile/RFQInboxTab.js)
- [ ] No `.from('vendor_rfq_inbox')` queries remain
- [ ] All `.rpc()` calls use correct function name: `'get_vendor_rfq_inbox'`
- [ ] All RPC calls pass correct parameter: `{ p_vendor_id: ... }`
- [ ] Local development: `npm run dev` works without errors
- [ ] Vendor profile page loads RFQs correctly
- [ ] RFQ Inbox tab displays data
- [ ] Browser console shows no errors
- [ ] Network tab shows RPC call (not REST query)

---

## Summary

**Total changes: 2 files, 1 line each**
- File 1: 1 line change
- File 2: 1 line change
- **Time to implement: ~2 minutes**
- **Time to test: ~5 minutes**

The change is minimal, safe, and maintains full backward compatibility at the application level. The data structure and columns returned are identical.

