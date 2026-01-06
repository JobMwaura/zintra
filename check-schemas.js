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
  console.log('Checking table schemas...\n');
  
  // Check rfq_recipients columns
  console.log('=== RFQ_RECIPIENTS TABLE ===');
  const { data: recipients } = await supabase
    .from('rfq_recipients')
    .select('*')
    .limit(1);
  
  if (recipients && recipients.length > 0) {
    console.log('Columns:', Object.keys(recipients[0]));
  } else {
    console.log('No recipients in table yet');
  }
  
  // Check valid RFQ types by looking at existing ones
  console.log('\n=== RFQ TYPES (from existing RFQs) ===');
  const { data: rfqs } = await supabase
    .from('rfqs')
    .select('type')
    .limit(10);
  
  if (rfqs) {
    const types = [...new Set(rfqs.map(r => r.type))];
    console.log('Found types:', types);
  }
}

checkSchema();
