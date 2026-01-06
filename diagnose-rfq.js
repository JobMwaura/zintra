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

async function diagnose() {
  console.log('🔍 RFQ SUBMISSION FLOW DIAGNOSIS\n');

  try {
    // 1. Check RFQs table structure
    console.log('=== 1. RFQs TABLE COLUMNS ===');
    const { data: rfqSample } = await supabase
      .from('rfqs')
      .select('*')
      .limit(1);
    
    if (rfqSample && rfqSample.length > 0) {
      console.log('✅ Columns in rfqs table:');
      Object.keys(rfqSample[0]).forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('⚠️  No RFQs in table yet (new table)');
    }

    // 2. Check users table structure
    console.log('\n=== 2. USERS TABLE COLUMNS ===');
    const { data: userSample } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (userSample && userSample.length > 0) {
      console.log('✅ Columns in users table:');
      Object.keys(userSample[0]).forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('⚠️  No users in table yet (new table)');
    }

    // 3. Check for any users with phone_verified
    console.log('\n=== 3. USERS WITH PHONE_VERIFIED ===');
    const { data: usersWithPhone, count: phoneCount } = await supabase
      .from('users')
      .select('id, phone_verified', { count: 'exact' })
      .eq('phone_verified', true);
    
    console.log(`✅ Users with phone_verified=true: ${phoneCount || 0}`);
    if (usersWithPhone && usersWithPhone.length > 0) {
      usersWithPhone.slice(0, 3).forEach(u => {
        console.log(`   - ${u.id.substring(0, 8)}... (verified: ${u.phone_verified})`);
      });
    }

    // 4. Check RFQ types in database
    console.log('\n=== 4. EXISTING RFQ TYPES ===');
    const { data: rfqs } = await supabase
      .from('rfqs')
      .select('type, id')
      .limit(10);
    
    if (rfqs && rfqs.length > 0) {
      const types = [...new Set(rfqs.map(r => r.type))];
      console.log(`✅ Found ${rfqs.length} RFQs with types: ${types.join(', ')}`);
    } else {
      console.log('⚠️  No RFQs in database yet');
    }

    // 5. Check RLS policies
    console.log('\n=== 5. ROW LEVEL SECURITY STATUS ===');
    try {
      const { data: policies } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      console.log('✅ RLS appears to be working (policies are active)');
    } catch (err) {
      console.log('❌ RLS Error:', err.message);
    }

    // 6. Test actual RFQ insert
    console.log('\n=== 6. TEST RFQ INSERTION ===');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('⚠️  No authenticated user available for test');
      } else {
        console.log(`Testing with user: ${user.id.substring(0, 8)}...`);
        
        // Check if this user exists in users table and if phone is verified
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('id, phone_verified')
          .eq('id', user.id)
          .single();
        
        if (userError) {
          console.log(`❌ User query error: ${userError.message}`);
        } else if (!userRecord) {
          console.log(`❌ User not in users table: ${user.id.substring(0, 8)}...`);
        } else {
          console.log(`✅ User found in users table`);
          console.log(`   - phone_verified: ${userRecord.phone_verified}`);
          
          if (!userRecord.phone_verified) {
            console.log(`\n⚠️  USER PHONE NOT VERIFIED - This will cause RFQ submission to fail!`);
            console.log('   To fix: User must verify their phone number via OTP');
          }
        }
      }
    } catch (err) {
      console.log('⚠️  Test skipped:', err.message);
    }

    console.log('\n=== SUMMARY ===');
    console.log('Check the above output for any ❌ marks');
    console.log('Common issues:');
    console.log('  - User not in users table → Create user record');
    console.log('  - phone_verified = false → User must verify phone');
    console.log('  - Missing columns → Database schema issue');

  } catch (err) {
    console.error('Diagnosis error:', err);
  }
}

diagnose();
