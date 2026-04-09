# Schema Execution Checklist

## Pre-Execution (5 minutes)

### Prerequisites
- [x] Supabase project created
- [x] Supabase Auth enabled
- [x] Database schema file ready (`/DATABASE_SCHEMA.sql`)

### Check These
- [ ] Verify you're in the correct Supabase project
- [ ] Backup your existing database (Supabase → Settings → Backups)
- [ ] Note the project name and URL

---

## Execution Steps (3 minutes)

### 1. Copy Schema File
```
1. Open /DATABASE_SCHEMA.sql
2. Select all (Cmd+A or Ctrl+A)
3. Copy (Cmd+C or Ctrl+C)
```

### 2. Go to Supabase SQL Editor
```
1. Open your Supabase project: https://supabase.com/dashboard
2. Click on your project name
3. Left sidebar → SQL Editor
4. Click "+ New Query" or click in the editor area
```

### 3. Paste and Execute
```
1. Paste the entire DATABASE_SCHEMA.sql content
2. Click "Run" button (or Cmd+Enter)
3. Wait 10-30 seconds for execution
```

### 4. Verify Execution
```
✓ No errors in output panel
✓ Tables created (see below)
```

---

## Verification (2 minutes)

### Check Tables Exist
In Supabase, go to **Table Editor** (left sidebar) and verify these 12 tables exist:

1. ✅ `profiles`
2. ✅ `candidate_profiles`
3. ✅ `employer_profiles`
4. ✅ `listings`
5. ✅ `applications`
6. ✅ `subscriptions`
7. ✅ `listing_boosts`
8. ✅ `credits_ledger`
9. ✅ `contact_unlocks`
10. ✅ `conversations`
11. ✅ `messages`
12. ✅ `ratings`

### Check Indexes Created
```sql
-- Run this query to verify indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN (
  'profiles', 'listings', 'applications', 'listing_boosts', 
  'contact_unlocks', 'credits_ledger', 'messages', 'ratings'
)
ORDER BY indexname;
```

Expected: 15 indexes (named like `idx_*`)

### Check RLS Enabled
In Supabase Table Editor:
1. Click on `profiles` table
2. Right sidebar → "RLS" toggle
3. Should show **RLS is enabled**
4. Click to see policies (should see at least 2 policies)

### Check Sample View
```sql
-- Run this to test employer_capabilities view
SELECT * FROM employer_capabilities LIMIT 1;
```

---

## Post-Execution

### Enable RLS on Remaining Tables
Go to Supabase SQL Editor and run:

```sql
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
```

### Add RLS Policies (Optional but Recommended)
Copy policies from the schema file and paste into SQL Editor to set up basic access control.

---

## Troubleshooting

### Error: "relation already exists"
**Cause:** Tables already in database from previous execution
**Solution:** 
```sql
-- Drop existing tables
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS credits_ledger CASCADE;
DROP TABLE IF EXISTS contact_unlocks CASCADE;
DROP TABLE IF EXISTS listing_boosts CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS employer_profiles CASCADE;
DROP TABLE IF EXISTS candidate_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Then run schema file again
```

### Error: "foreign key constraint violation"
**Cause:** Trying to insert data before schema is fully created
**Solution:** Just run schema file again, no data is being inserted (schema only)

### Error: "permission denied"
**Cause:** Using the wrong Supabase API key
**Solution:** 
1. Go to Supabase project settings
2. Copy the correct API key
3. Check you're authenticated in the SQL editor

### Error: "RLS policies prevent data access"
**Cause:** RLS enabled but no policies defined
**Solution:** Add RLS policies (included in schema file)

---

## Quick Test After Schema

### Test 1: Create a profile
```sql
INSERT INTO profiles (id, email, is_candidate, full_name, phone, location)
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', true, 'Test User', '+254712345678', 'Nairobi');

SELECT * FROM profiles WHERE email = 'test@example.com';
```

### Test 2: Create a candidate profile
```sql
INSERT INTO candidate_profiles (id, skills, availability, rate_per_day, bio, experience_years)
VALUES ('00000000-0000-0000-0000-000000000001', ARRAY['Masonry', 'Carpentry'], 'Available now', 1500, 'Skilled mason', 5);

SELECT * FROM candidate_profiles WHERE id = '00000000-0000-0000-0000-000000000001';
```

### Test 3: Create a listing
```sql
INSERT INTO listings (employer_id, type, title, description, location, status, created_at)
VALUES ('00000000-0000-0000-0000-000000000002', 'job', 'Need a skilled mason', 'Residential renovation', 'Nairobi', 'active', NOW());

SELECT * FROM listings ORDER BY created_at DESC LIMIT 1;
```

---

## Schema Statistics

| Metric | Count |
|--------|-------|
| Tables | 12 |
| Columns | ~110 |
| Indexes | 15 |
| RLS Policies | 6 |
| Views | 1 |
| Constraints | 20+ |
| **Total Lines** | ~350 |

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Copy schema file | 1 min | ⏳ Ready |
| Paste in SQL Editor | 1 min | ⏳ Ready |
| Execute | 1 min | ⏳ Ready |
| Verify tables | 2 min | ⏳ Ready |
| Check indexes | 1 min | ⏳ Ready |
| Enable RLS | 2 min | ⏳ Optional |
| Test inserts | 3 min | ⏳ Optional |
| **TOTAL** | **~10 min** | **Ready** |

---

## Done! 🎉

Once schema is executed:

1. ✅ Database is ready for Week 1 profile creation
2. ✅ All monetization tables are in place
3. ✅ Indexes will speed up queries
4. ✅ RLS policies protect user data
5. ✅ Next step: Test signup → profile creation flow

**No code changes needed** - everything is already built and ready to test!
