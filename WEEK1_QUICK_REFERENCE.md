# Week 1 Quick Reference Card

## 📋 Files to Know

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `/app/api/rfq/check-eligibility/route.js` | Fast eligibility check before payment | 150 | ✅ Ready |
| `/app/api/rfq/create/route.js` | Create RFQ with vendor assignment | 330+ | ✅ Updated |
| `/lib/vendorMatching.js` | Vendor matching utilities | 200 | ✅ Ready |
| `/hooks/useRFQFormValidation.js` | Form validation | 190 | ✅ Ready |
| `/hooks/useRFQSubmit.js` | Complete submission flow | 350 | ✅ Ready |

## 🚀 API Endpoints

### Check Eligibility
```bash
POST /api/rfq/check-eligibility
{
  "user_id": "user-uuid"
}
```

**Response** (200 OK):
```json
{
  "eligible": true,
  "remaining_free": 2,
  "requires_payment": false,
  "amount": 0,
  "message": "You have 2 free RFQs remaining this month"
}
```

### Create RFQ
```bash
POST /api/rfq/create
{
  "userId": "user-uuid",
  "rfqType": "direct|wizard|public|vendor-request",
  "title": "Project title",
  "description": "Project summary",
  "category": "category-slug",
  "town": "Nairobi",
  "county": "Nairobi",
  "budgetMin": 50000,
  "budgetMax": 100000,
  "selectedVendors": ["v1", "v2", "v3"],     // For Direct
  "visibilityScope": "county",         // For Public
  "selectedVendor": "v1",              // For Vendor Request
  "templateFields": {}
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "rfqId": "rfq_xxxxx",
  "message": "RFQ created successfully"
}
```

## 🎣 Frontend Hooks

### Form Validation
```javascript
import { useRFQFormValidation } from '@/hooks/useRFQFormValidation';

const { validateRFQForm, getFieldError, hasError } = useRFQFormValidation();

const result = validateRFQForm(formData, 'direct', categoryFields);
// Returns: { isValid, errors, errorCount, hasSharedFieldErrors, ... }
```

### Submit Handler
```javascript
import { useRFQSubmit } from '@/hooks/useRFQSubmit';

const { handleSubmit, isLoading, error, success, currentStep } = useRFQSubmit();

await handleSubmit(
  formData,
  'direct',
  categoryFields,
  onVerificationNeeded,  // Show verification modal
  onPaymentNeeded,       // Show payment modal
  onSuccess              // Redirect to detail page
);
```

## 🔐 Key Validations

### Authentication
- Must have `user_id` ✅
- Must be logged in ✅

### Verification
- `email_verified` must be true ✅
- `phone_verified` must be true ✅

### Quota
- Free limit: 3 RFQs/month ✅
- Cost for extras: KES 300 ✅
- Server-side re-check on create ✅

### Form Fields
- Title: 5-200 characters ✅
- Summary: 10-5000 characters ✅
- Budget: min ≤ max, both ≥ 0 ✅
- Category: Required ✅
- Location: County + Town required ✅

## 🎯 RFQ Types

| Type | Vendor Source | How Many |
|------|---------------|----------|
| **Direct** | User selects | 1+ (user chooses) |
| **Wizard** | Auto-matched | 5-10 (by rating) |
| **Public** | Marketplace | 20 (top by rating) |
| **Vendor Request** | Pre-selected | 1 (vendor chooses) |

## 📊 HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Check-eligibility successful |
| 201 | Created | RFQ created successfully |
| 400 | Bad Request | Invalid form data |
| 401 | Unauthorized | Not authenticated |
| 402 | Payment Required | Over free quota |
| 403 | Forbidden | Not verified (email/phone) |
| 404 | Not Found | User doesn't exist |
| 500 | Server Error | Something went wrong |

## 🧪 Quick Test

```bash
# Test check-eligibility
curl -X POST http://localhost:3000/api/rfq/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user-verified"}'

# Test create Direct RFQ
curl -X POST http://localhost:3000/api/rfq/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-verified",
    "rfqType": "direct",
    "title": "Need construction services",
    "description": "Office renovation needed",
    "category": "construction",
    "town": "Nairobi",
    "county": "Nairobi",
    "budgetMin": 50000,
    "budgetMax": 100000,
    "selectedVendors": ["vendor-1"]
  }'
```

## 📚 Documentation Files

| File | What | When to Read |
|------|------|--------------|
| `WEEK1_STATUS_REPORT.md` | Executive summary | Before starting |
| `WEEK1_IMPLEMENTATION_SUMMARY.md` | Architecture overview | To understand system |
| `WEEK1_TESTING_GUIDE.md` | Test scenarios + SQL | Before testing |
| `RFQMODAL_INTEGRATION_GUIDE.md` | Integration steps | For RFQModal task |

## 🔄 Submission Flow (6 Steps)

1. **Form Validation** - Check all fields valid
2. **Auth Check** - Verify user logged in
3. **Eligibility Check** - Call `/api/rfq/check-eligibility`
   - If not verified → Show verification modal
   - If over quota → Show payment modal
4. **Create RFQ** - Call `/api/rfq/create`
5. **Handle Response** - Check for errors
6. **Redirect** - Go to `/rfq/{rfqId}` detail page

## ⚙️ Database Schema (Key Fields)

### RFQ Record
```
id, user_id, type, title, description, category,
town, county, budget_min, budget_max, visibility,
status, template_data, shared_data, is_paid, created_at
```

### RFQ Recipients
```
id, rfq_id, vendor_id, recipient_type, status, created_at
```

## 🚨 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | No user_id | Check authentication |
| 403 Forbidden | Not verified | Verify email + phone |
| 402 Payment Required | Over quota | Show payment modal |
| 400 Bad Request | Invalid data | Check form validation |
| "Vendor matching failed" | No active vendors | Check vendor setup |

## 💾 Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # For admin operations
```

## 🎨 Integration Checklist

- [ ] Import both hooks
- [ ] Initialize form state
- [ ] Initialize submit handler
- [ ] Add form change handler
- [ ] Render form fields with errors
- [ ] Handle verification callback
- [ ] Handle payment callback
- [ ] Show loading state
- [ ] Show error messages
- [ ] Test all 4 RFQ types
- [ ] Test unverified user
- [ ] Test over quota

## 📞 Vendor Assignment

```javascript
// Direct: User selects vendors
selectedVendors: ["v1", "v2", "v3"]

// Wizard: Auto-matched by category + rating
// (Backend handles - no input needed)

// Public: Top 20 by rating + verified_docs
// (Backend handles - no input needed)

// Vendor Request: Single pre-selected vendor
selectedVendor: "v1"
```

## 🔍 Debug Mode

Add to environment:
```
DEBUG_RFQ=true
```

This will enable verbose logging in:
- Check-eligibility endpoint
- Create endpoint
- Both hooks
- All helper functions

## 📞 Support

**Testing Guide**: `/WEEK1_TESTING_GUIDE.md`  
**Integration Help**: `/RFQMODAL_INTEGRATION_GUIDE.md`  
**Architecture Questions**: `/WEEK1_IMPLEMENTATION_SUMMARY.md`  
**Status Questions**: `/WEEK1_STATUS_REPORT.md`

---

**Last Updated**: January 15, 2024  
**Status**: Week 1 Backend Complete, Ready for Integration Testing  
**Next Step**: Integrate hooks into RFQModal component
