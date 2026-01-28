#!/usr/bin/env node
/**
 * Migration Script: Fix Expired S3 Presigned URLs
 * 
 * Problem: Database contains expired presigned URLs that return 403 errors
 * Solution: Extract S3 keys from URLs, store only keys, generate fresh URLs on-demand
 * 
 * Usage: NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=yyy node scripts/fix-expired-s3-urls.js
 * Or: node scripts/fix-expired-s3-urls.js (hardcoded for local testing)
 */

import { createClient } from '@supabase/supabase-js';

// Hardcoded for easier testing - replace with env vars in production
const supabaseUrl = 'https://zeomgqlnztcdqtespsjx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplb21ncWxuenRjZHF0ZXNwc2p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4NTIxMCwiZXhwIjoyMDc0OTYxMjEwfQ.THpKBuxUYe3i8f9aZkohX2ES1tbxqwI2oVb-43T1Po8';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Extract S3 key from presigned URL
 * URL format: https://bucket.s3.region.amazonaws.com/path/to/file?params
 * Key format: path/to/file
 */
function extractS3Key(url) {
  if (!url) return null;

  // If it's already just a key (no http/https), return as-is
  if (!url.startsWith('http')) {
    return url;
  }

  // Parse the URL
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove leading slash and bucket name if present
    // Format: /bucket-name/key or /key (depending on S3 URL style)
    let key = pathname.replace(/^\//, '');
    
    // If it starts with the bucket name, remove it
    if (key.startsWith('zintra-images-prod/')) {
      key = key.replace('zintra-images-prod/', '');
    }
    
    // URL decode (handle %20 → space, etc)
    key = decodeURIComponent(key);
    
    return key || null;
  } catch (error) {
    console.error('Error parsing URL:', url, error.message);
    return null;
  }
}

async function fixVendorLogos() {
  console.log('\n🔍 Fetching vendors with S3 URLs...');
  
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, company_name, logo_url')
    .not('logo_url', 'is', null);

  if (error) {
    console.error('❌ Error fetching vendors:', error);
    return;
  }

  if (!vendors || vendors.length === 0) {
    console.log('✅ No vendors found');
    return;
  }

  console.log(`📊 Found ${vendors.length} vendors`);

  let updated = 0;
  let skipped = 0;

  for (const vendor of vendors) {
    const url = vendor.logo_url;
    
    // Skip if it's already just a key
    if (!url.startsWith('http')) {
      console.log(`⏭️  ${vendor.company_name} - Already a key: ${url.substring(0, 50)}...`);
      skipped++;
      continue;
    }

    const key = extractS3Key(url);
    
    if (!key) {
      console.log(`⚠️  ${vendor.company_name} - Could not extract key from URL`);
      skipped++;
      continue;
    }

    // Update vendor with S3 key instead of presigned URL
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ logo_url: key })
      .eq('id', vendor.id);

    if (updateError) {
      console.error(`❌ ${vendor.company_name} - Update failed:`, updateError.message);
      skipped++;
    } else {
      console.log(`✅ ${vendor.company_name}`);
      console.log(`   Old: ${url.substring(0, 80)}...`);
      console.log(`   New: ${key}`);
      updated++;
    }
  }

  console.log(`\n📊 Summary: ${updated} updated, ${skipped} skipped`);
}

async function main() {
  console.log('🚀 Starting S3 URL migration...\n');
  await fixVendorLogos();
  console.log('\n✅ Migration complete!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
