#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  console.log('\n=== RFQ TABLE STRUCTURE ===\n');
  
  // Get table structure
  const { data: sample, error } = await supabase
    .from('rfqs')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  if (sample.length === 0) {
    console.log('No RFQs yet, but table exists. Checking by inserting test record...\n');
    
    // Try to insert and see what columns it actually needs
    const testData = {
      user_id: '00092b8f-9dc1-4767-991b-703b70e94a4e',
      title: 'Test RFQ',
      description: 'Test',
      category_slug: 'test',
      specific_location: 'Test',
      county: 'Test',
      type: 'direct',
      status: 'submitted'
    };
    
    console.log('Attempting insert with:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n');
    
    const { data: inserted, error: insertError } = await supabase
      .from('rfqs')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.log('❌ INSERT ERROR:', insertError.message);
      console.log('Code:', insertError.code);
      console.log('Details:', insertError.details);
    } else {
      console.log('✅ INSERT SUCCESS!');
      console.log('Created RFQ with these columns:');
      Object.keys(inserted[0]).forEach(key => {
        console.log(`  - ${key}: ${inserted[0][key]}`);
      });
    }
  } else {
    console.log('Sample RFQ columns:');
    Object.keys(sample[0]).forEach(key => {
      const val = sample[0][key];
      console.log(`  - ${key}: ${val === null ? '(NULL)' : typeof val}`);
    });
  }
}

check().catch(console.error);
