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

async function checkSchema() {
  console.log('Checking RFQs table schema...\n');
  
  // Get first RFQ to see what columns exist
  const { data, error } = await supabase
    .from('rfqs')
    .select('*')
    .limit(1);
  
  if (data && data.length > 0) {
    console.log('RFQs table columns:', Object.keys(data[0]));
  } else if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('No RFQs in table yet. Checking users table instead...\n');
    
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (users && users.length > 0) {
      console.log('Users table columns:', Object.keys(users[0]));
    }
  }
}

checkSchema();
