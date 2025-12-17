# ✅ SQL Migration Checklist

**File to Run**: `supabase/sql/MIGRATION_RFQ_SYSTEM_DEC2025.sql`  
**Size**: 185 lines  
**Execution Time**: ~30 seconds  
**Difficulty**: Easy (copy/paste)  
**Date**: December 17, 2025

---

## 📋 Pre-Migration Checklist

- [ ] You have access to Supabase dashboard
- [ ] You know which project to run migration on
- [ ] You have admin/superuser credentials
- [ ] You've read SQL_QUICK_START.md (or at least this checklist)

---

## 🚀 Step-by-Step Execution

### **Step 1: Prepare the SQL**
- [ ] Navigate to `/Users/macbookpro2/Desktop/zintra-platform/supabase/sql/`
- [ ] Open file: `MIGRATION_RFQ_SYSTEM_DEC2025.sql`
- [ ] Copy ALL contents (Ctrl+A, Ctrl+C or Cmd+A, Cmd+C)

### **Step 2: Open Supabase**
- [ ] Go to https://supabase.com
- [ ] Log in with your credentials
- [ ] Select your project (the one you're using for Zintra)

### **Step 3: Access SQL Editor**
- [ ] Click **SQL Editor** in the left sidebar
- [ ] Click **New Query** button (top right)
- [ ] A blank SQL editor appears

### **Step 4: Paste the SQL**
- [ ] Click in the editor window
- [ ] Paste the migration SQL (Ctrl+V or Cmd+V)
- [ ] You should see the SQL code in the editor
- [ ] Verify it looks like SQL (lots of ALTER TABLE, CREATE TABLE lines)

### **Step 5: Execute the Migration**
- [ ] Look for the **Run** button (top right of editor, usually green)
- [ ] Click the **Run** button
- [ ] Wait for the query to execute

### **Step 6: Verify Success**
You'll see one of these:

**✅ Success Message**:
```
Query executed successfully
```

**❌ Error Message**: 
- Don't panic - usually just permission issues
- See troubleshooting section below

### **Step 7: Confirm Tables Exist**

Option A - In Supabase Dashboard:
- [ ] Go to **Table Editor** (left sidebar)
- [ ] Look for: **rfq_recipients** table
- [ ] Look for: **rfq_quotes** table
- [ ] Both tables exist? ✅ Migration successful!

Option B - Run Verification Query:
- [ ] In SQL Editor, create a new query
- [ ] Paste this:
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('rfq_recipients', 'rfq_quotes');
```
- [ ] Click Run
- [ ] Should show 2 rows: rfq_recipients, rfq_quotes
- [ ] ✅ Migration successful!

---

## 📊 What Gets Created

### **6 New Columns in rfqs Table**
- [x] rfq_type (VARCHAR)
- [x] visibility (VARCHAR)
- [x] deadline (TIMESTAMP)
- [x] budget_min (INTEGER)
- [x] budget_max (INTEGER)
- [x] payment_terms (VARCHAR)

### **2 New Tables**
- [x] rfq_recipients
- [x] rfq_quotes

### **11 New Indexes**
- [x] idx_rfqs_rfq_type
- [x] idx_rfqs_visibility
- [x] idx_rfqs_user_id_type
- [x] idx_rfqs_category_location
- [x] idx_rfqs_deadline
- [x] idx_rfqs_budget_range
- [x] idx_rfq_recipients_rfq_id
- [x] idx_rfq_recipients_vendor_id
- [x] idx_rfq_recipients_recipient_type
- [x] idx_rfq_recipients_viewed
- [x] idx_rfq_recipients_quote_pending
- [x] idx_rfq_quotes_rfq_id
- [x] idx_rfq_quotes_vendor_id
- [x] idx_rfq_quotes_status
- [x] idx_rfq_quotes_submitted

### **Row Level Security Policies**
- [x] Allow buyers to create rfq_recipients
- [x] Allow users to view their rfq_recipients
- [x] Allow vendors to submit quotes
- [x] Allow users to view rfq_quotes

### **Permissions Grants**
- [x] SELECT on rfq_recipients to authenticated
- [x] INSERT on rfq_recipients to authenticated
- [x] UPDATE on rfq_recipients to authenticated
- [x] DELETE on rfq_recipients to authenticated
- [x] SELECT on rfq_quotes to authenticated
- [x] INSERT on rfq_quotes to authenticated
- [x] UPDATE on rfq_quotes to authenticated
- [x] DELETE on rfq_quotes to authenticated

---

## 🐛 Troubleshooting

### **Error: "permission denied"**
- [ ] Make sure you're logged in with admin credentials
- [ ] Try using the postgres superuser role (not anon or service_role)
- [ ] Check that your user has admin access to the project

### **Error: "relation 'rfqs' does not exist"**
- [ ] Verify you're in the correct project
- [ ] Check that you have an rfqs table already (should from previous setup)
- [ ] Make sure you're connected to the right database

### **Error: "column already exists"**
- [ ] This is OK! The script uses `IF NOT EXISTS`
- [ ] Just run it again - it will skip what's already created
- [ ] This is not an error, migration still worked

### **Error: "syntax error"**
- [ ] Make sure you copied the entire file
- [ ] Paste it fresh from the file again
- [ ] Try running in a new query window

### **Query seems stuck / takes forever**
- [ ] Most queries complete in <30 seconds
- [ ] If it's taking longer than 1 minute, it might have hung
- [ ] Try closing the query tab and running again

### **No clear success/error message**
- [ ] Scroll up/down in the results panel
- [ ] Look for any error text
- [ ] Try the verification query to see if tables exist

---

## ✨ Post-Migration Steps

After successful migration:

1. [ ] Verify tables exist (rfq_recipients, rfq_quotes)
2. [ ] Test Direct RFQ form in development
3. [ ] Test Wizard RFQ form in development
4. [ ] Test Public RFQ form in development
5. [ ] Create test RFQ - check database for entries
6. [ ] Verify rfq_recipients table gets populated
7. [ ] Review README or documentation for next steps

---

## 🎯 Success Criteria

You know the migration worked when:

- [x] No error messages appear
- [x] Tables rfq_recipients and rfq_quotes exist in Table Editor
- [x] You can submit an RFQ from a form
- [x] Data appears in the database with correct field names
- [x] rfq_type is set correctly ('direct', 'matched', or 'public')
- [x] visibility is set correctly
- [x] budget_min and budget_max are integers (not strings)
- [x] deadline field contains a timestamp
- [x] payment_terms field contains the selected value

---

## 📞 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Query executed successfully" but no visible change | Scroll needed | Scroll up in results panel |
| Tables don't appear in Table Editor | Browser cache | Refresh page (F5) |
| Forms still error after migration | Wrong database | Verify connection string |
| Can't find SQL file | File path issue | Copy from: supabase/sql/MIGRATION_RFQ_SYSTEM_DEC2025.sql |
| Permission errors | Not logged in properly | Log out and log in again |
| Migration hangs | Large database | Wait up to 5 minutes, or contact support |

---

## 📝 Notes

- Migration is **idempotent** - safe to run multiple times
- No data loss - only additions, no deletions
- Can be run on existing databases with data
- Rollback would require manual table/column deletion
- Take ~30 seconds to 2 minutes depending on database size

---

## ✅ Final Checklist

Before you say you're done:

- [ ] SQL executed with no errors
- [ ] rfq_recipients table exists
- [ ] rfq_quotes table exists
- [ ] All 6 columns added to rfqs table
- [ ] You can submit a test RFQ
- [ ] Data appears in database
- [ ] You've read the next phase documentation

---

**Status**: Ready to execute  
**Date**: December 17, 2025  
**Next Step**: Run the migration!

---

## 📚 Related Documentation

- `SQL_QUICK_START.md` - 2-minute overview
- `SQL_MIGRATION_GUIDE.md` - Detailed guide with all methods
- `RFQ_IMPLEMENTATION_STATUS.md` - Complete status report
- `RFQ_FORMS_ALIGNMENT_COMPLETE.md` - Form implementation details
