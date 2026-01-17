# Vendor Integration Schema - Setup & Architecture Guide

## 🎯 What This Schema Does

This schema integrates existing Zintra **vendors** into the Career Centre as **employers**. It allows vendors to:
1. Hire talent (post jobs/gigs)
2. Track spending & credits
3. View analytics on their hiring dashboard
4. Pay for job postings, boosts, and contact unlocks

---

## 📋 Execution Steps

### **Step 1: Copy the Schema**
File: `/VENDOR_INTEGRATION_SCHEMA.sql`

### **Step 2: Execute in Supabase**
1. Open Supabase console → SQL Editor
2. Click "+ New Query"
3. Copy entire schema
4. Click "Run"
5. Wait for success message

### **Step 3: Verify Tables Created**
Go to "Table Editor" and confirm:
- ✅ `employer_payments` (new)
- ✅ `employer_spending` (new)
- ✅ `employers_dashboard_stats` (view, new)

### **Step 4: Verify ENUMs Created**
Go to "SQL Editor" and run:
```sql
SELECT * FROM pg_type WHERE typname IN ('payment_method_enum', 'payment_status_enum', 'job_post_status_enum');
```

Should return 3 rows.

---

## 🏗️ Database Design Decisions

### **1. ENUM Types (Instead of TEXT Check)**
```sql
CREATE TYPE payment_method_enum AS ENUM ('mpesa', 'card', 'pesapal');
```

**Why ENUMs?**
- ✅ Type-safe (prevents invalid values)
- ✅ Efficient (PostgreSQL optimizes)
- ✅ Self-documenting
- ✅ Easy to extend later

**Alternative (if you need flexibility):**
```sql
-- If you want to add payment methods without schema changes:
payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('mpesa', 'card', 'pesapal', 'bank_transfer'))
```

### **2. vendor_id in employer_profiles**
```sql
ALTER TABLE employer_profiles ADD COLUMN vendor_id UUID REFERENCES vendors(id);
```

**Why?**
- ✅ Links vendor → employer relationship
- ✅ Allows ONE vendor to have MULTIPLE employer profiles (if needed)
- ✅ Enables analytics: "How many vendors became employers?"

### **3. Spending Tracker (employer_spending)**
```sql
UNIQUE (employer_id, period_month)
```

**Why track spending separately?**
- ✅ Credits ledger tracks individual transactions
- ✅ Spending table tracks monthly aggregates
- ✅ Dashboard can show: "Spent 5,000 KES this month"
- ✅ Supports billing: "Generate invoice for month"

### **4. Dashboard Stats View**
```sql
CREATE OR REPLACE VIEW employer_dashboard_stats AS
```

**Why a view?**
- ✅ Single query gets all dashboard metrics
- ✅ Calculated fields (balance, percentages, aggregates)
- ✅ No duplication of data
- ✅ Easy to query from app: `SELECT * FROM employer_dashboard_stats WHERE employer_id = ?`

**Metrics included:**
- Credits balance (calculated from ledger)
- Monthly spending (from employer_spending table)
- Active jobs count
- Pending applications count
- Hiring success rate

---

## 🔄 Data Flow

### **When Vendor Signs Up for ZCC**
```
1. Vendor clicks "Career Centre" tab in dashboard
2. System detects vendor_id from auth.users
3. Check: Does employer_profiles.vendor_id exist for this vendor?
   
   If NO:
   - Create employer_profiles entry
   - Set vendor_id = their vendor ID
   - Set is_vendor_employer = true
   - Create subscriptions entry (plan = 'free')
   - Redirect to onboarding
   
   If YES:
   - Load existing employer profile
   - Redirect to dashboard
```

### **When Vendor Posts a Job**
```
1. Vendor fills job form
2. System checks credits balance
3. Deduct 1,000 KES from credits_ledger (credit_type = 'job_posting')
4. Create listing
5. Update employer_spending (posting_spent += 1000)
6. Show success
```

### **When Vendor Unlocks Contact**
```
1. Vendor clicks "View Contact"
2. System checks:
   - Credits available? ✅
   - Plan allows unlocks? ✅
3. Deduct 200 KES from credits_ledger (credit_type = 'contact_unlock')
4. Create contact_unlocks record
5. Update employer_spending (unlocks_spent += 200)
6. Reveal contact info
```

### **Monthly Spending Summary**
```
Nightly cron job:
- Check all employers for period_month = current month
- Recalculate totals from credits_ledger
- Update employer_spending.total_spent
- Use for dashboard display
```

---

## 📊 Dashboard Query Example

```typescript
// Get employer dashboard stats
const { data: stats } = await supabase
  .from('employer_dashboard_stats')
  .select('*')
  .eq('employer_id', employerId)
  .single();

// Returns:
{
  employer_id: '...',
  company_name: 'ABC Construction',
  credits_balance: 2450,
  month_spending: 1550,
  active_jobs: 3,
  pending_applications: 12,
  candidates_unlocked: 5,
  total_hired: 2,
  avg_hire_rating: 4.8,
  current_plan: 'free'
}
```

---

## 🔐 RLS Policies Explained

### **1. Employers can only see their own payments**
```sql
CREATE POLICY "employers_read_own_payments" ON employer_payments
  FOR SELECT USING (auth.uid() = employer_id);
```
→ Vendor A cannot see Vendor B's payments

### **2. Only admins/system can insert payments**
```sql
CREATE POLICY "admins_insert_payments" ON employer_payments
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.jwt()->>'role' = 'service');
```
→ Prevents users from creating fake payment records
→ Payment webhooks create records using service role

### **3. Employers see their own spending**
```sql
CREATE POLICY "employers_read_own_spending" ON employer_spending
  FOR SELECT USING (auth.uid() = employer_id);
```
→ Dashboard queries work on their own data

---

## 🚀 Next Steps After Schema Execution

### **Week 2: Build Vendor Detection**
```typescript
// /lib/vendor-detection.ts
export async function detectVendor(userId: string) {
  const supabase = await createClient();
  
  // Check if user is vendor
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, name')
    .eq('user_id', userId)
    .single();
  
  if (vendor) {
    // Check if they have employer profile
    const { data: employer } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('vendor_id', vendor.id)
      .single();
    
    return {
      isVendor: true,
      vendorId: vendor.id,
      hasEmployerProfile: !!employer,
      employerId: employer?.id
    };
  }
  
  return { isVendor: false };
}
```

### **Week 2: Build Onboarding Page**
```
/careers/vendor/onboarding
├─ Vendor detection (redirect if not vendor)
├─ Display: "You're already a vendor! Start hiring:"
├─ Button: "Post Your First Job"
└─ Redirect to /careers/employer/payment-setup
```

### **Week 3: Build Payment Setup**
```
/careers/employer/payment-setup
├─ M-Pesa option
├─ Card option
├─ Pesapal option
└─ Create employer profile + add credits
```

### **Week 4: Build Employer Dashboard**
```
/careers/employer/dashboard
├─ Stats from employer_dashboard_stats view
├─ Active jobs widget
├─ Recent applications
├─ Credits & spending
└─ Quick actions (Post Job, View Applications)
```

---

## ⚠️ Important Notes

### **Backward Compatibility**
- This schema doesn't modify existing tables
- Existing vendors continue to work normally
- New columns are optional (with defaults)
- Safe to execute on production

### **Payment Processing**
- `employer_payments` table structure is ready
- Payment webhook will INSERT records with status='completed'
- Don't hardcode payment processing yet (we'll build that in Week 3)

### **Credits Ledger Integration**
- Credits system already exists (from Week 1)
- Job posting costs will deduct from `credits_ledger` table
- The view calculates balance from ledger (no duplication)

---

## 📝 What to Test After Execution

```sql
-- 1. Verify ENUM types
SELECT * FROM pg_type WHERE typname LIKE '%enum';

-- 2. Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'employer%';

-- 3. Test view
SELECT * FROM employer_dashboard_stats LIMIT 1;

-- 4. Test RLS policies are enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('employer_payments', 'employer_spending');
```

---

## 🎯 Ready to Execute?

1. Copy the schema from: `/VENDOR_INTEGRATION_SCHEMA.sql`
2. Go to Supabase SQL Editor
3. Paste & Run
4. Verify execution
5. Come back and we'll build the UI

Let me know when it's done! 🚀
