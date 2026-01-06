// ============================================================================
// RFQ SUPABASE TABLE VERIFICATION & SYNC DIAGNOSTIC
// ============================================================================
// This script verifies that:
// 1. RFQ endpoints are using correct table names and columns
// 2. Data is properly stored in Supabase
// 3. Tables are syncing correctly between frontend and backend
// 4. All required columns exist and have correct data types
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// 1. CHECK TABLE SCHEMA
// ============================================================================

async function checkTableSchema() {
  console.log('\n📋 CHECKING TABLE SCHEMAS...\n');

  const tables = [
    { name: 'rfqs', expectedColumns: ['id', 'user_id', 'title', 'description', 'category_slug', 'budget_min', 'budget_max', 'status', 'created_at', 'updated_at'] },
    { name: 'rfq_recipients', expectedColumns: ['id', 'rfq_id', 'vendor_id', 'status', 'created_at'] },
    { name: 'categories', expectedColumns: ['id', 'name', 'slug', 'description'] },
    { name: 'vendors', expectedColumns: ['id', 'company_name', 'status', 'is_approved'] },
    { name: 'users', expectedColumns: ['id', 'full_name', 'email', 'created_at'] }
  ];

  for (const table of tables) {
    console.log(`Checking ${table.name}...`);
    try {
      // Try to fetch one row to check table exists and columns work
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`  ❌ ERROR: ${error.message}`);
        continue;
      }

      if (data && data.length > 0) {
        const actualColumns = Object.keys(data[0]);
        const missingColumns = table.expectedColumns.filter(col => !actualColumns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log(`  ⚠️  Missing expected columns: ${missingColumns.join(', ')}`);
        } else {
          console.log(`  ✅ All expected columns present`);
        }
        
        console.log(`  📊 Total columns: ${actualColumns.length}`);
        console.log(`  Fields: ${actualColumns.slice(0, 5).join(', ')}${actualColumns.length > 5 ? '...' : ''}`);
      } else {
        console.log(`  ℹ️  Table is empty (no records to check)`);
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
    }
  }
}

// ============================================================================
// 2. CHECK RFQ DATA INTEGRITY
// ============================================================================

async function checkRFQDataIntegrity() {
  console.log('\n📊 CHECKING RFQ DATA INTEGRITY...\n');

  try {
    // Get all RFQs
    const { data: rfqs, error } = await supabase
      .from('rfqs')
      .select('*');

    if (error) {
      console.log(`❌ Error fetching RFQs: ${error.message}`);
      return;
    }

    if (!rfqs || rfqs.length === 0) {
      console.log('ℹ️  No RFQs in database yet');
      return;
    }

    console.log(`✅ Found ${rfqs.length} RFQ(s)\n`);

    // Check for data quality issues
    let issues = {
      missingTitle: 0,
      missingUser: 0,
      missingCategory: 0,
      invalidBudget: 0,
      invalidStatus: 0,
      orphaned: 0
    };

    for (const rfq of rfqs) {
      if (!rfq.title) issues.missingTitle++;
      if (!rfq.user_id) issues.missingUser++;
      if (!rfq.category_slug) issues.missingCategory++;
      if (rfq.budget_min && rfq.budget_max && rfq.budget_min > rfq.budget_max) issues.invalidBudget++;
      if (!['submitted', 'open', 'pending', 'closed', 'completed', 'cancelled'].includes(rfq.status)) {
        issues.invalidStatus++;
      }
    }

    // Check for orphaned RFQs (user doesn't exist)
    const { data: users } = await supabase.from('users').select('id');
    const userIds = new Set(users?.map(u => u.id) || []);

    for (const rfq of rfqs) {
      if (!userIds.has(rfq.user_id)) issues.orphaned++;
    }

    console.log('Data Quality Issues Found:');
    console.log(`  Missing title: ${issues.missingTitle}`);
    console.log(`  Missing user_id: ${issues.missingUser}`);
    console.log(`  Missing category_slug: ${issues.missingCategory}`);
    console.log(`  Invalid budget (min > max): ${issues.invalidBudget}`);
    console.log(`  Invalid status value: ${issues.invalidStatus}`);
    console.log(`  Orphaned records (user deleted): ${issues.orphaned}`);

    // Show status distribution
    const statusCounts = {};
    rfqs.forEach(rfq => {
      statusCounts[rfq.status] = (statusCounts[rfq.status] || 0) + 1;
    });

    console.log('\nRFQ Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Sample RFQs
    console.log('\nSample RFQs:');
    rfqs.slice(0, 3).forEach((rfq, idx) => {
      console.log(`\n  RFQ ${idx + 1}:`);
      console.log(`    ID: ${rfq.id}`);
      console.log(`    Title: ${rfq.title}`);
      console.log(`    User: ${rfq.user_id}`);
      console.log(`    Category: ${rfq.category_slug}`);
      console.log(`    Budget: $${rfq.budget_min} - $${rfq.budget_max}`);
      console.log(`    Status: ${rfq.status}`);
      console.log(`    Created: ${new Date(rfq.created_at).toLocaleString()}`);
    });

  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }
}

// ============================================================================
// 3. CHECK RFQ RECIPIENTS SYNC
// ============================================================================

async function checkRFQRecipientsSync() {
  console.log('\n🔗 CHECKING RFQ RECIPIENTS SYNC...\n');

  try {
    const { data: rfqRecipients, error } = await supabase
      .from('rfq_recipients')
      .select('*');

    if (error) {
      console.log(`❌ Error fetching RFQ recipients: ${error.message}`);
      return;
    }

    if (!rfqRecipients || rfqRecipients.length === 0) {
      console.log('ℹ️  No RFQ recipients yet (RFQs may not have been sent to vendors)');
      return;
    }

    console.log(`✅ Found ${rfqRecipients.length} RFQ recipient record(s)\n`);

    // Check for orphaned recipients (RFQ or vendor deleted)
    const { data: rfqs } = await supabase.from('rfqs').select('id');
    const { data: vendors } = await supabase.from('vendors').select('id');

    const rfqIds = new Set(rfqs?.map(r => r.id) || []);
    const vendorIds = new Set(vendors?.map(v => v.id) || []);

    let orphanedRFQs = 0;
    let orphanedVendors = 0;

    rfqRecipients.forEach(recipient => {
      if (!rfqIds.has(recipient.rfq_id)) orphanedRFQs++;
      if (!vendorIds.has(recipient.vendor_id)) orphanedVendors++;
    });

    console.log('Sync Issues Found:');
    console.log(`  Recipients with missing RFQ: ${orphanedRFQs}`);
    console.log(`  Recipients with missing vendor: ${orphanedVendors}`);

    // Status distribution
    const statusCounts = {};
    rfqRecipients.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    console.log('\nRecipient Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Show sample recipients
    console.log('\nSample Recipients:');
    rfqRecipients.slice(0, 3).forEach((recipient, idx) => {
      console.log(`\n  Recipient ${idx + 1}:`);
      console.log(`    RFQ: ${recipient.rfq_id}`);
      console.log(`    Vendor: ${recipient.vendor_id}`);
      console.log(`    Status: ${recipient.status}`);
      console.log(`    Created: ${new Date(recipient.created_at).toLocaleString()}`);
    });

  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }
}

// ============================================================================
// 4. CHECK ENDPOINT CODE
// ============================================================================

async function checkEndpointCode() {
  console.log('\n🔍 CHECKING ENDPOINT CODE...\n');

  try {
    const endpointPath = path.join(process.cwd(), 'app', 'api', 'rfq', 'create', 'route.js');
    
    if (!fs.existsSync(endpointPath)) {
      console.log(`❌ Endpoint file not found: ${endpointPath}`);
      return;
    }

    const code = fs.readFileSync(endpointPath, 'utf-8');

    console.log('Checking endpoint for correct table usage...\n');

    // Check for key operations
    const checks = [
      { pattern: /\.from\(['"]rfqs['"]\)/, description: 'Uses rfqs table' },
      { pattern: /budget_min/, description: 'Uses budget_min column' },
      { pattern: /budget_max/, description: 'Uses budget_max column' },
      { pattern: /category_slug/, description: 'Uses category_slug column' },
      { pattern: /user_id/, description: 'Uses user_id for association' },
      { pattern: /auth\.uuid\(\)/, description: 'Gets user from auth context' },
      { pattern: /status/, description: 'Sets status field' },
    ];

    checks.forEach(check => {
      if (check.pattern.test(code)) {
        console.log(`  ✅ ${check.description}`);
      } else {
        console.log(`  ⚠️  ${check.description} - NOT FOUND`);
      }
    });

    // Show relevant code snippet
    console.log('\nEndpoint code snippet:');
    const lines = code.split('\n');
    const insertIndex = lines.findIndex(l => l.includes('.insert('));
    if (insertIndex !== -1) {
      console.log('  Insert operation:');
      lines.slice(insertIndex, Math.min(insertIndex + 10, lines.length)).forEach(line => {
        console.log(`    ${line}`);
      });
    }

  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }
}

// ============================================================================
// 5. CHECK CATEGORY DATA
// ============================================================================

async function checkCategoryData() {
  console.log('\n📂 CHECKING CATEGORY DATA...\n');

  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .limit(10);

    if (error) {
      console.log(`❌ Error fetching categories: ${error.message}`);
      return;
    }

    if (!categories || categories.length === 0) {
      console.log('❌ NO CATEGORIES FOUND - RFQs will fail!');
      console.log('   Solution: Run seed-categories.js to populate categories');
      return;
    }

    console.log(`✅ Found ${categories.length} categories\n`);

    // Check that RFQs are using valid category slugs
    const { data: rfqs } = await supabase.from('rfqs').select('category_slug');
    if (rfqs && rfqs.length > 0) {
      const categorySlugs = new Set(categories.map(c => c.slug));
      const usedSlugs = new Set(rfqs.map(r => r.category_slug).filter(Boolean));

      const invalidSlugs = [...usedSlugs].filter(slug => !categorySlugs.has(slug));
      if (invalidSlugs.length > 0) {
        console.log(`⚠️  RFQs using invalid category slugs: ${invalidSlugs.join(', ')}`);
      } else {
        console.log('✅ All RFQs use valid category slugs');
      }
    }

    console.log('\nSample Categories:');
    categories.slice(0, 5).forEach((cat, idx) => {
      console.log(`  ${idx + 1}. ${cat.name} (${cat.slug})`);
    });

  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }
}

// ============================================================================
// 6. CHECK USER DATA
// ============================================================================

async function checkUserData() {
  console.log('\n👥 CHECKING USER DATA...\n');

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.log(`❌ Error fetching users: ${error.message}`);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users in database');
      return;
    }

    console.log(`✅ Found ${users.length} user(s)\n`);

    // Check email data
    const usersWithoutEmail = users.filter(u => !u.email || u.email.includes('@zintra.local'));
    if (usersWithoutEmail.length > 0) {
      console.log(`⚠️  ${usersWithoutEmail.length} users have placeholder/missing email`);
    } else {
      console.log('✅ All users have proper email addresses');
    }

    // Check RFQ ownership
    const { data: rfqs } = await supabase.from('rfqs').select('user_id');
    if (rfqs && rfqs.length > 0) {
      const rfqOwnerIds = new Set(rfqs.map(r => r.user_id));
      const userIds = new Set(users.map(u => u.id));
      const orphanedRFQs = [...rfqOwnerIds].filter(id => !userIds.has(id)).length;
      
      if (orphanedRFQs > 0) {
        console.log(`⚠️  ${orphanedRFQs} RFQs belong to deleted users`);
      } else {
        console.log('✅ All RFQs have valid user ownership');
      }
    }

    console.log('\nSample Users:');
    users.slice(0, 3).forEach((user, idx) => {
      console.log(`  ${idx + 1}. ${user.full_name} (${user.email})`);
    });

  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }
}

// ============================================================================
// 7. SYNC RECOMMENDATIONS
// ============================================================================

function showRecommendations() {
  console.log('\n💡 SYNC RECOMMENDATIONS...\n');

  console.log('1. Frontend-Backend Sync:');
  console.log('   ✓ Frontend should use these exact table names:');
  console.log('     - rfqs (for creating/reading RFQs)');
  console.log('     - rfq_recipients (for tracking sent RFQs)');
  console.log('     - categories (for dropdown selection)');
  console.log('     - vendors (for vendor selection)');

  console.log('\n2. Required RFQ Fields:');
  console.log('   ✓ title (NOT NULL)');
  console.log('   ✓ user_id (from auth.uid())');
  console.log('   ✓ category_slug (must match categories.slug)');
  console.log('   ✓ budget_min, budget_max (numeric, min ≤ max)');
  console.log('   ✓ status (default: "submitted")');

  console.log('\n3. Table Relationships:');
  console.log('   ✓ rfqs.user_id → users.id');
  console.log('   ✓ rfqs.category_slug → categories.slug');
  console.log('   ✓ rfq_recipients.rfq_id → rfqs.id');
  console.log('   ✓ rfq_recipients.vendor_id → vendors.id');

  console.log('\n4. RLS Policies:');
  console.log('   ✓ Users can only see their own RFQs');
  console.log('   ✓ Vendors can see RFQs assigned to them');
  console.log('   ✓ Categories are public read-only');

  console.log('\n5. Testing Steps:');
  console.log('   1. Create an RFQ through frontend');
  console.log('   2. Verify it appears in Supabase rfqs table');
  console.log('   3. Check all required fields are populated');
  console.log('   4. Verify category_slug matches a valid category');
  console.log('   5. Check updated_at timestamp is correct');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('RFQ SUPABASE SYNC VERIFICATION');
  console.log('='.repeat(80));

  await checkTableSchema();
  await checkRFQDataIntegrity();
  await checkRFQRecipientsSync();
  await checkCategoryData();
  await checkUserData();
  await checkEndpointCode();
  showRecommendations();

  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);
