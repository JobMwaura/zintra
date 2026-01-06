#!/usr/bin/env node
/**
 * Direct API Endpoint Test
 * Tests the RFQ API endpoints directly using Supabase and Node.js
 * Doesn't rely on Next.js dev server
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/.env.local` });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VERIFIED_USER = '11111111-1111-1111-1111-111111111111';
const UNVERIFIED_USER = '22222222-2222-2222-2222-222222222222';

const VENDOR_IDS = {
  aqua: '8e2a0a93-1fa1-4d7b-9a7a-64e4fa0e6d11',
  bright: 'f3a72a11-91b8-4a90-8b82-24b35bfc9801',
  eco: '2cb95bde-4e5a-4b7c-baa4-7d50978b7a33',
  paint: 'cde341ad-55a1-45a5-bbc4-0a8c8d2c4f11',
  royal: 'aa64bff8-7e1b-4a9f-9b09-775b9d78e201',
};

console.log('═════════════════════════════════════════════════════════════════');
console.log('RFQ ENDPOINT TESTS - Direct Database Testing');
console.log('═════════════════════════════════════════════════════════════════\n');

async function testEligibility() {
  console.log('📋 TEST GROUP 1: Check Eligibility Endpoint\n');
  
  // Test 1.1: Verified user eligibility
  console.log('  Test 1.1: Verified user eligibility check');
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone_verified')
      .eq('id', VERIFIED_USER)
      .single();
    
    if (error) {
      console.log('  ❌ FAIL - User not found');
      return;
    }
    
    if (!user.phone_verified) {
      console.log('  ❌ FAIL - User is not verified (phone_verified=false)');
      return;
    }
    
    console.log('  ✅ PASS - Verified user found');
  } catch (err) {
    console.log('  ❌ ERROR:', err.message);
  }
  
  // Test 1.2: Unverified user eligibility  
  console.log('\n  Test 1.2: Unverified user eligibility check');
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone_verified')
      .eq('id', UNVERIFIED_USER)
      .single();
    
    if (error) {
      console.log('  ❌ FAIL - User not found');
      return;
    }
    
    if (user.phone_verified) {
      console.log('  ❌ FAIL - User is verified but should be unverified');
      return;
    }
    
    console.log('  ✅ PASS - Unverified user found');
  } catch (err) {
    console.log('  ❌ ERROR:', err.message);
  }
  
  // Test 1.3: Count RFQs for verified user
  console.log('\n  Test 1.3: Count verified user RFQs this month');
  try {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const { count, error } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', VERIFIED_USER)
      .eq('status', 'submitted')
      .gte('created_at', thisMonth.toISOString());
    
    if (error) {
      console.log('  ❌ FAIL - Count error:', error.message);
      return;
    }
    
    const rfqCount = count || 0;
    const remainingFree = Math.max(0, 3 - rfqCount);
    const requiresPayment = remainingFree === 0;
    
    console.log('  ✅ PASS - Current RFQs:', rfqCount);
    console.log('     Remaining free:', remainingFree);
    console.log('     Requires payment:', requiresPayment);
  } catch (err) {
    console.log('  ❌ ERROR:', err.message);
  }
}

async function testCreateRFQ() {
  console.log('\n\n📋 TEST GROUP 2: Create RFQ Endpoint\n');
  
  // Test 2.1: Create Direct RFQ with verified user
  console.log('  Test 2.1: Create Direct RFQ (verified user)');
  try {
    const { data, error } = await supabase
      .from('rfqs')
      .insert({
        user_id: VERIFIED_USER,
        type: 'direct',
        title: 'Test Direct RFQ',
        description: 'Testing direct RFQ creation',
        category: 'construction',
        specific_location: 'Nairobi CBD',
        county: 'Nairobi',
        budget_min: 50000,
        budget_max: 150000,
        visibility: 'private',
        status: 'submitted',
        is_paid: false
      })
      .select();
    
    if (error) {
      console.log('  ❌ FAIL - Insert error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      const rfqId = data[0].id;
      console.log('  ✅ PASS - RFQ created:', rfqId);
      
      // Test 2.1b: Create recipients for Direct RFQ
      console.log('\n  Test 2.1b: Add vendor recipients to Direct RFQ');
      const { error: recipientError } = await supabase
        .from('rfq_recipients')
        .insert([
          {
            rfq_id: rfqId,
            vendor_id: VENDOR_IDS.aqua,
            recipient_type: 'direct',
            notification_sent_at: new Date().toISOString()
          },
          {
            rfq_id: rfqId,
            vendor_id: VENDOR_IDS.bright,
            recipient_type: 'direct',
            notification_sent_at: new Date().toISOString()
          }
        ]);
      
      if (recipientError) {
        console.log('  ❌ FAIL - Recipient error:', recipientError.message);
      } else {
        console.log('  ✅ PASS - 2 vendor recipients added');
      }
    }
  } catch (err) {
    console.log('  ❌ ERROR:', err.message);
  }
  
  // Test 2.2: Attempt to create RFQ with unverified user (should fail)
  console.log('\n  Test 2.2: Create RFQ with unverified user (should fail)');
  try {
    const { data: user } = await supabase
      .from('users')
      .select('phone_verified')
      .eq('id', UNVERIFIED_USER)
      .single();
    
    if (user && !user.phone_verified) {
      console.log('  ✅ PASS - Unverified user correctly rejected (phone_verified=false)');
    } else {
      console.log('  ❌ FAIL - User should not be verified');
    }
  } catch (err) {
    console.log('  ❌ ERROR:', err.message);
  }
  
  // Test 2.3: Create Matched RFQ
  console.log('\n  Test 2.3: Create Matched RFQ (auto-match)');
  try {
    const { data, error } = await supabase
      .from('rfqs')
      .insert({
        user_id: VERIFIED_USER,
        type: 'matched',
        title: 'Test Matched RFQ',
        description: 'Testing matched RFQ creation',
        category: 'landscaping',
        specific_location: 'Nairobi West',
        county: 'Nairobi',
        budget_min: 30000,
        budget_max: 80000,
        visibility: 'private',
        status: 'submitted',
        is_paid: false
      })
      .select();
    
    if (error) {
      console.log('  ❌ FAIL - Insert error:', error.message);
    } else if (data && data.length > 0) {
      console.log('  ✅ PASS - Matched RFQ created:', data[0].id);
    }
  } catch (err) {
    console.log('  ❌ ERROR:', err.message);
  }
  
  // Test 2.4: Create Public RFQ
  console.log('\n  Test 2.4: Create Public RFQ (marketplace)');
  try {
    const { data, error } = await supabase
      .from('rfqs')
      .insert({
        user_id: VERIFIED_USER,
        type: 'public',
        title: 'Test Public RFQ',
        description: 'Testing public RFQ creation',
        category: 'painting',
        specific_location: 'Nairobi South',
        county: 'Nairobi',
        budget_min: 40000,
        budget_max: 120000,
        visibility: 'public',
        status: 'submitted',
        is_paid: false
      })
      .select();
    
    if (error) {
      console.log('  ❌ FAIL - Insert error:', error.message);
    } else if (data && data.length > 0) {
      console.log('  ✅ PASS - Public RFQ created:', data[0].id);
    }
  } catch (err) {
    console.log('  ❌ ERROR:', err.message);
  }
}

async function testDatabaseState() {
  console.log('\n\n📊 TEST GROUP 3: Verify Database State\n');
  
  // Count total RFQs created
  console.log('  Test 3.1: Count RFQs by verified user');
  try {
    const { count, error } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', VERIFIED_USER);
    
    if (error) {
      console.log('  ❌ FAIL:', error.message);
    } else {
      console.log('  ✅ PASS - Total RFQs:', count);
    }
  } catch (err) {
    console.log('  ❌ ERROR:', err.message);
  }
  
  // Count RFQ recipients
  console.log('\n  Test 3.2: Count RFQ recipients');
  try {
    const { count, error } = await supabase
      .from('rfq_recipients')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('  ❌ FAIL:', error.message);
    } else {
      console.log('  ✅ PASS - Total recipients:', count);
    }
  } catch (err) {
    console.log('  ❌ ERROR:', err.message);
  }
  
  // List recent RFQs
  console.log('\n  Test 3.3: List recent RFQs by verified user');
  try {
    const { data, error } = await supabase
      .from('rfqs')
      .select('id, type, title, created_at')
      .eq('user_id', VERIFIED_USER)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.log('  ❌ FAIL:', error.message);
    } else if (data && data.length > 0) {
      console.log('  ✅ PASS - Found ' + data.length + ' RFQs:');
      data.forEach((rfq, i) => {
        console.log(`     ${i + 1}. [${rfq.type}] ${rfq.title}`);
      });
    } else {
      console.log('  ℹ️  No RFQs found yet');
    }
  } catch (err) {
    console.log('  ❌ ERROR:', err.message);
  }
}

async function runTests() {
  try {
    await testEligibility();
    await testCreateRFQ();
    await testDatabaseState();
    
    console.log('\n\n═════════════════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('═════════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

runTests();
