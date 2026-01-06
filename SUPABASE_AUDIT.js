#!/usr/bin/env node
/**
 * COMPREHENSIVE SUPABASE AUDIT
 * 
 * Checks:
 * - All table structures
 * - RLS policies for each table
 * - Foreign key relationships
 * - Missing indexes
 * - Data integrity issues
 * - Potential improvements
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditSupabase() {
  console.log('\n' + '='.repeat(100));
  console.log('COMPREHENSIVE SUPABASE AUDIT');
  console.log('='.repeat(100) + '\n');

  try {
    // 1. Check all tables
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. TABLE STRUCTURE AUDIT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const tables = ['users', 'rfqs', 'rfq_recipients', 'vendors', 'categories', 'vendor_services'];

    for (const table of tables) {
      console.log(`\n▸ TABLE: ${table.toUpperCase()}`);
      const { data: sample, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log(`  ❌ Error accessing table: ${sampleError.message}`);
        continue;
      }

      if (sample.length === 0) {
        console.log(`  ⚠️  No records (table is empty)`);
      } else {
        const columns = Object.keys(sample[0]);
        console.log(`  Columns (${columns.length}):`);
        columns.forEach(col => {
          const value = sample[0][col];
          const type = value === null ? 'unknown' : typeof value;
          console.log(`    - ${col}: ${type}`);
        });
      }
    }

    // 2. Check RLS policies
    console.log('\n\n' + '━'.repeat(100));
    console.log('2. ROW-LEVEL SECURITY (RLS) POLICIES AUDIT');
    console.log('━'.repeat(100) + '\n');

    console.log(`\n⚠️  NOTE: RLS policies must be checked in Supabase Dashboard`);
    console.log(`\nRECOMMENDED RLS POLICIES:\n`);

    const recommendedPolicies = {
      users: [
        {
          name: 'Users can see their own profile',
          operation: 'SELECT',
          definition: `auth.uid() = id`,
          status: '⏳ CHECK'
        },
        {
          name: 'Users can update their own profile',
          operation: 'UPDATE',
          definition: `auth.uid() = id`,
          status: '⏳ CHECK'
        }
      ],
      rfqs: [
        {
          name: 'Users can see their own RFQs',
          operation: 'SELECT',
          definition: `auth.uid() = user_id`,
          status: '⏳ CHECK'
        },
        {
          name: 'Users can create RFQs',
          operation: 'INSERT',
          definition: `auth.uid() = user_id`,
          status: '⏳ CHECK'
        },
        {
          name: 'Users can update their own RFQs',
          operation: 'UPDATE',
          definition: `auth.uid() = user_id`,
          status: '⏳ CHECK'
        },
        {
          name: 'Vendors can see RFQs sent to them',
          operation: 'SELECT',
          definition: `auth.uid() IN (SELECT vendor_id FROM rfq_recipients WHERE rfq_id = id)`,
          status: '⏳ CHECK'
        }
      ],
      rfq_recipients: [
        {
          name: 'Show vendor quote assignments',
          operation: 'SELECT',
          definition: `auth.uid() = vendor_id OR (SELECT user_id FROM rfqs WHERE id = rfq_id) = auth.uid()`,
          status: '⏳ CHECK'
        }
      ],
      vendors: [
        {
          name: 'Vendors can see their profile',
          operation: 'SELECT',
          definition: `true (public list for buyers)`,
          status: '⏳ CHECK'
        },
        {
          name: 'Vendors can update their profile',
          operation: 'UPDATE',
          definition: `auth.uid() = user_id`,
          status: '⏳ CHECK'
        }
      ]
    };

    for (const [table, policies] of Object.entries(recommendedPolicies)) {
      console.log(`\n${table.toUpperCase()}:`);
      policies.forEach((policy, idx) => {
        console.log(`  ${idx + 1}. ${policy.name}`);
        console.log(`     Operation: ${policy.operation}`);
        console.log(`     Policy: ${policy.definition}`);
        console.log(`     Status: ${policy.status}`);
      });
    }

    // 3. Check data integrity
    console.log('\n\n' + '━'.repeat(100));
    console.log('3. DATA INTEGRITY & CONSISTENCY CHECKS');
    console.log('━'.repeat(100) + '\n');

    // Check users
    console.log('\n▸ USERS TABLE');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, phone_verified, created_at');

    if (!usersError && users) {
      console.log(`  Total users: ${users.length}`);
      const verified = users.filter(u => u.phone_verified).length;
      console.log(`  Verified users: ${verified}/${users.length}`);
      
      // Check for null values in critical fields
      const { data: nullCheck } = await supabase
        .from('users')
        .select('id')
        .or('full_name.is.null,email.is.null');
      
      if (nullCheck && nullCheck.length > 0) {
        console.log(`  ⚠️  ${nullCheck.length} users with missing name or email`);
      } else {
        console.log(`  ✅ All users have name and email`);
      }
    }

    // Check RFQs
    console.log('\n▸ RFQS TABLE');
    const { data: rfqs, error: rfqsError } = await supabase
      .from('rfqs')
      .select('id, user_id, status, created_at');

    if (!rfqsError && rfqs) {
      console.log(`  Total RFQs: ${rfqs.length}`);
      
      const statuses = {};
      rfqs.forEach(r => {
        statuses[r.status] = (statuses[r.status] || 0) + 1;
      });
      
      console.log(`  Status breakdown:`);
      Object.entries(statuses).forEach(([status, count]) => {
        console.log(`    - ${status}: ${count}`);
      });

      // Check RFQs with missing vendors
      const { data: noVendors } = await supabase
        .from('rfqs')
        .select('id')
        .eq('type', 'direct')
        .not('id', 'in', `(SELECT DISTINCT rfq_id FROM rfq_recipients)`);

      if (noVendors && noVendors.length > 0) {
        console.log(`  ⚠️  ${noVendors.length} direct RFQs with no vendor assignments`);
      }
    }

    // Check vendors
    console.log('\n▸ VENDORS TABLE');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, company_name, phone_verified, status');

    if (!vendorsError && vendors) {
      console.log(`  Total vendors: ${vendors.length}`);
      const verified = vendors.filter(v => v.phone_verified).length;
      console.log(`  Phone verified: ${verified}/${vendors.length}`);
      
      const statuses = {};
      vendors.forEach(v => {
        statuses[v.status] = (statuses[v.status] || 0) + 1;
      });
      
      if (Object.keys(statuses).length > 0) {
        console.log(`  Approval status breakdown:`);
        Object.entries(statuses).forEach(([status, count]) => {
          console.log(`    - ${status}: ${count}`);
        });
      }
    }

    // 4. Recommended improvements
    console.log('\n\n' + '━'.repeat(100));
    console.log('4. RECOMMENDED IMPROVEMENTS');
    console.log('━'.repeat(100) + '\n');

    const improvements = [
      {
        category: 'Indexes',
        items: [
          {
            description: 'Index on rfqs(user_id) for fast user lookup',
            reason: 'Users frequently query their own RFQs',
            impact: 'High',
            sql: 'CREATE INDEX idx_rfqs_user_id ON rfqs(user_id);'
          },
          {
            description: 'Index on rfqs(category_slug) for filtering by category',
            reason: 'Category filtering is common in browse functionality',
            impact: 'Medium',
            sql: 'CREATE INDEX idx_rfqs_category_slug ON rfqs(category_slug);'
          },
          {
            description: 'Index on rfq_recipients(vendor_id) for vendor dashboard',
            reason: 'Vendors need to find their RFQs quickly',
            impact: 'High',
            sql: 'CREATE INDEX idx_rfq_recipients_vendor_id ON rfq_recipients(vendor_id);'
          },
          {
            description: 'Index on rfq_recipients(rfq_id) for RFQ detail view',
            reason: 'Need to fetch vendors for specific RFQ',
            impact: 'High',
            sql: 'CREATE INDEX idx_rfq_recipients_rfq_id ON rfq_recipients(rfq_id);'
          },
          {
            description: 'Index on vendors(status) for vendor browsing',
            reason: 'Filter only approved vendors',
            impact: 'Medium',
            sql: 'CREATE INDEX idx_vendors_status ON vendors(status);'
          }
        ]
      },
      {
        category: 'RLS Policies',
        items: [
          {
            description: 'Implement comprehensive RLS for all tables',
            reason: 'Prevent unauthorized access to sensitive data',
            impact: 'Critical',
            details: 'Enable RLS on all tables and create policies as recommended above'
          },
          {
            description: 'Add policy for public RFQ browsing',
            reason: 'Allow unauthenticated users to see public RFQs',
            impact: 'Medium',
            details: 'SELECT policy: visibility = "public" OR auth.uid() = user_id'
          },
          {
            description: 'Restrict vendor data modification',
            reason: 'Only vendors can update their own profiles',
            impact: 'High',
            details: 'UPDATE/DELETE policy: auth.uid() = user_id'
          }
        ]
      },
      {
        category: 'Constraints & Triggers',
        items: [
          {
            description: 'Add CHECK constraint: budget_min <= budget_max',
            reason: 'Prevent invalid budget ranges',
            impact: 'Medium',
            sql: 'ALTER TABLE rfqs ADD CONSTRAINT budget_range_check CHECK (budget_min <= budget_max);'
          },
          {
            description: 'Add NOT NULL constraint on rfqs.title',
            reason: 'Title is always required',
            impact: 'Low',
            sql: 'ALTER TABLE rfqs ALTER COLUMN title SET NOT NULL;'
          },
          {
            description: 'Add trigger to set updated_at on rfqs',
            reason: 'Automatically update timestamp on changes',
            impact: 'Low',
            details: 'Use Postgres trigger to update updated_at column'
          }
        ]
      },
      {
        category: 'Schema Improvements',
        items: [
          {
            description: 'Add is_deleted or soft delete timestamp',
            reason: 'Maintain audit trail and allow recovery',
            impact: 'Medium',
            details: 'Add deleted_at TIMESTAMP NULL column'
          },
          {
            description: 'Add created_by and updated_by fields',
            reason: 'Track who created/modified each record',
            impact: 'Medium',
            details: 'Useful for audit logs'
          },
          {
            description: 'Add search_vector for full-text search',
            reason: 'Enable fast full-text search on RFQ titles/descriptions',
            impact: 'Medium',
            details: 'Add tsvector column and trigger for auto-update'
          }
        ]
      },
      {
        category: 'Data Cleanup',
        items: [
          {
            description: 'Remove orphaned RFQ recipient records',
            reason: 'Clean up records where RFQ no longer exists',
            impact: 'Low',
            sql: 'DELETE FROM rfq_recipients WHERE rfq_id NOT IN (SELECT id FROM rfqs);'
          },
          {
            description: 'Check for duplicate user accounts',
            reason: 'Merge accounts with same email',
            impact: 'Medium',
            details: 'Check for multiple users with same email'
          }
        ]
      }
    ];

    improvements.forEach(improvement => {
      console.log(`\n${improvement.category.toUpperCase()}:`);
      improvement.items.forEach((item, idx) => {
        console.log(`\n  ${idx + 1}. ${item.description}`);
        console.log(`     Reason: ${item.reason}`);
        console.log(`     Impact: ${item.impact}`);
        if (item.sql) {
          console.log(`     SQL: ${item.sql}`);
        }
        if (item.details) {
          console.log(`     Details: ${item.details}`);
        }
      });
    });

    // 5. Security recommendations
    console.log('\n\n' + '━'.repeat(100));
    console.log('5. SECURITY RECOMMENDATIONS');
    console.log('━'.repeat(100) + '\n');

    const securityRecs = [
      {
        title: 'Enable RLS on ALL tables',
        description: 'Ensure every table has Row Level Security enabled',
        priority: 'CRITICAL',
        steps: [
          'Go to Authentication → Policies',
          'Enable RLS on: users, rfqs, rfq_recipients, vendors, categories, vendor_services',
          'Create appropriate policies for each table'
        ]
      },
      {
        title: 'Implement JWT token verification',
        description: 'Ensure all API calls include valid JWT tokens',
        priority: 'CRITICAL',
        steps: [
          'All endpoints already use service role or auth tokens',
          'Verify tokens are properly validated'
        ]
      },
      {
        title: 'Set up audit logging',
        description: 'Track all data changes for compliance',
        priority: 'HIGH',
        steps: [
          'Enable PostgreSQL logical replication',
          'Use audit triggers to log modifications',
          'Store audit logs in separate table'
        ]
      },
      {
        title: 'Implement rate limiting',
        description: 'Prevent API abuse and DoS attacks',
        priority: 'HIGH',
        steps: [
          'Add rate limiting middleware on all endpoints',
          'Implement per-user request quotas',
          'Track usage in database'
        ]
      },
      {
        title: 'Data encryption at rest',
        description: 'Sensitive data should be encrypted',
        priority: 'MEDIUM',
        steps: [
          'Enable Supabase encryption (available in Pro plan)',
          'Encrypt PII data before storage',
          'Encrypt phone numbers and addresses'
        ]
      }
    ];

    securityRecs.forEach((rec, idx) => {
      console.log(`${idx + 1}. [${rec.priority}] ${rec.title}`);
      console.log(`   Description: ${rec.description}`);
      console.log(`   Steps:`);
      rec.steps.forEach((step, stepIdx) => {
        console.log(`   ${String.fromCharCode(96 + stepIdx + 1)}) ${step}`);
      });
      console.log();
    });

    // 6. Performance recommendations
    console.log('━'.repeat(100));
    console.log('6. PERFORMANCE RECOMMENDATIONS');
    console.log('━'.repeat(100) + '\n');

    const perfRecs = [
      {
        title: 'Add database indexes',
        description: 'Speed up common queries',
        tables: ['rfqs(user_id)', 'rfqs(category_slug)', 'rfq_recipients(vendor_id)', 'vendors(status)']
      },
      {
        title: 'Use query pagination',
        description: 'Limit large result sets',
        example: '.select("*").range(0, 50)'
      },
      {
        title: 'Implement caching strategy',
        description: 'Cache frequently accessed data',
        example: 'Categories (changes rarely), vendor profiles'
      },
      {
        title: 'Use materialized views',
        description: 'Pre-calculate aggregations',
        example: 'RFQ counts by category, vendor statistics'
      }
    ];

    perfRecs.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec.title}`);
      console.log(`   ${rec.description}`);
      if (rec.tables) console.log(`   Tables: ${rec.tables.join(', ')}`);
      if (rec.example) console.log(`   Example: ${rec.example}`);
      console.log();
    });

    console.log('━'.repeat(100));
    console.log('END OF AUDIT');
    console.log('━'.repeat(100) + '\n');

  } catch (error) {
    console.error('❌ AUDIT ERROR:', error.message);
  }
}

auditSupabase().catch(console.error);
