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

async function updateTestUsers() {
  console.log('Updating test users...\n');
  
  // Update verified user
  const { error: e1 } = await supabase
    .from('users')
    .update({
      phone_verified: true,
      phone_verified_at: new Date().toISOString()
    })
    .eq('id', '11111111-1111-1111-1111-111111111111');
  
  if (e1) {
    console.log('❌ Error updating verified user:', e1.message);
  } else {
    console.log('✅ Verified user updated (phone_verified=true)');
  }
  
  // Verify unverified user  
  const { error: e2 } = await supabase
    .from('users')
    .update({
      phone_verified: false,
      phone_verified_at: null
    })
    .eq('id', '22222222-2222-2222-2222-222222222222');
  
  if (e2) {
    console.log('❌ Error updating unverified user:', e2.message);
  } else {
    console.log('✅ Unverified user updated (phone_verified=false)');
  }
  
  // Verify the changes
  console.log('\nVerifying changes...');
  const { data: verified } = await supabase
    .from('users')
    .select('id, phone_verified')
    .eq('id', '11111111-1111-1111-1111-111111111111')
    .single();
  
  const { data: unverified } = await supabase
    .from('users')
    .select('id, phone_verified')
    .eq('id', '22222222-2222-2222-2222-222222222222')
    .single();
  
  console.log('Verified user phone_verified:', verified?.phone_verified);
  console.log('Unverified user phone_verified:', unverified?.phone_verified);
}

updateTestUsers();
