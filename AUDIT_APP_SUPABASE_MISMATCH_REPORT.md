# App to Supabase Mismatch Audit Report

**Date**: January 6, 2026  
**Status**: ⚠️ Found 26 Issues - 3 categories  
**Severity**: MEDIUM (Non-critical paths affected)

---

## 🔍 Executive Summary

The audit found **26 mismatches** between app code and Supabase schema. These are primarily:

1. **API Endpoints for Negotiation System** (9 issues) - Using obsolete `buyer_id` field
2. **Legacy SQL Migration Files** (15 issues) - References to obsolete `quotes` table
3. **Environment Variables** (2 issues) - Missing Clerk authentication config

### Immediate Action Required
✅ Fix API endpoints (pages/api/negotiations/*)  
⚠️ Clerk environment variables (may not be critical for current work)  
📝 Legacy SQL files (documentation only, not active)

---

## 📋 Detailed Findings

### CATEGORY 1: API Endpoint Column Name Issues (9 issues) ❌

**Severity**: MEDIUM - Will break when Negotiation System is enabled

**Files Affected**:
- `pages/api/negotiations/counter-offer.js`
- `pages/api/negotiations/create.js`
- `pages/api/negotiations/qa.js`

#### Issue Details

##### File: counter-offer.js
```javascript
// LINE 78: ❌ WRONG
.select('id, buyer_id, vendor_id, quote_id')

// Should be:
.select('id, user_id, vendor_id, rfq_quote_id')

// LINE 90: ❌ WRONG
if (proposedBy !== negotiation.buyer_id && proposedBy !== negotiation.vendor_id) {

// Should be:
if (proposedBy !== negotiation.user_id && proposedBy !== negotiation.vendor_id) {

// LINE 163: ❌ WRONG
const notifiedUserId = proposedBy === negotiation.buyer_id ? 
  negotiation.vendor_id : negotiation.buyer_id;

// Should be:
const notifiedUserId = proposedBy === negotiation.user_id ? 
  negotiation.vendor_id : negotiation.user_id;
```

##### File: create.js
```javascript
// LINE 68: ❌ WRONG
buyer_id: buyerId,

// Should be:
user_id: userId,
```

##### File: qa.js
```javascript
// LINE 75: ❌ WRONG
.select('id, buyer_id, vendor_id')

// Should be:
.select('id, user_id, vendor_id')

// LINE 87: ❌ WRONG
if (askedBy !== negotiation.buyer_id && askedBy !== negotiation.vendor_id) {

// Should be:
if (askedBy !== negotiation.user_id && askedBy !== negotiation.vendor_id) {

// LINE 111: ❌ WRONG
const notifiedUserId = askedBy === negotiation.buyer_id ? 
  negotiation.vendor_id : negotiation.buyer_id;

// Should be:
const notifiedUserId = askedBy === negotiation.user_id ? 
  negotiation.vendor_id : negotiation.user_id;

// LINE 192: ❌ WRONG
.select('buyer_id, vendor_id')

// Should be:
.select('user_id, vendor_id')

// LINE 209: ❌ WRONG
if (answeredBy !== negotiation.buyer_id && answeredBy !== negotiation.vendor_id) {

// Should be:
if (answeredBy !== negotiation.user_id && answeredBy !== negotiation.vendor_id) {
```

**Impact**: Negotiation endpoints will fail when enabled because:
- Selecting non-existent `buyer_id` column
- Comparing against undefined values
- Cannot create/update negotiations

**Fix Priority**: 🔴 HIGH - Must fix before implementing Task 10

---

### CATEGORY 2: Legacy SQL File References (15 issues) ⚠️

**Severity**: LOW - These are archived/documentation files

**Files Affected** (15 SQL files in `/supabase/sql/`):
1. ADD_DASHBOARD_METRICS_COLUMNS.sql
2. CREATE_USERS_TABLE.sql
3. FIX_RFQ_SELECT_POLICY.sql
4. FIX_RFQ_STATS_RLS.sql
5. METRICS_TABLES_AND_TRIGGERS.sql
6. MIGRATION_RFQ_SYSTEM_DEC2025.sql
7. MIGRATION_RFQ_TYPES.sql
8. MIGRATION_v2_FIXED.sql
9. NOTIFICATIONS_SYSTEM.sql
10. PHASE1_JOB_ASSIGNMENT_AND_NOTIFICATIONS.sql
11. PHASE1_JOB_ASSIGNMENT_AND_NOTIFICATIONS_FIXED.sql
12. SAMPLE_PUBLIC_RFQS.sql (also has buyer_id reference)
13. VENDOR_STATUS_UPDATES_AND_RFQ_INBOX.sql
14. admin_schema.sql
15. rfq_enhancements.sql

**Analysis**: These files reference the old `quotes` table which doesn't exist. They are:
- ✅ Historical documentation
- ✅ Not actively executed
- ✅ Not blocking current functionality
- ❌ Could be confusing for developers

**Impact**: None - These files are not being executed against the database

**Fix Priority**: 🟢 LOW - Optional cleanup for documentation

---

### CATEGORY 3: Environment Variables (2 issues) ⚠️

**Severity**: MEDIUM (if using Clerk) / LOW (if not)

**Missing Variables**:
```
❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
❌ CLERK_SECRET_KEY
```

**Status**: 
- These are for Clerk authentication integration
- Current setup uses Supabase auth (different system)
- May be needed for future enhancement
- Not critical for current RFQ system

**What to do**:
- If using Supabase auth: Can ignore
- If planning Clerk integration: Add these to `.env.local`

**Fix Priority**: 🟡 MEDIUM (depends on auth strategy)

---

## ✅ What's Working Well

The audit also confirmed:

```
✅ RFQ field usage is consistent
✅ Main table references are correct (rfqs, rfq_quotes, rfq_recipients)
✅ RLS policies on active tables properly configured
✅ Foreign keys are valid
✅ API endpoints are mostly consistent
✅ RFQ type handling is implemented
✅ Data types are consistent
✅ Database indexes are defined (43 indexes)
```

---

## 🛠️ Recommended Actions

### PRIORITY 1: Fix Negotiation API Endpoints (HIGH) 🔴

These 3 files need updates before Task 10 implementation:

1. **pages/api/negotiations/counter-offer.js**
   - [ ] Replace `buyer_id` with `user_id` (3 occurrences)
   - [ ] Replace `quote_id` with `rfq_quote_id` (1 occurrence)

2. **pages/api/negotiations/create.js**
   - [ ] Replace `buyer_id: buyerId` with `user_id: userId` (1 occurrence)

3. **pages/api/negotiations/qa.js**
   - [ ] Replace `buyer_id` with `user_id` (4 occurrences)

**Estimated time**: 15-20 minutes
**Test**: Integration tests with negotiation flow

---

### PRIORITY 2: Document Legacy SQL Files (LOW) 🟢

Create a README explaining the archive:

```markdown
# /supabase/sql/

## Active Migrations
- RESET_ALL_RLS_POLICIES.sql ✅ Executed
- SUPABASE_ALL_SQL.sql ✅ Executed
- task10_negotiation_system.sql ✅ Executed
- task9_reputation_system.sql ✅ Ready

## Legacy/Historical Files (Not Executed)
These files are for reference only and reference obsolete 'quotes' table:
- ADD_DASHBOARD_METRICS_COLUMNS.sql
- MIGRATION_RFQ_SYSTEM_DEC2025.sql
- ... (list all 15 files)

To use these, update references from 'quotes' to 'rfq_quotes'
```

**Estimated time**: 5 minutes
**Action**: Optional but recommended for clarity

---

### PRIORITY 3: Add Clerk Environment Variables (MEDIUM) 🟡

If implementing Clerk authentication:

Add to `.env.local`:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

Get keys from: https://dashboard.clerk.com

**Current status**: Using Supabase auth (sufficient)  
**Future**: May want Clerk for additional auth flows

---

## 📊 Mismatch Summary Table

| Issue | File(s) | Current | Expected | Impact |
|-------|---------|---------|----------|--------|
| buyer_id in queries | counter-offer.js | buyer_id | user_id | 🔴 BREAKS negotiation |
| buyer_id comparisons | counter-offer.js | buyer_id | user_id | 🔴 BREAKS negotiation |
| quote_id references | counter-offer.js | quote_id | rfq_quote_id | 🔴 BREAKS negotiation |
| buyer_id in create | create.js | buyer_id | user_id | 🔴 BREAKS negotiation |
| buyer_id in queries | qa.js | buyer_id | user_id | 🔴 BREAKS negotiation |
| buyer_id comparisons | qa.js | buyer_id | user_id | 🔴 BREAKS negotiation |
| buyer_id in queries | qa.js | buyer_id | user_id | 🔴 BREAKS negotiation |
| quotes table | 15 SQL files | quotes | rfq_quotes | 🟢 ARCHIVE ONLY |
| Clerk auth keys | .env.local | MISSING | REQUIRED | 🟡 IF USING CLERK |

---

## 🚀 Next Steps

1. **Immediate** (Today):
   ```
   ☐ Review negotiation API files
   ☐ Identify all buyer_id references
   ☐ Plan conversion strategy
   ```

2. **Short-term** (This week):
   ```
   ☐ Update pages/api/negotiations/*.js files
   ☐ Test negotiation endpoints
   ☐ Verify RLS policies work with new fields
   ☐ Run audit again to verify
   ```

3. **Medium-term** (Optional):
   ```
   ☐ Add Clerk env vars if planning auth integration
   ☐ Archive/reorganize legacy SQL files
   ☐ Create SQL file documentation
   ```

---

## 📝 Appendix: Full Issue List

### API Column Issues (9)
- counter-offer.js:78 - `.select('id, buyer_id, vendor_id, quote_id')`
- counter-offer.js:90 - `negotiation.buyer_id` comparison
- counter-offer.js:163 - `negotiation.buyer_id` in ternary
- create.js:68 - `buyer_id: buyerId`
- qa.js:75 - `.select('id, buyer_id, vendor_id')`
- qa.js:87 - `negotiation.buyer_id` comparison
- qa.js:111 - `negotiation.buyer_id` in ternary
- qa.js:192 - `.select('buyer_id, vendor_id')`
- qa.js:209 - `negotiation.buyer_id` comparison

### Legacy SQL Issues (15)
- ADD_DASHBOARD_METRICS_COLUMNS.sql
- CREATE_USERS_TABLE.sql
- FIX_RFQ_SELECT_POLICY.sql
- FIX_RFQ_STATS_RLS.sql
- METRICS_TABLES_AND_TRIGGERS.sql
- MIGRATION_RFQ_SYSTEM_DEC2025.sql
- MIGRATION_RFQ_TYPES.sql
- MIGRATION_v2_FIXED.sql
- NOTIFICATIONS_SYSTEM.sql
- PHASE1_JOB_ASSIGNMENT_AND_NOTIFICATIONS.sql
- PHASE1_JOB_ASSIGNMENT_AND_NOTIFICATIONS_FIXED.sql
- SAMPLE_PUBLIC_RFQS.sql
- VENDOR_STATUS_UPDATES_AND_RFQ_INBOX.sql
- admin_schema.sql
- rfq_enhancements.sql

### Environment Variable Issues (2)
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY

---

## ✨ Recommendations

**For immediate production deployment**:
1. ✅ Fix negotiation API endpoints
2. ✅ Run audit again to confirm all issues resolved
3. ✅ Test complete RFQ workflow
4. ✅ Deploy to staging first

**For documentation**:
1. Archive or document legacy SQL files
2. Create developer guide for API endpoints
3. Document current auth strategy (Supabase vs Clerk)

---

**Generated**: January 6, 2026  
**Audit Tool**: COMPREHENSIVE_APP_SUPABASE_AUDIT.js
