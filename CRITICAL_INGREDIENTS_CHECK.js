#!/usr/bin/env node
/**
 * CRITICAL: What's ACTUALLY in the database?
 * This checks the raw table structure
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEverything() {
  console.log('\n' + '='.repeat(80));
  console.log('CRITICAL INGREDIENTS CHECK');
  console.log('='.repeat(80) + '\n');

  // 1. What tables exist?
  console.log('--- 1. ALL TABLES IN DATABASE ---');
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  if (tablesError) {
    console.log('⚠️  Cannot query information_schema, checking manually...\n');
    
    // Try querying common table names
    const tablesToCheck = [
      'users', 'rfqs', 'rfq_recipients', 'categories', 'vendors', 
      'job_types', 'vendor_categories', 'vendor_specializations',
      'category_templates', 'vendor_services'
    ];
    
    for (const table of tablesToCheck) {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (!error) {
        console.log(`✅ ${table} EXISTS`);
        
        // Get one record to see structure
        const { data: sample } = await supabase.from(table).select('*').limit(1);
        if (sample && sample.length > 0) {
          const fields = Object.keys(sample[0]);
          console.log(`   Fields: ${fields.join(', ')}`);
        }
      } else {
        console.log(`❌ ${table} - ${error.message}`);
      }
    }
  } else {
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
  }

  // 2. Check rfqs table specifically
  console.log('\n--- 2. RFQS TABLE DETAILED CHECK ---');
  const { data: rfqs, error: rfqsError } = await supabase
    .from('rfqs')
    .select('*')
    .limit(0);
  
  if (rfqsError) {
    console.log('❌ Cannot access rfqs table:', rfqsError.message);
  } else {
    console.log('✅ rfqs table exists and is accessible');
    
    // Get actual data
    const { data: rfqData, error: rfqDataError } = await supabase
      .from('rfqs')
      .select('*')
      .limit(1);
    
    if (!rfqDataError && rfqData.length > 0) {
      console.log('\n   Sample RFQ record shows these columns:');
      Object.keys(rfqData[0]).forEach(col => {
        const val = rfqData[0][col];
        console.log(`   - ${col}: ${val === null ? '(NULL)' : typeof val}`);
      });
    } else {
      console.log('   No RFQ records yet');
    }
  }

  // 3. Check categories
  console.log('\n--- 3. CATEGORIES ---');
  const { data: cats, error: catsError } = await supabase
    .from('categories')
    .select('*');
  
  if (catsError) {
    console.log('❌ Cannot access categories:', catsError.message);
  } else {
    console.log(`✅ Found ${cats.length} categories`);
    if (cats.length > 0) {
      cats.slice(0, 5).forEach(c => {
        console.log(`   - ${c.name || c.title || 'N/A'} (id: ${c.id}, slug: ${c.slug})`);
      });
    }
  }

  // 4. Check vendors
  console.log('\n--- 4. VENDORS ---');
  const { data: vends, error: vendsError } = await supabase
    .from('vendors')
    .select('*')
    .limit(1);
  
  if (vendsError) {
    console.log('❌ Cannot access vendors:', vendsError.message);
  } else {
    console.log(`✅ Vendors table accessible`);
    if (vends.length > 0) {
      console.log('   Sample vendor columns:');
      Object.keys(vends[0]).forEach(col => {
        console.log(`   - ${col}`);
      });
    }
  }

  // 5. Check what the CREATE RFQ endpoint actually expects
  console.log('\n--- 5. CREATE ENDPOINT EXPECTATIONS ---');
  const createEndpoint = '/app/api/rfq/create/route.js';
  const fs = require('fs');
  try {
    const content = fs.readFileSync('/Users/macbookpro2/Desktop/zintra-platform/app/api/rfq/create/route.js', 'utf-8');
    
    // Find the rfqData object
    const rfqDataMatch = content.match(/const rfqData\s*=\s*\{[\s\S]*?\n\s*\}/);
    if (rfqDataMatch) {
      console.log('✅ Found rfqData object in endpoint:');
      const lines = rfqDataMatch[0].split('\n');
      lines.forEach(line => {
        if (line.includes(':')) {
          console.log(`   ${line.trim()}`);
        }
      });
    }
  } catch (e) {
    console.log('⚠️  Could not read endpoint file');
  }

  console.log('\n' + '='.repeat(80));
  console.log('END OF CHECK');
  console.log('='.repeat(80) + '\n');
}

checkEverything().catch(console.error);
