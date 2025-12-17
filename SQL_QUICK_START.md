# SQL Migration Summary - What You Need to Do

## ⚡ TL;DR - Quick Version

**Status**: The RFQ forms are built and deployed ✅  
**Next Step**: Run the SQL migration to enable database functionality  
**Time Needed**: ~2 minutes  
**Difficulty**: Easy (copy/paste SQL)

---

## 📋 The SQL You Need to Run

**File to run:** `supabase/sql/MIGRATION_RFQ_SYSTEM_DEC2025.sql`

This single SQL file adds:
- 6 new columns to the `rfqs` table
- 2 new tables (`rfq_recipients`, `rfq_quotes`)
- 11 indexes for performance
- Row-level security policies
- Database permissions

---

## 🚀 How to Run It (Pick One)

### **Method 1: Supabase Dashboard (Easiest)**
1. Go to Supabase project → SQL Editor
2. Create new query
3. Copy-paste entire contents of: `supabase/sql/MIGRATION_RFQ_SYSTEM_DEC2025.sql`
4. Click "Run"
5. Done! ✅

### **Method 2: Command Line**
```bash
cd /Users/macbookpro2/Desktop/zintra-platform
psql postgresql://user:password@host:port/database < supabase/sql/MIGRATION_RFQ_SYSTEM_DEC2025.sql
```

### **Method 3: Supabase CLI**
```bash
supabase db push
```

---

## ✅ How to Verify It Worked

After running the SQL, check these two things:

### **Quick Check - In Supabase Dashboard:**
1. Go to Table Editor
2. Look for two new tables: `rfq_recipients` and `rfq_quotes`
3. If you see them → ✅ Migration succeeded!

### **Detailed Check - Run This Query:**
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('rfq_recipients', 'rfq_quotes');
```

Expected result: 2 rows returned

---

## 🎯 What This Enables

Once you run the SQL:

| Feature | Status |
|---------|--------|
| Direct RFQ form | ✅ Fully functional |
| Wizard/Matched RFQ form | ✅ Fully functional |
| Public RFQ form | ✅ Fully functional |
| Store budget_min/max | ✅ Enabled |
| Store payment terms | ✅ Enabled |
| Store deadlines | ✅ Enabled |
| Track vendor recipients | ✅ Enabled |
| Store vendor quotes | ✅ Enabled |

---

## 📊 What Gets Created

### **6 New Columns in `rfqs` Table**
```
rfq_type (VARCHAR)        → 'direct', 'matched', 'public'
visibility (VARCHAR)      → 'private', 'semi-private', 'public'
deadline (TIMESTAMP)      → When vendors must quote by
budget_min (INTEGER)      → Minimum budget in KSh
budget_max (INTEGER)      → Maximum budget in KSh
payment_terms (VARCHAR)   → Payment preference
```

### **rfq_recipients Table**
Tracks which vendors got which RFQs:
```
- id (primary key)
- rfq_id (reference to RFQ)
- vendor_id (reference to vendor)
- recipient_type ('direct' or 'matched')
- notification_sent_at (when vendor notified)
- viewed_at (when vendor viewed)
- quote_submitted (boolean)
```

### **rfq_quotes Table**
Stores vendor quote responses:
```
- id (primary key)
- rfq_id (reference to RFQ)
- vendor_id (reference to vendor)
- amount (quote price)
- currency (default 'KES')
- timeline_days (vendor's timeline)
- payment_terms (vendor's preference)
- status ('submitted', 'accepted', 'rejected', 'withdrawn')
```

---

## ⏱️ Timeline

| Step | Timing | Status |
|------|--------|--------|
| Build RFQ forms | ✅ Complete | Committed & deployed |
| Write SQL migration | ✅ Complete | Ready to run |
| **Run SQL migration** | ⏳ **DO THIS NOW** | Not yet run |
| Test forms with real data | ⏳ Next | After SQL runs |
| Implement auto-matching | ⏳ Phase 5 | After testing |
| Add vendor notifications | ⏳ Phase 6 | After auto-matching |

---

## 🔒 Security

The migration includes:
- ✅ Row Level Security (RLS) enabled
- ✅ Authenticated user policies
- ✅ Proper permission grants
- ✅ No public read access to sensitive data

---

## 📚 Documentation Files Created

| File | Purpose |
|------|---------|
| `supabase/sql/MIGRATION_RFQ_SYSTEM_DEC2025.sql` | **← RUN THIS** |
| `SQL_MIGRATION_GUIDE.md` | Detailed guide with troubleshooting |
| `RFQ_FORMS_ALIGNMENT_COMPLETE.md` | Form implementation summary |

---

## ❓ Common Questions

**Q: Will this break anything?**  
A: No. All changes use `IF NOT EXISTS` and `ALTER TABLE ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times.

**Q: How long does it take?**  
A: ~10-30 seconds for the entire migration.

**Q: Can I undo it?**  
A: Yes, but you'd need to manually drop the tables/columns. The migration is non-destructive.

**Q: What if I get an error?**  
A: Most errors are permission-related. Make sure you're running with admin/superuser credentials.

---

## 🎬 Next Steps

1. **Run the SQL** (this page explains how)
2. **Verify it worked** (see "How to Verify" section above)
3. **Test the forms** in your dev environment
4. **Create test RFQs** to verify data flow
5. **Check the database** - you should see new rows in rfq_recipients

---

**You're 95% done.** Just need to run that SQL! 🚀
