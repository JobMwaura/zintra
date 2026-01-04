# 🚀 Supabase Database Setup - Complete Guide

**Status:** ⚠️ **ACTION REQUIRED - Update DATABASE_URL**  
**Project:** Zintra Platform - Phase 2 Build  
**Database:** Supabase PostgreSQL

---

## 🔴 Critical Issue Found

Your project is **using Supabase** but the `.env` file is still pointing to **local PostgreSQL**!

```properties
# ❌ CURRENT (WRONG)
DATABASE_URL=postgresql://postgres:ZintraKenya2024@localhost:5432/zintra

# ✅ SHOULD BE (pointing to Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.zeomgqlnztcdqtespsjx.supabase.co:5432/postgres
```

---

## 📊 Current Database Status

| Item | Status | Details |
|------|--------|---------|
| **Supabase Project** | ✅ Active | zeomgqlnztcdqtespsjx |
| **Supabase URL** | ✅ Configured | https://zeomgqlnztcdqtespsjx.supabase.co |
| **Anon Key** | ✅ Configured | Set in .env |
| **DATABASE_URL** | ❌ Wrong | Points to localhost:5432 (doesn't exist) |
| **Prisma Schema** | ✅ Updated | Has 3 new category fields |
| **Initial Migration** | ⚠️ Status Unknown | Can't check without correct DB connection |
| **Seed Script** | ✅ Ready | 20 categories prepared |

---

## ⚙️ Step-by-Step Supabase Setup

### STEP 1: Get Your Supabase Connection String

1. **Go to Supabase Dashboard:**
   - URL: https://app.supabase.com
   - Log in with your credentials

2. **Navigate to Connection String:**
   - Click on your project: `zeomgqlnztcdqtespsjx`
   - Go to: **Settings** → **Database** → **Connection Pooling**
   - Look for: **Connection string** (under "Pooler mode")

3. **Copy the URI Format:**
   - You'll see something like:
   ```
   postgresql://postgres.zeomgqlnztcdqtespsjx:[PASSWORD]@db.zeomgqlnztcdqtespsjx.supabase.co:5432/postgres
   ```
   - OR use this format with your password:
   ```
   postgresql://postgres:[PASSWORD]@db.zeomgqlnztcdqtespsjx.supabase.co:5432/postgres
   ```

4. **Get Your Supabase Password:**
   - If you don't remember the password, go to:
   - **Settings** → **Database** → **Database Password** → **Reset password**
   - Save the new password

### STEP 2: Update Your .env File

Replace the DATABASE_URL with your Supabase connection string:

```bash
# Before
DATABASE_URL=postgresql://postgres:ZintraKenya2024@localhost:5432/zintra

# After (use YOUR password from Supabase)
DATABASE_URL=postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@db.zeomgqlnztcdqtespsjx.supabase.co:5432/postgres
```

**Example:**
```bash
DATABASE_URL=postgresql://postgres:abc123XyZ@db.zeomgqlnztcdqtespsjx.supabase.co:5432/postgres
```

### STEP 3: Check Migration Status

Once you've updated the .env file:

```bash
cd /Users/macbookpro2/Desktop/zintra-platform
npx prisma migrate status
```

This will tell you:
- ✅ If the initial migration has been applied
- ⚠️ If there are pending migrations
- ❌ If migrations are missing

### STEP 4a: If Initial Migration is NOT Applied

If you see: *"Following migrations have not yet been applied: 20251002203319_init"*

Run:
```bash
npx prisma migrate deploy
```

This will:
- Apply the initial migration to Supabase
- Create all tables (User, VendorProfile, Category, etc.)
- Set up relationships and indexes
- Takes ~30 seconds

### STEP 4b: If 3 Category Fields are Missing

If the initial migration was applied but **before** the schema had the 3 new fields, you need to add them.

Check what's in the database:
```bash
npx prisma db execute --stdin << 'SQL'
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'VendorProfile' 
ORDER BY ordinal_position;
SQL
```

If you **don't see** `primaryCategorySlug`, `secondaryCategories`, or `otherServices`:

Create a migration:
```bash
npx prisma migrate dev --name "add-category-fields"
```

This will:
- Detect schema mismatch
- Create new migration SQL
- Apply it to Supabase
- Update Prisma client

### STEP 5: Populate Categories (20 Canonical Categories)

Once the schema is updated:

```bash
npm run prisma db seed
```

This will:
- Insert 20 canonical construction categories
- Skip duplicates (idempotent)
- Output: `✓ Created: X categories` or `⊘ Skipped: Y categories`

**Expected Output:**
```
🌱 Starting database seed...
✓ Created category: "Architectural Design" (architectural_design)
✓ Created category: "Doors, Windows & Glass" (doors_windows_glass)
... (18 more categories)

📊 Seed Summary:
  ✓ Created: 20 categories
  ⊘ Skipped: 0 categories
  📦 Total: 20/20 categories in database

✅ All 20 canonical categories are ready!
```

### STEP 6: Verify Everything

After seeding, verify your database:

```bash
# Check categories were inserted
npx prisma db execute --stdin << 'SQL'
SELECT COUNT(*) as category_count FROM "Category";
SELECT name, slug FROM "Category" LIMIT 5;
SQL
```

Or in Supabase dashboard:
- Go to: **SQL Editor**
- Run: `SELECT COUNT(*) FROM "Category";`
- Expected: **20 rows**

---

## 📋 Quick Command Checklist

```bash
# Step 1: Verify .env is updated (check DATABASE_URL points to Supabase)
cat .env | grep DATABASE_URL

# Step 2: Check migration status
npx prisma migrate status

# Step 3: If needed, apply migrations
npx prisma migrate deploy
# OR create new migration if schema changed:
npx prisma migrate dev --name "add-category-fields"

# Step 4: Seed the database
npm run prisma db seed

# Step 5: Verify categories exist
npx prisma db execute --stdin << 'SQL'
SELECT COUNT(*) as total, COUNT(DISTINCT slug) as unique_slugs FROM "Category";
SQL
```

---

## 🎯 What Gets Set Up

### Database Tables Created:
1. **User** - App users (customers, vendors, admins)
2. **VendorProfile** - Vendor information + NEW category fields
3. **Category** - 20 canonical service categories
4. **VendorCategory** - Junction table (vendor + category relationships)
5. **PortfolioImage** - Vendor portfolio images
6. **Certification** - Vendor certifications
7. **Subscription** - Vendor subscription data

### New Fields in VendorProfile:
```javascript
primaryCategorySlug String?        // Primary service category
secondaryCategories Json?          // Array of 0-5 secondary categories
otherServices String?              // Free-text additional services
```

### 20 Canonical Categories:
1. Architectural Design
2. Doors, Windows & Glass
3. Flooring & Wall Finishes
4. Interior Decoration
5. Structural & Foundation Work
6. Roofing Services
7. Electrical Installation
8. Plumbing & Sanitation
9. HVAC Systems
10. Painting & Finishing
11. Metalwork & Fabrication
12. Carpentry & Woodwork
13. Tiling & Stonemasonry
14. Landscaping & Outdoor
15. Security Systems
16. Smart Home Technology
17. Water & Waste Management
18. Safety & Compliance
19. Special Structures
20. General Construction

---

## ✅ All Phase 2 Components Ready

Once database is set up, you can integrate:

### React Components (4 files):
- ✅ `components/modals/UniversalRFQModal.js` (350 lines)
- ✅ `components/modals/RFQModalDispatcher.js` (150 lines)
- ✅ `components/vendor-profile/CategorySelector.js` (350 lines)
- ✅ `components/vendor-profile/CategoryManagement.js` (200 lines)

### API Endpoints (1 file):
- ✅ `app/api/vendor/update-categories.js` (106 lines)

### RFQ Templates (20 files):
- ✅ Location: `lib/rfqTemplates/categories/`
- ✅ All 20 categories covered

### Documentation (5 files):
- ✅ Integration guides and quick starts ready

---

## 🔗 Integration Points (After DB Setup)

### 1. Vendor Signup Form
- **File:** `app/vendor-registration/page.js` (line ~770)
- **Action:** Add `<CategorySelector />` component
- **Time:** 30 minutes
- **Status:** Ready to integrate

### 2. Vendor Profile Dashboard
- **Where:** Vendor settings section
- **Action:** Add `<CategoryManagement />` component
- **Time:** 20 minutes
- **Status:** Ready to integrate

### 3. RFQ Response Modal
- **Where:** RFQ listing page
- **Action:** Add `<RFQModalDispatcher />` component
- **Time:** 30 minutes
- **Status:** Ready to integrate

---

## ⏱️ Timeline

| Step | Time | Blocker |
|------|------|---------|
| 1. Update .env | 2 min | None |
| 2. Check migrations | 1 min | #1 |
| 3. Apply migrations | 5 min | #2 |
| 4. Seed categories | 2 min | #3 |
| 5. Verify setup | 2 min | #4 |
| **Database Ready** | **12 min** | None |
| 6. Integrate components | 1.5 hrs | Database ready |
| 7. Testing | 1 hr | #6 |
| **Full Production** | **~2.5 hours** | Database ready |

---

## 🚨 Troubleshooting

### Error: "Can't reach database server"
- **Cause:** DATABASE_URL points to localhost
- **Fix:** Update .env with Supabase connection string

### Error: "Permission denied"
- **Cause:** Wrong Supabase password
- **Fix:** Reset password in Supabase → Settings → Database

### Error: "Migration failed"
- **Cause:** Schema conflicts or migration issues
- **Solution:** Go to Supabase SQL Editor and check table structure

### Seed script not finding categories
- **Cause:** Missing `lib/categories/canonicalCategories.js`
- **Fix:** Check file exists and has CANONICAL_CATEGORIES export

---

## ✨ Next Actions

1. ✅ Get Supabase connection string
2. ✅ Update DATABASE_URL in .env
3. ✅ Run: `npx prisma migrate status`
4. ✅ Report migration status back
5. ✅ Run migration commands (I'll provide exact ones based on status)
6. ✅ Run seed script
7. ✅ Verify database is ready
8. ✅ Proceed with component integration

**Ready to proceed once you have your Supabase connection string!**

