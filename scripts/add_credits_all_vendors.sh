#!/bin/bash

# Script to add 1000 test credits to all existing vendors
# This creates employer profiles and adds credits via the server action

# First, let's create a Node.js script that will do this
cat > /tmp/add_credits_to_all_vendors.mjs << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zeomgqlnztcdqtespsjx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplb21ncWxuenRjZHF0ZXNwc2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk4ODU5MTcsImV4cCI6MjAxNTQ2MTkxN30.h_nPbqIQ-dljr6yChJhHE2lmGDTt-mZ6h_3eiIhFqQI';

const supabase = createClient(supabaseUrl, supabaseKey);

const creditAmount = 1000;
let successCount = 0;
let errorCount = 0;
const errors = [];

async function addCreditsToVendor(vendor) {
  try {
    const userId = vendor.user_id;

    // Check if employer profile exists
    const { data: existingEmployer } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    // If employer profile doesn't exist, create it
    if (!existingEmployer) {
      const { error: createError } = await supabase
        .from('employer_profiles')
        .insert({
          id: userId,
          company_name: vendor.company_name || vendor.name || 'Unknown Company',
          company_email: vendor.email || '',
          vendor_id: vendor.id,
          is_vendor_employer: true,
          verification_level: 'verified',
        });

      if (createError) {
        throw new Error('Failed to create employer profile: ' + createError.message);
      }
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('employer_payments')
      .insert({
        employer_id: userId,
        vendor_id: vendor.id,
        amount_kes: creditAmount * 4,
        payment_method: 'bulk_admin',
        status: 'completed',
        reference_id: `BULK-ADMIN-${Date.now()}-${vendor.id.substring(0, 8)}`,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error('Failed to create payment: ' + paymentError.message);
    }

    // Add credits to ledger
    const { error: ledgerError } = await supabase
      .from('credits_ledger')
      .insert({
        employer_id: userId,
        credit_type: 'admin_gift',
        amount: creditAmount,
        reference_id: payment.id,
      });

    if (ledgerError) {
      throw new Error('Failed to add credits: ' + ledgerError.message);
    }

    successCount++;
    console.log(`✅ ${vendor.company_name || vendor.name} - ${creditAmount} credits added`);
  } catch (error) {
    errorCount++;
    errors.push(`${vendor.company_name || vendor.name}: ${error.message}`);
    console.error(`❌ ${vendor.company_name || vendor.name} - Error: ${error.message}`);
  }
}

async function processAllVendors() {
  try {
    console.log('Fetching all vendors...');
    
    // Get all vendors
    const { data: vendors, error: fetchError } = await supabase
      .from('vendors')
      .select('id, user_id, company_name, name, email')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching vendors:', fetchError.message);
      return;
    }

    if (!vendors || vendors.length === 0) {
      console.log('No vendors found');
      return;
    }

    console.log(`\n📊 Found ${vendors.length} vendors`);
    console.log(`Adding ${creditAmount} credits to each vendor...\n`);

    // Process each vendor sequentially to avoid rate limiting
    for (const vendor of vendors) {
      await addCreditsToVendor(vendor);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ SUCCESS SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total vendors processed: ${vendors.length}`);
    console.log(`✅ Successfully added credits: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`Total credits distributed: ${successCount * creditAmount}`);

    if (errors.length > 0) {
      console.log(`\n⚠️ ERRORS:`);
      errors.forEach(err => console.log(`  - ${err}`));
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

processAllVendors();
EOF

echo "Running script to add credits to all vendors..."
node /tmp/add_credits_to_all_vendors.mjs
