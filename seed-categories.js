#!/usr/bin/env node
/**
 * SEED CATEGORIES FROM RFQ TEMPLATES
 * 
 * This extracts all categories from rfq-templates-v2-hierarchical.json
 * and inserts them into the categories table
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedCategories() {
  console.log('\n' + '='.repeat(80));
  console.log('SEEDING CATEGORIES FROM RFQ TEMPLATES');
  console.log('='.repeat(80) + '\n');

  try {
    // Load templates
    const templatesPath = path.join(process.cwd(), 'public/data/rfq-templates-v2-hierarchical.json');
    const templateContent = fs.readFileSync(templatesPath, 'utf-8');
    const templates = JSON.parse(templateContent);

    if (!templates.majorCategories || templates.majorCategories.length === 0) {
      console.error('❌ No majorCategories found in templates file');
      process.exit(1);
    }

    console.log(`📋 Found ${templates.majorCategories.length} categories in template file\n`);

    // Prepare categories for insertion
    // Note: Don't include 'id' field - let database generate UUIDs
    const categoriesToInsert = templates.majorCategories.map(cat => ({
      name: cat.label,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
    }));

    // Clear existing categories (CAREFUL!)
    console.log('🗑️  Clearing existing categories...');
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .neq('id', ''); // Delete all where id is not empty (all records)

    if (deleteError && !deleteError.message.includes('0 rows')) {
      console.warn('⚠️  Warning clearing categories:', deleteError.message);
    } else {
      console.log('✅ Categories cleared\n');
    }

    // Insert categories
    console.log(`📝 Inserting ${categoriesToInsert.length} categories...`);
    const { data: inserted, error: insertError } = await supabase
      .from('categories')
      .insert(categoriesToInsert)
      .select();

    if (insertError) {
      console.error('❌ INSERT ERROR:', insertError.message);
      console.error('Details:', insertError.details);
      process.exit(1);
    }

    console.log(`✅ Successfully inserted ${inserted.length} categories!\n`);

    // Show what was inserted
    console.log('📚 Categories inserted:');
    inserted.forEach((cat, i) => {
      console.log(`   ${i + 1}. ${cat.name} (slug: ${cat.slug})`);
      if (cat.icon) console.log(`      Icon: ${cat.icon}`);
      if (cat.description) console.log(`      Desc: ${cat.description}`);
    });

    // Verify insertion
    console.log('\n🔍 Verification:');
    const { count, error: countError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count error:', countError.message);
    } else {
      console.log(`✅ Categories table now has ${count} records`);
    }

    // Show first few for verification
    const { data: verify } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(5);

    if (verify && verify.length > 0) {
      console.log('\n✅ Sample categories:');
      verify.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug})`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ SEEDING COMPLETE');
    console.log('='.repeat(80));
    console.log('\n✨ Categories are now ready! Try creating an RFQ with one of these slugs.\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedCategories();
