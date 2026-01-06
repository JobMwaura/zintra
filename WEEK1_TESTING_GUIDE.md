# TESTING GUIDE: RFQ Submission Flow

This guide provides cURL commands and testing scenarios for Week 1 backend components:
- `POST /api/rfq/check-eligibility`
- `POST /api/rfq/create`

---

## PART 1: TEST DATA SETUP

Before running tests, you need:
1. Test users in Supabase (with and without verified email/phone)
2. Test vendors in the vendors table
3. Test categories in the categories table

**Run this SQL in Supabase SQL Editor to create test data:**

```sql
-- Create test users
INSERT INTO auth.users (id, email, phone, raw_app_meta_data) VALUES
('test-user-verified', 'test-verified@example.com', '+254712345678', '{"phone_verified": true}'),
('test-user-unverified', 'test-unverified@example.com', '+254712345679', '{"phone_verified": false}');

INSERT INTO public.users (id, email, phone_verified, email_verified, created_at) VALUES
('test-user-verified', 'test-verified@example.com', true, true, NOW()),
('test-user-unverified', 'test-unverified@example.com', false, false, NOW());

-- Create test vendors
INSERT INTO public.vendors (id, business_name, primary_category, secondary_categories, subscription_active, rating, response_rate, verified_docs) VALUES
('vendor-1', 'Test Vendor 1', 'construction', '["plumbing"]'::jsonb, true, 4.5, 0.95, true),
('vendor-2', 'Test Vendor 2', 'construction', '["electrical"]'::jsonb, true, 4.2, 0.90, true),
('vendor-3', 'Test Vendor 3', 'plumbing', '["construction"]'::jsonb, true, 4.8, 0.98, true),
('vendor-4', 'Test Vendor 4', 'electrical', '[]'::jsonb, true, 3.9, 0.85, false),
('vendor-5', 'Test Vendor 5', 'construction', '[]'::jsonb, false, 4.0, 0.88, true);
```

---

## PART 2: ENDPOINT 1 - CHECK-ELIGIBILITY

### TEST 1: Check eligibility - Unauthenticated (no user_id)
**Expected: 401 Unauthorized**

```bash
curl -X POST http://localhost:3000/api/rfq/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (Error):**
```json
{
  "error": {
    "message": "Unauthorized: user_id is required",
    "code": "AUTH_REQUIRED"
  }
}
```

### TEST 2: Check eligibility - User not found
**Expected: 404 Not Found**

```bash
curl -X POST http://localhost:3000/api/rfq/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "nonexistent-user-12345"
  }'
```

**Response (Error):**
```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
}
```

### TEST 3: Check eligibility - User not verified
**Expected: 200 OK with eligible: false**

```bash
curl -X POST http://localhost:3000/api/rfq/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-unverified"
  }'
```

**Response (Success):**
```json
{
  "eligible": false,
  "remaining_free": 0,
  "requires_payment": false,
  "amount": 0,
  "message": "Your account is not verified. Please verify your email and phone number.",
  "verification_required": {
    "email_verified": false,
    "phone_verified": false
  }
}
```

### TEST 4: Check eligibility - User with free RFQs available
**Expected: 200 OK with eligible: true, remaining_free > 0**

Prerequisite: Make sure test-user-verified has submitted < 3 RFQs this month

```bash
curl -X POST http://localhost:3000/api/rfq/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-verified"
  }'
```

**Response (Success):**
```json
{
  "eligible": true,
  "remaining_free": 3,
  "requires_payment": false,
  "amount": 0,
  "current_count": 0,
  "free_limit": 3,
  "message": "You have 3 free RFQs remaining this month"
}
```

### TEST 5: Check eligibility - User over quota
**Expected: 200 OK with eligible: true, remaining_free: 0, requires_payment: true**

Prerequisite: Create 3 RFQs for test-user-verified first (see PART 3)

```bash
curl -X POST http://localhost:3000/api/rfq/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-verified"
  }'
```

**Response (Success):**
```json
{
  "eligible": true,
  "remaining_free": 0,
  "requires_payment": true,
  "amount": 300,
  "current_count": 3,
  "free_limit": 3,
  "message": "You have reached your free RFQ limit. The next RFQ costs KES 300."
}
```

---

## PART 3: ENDPOINT 2 - CREATE RFQ

### TEST 1: Create Direct RFQ (select vendors)
**Expected: 201 Created with rfqId**

```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-verified",
    "rfqType": "direct",
    "title": "Need construction services for office renovation",
    "description": "Looking for experienced contractors to renovate our office building. Project includes structural repairs, painting, and fixtures.",
    "category": "construction",
    "town": "Nairobi",
    "county": "Nairobi",
    "budgetMin": 50000,
    "budgetMax": 100000,
    "selectedVendors": ["vendor-1", "vendor-2"],
    "templateFields": {},
    "draftSavedAt": "2024-01-15T10:00:00Z"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "rfqId": "rfq_1234567890",
  "message": "RFQ created successfully",
  "details": {
    "type": "direct",
    "vendor_count": 2,
    "recipients_created": 2
  }
}
```

### TEST 2: Create Wizard RFQ (auto-match vendors)
**Expected: 201 Created with rfqId + auto-matched vendors**

```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-verified",
    "rfqType": "wizard",
    "title": "Plumbing installation for new house",
    "description": "Need professional plumbers to install complete plumbing system for new house construction.",
    "category": "plumbing",
    "town": "Mombasa",
    "county": "Mombasa",
    "budgetMin": 25000,
    "budgetMax": 50000,
    "templateFields": {},
    "draftSavedAt": "2024-01-15T10:30:00Z"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "rfqId": "rfq_9876543210",
  "message": "RFQ created and vendors auto-matched",
  "details": {
    "type": "wizard",
    "vendor_count": 5,
    "recipients_created": 5,
    "matched_vendors": ["vendor-3", "..."]
  }
}
```

### TEST 3: Create Public RFQ (notify top 20 vendors)
**Expected: 201 Created with rfqId + top 20 vendors notified**

```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-verified",
    "rfqType": "public",
    "title": "Electrical wiring for commercial building",
    "description": "Seeking certified electricians for complete electrical installation in 5-story commercial building.",
    "category": "electrical",
    "town": "Kisumu",
    "county": "Kisumu",
    "budgetMin": 150000,
    "budgetMax": 250000,
    "visibilityScope": "county",
    "templateFields": {},
    "draftSavedAt": "2024-01-15T11:00:00Z"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "rfqId": "rfq_5555555555",
  "message": "RFQ published publicly and vendors notified",
  "details": {
    "type": "public",
    "visibility": "county",
    "vendor_count": 20,
    "recipients_created": 20,
    "notifications_sent": 20
  }
}
```

### TEST 4: Create Vendor Request RFQ (select 1 vendor)
**Expected: 201 Created with rfqId + single vendor**

```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-verified",
    "rfqType": "vendor-request",
    "title": "Maintenance contract for office building",
    "description": "Annual maintenance contract for office building including cleaning, repairs, and preventive maintenance.",
    "category": "construction",
    "town": "Nairobi",
    "county": "Nairobi",
    "budgetMin": 30000,
    "budgetMax": 40000,
    "selectedVendor": "vendor-1",
    "templateFields": {},
    "draftSavedAt": "2024-01-15T11:30:00Z"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "rfqId": "rfq_3333333333",
  "message": "RFQ created and vendor request sent",
  "details": {
    "type": "vendor-request",
    "vendor_id": "vendor-1",
    "recipients_created": 1
  }
}
```

### TEST 5: Create RFQ - Unverified user
**Expected: 403 Forbidden**

```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-unverified",
    "rfqType": "direct",
    "title": "Need services",
    "description": "Description here",
    "category": "construction",
    "town": "Nairobi",
    "county": "Nairobi",
    "budgetMin": 10000,
    "budgetMax": 20000,
    "selectedVendors": ["vendor-1"]
  }'
```

**Response (Error):**
```json
{
  "error": {
    "message": "Account not verified",
    "code": "VERIFICATION_REQUIRED",
    "details": {
      "email_verified": false,
      "phone_verified": false
    }
  }
}
```

### TEST 6: Create RFQ - Invalid form data
**Expected: 400 Bad Request**

```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-verified",
    "rfqType": "direct",
    "title": "Need",
    "description": "Too short",
    "category": "",
    "town": "Nairobi",
    "county": "Nairobi",
    "budgetMin": 50000,
    "budgetMax": 10000
  }'
```

**Response (Error):**
```json
{
  "error": {
    "message": "Validation failed: title must be at least 5 characters, category is required, budgetMin must be <= budgetMax",
    "code": "VALIDATION_ERROR",
    "validationErrors": ["..."]
  }
}
```

### TEST 7: Create RFQ - Over quota (no payment)
**Expected: 402 Payment Required**

Prerequisite: User must have submitted 3+ RFQs this month

```bash
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-verified",
    "rfqType": "direct",
    "title": "Over quota test RFQ",
    "description": "This RFQ should require payment",
    "category": "construction",
    "town": "Nairobi",
    "county": "Nairobi",
    "budgetMin": 50000,
    "budgetMax": 100000,
    "selectedVendors": ["vendor-1"]
  }'
```

**Response (Error):**
```json
{
  "error": {
    "message": "Payment required - you have reached your free RFQ limit",
    "code": "PAYMENT_REQUIRED",
    "details": {
      "remaining_free": 0,
      "amount": 300,
      "currency": "KES"
    }
  }
}
```

---

## PART 4: VERIFICATION QUERIES

After creating an RFQ, verify data was correctly stored:

```sql
-- Query created RFQ
SELECT * FROM rfqs WHERE id = 'rfq_1234567890';

-- Expected output:
-- id | user_id | type | category | title | description | town | county | budget_min | budget_max | status | visibility | template_data | shared_data | is_paid | created_at
-- rfq_1234567890 | test-user-verified | direct | construction | ... | ... | Nairobi | Nairobi | 50000 | 100000 | submitted | private | {} | {...} | false | 2024-01-15 10:00:00

-- Query RFQ recipients (vendors)
SELECT * FROM rfq_recipients WHERE rfq_id = 'rfq_1234567890';

-- Expected output for Direct RFQ:
-- rfq_id | vendor_id | recipient_type | status
-- rfq_1234567890 | vendor-1 | direct | pending
-- rfq_1234567890 | vendor-2 | direct | pending
```

---

## PART 5: TESTING CHECKLIST

**Check-Eligibility Endpoint Tests:**
- [ ] Test 1: No user_id → 401
- [ ] Test 2: User not found → 404
- [ ] Test 3: Unverified user → 200, eligible: false
- [ ] Test 4: Free RFQs available → 200, eligible: true, remaining_free: 3
- [ ] Test 5: Over quota → 200, eligible: true, remaining_free: 0, requires_payment: true

**Create Endpoint Tests:**
- [ ] Test 1: Direct RFQ → 201, vendors in recipients
- [ ] Test 2: Wizard RFQ → 201, auto-matched vendors in recipients
- [ ] Test 3: Public RFQ → 201, top 20 vendors in recipients
- [ ] Test 4: Vendor Request RFQ → 201, single vendor in recipients
- [ ] Test 5: Unverified user → 403
- [ ] Test 6: Invalid form data → 400
- [ ] Test 7: Over quota → 402

**Database Verification:**
- [ ] RFQ record created with correct fields
- [ ] RFQ recipients created for selected/matched vendors
- [ ] Status fields are correct (submitted, pending)
- [ ] visibility field matches rfqType
- [ ] is_paid flag set correctly
- [ ] created_at timestamp is correct

---

## PART 6: TROUBLESHOOTING

**Common Issues & Solutions:**

1. **"Cannot read property 'id' of undefined"**
   - Problem: Supabase client not initialized
   - Solution: Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set

2. **"user_id format is invalid"**
   - Problem: Using wrong user ID format
   - Solution: Use the exact UUID from auth.users table

3. **"Invalid category slug"**
   - Problem: Category doesn't exist in categories table
   - Solution: Check categories table and use exact category slug

4. **"Vendors not found for category"**
   - Problem: No active vendors for selected category
   - Solution: Create test vendors with subscription_active = true

5. **"RLS policy violation"**
   - Problem: User doesn't have permission to insert into rfqs table
   - Solution: Check RLS policies - should allow authenticated users to insert own RFQs

6. **"CORS error when calling API"**
   - Problem: Frontend making request from different origin
   - Solution: Check API CORS headers or make requests from same origin
