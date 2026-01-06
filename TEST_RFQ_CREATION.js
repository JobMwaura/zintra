#!/usr/bin/env node
/**
 * TEST RFQ CREATION
 * Simulates an actual RFQ submission to verify everything works
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRFQCreation() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST RFQ CREATION');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Get a verified user
    console.log('Step 1: Getting a verified user...');
    const { data: verifiedUsers, error: userError } = await supabase
      .from('users')
      .select('id, full_name, email, phone_verified')
      .eq('phone_verified', true)
      .limit(1);

    if (userError || !verifiedUsers || verifiedUsers.length === 0) {
      console.error('❌ No verified users found');
      process.exit(1);
    }

    const userId = verifiedUsers[0].id;
    console.log(`✅ Using user: ${verifiedUsers[0].full_name} (${userId})`);
    console.log(`   Phone verified: ${verifiedUsers[0].phone_verified}\n`);

    // Step 2: Get a category (now that we've seeded them)
    console.log('Step 2: Getting available categories...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, slug, name')
      .limit(1);

    if (catError || !categories || categories.length === 0) {
      console.error('❌ No categories found');
      process.exit(1);
    }

    const categorySlug = categories[0].slug;
    console.log(`✅ Using category: ${categories[0].name} (slug: ${categorySlug})\n`);

    // Step 3: Prepare RFQ data
    console.log('Step 3: Preparing RFQ data...');
    const testRFQ = {
      user_id: userId,
      title: `Test RFQ - ${new Date().toISOString()}`,
      description: 'This is a test RFQ to verify the system is working correctly after category seeding',
      category_slug: categorySlug,
      county: 'Test County',
      specific_location: 'Test Location, Nairobi',
      type: 'direct',
      status: 'submitted',
      budget_estimate: '5000 - 10000',
      urgency: 'normal',
      is_paid: false,
      visibility: 'private',
    };

    console.log('📝 RFQ Data:');
    Object.entries(testRFQ).forEach(([key, val]) => {
      console.log(`   ${key}: ${val}`);
    });
    console.log('\n');

    // Step 4: Insert RFQ
    console.log('Step 4: Inserting RFQ into database...');
    const { data: inserted, error: insertError } = await supabase
      .from('rfqs')
      .insert([testRFQ])
      .select();

    if (insertError) {
      console.error('❌ INSERT FAILED:', insertError.message);
      console.error('Code:', insertError.code);
      console.error('Details:', insertError.details);
      process.exit(1);
    }

    const createdRFQ = inserted[0];
    console.log('✅ RFQ CREATED SUCCESSFULLY!\n');
    console.log('Created RFQ Details:');
    console.log(`   ID: ${createdRFQ.id}`);
    console.log(`   Title: ${createdRFQ.title}`);
    console.log(`   Category: ${createdRFQ.category_slug}`);
    console.log(`   Type: ${createdRFQ.type}`);
    console.log(`   Status: ${createdRFQ.status}`);
    console.log(`   Created At: ${createdRFQ.created_at}\n`);

    // Step 5: Test RFQ recipient insertion (vendor linking)
    console.log('Step 5: Testing vendor linking...');
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id')
      .limit(1);

    if (vendors && vendors.length > 0) {
      const vendorId = vendors[0].id;
      const { data: recipient, error: recipError } = await supabase
        .from('rfq_recipients')
        .insert([{
          rfq_id: createdRFQ.id,
          vendor_id: vendorId,
          status: 'sent'
        }])
        .select();

      if (recipError) {
        console.warn('⚠️  Could not link vendor:', recipError.message);
      } else {
        console.log('✅ Vendor linked successfully\n');
      }
    }

    console.log('='.repeat(80));
    console.log('✅ TEST COMPLETE - RFQ CREATION WORKS!');
    console.log('='.repeat(80));
    console.log('\nYour system is now ready to accept RFQ submissions.\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

testRFQCreation();
