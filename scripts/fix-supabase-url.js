#!/usr/bin/env node
/**
 * Manual Fix for Supabase URL stored incorrectly
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zeomgqlnztcdqtespsjx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplb21ncWxuenRjZHF0ZXNwc2p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4NTIxMCwiZXhwIjoyMDc0OTYxMjEwfQ.THpKBuxUYe3i8f9aZkohX2ES1tbxqwI2oVb-43T1Po8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFranshhoekPlumbers() {
  console.log('🔧 Fixing Franshoek Plumbers logo URL...\n');

  // The correct Supabase public storage URL
  const correctUrl = 'https://zeomgqlnztcdqtespsjx.supabase.co/storage/v1/object/public/vendor-assets/logos/52c837c7-e0e0-4315-b5ea-5c4fda5064b8/vendor-52c837c7-e0e0-4315-b5ea-5c4fda5064b8-1765893040755.PNG';

  const { error } = await supabase
    .from('vendors')
    .update({ logo_url: correctUrl })
    .eq('company_name', 'Franshoek Plumbers');

  if (error) {
    console.error('❌ Error updating vendor:', error);
  } else {
    console.log('✅ Updated Franshoek Plumbers');
    console.log('   New URL:', correctUrl);
  }
}

fixFranshhoekPlumbers().catch(console.error);
