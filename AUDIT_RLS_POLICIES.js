// ============================================================================
// RLS POLICIES AUDIT - Check what's blocking RFQ submissions
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use service role to inspect database directly
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// AUDIT FUNCTION
// ============================================================================

async function auditRLSPolicies() {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 RLS POLICIES AUDIT - RFQ SUBMISSION BLOCKING ANALYSIS');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Get all policies
    console.log('📋 Step 1: Fetching all RLS policies...\n');
    
    const { data: allPolicies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public');

    if (policiesError) {
      console.log('⚠️  Note: Cannot query pg_policies directly via client');
      console.log('   Using alternative method...\n');
      await auditViaSQL();
    } else {
      console.log(`✅ Found ${allPolicies?.length || 0} policies\n`);
      analyzeRFQPolicies(allPolicies);
    }

  } catch (err) {
    console.log('ℹ️  Using SQL-based audit instead:\n');
    await auditViaSQL();
  }
}

// ============================================================================
// SQL-BASED AUDIT (More reliable)
// ============================================================================

async function auditViaSQL() {
  console.log('Running SQL-based policy audit...\n');

  // SQL query to get all policies
  const query = `
    SELECT 
      tablename,
      policyname,
      permissive,
      roles,
      COALESCE(qual, 'No SELECT condition') as select_condition,
      COALESCE(with_check, 'No INSERT/UPDATE condition') as insert_condition
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;

  const { data, error } = await supabaseAdmin.rpc('query_sql', { sql: query }).catch(() => ({
    data: null,
    error: { message: 'RPC not available' }
  }));

  if (error) {
    console.log('⚠️  Cannot execute SQL audit directly');
    console.log('   Please run AUDIT_RLS_POLICIES.sql in Supabase SQL Editor\n');
    return;
  }

  analyzeRFQPolicies(data);
}

// ============================================================================
// ANALYZE RFQ POLICIES
// ============================================================================

function analyzeRFQPolicies(policies) {
  if (!policies || policies.length === 0) {
    console.log('⚠️  No policies found in database\n');
    return;
  }

  console.log('📊 POLICY ANALYSIS\n');
  console.log('='.repeat(80) + '\n');

  // Group by table
  const policyByTable = {};
  policies.forEach(policy => {
    if (!policyByTable[policy.tablename]) {
      policyByTable[policy.tablename] = [];
    }
    policyByTable[policy.tablename].push(policy);
  });

  // Analyze each table
  Object.entries(policyByTable).forEach(([tableName, tablePolicies]) => {
    console.log(`\n🔍 TABLE: ${tableName}`);
    console.log('-'.repeat(80));

    tablePolicies.forEach(policy => {
      const policyType = policy.permissive ? '✅ ALLOW' : '❌ DENY';
      const operation = policy.insert_condition !== 'No INSERT/UPDATE condition' ? 'INSERT/UPDATE' : 'SELECT';

      console.log(`\n  Policy: "${policy.policyname}"`);
      console.log(`  Type: ${policyType}`);
      console.log(`  Operation: ${operation}`);
      
      if (policy.select_condition !== 'No SELECT condition') {
        console.log(`  SELECT: ${policy.select_condition}`);
      }
      
      if (policy.insert_condition !== 'No INSERT/UPDATE condition') {
        console.log(`  INSERT: ${policy.insert_condition}`);
      }
    });
  });

  // RFQ-specific analysis
  console.log('\n\n' + '='.repeat(80));
  console.log('🎯 RFQ SUBMISSION ANALYSIS');
  console.log('='.repeat(80) + '\n');

  const rfqPolicies = policyByTable['rfqs'] || [];

  if (rfqPolicies.length === 0) {
    console.log('❌ CRITICAL: No RLS policies on rfqs table!');
    console.log('   This would block ALL access to RFQ table\n');
    return;
  }

  // Check for INSERT policy
  const insertPolicy = rfqPolicies.find(p => 
    p.insert_condition !== 'No INSERT/UPDATE condition' && p.permissive
  );

  if (!insertPolicy) {
    console.log('❌ PROBLEM: No ALLOW policy for INSERT on rfqs table');
    console.log('   This will block RFQ creation!\n');
    console.log('   Solution:');
    console.log('   CREATE POLICY "Users can create RFQs"');
    console.log('     ON rfqs FOR INSERT');
    console.log('     WITH CHECK (auth.uid() = user_id);\n');
  } else {
    console.log('✅ INSERT policy exists:', insertPolicy.policyname);
    console.log('   Condition:', insertPolicy.insert_condition, '\n');

    // Check if it allows auth.uid()
    if (insertPolicy.insert_condition.includes('auth.uid()') && 
        insertPolicy.insert_condition.includes('user_id')) {
      console.log('✅ Policy correctly checks auth.uid() = user_id\n');
    } else {
      console.log('⚠️  WARNING: Policy might not be checking auth.uid() correctly');
      console.log('   Check the condition:', insertPolicy.insert_condition, '\n');
    }
  }

  // List all RFQ policies
  console.log('All RFQ Policies:');
  rfqPolicies.forEach((policy, idx) => {
    const type = policy.permissive ? 'ALLOW' : 'DENY';
    const op = policy.insert_condition !== 'No INSERT/UPDATE condition' ? 'INSERT' : 'SELECT';
    console.log(`  ${idx + 1}. "${policy.policyname}" [${type} ${op}]`);
  });

  // Recommendations
  console.log('\n\n' + '='.repeat(80));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(80) + '\n');

  if (!insertPolicy) {
    console.log('❌ URGENT: Create INSERT policy for RFQs\n');
  } else {
    console.log('✅ INSERT policy exists\n');
  }

  // Check for SELECT policy
  const selectPolicy = rfqPolicies.find(p => 
    p.select_condition !== 'No SELECT condition' && p.permissive
  );

  if (selectPolicy) {
    console.log('✅ SELECT policy exists\n');
  } else {
    console.log('⚠️  No SELECT policy - users might not see their RFQs\n');
  }

  // Check for UPDATE policy
  const updatePolicy = rfqPolicies.find(p => 
    p.insert_condition !== 'No INSERT/UPDATE condition' && 
    p.policyname.includes('update') && 
    p.permissive
  );

  if (updatePolicy) {
    console.log('✅ UPDATE policy exists\n');
  } else {
    console.log('⚠️  No UPDATE policy - users cannot update their RFQs\n');
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 NEXT STEP: Run AUDIT_RLS_POLICIES.sql in Supabase SQL Editor');
  console.log('   for detailed policy information\n');
}

// ============================================================================
// Run audit
// ============================================================================

auditRLSPolicies().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
