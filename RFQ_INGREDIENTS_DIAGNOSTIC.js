#!/usr/bin/env node
/**
 * COMPREHENSIVE RFQ SUBMISSION DIAGNOSTIC
 * 
 * This script identifies EXACTLY what's needed for RFQ creation to succeed.
 * Tests all prerequisites, checks flow, and identifies exactly where it breaks.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('\n' + '='.repeat(80));
  console.log('RFQ SUBMISSION INGREDIENTS DIAGNOSTIC');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Check users table structure
    console.log('\n--- 1. USERS TABLE STRUCTURE & PHONE VERIFICATION ---');
    const { data: userColumns, error: userColError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (userColError) {
      console.error('❌ Cannot query users table:', userColError.message);
    } else {
      const user = userColumns[0];
      if (user) {
        console.log('✅ Sample user fields:');
        Object.keys(user).forEach(key => {
          const value = user[key];
          const isNull = value === null ? ' (NULL)' : '';
          console.log(`   - ${key}: ${typeof value}${isNull}`);
        });
      }
    }

    // 2. Check for users with phone_verified = true
    console.log('\n--- 2. USERS WITH PHONE_VERIFIED = TRUE ---');
    const { data: verifiedUsers, error: verifiedError } = await supabase
      .from('users')
      .select('id, email, phone_verified, phone_verified_at, full_name')
      .eq('phone_verified', true);
    
    if (verifiedError) {
      console.error('❌ Error checking verified users:', verifiedError.message);
    } else {
      console.log(`✅ Found ${verifiedUsers.length} users with phone_verified = true`);
      verifiedUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.full_name} (${u.email})`);
        console.log(`      └─ ID: ${u.id}`);
        console.log(`      └─ phone_verified: ${u.phone_verified}`);
        console.log(`      └─ verified_at: ${u.phone_verified_at}`);
      });
    }

    // 3. Check categories table
    console.log('\n--- 3. AVAILABLE CATEGORIES ---');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(10);
    
    if (catError) {
      console.error('❌ Error checking categories:', catError.message);
    } else {
      console.log(`✅ Found ${categories.length} categories`);
      categories.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name} (slug: ${c.slug}, id: ${c.id})`);
      });
    }

    // 4. Check RFQs table structure
    console.log('\n--- 4. RFQS TABLE STRUCTURE & CONSTRAINTS ---');
    const { data: sampleRFQ, error: rfqError } = await supabase
      .from('rfqs')
      .select('*')
      .limit(1);
    
    if (rfqError) {
      console.error('❌ Cannot query rfqs table:', rfqError.message);
    } else if (sampleRFQ.length > 0) {
      const rfq = sampleRFQ[0];
      console.log('✅ RFQs table structure:');
      const requiredFields = [
        'id', 'user_id', 'title', 'description', 'category_slug',
        'county', 'specific_location', 'type', 'status',
        'budget_estimate', 'urgency', 'is_paid', 'visibility'
      ];
      
      requiredFields.forEach(field => {
        const exists = field in rfq;
        const value = rfq[field];
        const status = exists ? '✅' : '❌';
        const val = value !== null ? ` = ${typeof value === 'object' ? JSON.stringify(value) : value}` : ' (NULL)';
        console.log(`   ${status} ${field}${val}`);
      });
    }

    // 5. Check RLS policies
    console.log('\n--- 5. RLS POLICIES CHECK ---');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Cannot get auth session:', authError.message);
    } else {
      const session = authData?.session;
      if (!session) {
        console.log('⚠️  No active session (using anon key)');
        console.log('   RLS policies will use `auth.uid()` NULL check');
      } else {
        console.log(`✅ Active session for user: ${session.user.id}`);
        console.log(`   Email: ${session.user.email}`);
      }
    }

    // 6. Check job types
    console.log('\n--- 6. AVAILABLE JOB TYPES ---');
    const { data: jobTypes, error: jobTypeError } = await supabase
      .from('job_types')
      .select('id, name, slug, category_id')
      .limit(5);
    
    if (jobTypeError) {
      console.error('❌ Error checking job types:', jobTypeError.message);
    } else {
      console.log(`✅ Found ${jobTypes.length} job types`);
      jobTypes.forEach((jt, i) => {
        console.log(`   ${i + 1}. ${jt.name} (slug: ${jt.slug}, category: ${jt.category_id})`);
      });
    }

    // 7. Check vendors table
    console.log('\n--- 7. AVAILABLE VENDORS ---');
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, company_name, category_id, email')
      .limit(5);
    
    if (vendorError) {
      console.error('❌ Error checking vendors:', vendorError.message);
    } else {
      console.log(`✅ Found ${vendors.length} vendors in database`);
      vendors.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.company_name} (id: ${v.id}, category: ${v.category_id})`);
      });
    }

    // 8. Check rfq_recipients table structure
    console.log('\n--- 8. RFQ_RECIPIENTS TABLE STRUCTURE ---');
    const { data: sampleRecipient, error: recipError } = await supabase
      .from('rfq_recipients')
      .select('*')
      .limit(1);
    
    if (recipError) {
      console.error('❌ Cannot query rfq_recipients table:', recipError.message);
    } else if (sampleRecipient.length > 0) {
      const recipient = sampleRecipient[0];
      console.log('✅ RFQ_recipients structure:');
      Object.keys(recipient).forEach(field => {
        const value = recipient[field];
        const val = value !== null ? ` = ${typeof value === 'object' ? JSON.stringify(value) : value}` : ' (NULL)';
        console.log(`   - ${field}${val}`);
      });
    }

    // 9. Test INSERT with complete data
    console.log('\n--- 9. TEST RFQ CREATION WITH SAMPLE DATA ---');
    
    // Get a verified user
    const { data: testUser } = await supabase
      .from('users')
      .select('id, email, phone_verified')
      .eq('phone_verified', true)
      .limit(1);
    
    if (!testUser || testUser.length === 0) {
      console.log('⚠️  No verified users available to test with');
    } else {
      const userId = testUser[0].id;
      console.log(`✅ Using user: ${userId} (${testUser[0].email})`);
      
      // Get a category
      const { data: testCat } = await supabase
        .from('categories')
        .select('slug')
        .limit(1);
      
      if (testCat && testCat.length > 0) {
        const categorySlug = testCat[0].slug;
        console.log(`✅ Using category: ${categorySlug}`);
        
        // Prepare test data
        const testRFQ = {
          user_id: userId,
          title: `TEST_RFQ_${Date.now()}`,
          description: 'This is a test RFQ to verify the system works',
          category_slug: categorySlug,
          county: 'Test County',
          specific_location: 'Test Location',
          type: 'direct',
          status: 'submitted',
          budget_estimate: '1000 - 5000',
          urgency: 'normal',
          is_paid: false,
          visibility: 'private',
        };
        
        console.log('\n📝 Attempting to insert RFQ with this data:');
        console.log(JSON.stringify(testRFQ, null, 2));
        
        const { data: insertedRFQ, error: insertError } = await supabase
          .from('rfqs')
          .insert([testRFQ])
          .select();
        
        if (insertError) {
          console.error('\n❌ RFQ INSERT FAILED:', insertError.message);
          console.error('   Code:', insertError.code);
          console.error('   Details:', insertError.details);
        } else if (insertedRFQ && insertedRFQ.length > 0) {
          console.log('\n✅ RFQ INSERTED SUCCESSFULLY!');
          console.log('   ID:', insertedRFQ[0].id);
          console.log('   Title:', insertedRFQ[0].title);
          console.log('   Created at:', insertedRFQ[0].created_at);
        }
      }
    }

    // 10. List recent RFQs
    console.log('\n--- 10. RECENT RFQS IN SYSTEM ---');
    const { data: recentRFQs, error: recentError } = await supabase
      .from('rfqs')
      .select('id, user_id, title, category_slug, type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('❌ Error fetching recent RFQs:', recentError.message);
    } else {
      console.log(`✅ Found ${recentRFQs.length} recent RFQs`);
      recentRFQs.forEach((r, i) => {
        console.log(`   ${i + 1}. "${r.title}" (type: ${r.type}, status: ${r.status})`);
        console.log(`      └─ ID: ${r.id}, User: ${r.user_id}, Created: ${r.created_at}`);
      });
    }

  } catch (error) {
    console.error('\n❌ DIAGNOSTIC ERROR:', error.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(80) + '\n');
}

diagnose().catch(console.error);
