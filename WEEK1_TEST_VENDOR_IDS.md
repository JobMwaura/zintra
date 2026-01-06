# Week 1 Test Vendor IDs Reference

Use these vendor IDs directly in your cURL test commands.

## Test Users (Created by WEEK1_TEST_DATA_SETUP.sql)

**Verified User:**
```
User ID: 11111111-1111-1111-1111-111111111111
Email: test-verified@example.com
Phone: +254712345678
Status: Email ✅ Phone ✅
```

**Unverified User:**
```
User ID: 22222222-2222-2222-2222-222222222222
Email: test-unverified@example.com
Phone: +254712345679
Status: Email ❌ Phone ❌
```

---

## Real Vendor IDs (From Your Database)

### Primary Test Vendors (use for Direct & Wizard tests)

**Vendor 1: AquaTech Borehole Services**
```
ID: 8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11
Category: Water & Borehole Drilling
```

**Vendor 2: BrightBuild Contractors**
```
ID: f3a72a11-91b8-4a90-8b82-24b35bfc9801
Category: General Construction
```

**Vendor 3: EcoSmart Landscapes**
```
ID: 2cb95bde-4e5a-4b7c-baa4-7d50978b7a33
Category: Landscaping & Gardening
```

**Vendor 4: PaintPro Interiors**
```
ID: cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11
Category: Painting & Finishing
```

---

### Secondary Test Vendors

**Vendor 5: Royal Glass & Aluminum Works**
```
ID: aa64bff8-7e1b-4a9f-9b09-775b9d78e201
Category: Windows & Aluminum Fabrication
```

**Vendor 6: SolarOne Energy Solutions**
```
ID: 3b72d211-3a11-4b45-b7a5-3212c4219e08
Category: Solar & Renewable Energy
```

**Vendor 7: SteelPro Fabricators Ltd**
```
ID: b4f2c6ef-81b3-45d7-b42b-8036cbf210d4
Category: Steel & Metal Works
```

**Vendor 8: Timber Masters Kenya**
```
ID: 3688f0ab-4c1d-4a5e-9345-2df1da846544
Category: Wood & Timber Solutions
```

---

## cURL Test Commands (Ready to Copy & Paste)

### Test 1: Check Eligibility (Verified User)
```bash
curl -X POST http://localhost:3000/api/rfq/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "11111111-1111-1111-1111-111111111111"
  }'
```

### Test 2: Check Eligibility (Unverified User)
```bash
curl -X POST http://localhost:3000/api/rfq/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "22222222-2222-2222-2222-222222222222"
  }'
```

---

### Test 3: Create Direct RFQ (2 vendors)
```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "11111111-1111-1111-1111-111111111111",
    "rfqType": "direct",
    "title": "Construction project - need multiple vendors",
    "description": "Looking for experienced contractors for our project",
    "category": "construction",
    "town": "Nairobi",
    "county": "Nairobi",
    "budgetMin": 50000,
    "budgetMax": 150000,
    "selectedVendors": [
      "8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11",
      "f3a72a11-91b8-4a90-8b82-24b35bfc9801"
    ],
    "templateFields": {}
  }'
```

### Test 4: Create Wizard RFQ (auto-match)
```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "11111111-1111-1111-1111-111111111111",
    "rfqType": "wizard",
    "title": "Landscaping project - need auto-matched vendors",
    "description": "Professional landscaping for residential property",
    "category": "landscaping",
    "town": "Nairobi",
    "county": "Nairobi",
    "budgetMin": 30000,
    "budgetMax": 80000,
    "templateFields": {}
  }'
```

### Test 5: Create Public RFQ (marketplace)
```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "11111111-1111-1111-1111-111111111111",
    "rfqType": "public",
    "title": "Painting project - public marketplace",
    "description": "Interior painting for office building",
    "category": "painting",
    "town": "Nairobi",
    "county": "Nairobi",
    "budgetMin": 40000,
    "budgetMax": 120000,
    "visibilityScope": "county",
    "templateFields": {}
  }'
```

### Test 6: Create Vendor Request (single vendor)
```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "11111111-1111-1111-1111-111111111111",
    "rfqType": "vendor-request",
    "title": "Glass & Aluminum - vendor request",
    "description": "Custom glass and aluminum fabrication",
    "category": "glass",
    "town": "Nairobi",
    "county": "Nairobi",
    "budgetMin": 60000,
    "budgetMax": 200000,
    "selectedVendor": "aa64bff8-7e1b-4a9f-9b09-775b9d78e201",
    "templateFields": {}
  }'
```

### Test 7: Try to Create RFQ with Unverified User (should get 403)
```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "22222222-2222-2222-2222-222222222222",
    "rfqType": "direct",
    "title": "This should fail",
    "description": "Unverified user cannot create RFQ",
    "category": "construction",
    "town": "Nairobi",
    "county": "Nairobi",
    "budgetMin": 10000,
    "budgetMax": 50000,
    "selectedVendors": ["8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11"],
    "templateFields": {}
  }'
```

---

## Vendor ID Quick Reference (Copy-Paste)

Direct RFQ (select vendors):
```
8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11
f3a72a11-91b8-4a90-8b82-24b35bfc9801
```

Single vendor (Vendor Request):
```
aa64bff8-7e1b-4a9f-9b09-775b9d78e201
```

All vendors (for reference):
```
8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11
f3a72a11-91b8-4a90-8b82-24b35bfc9801
2cb95bde-4e5a-4b7c-baa4-7d50978b7a33
cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11
aa64bff8-7e1b-4a9f-9b09-775b9d78e201
3b72d211-3a11-4b45-b7a5-3212c4219e08
b4f2c6ef-81b3-45d7-b42b-8036cbf210d4
3688f0ab-4c1d-4a5e-9345-2df1da846544
```

---

## Testing Workflow

1. **Setup**: Run `WEEK1_TEST_DATA_SETUP.sql` in Supabase to create test users
2. **Verify Setup**: Check that users were created (query auth.users table)
3. **Test Check-Eligibility**: Run Test 1 & 2 above
4. **Test Create Endpoint**: Run Tests 3-7 above
5. **Verify Database**: Check rfqs and rfq_recipients tables for created records
6. **Frontend Testing**: Use these IDs when testing RFQModal integration

---

**Status**: Ready for testing ✅  
**Last Updated**: January 6, 2024
