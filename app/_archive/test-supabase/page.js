'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestSupabasePage() {
  const [status, setStatus] = useState('Connecting...');
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    async function testConnection() {
      try {
        // ✅ Adjust to match your table name and actual column names
        const { data, error } = await supabase
          .from('vendors')
          .select('*') // fetch all columns just for testing
          .limit(5);

        if (error) {
          console.error('Supabase Error:', error);
          setStatus('❌ Connection failed. Check table columns.');
        } else if (data && data.length > 0) {
          console.log('✅ Data from Supabase:', data);
          setVendors(data);
          setStatus('✅ Supabase connection successful!');
        } else {
          setStatus('⚠️ Connected but no data found.');
        }
      } catch (err) {
        console.error('Unexpected Error:', err);
        setStatus('❌ Unexpected connection error.');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow text-center w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Supabase Test Connection</h1>
        <p className="text-lg mb-6">{status}</p>

        {vendors.length > 0 && (
          <div className="text-left">
            <h2 className="text-xl font-semibold mb-3">Sample Vendor Records</h2>
            <ul className="space-y-2">
              {vendors.map((v) => (
                <li
                  key={v.id}
                  className="border border-gray-200 p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition"
                >
                  <strong className="text-gray-900">
                    {v.name || v.company_name || v.business_name || 'Unnamed Vendor'}
                  </strong>
                  <p className="text-sm text-gray-600">
                    {v.category || v.type || 'No category'} — {v.location || v.city || 'Unknown location'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}