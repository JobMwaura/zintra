import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zeomgqlnztcdqtespsjx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplb21ncWxuenRjZHF0ZXNwc2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk4ODU5MTcsImV4cCI6MjAxNTQ2MTkxN30.h_nPbqIQ-dljr6yChJhHE2lmGDTt-mZ6h_3eiIhFqQI';

const supabase = createClient(supabaseUrl, supabaseKey);

const vendorId = '0608c7a8-bfa5-4c73-8354-365502ed387d';
const creditAmount = 2000; // 2000 credits

async function addCreditsToVendor() {
  try {
    console.log(`Adding ${creditAmount} credits to vendor ${vendorId}...`);

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, user_id, name, email')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      console.error('Vendor not found:', vendorError?.message);
      return;
    }

    console.log(`Found vendor: ${vendor.name} (${vendor.email})`);

    const userId = vendor.user_id;

    // Check if employer profile exists
    const { data: existingEmployer } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingEmployer) {
      console.log('Creating employer profile...');
      const { error: createError } = await supabase
        .from('employer_profiles')
        .insert({
          id: userId,
          company_name: vendor.name || 'Unknown Company',
          company_email: vendor.email || '',
          vendor_id: vendorId,
          is_vendor_employer: true,
          verification_level: 'verified',
        });

      if (createError) {
        console.error('Failed to create employer profile:', createError.message);
        return;
      }
      console.log('✅ Employer profile created');
    } else {
      console.log('✅ Employer profile already exists');
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('employer_payments')
      .insert({
        employer_id: userId,
        vendor_id: vendorId,
        amount_kes: creditAmount * 4,
        payment_method: 'admin',
        status: 'completed',
        reference_id: `ADMIN-${Date.now()}`,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment:', paymentError.message);
      return;
    }

    console.log(`✅ Payment record created (ID: ${payment.id})`);

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
      console.error('Failed to add credits:', ledgerError.message);
      return;
    }

    console.log(`✅ Added ${creditAmount} credits to ledger`);
    console.log(`\n✅ SUCCESS: ${creditAmount} credits added to vendor ${vendor.name}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addCreditsToVendor();
