# Fallback Simplified Response Endpoint

## What Is This?

If the full vendor response endpoint has issues with database columns/schema, this is a **simplified version** that inserts only essential fields and will work even if new columns don't exist.

## When To Use This

**Use if:**
- Error says "column does not exist"
- Error says "undefined column"
- RFQ_RESPONSES table is old schema
- You want to test without adding columns

**Don't use if:**
- New quote form features are needed
- You want to store pricing details
- You need the comprehensive quote form

---

## The Simplified Endpoint

Save this as a new file: `app/api/rfq/[rfq_id]/response-simple/route.js`

```javascript
'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * SIMPLIFIED VERSION - Only essential fields
 * Use this if full version fails with "column does not exist" error
 */
export async function POST(request, { params }) {
  try {
    const { rfq_id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const {
      quoted_price,
      currency = 'KES',
      delivery_timeline,
      description,
      quote_title,
      intro_text
    } = await request.json();

    // Get vendor profile
    const { data: vendorProfile } = await supabase
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .single();

    const vendorId = vendorProfile?.id || user.id;

    // Check if RFQ exists
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('id, title, user_id, status')
      .eq('id', rfq_id)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    }

    // Only insert essential columns
    const { data: response, error: responseError } = await supabase
      .from('rfq_responses')
      .insert([{
        rfq_id: rfq_id,
        vendor_id: vendorId,
        quoted_price: quoted_price,
        currency: currency,
        delivery_timeline: delivery_timeline,
        description: description,
        status: 'submitted',
        vendor_name: vendorProfile?.business_name || 'Vendor'
      }])
      .select()
      .single();

    if (responseError) {
      console.error('Response error:', responseError);
      return NextResponse.json(
        { 
          error: 'Failed to submit: ' + responseError.message,
          code: responseError.code
        },
        { status: 500 }
      );
    }

    // Notify requester
    await supabase.from('notifications').insert([{
      user_id: rfq.user_id,
      type: 'rfq_response',
      title: 'New Quote Received',
      message: `${vendorProfile?.business_name} submitted a quote for "${rfq.title}"`,
      resource_type: 'rfq_response',
      resource_id: response.id
    }]).catch(() => {});

    return NextResponse.json({
      success: true,
      response: response,
      message: 'Quote submitted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## How To Use This Fallback

### Step 1: Create the File
In your project, create:
```
app/api/rfq/[rfq_id]/response-simple/route.js
```

Paste the code above.

### Step 2: Update Frontend To Use It

In `app/vendor/rfq/[rfq_id]/respond/page.js`, change:

**Before:**
```javascript
const response = await fetch(`/api/rfq/${rfqId}/response`, {
```

**After:**
```javascript
const response = await fetch(`/api/rfq/${rfqId}/response-simple`, {
```

### Step 3: Test

Try vendor response form again. It should work with just the essential fields.

---

## What This Sacrifices

This simplified version doesn't store:
- Quote title
- Intro text
- Pricing model details
- Inclusions/exclusions
- VAT calculations
- Line items
- etc.

It ONLY stores:
- quoted_price
- currency
- delivery_timeline
- description
- status
- vendor_name

---

## If This Works

Then the issue is definitely the database schema. We need to:

1. Add missing columns to `rfq_responses` table
2. Run the migration SQL I'll provide
3. Switch back to the full endpoint
4. Get all features working

---

## If This ALSO Fails

Then the issue is NOT the schema, but something else:
- RLS policy blocking
- Foreign key constraint
- Authentication issue
- Data validation

We'll diagnose further.

---

## Next Steps

1. **First:** Try the full endpoint and get the error code
2. **If missing columns:** I'll add them
3. **If still fails:** Use this simplified endpoint as fallback
4. **Once working:** Add columns back incrementally

---

## Keep This For Reference

This file is saved in your repo as a fallback option. You can always use this endpoint if needed!
