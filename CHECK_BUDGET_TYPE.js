#!/usr/bin/env node
/**
 * CHECK BUDGET_ESTIMATE COLUMN TYPE
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('\nChecking rfqs table columns...\n');
  
  // Try inserting different types
  const userId = '00092b8f-9dc1-4767-991b-703b70e94a4e';
  const categorySlug = 'building_masonry';

  // Test 1: String budget_estimate
  console.log('Test 1: Trying budget_estimate as string "5000 - 10000"...');
  let { data: d1, error: e1 } = await supabase
    .from('rfqs')
    .insert([{
      user_id: userId,
      title: 'Test 1',
      description: 'Test',
      category_slug: categorySlug,
      county: 'Test',
      specific_location: 'Test',
      type: 'direct',
      status: 'submitted',
      budget_estimate: '5000 - 10000'
    }])
    .select();

  if (e1) {
    console.log(`❌ Error: ${e1.message}\n`);
  } else {
    console.log(`✅ Success! budget_estimate accepts string\n`);
    // Clean up
    await supabase.from('rfqs').delete().eq('id', d1[0].id);
  }

  // Test 2: Number budget_estimate
  console.log('Test 2: Trying budget_estimate as number 5000...');
  let { data: d2, error: e2 } = await supabase
    .from('rfqs')
    .insert([{
      user_id: userId,
      title: 'Test 2',
      description: 'Test',
      category_slug: categorySlug,
      county: 'Test',
      specific_location: 'Test',
      type: 'direct',
      status: 'submitted',
      budget_estimate: 5000
    }])
    .select();

  if (e2) {
    console.log(`❌ Error: ${e2.message}\n`);
  } else {
    console.log(`✅ Success! budget_estimate accepts number\n`);
    // Clean up
    await supabase.from('rfqs').delete().eq('id', d2[0].id);
  }

  // Test 3: Check if there's a budget_min and budget_max separate column
  console.log('Test 3: Checking other budget columns...');
  const { data: sample } = await supabase
    .from('rfqs')
    .select('*')
    .limit(1);

  if (sample && sample.length > 0) {
    const cols = Object.keys(sample[0]);
    const budgetCols = cols.filter(c => c.includes('budget'));
    console.log('Budget-related columns found:');
    budgetCols.forEach(c => console.log(`   - ${c}`));
  }
}

check().catch(console.error);
