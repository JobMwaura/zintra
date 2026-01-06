import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: `${__dirname}/.env.local` });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  try {
    console.log('Testing Supabase connection and endpoints...\n');
    
    // Test 0: Verify test users exist
    console.log('📋 Checking test users...');
    const { data: verified, error: verifiedError } = await supabase
      .from('users')
      .select('*')
      .eq('id', '11111111-1111-1111-1111-111111111111')
      .single();
    
    if (!verifiedError && verified) {
      console.log('✅ Verified user exists with phone_verified:', verified.phone_verified);
    } else {
      console.error('❌ Error fetching verified user:', verifiedError?.message);
    }
    
    const { data: unverified, error: unverifiedError } = await supabase
      .from('users')
      .select('*')
      .eq('id', '22222222-2222-2222-2222-222222222222')
      .single();
    
    if (!unverifiedError && unverified) {
      console.log('✅ Unverified user exists with phone_verified:', unverified.phone_verified);
    } else {
      console.error('❌ Error fetching unverified user:', unverifiedError?.message);
    }

    // Test 1: Check eligibility for verified user
    console.log('\n🧪 TEST 1: Check eligibility (verified user)');
    try {
      const response1 = await fetch('http://localhost:3001/api/rfq/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: '11111111-1111-1111-1111-111111111111'
        })
      });
      
      const data1 = await response1.json();
      console.log(`Status: ${response1.status}`);
      console.log('Response:', JSON.stringify(data1, null, 2));
      console.log(response1.status === 200 && data1.eligible ? '✅ PASS' : '❌ FAIL');
    } catch (err) {
      console.error('❌ Error:', err.message);
    }

    // Test 2: Check eligibility for unverified user
    console.log('\n🧪 TEST 2: Check eligibility (unverified user)');
    try {
      const response2 = await fetch('http://localhost:3001/api/rfq/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: '22222222-2222-2222-2222-222222222222'
        })
      });
      
      const data2 = await response2.json();
      console.log(`Status: ${response2.status}`);
      console.log('Response:', JSON.stringify(data2, null, 2));
      console.log(response2.status === 200 && !data2.eligible ? '✅ PASS' : '❌ FAIL');
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testConnection();
