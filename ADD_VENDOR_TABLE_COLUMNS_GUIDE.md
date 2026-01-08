# 🔧 ADD MISSING VENDOR TABLE COLUMNS - Quick Start Guide

## What to Do

Your vendor table is **51% complete**. Here's exactly what to add and in what order.

---

## 📋 DO THIS FIRST (Critical - 5 minutes)

### Add These 3 Columns Immediately

Copy & paste this into **Supabase SQL Editor**:

```sql
-- ============================================
-- CRITICAL COLUMNS - Run this FIRST
-- ============================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Verify they were added:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' AND column_name IN ('phone_verified', 'phone_verified_at', 'logo_url')
ORDER BY column_name;

-- Should show 3 rows
```

**Why these first?**
- `phone_verified` - Proves vendor phone is real (critical for trust)
- `phone_verified_at` - Audit trail (when was it verified)
- `logo_url` - Makes vendor profiles look professional

**Impact:** HIGH (fixes verification & UX)

---

## 📋 DO THIS NEXT (High Priority - 5 minutes)

After the first 3 are added, run this:

```sql
-- ============================================
-- HIGH PRIORITY COLUMNS - Run this SECOND
-- ============================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS service_counties TEXT[] DEFAULT '{}';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;

-- Verify they were added:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name IN ('email_verified', 'email_verified_at', 'service_counties', 'banner_url', 'certifications', 'is_suspended')
ORDER BY column_name;

-- Should show 6 rows
```

**Why these?**
- `email_verified` - Completes verification (phone + email)
- `service_counties` - Vendors can serve multiple counties (better RFQ matching)
- `banner_url` - Profile page branding
- `certifications` - Shows professional qualifications
- `is_suspended` - Can enforce vendor penalties

**Impact:** MEDIUM-HIGH (enables key features)

---

## 📋 OPTIONAL: DO THIS LATER (Medium Priority - 10 minutes)

When you have time, add these remaining columns:

```sql
-- ============================================
-- MEDIUM PRIORITY COLUMNS - Run this THIRD
-- ============================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_registration_number TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS years_of_experience INT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_hours JSONB;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Verify they were added:
SELECT COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'vendors';

-- Total should now be: 21 + 3 + 6 + 8 = 38 columns
```

**Why later?**
- These are useful but not blocking
- Business registration, social links - nice-to-have
- Business hours, payment method - for future features

---

## ⚠️ Important Notes

### Before Running SQL:
1. ✅ Backup your database first (Supabase → Database → Backups)
2. ✅ Copy-paste entire SQL block into Supabase SQL Editor
3. ✅ Review the SQL before clicking "Run"
4. ✅ Check results with the verification queries

### Why These Columns?

| Column | Reason | Used For |
|--------|--------|----------|
| `phone_verified` | Trust & security | Validate vendor contact |
| `phone_verified_at` | Audit trail | Show when verified |
| `logo_url` | Professional look | Vendor cards, profiles |
| `email_verified` | Trust & security | Validate vendor email |
| `email_verified_at` | Audit trail | Compliance |
| `service_counties` | Better matching | RFQs go to right vendors |
| `banner_url` | Profile branding | Vendor profile page |
| `certifications` | Trust indicator | Show qualifications |
| `is_suspended` | Enforcement | Block bad vendors |

---

## ✅ After Adding Columns

### Step 1: Update Registration Form
File: `app/vendor-registration/page.js`

Add after successful phone OTP:
```javascript
// Update vendors table with phone verification
const { data: updateData, error: updateError } = await supabase
  .from('vendors')
  .update({
    phone_verified: true,
    phone_verified_at: new Date().toISOString()
  })
  .eq('user_id', userId);
```

### Step 2: Update Vendor Profile Form
Allow vendors to upload:
- Logo image → store URL in `logo_url`
- Banner image → store URL in `banner_url`
- Certifications → store as JSON array in `certifications`
- Service counties → store as text array in `service_counties`

### Step 3: Update Vendor Display
Show these new fields:
```javascript
// On vendor profile page:
{vendor.logo_url && <img src={vendor.logo_url} alt="logo" />}
{vendor.certifications?.length > 0 && (
  <div>
    <strong>Certifications:</strong>
    {vendor.certifications.map(cert => <span key={cert}>{cert}</span>)}
  </div>
)}
```

### Step 4: Update RFQ Matching
Use `service_counties` for better geographic matching:
```sql
-- Find vendors that serve the RFQ county
SELECT * FROM vendors
WHERE service_counties @> ARRAY['nairobi']  -- JSONB array contains
AND status = 'active'
AND verified = true;
```

---

## 🔍 How to Check Progress

After running the SQL, verify with this query:

```sql
-- Check all columns exist
SELECT 
  COUNT(*) as total_columns,
  COUNT(CASE WHEN column_name = 'phone_verified' THEN 1 END) as has_phone_verified,
  COUNT(CASE WHEN column_name = 'email_verified' THEN 1 END) as has_email_verified,
  COUNT(CASE WHEN column_name = 'logo_url' THEN 1 END) as has_logo_url,
  COUNT(CASE WHEN column_name = 'service_counties' THEN 1 END) as has_service_counties,
  COUNT(CASE WHEN column_name = 'certifications' THEN 1 END) as has_certifications
FROM information_schema.columns 
WHERE table_name = 'vendors' AND table_schema = 'public';
```

**Expected Results:**
- `total_columns` = 38+ (was 21, added 3, then 6, then 8 = 38)
- All other columns = 1 (exists)

---

## 📊 Current vs. After Updates

### BEFORE
```
Core:           ✅ Complete
Contact:        ⚠️  Missing phone_verified
Verification:   ❌ Almost empty
Profile:        ❌ Only 2 fields
Categories:     ✅ Complete (after migration)
Media:          ❌ No images
Geographic:     ❌ Only 1 county
Reputation:     ✅ Complete
```

**Total: 21 columns, 51% complete**

### AFTER (Phase 1 + 2)
```
Core:           ✅ Complete
Contact:        ✅ Complete (added phone_verified)
Verification:   ✅ Complete (added phone & email verified)
Profile:        ⚠️  Better (added logo, banner)
Categories:     ✅ Complete
Media:          ✅ Added logo_url, banner_url
Geographic:     ✅ Added service_counties array
Reputation:     ✅ Complete
```

**Total: 38 columns, 80%+ complete**

---

## 🚀 Timeline

| When | What | Time | Priority |
|------|------|------|----------|
| **TODAY** | Run first 3 columns | 5 min | 🔴 CRITICAL |
| **THIS WEEK** | Run next 6 columns | 5 min | 🟠 HIGH |
| **NEXT WEEK** | Run remaining 8 columns | 10 min | 🟡 MEDIUM |
| **ONGOING** | Update forms & UI | 1-2 hours | 🟢 LOW |

---

## Questions?

- **What if a column already exists?** 
  - The `IF NOT EXISTS` clause prevents errors. It's safe to run.

- **Can I run all at once?**
  - Yes! But I recommend doing it in 3 phases so you can verify after each.

- **Do I need to restart the app?**
  - No! New columns are immediately available. No restart needed.

- **What about existing vendors?**
  - They get the default values (false for booleans, null for text/arrays). No data loss.

---

**Ready? Run the first block in Supabase SQL Editor now! 🚀**

