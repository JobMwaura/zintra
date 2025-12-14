'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DiagnosticPage() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rawQuery, setRawQuery] = useState('');

  useEffect(() => {
    const checkVendor = async () => {
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log('Current user:', currentUser);
        setUser(currentUser);

        if (!currentUser) {
          setData({ error: 'No user logged in' });
          setLoading(false);
          return;
        }

        // Try simple query first
        console.log('Querying vendors for user:', currentUser.id);
        
        const { data: vendors, error: queryError } = await supabase
          .from('vendors')
          .select('*');

        console.log('All vendors query:', { vendors, error: queryError });
        setRawQuery(JSON.stringify({ vendors, error: queryError }, null, 2));

        // Try filtered query
        const { data: vendorFiltered, error: filteredError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        console.log('Filtered query:', { vendorFiltered, error: filteredError });

        setData({
          allVendors: vendors,
          filteredVendor: vendorFiltered,
          queryError: filteredError,
          userId: currentUser.id,
        });

        setLoading(false);
      } catch (err) {
        console.error('Diagnostic error:', err);
        setData({ error: err.message });
        setLoading(false);
      }
    };

    checkVendor();
  }, []);

  if (loading) {
    return <div className="p-8">Loading diagnostic data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Diagnostic Report</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Logged In User</h2>
          {user ? (
            <div className="space-y-2 font-mono text-sm">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          ) : (
            <p className="text-red-600">❌ No user logged in</p>
          )}
        </div>

        {/* Query Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Database Query Results</h2>
          
          {data?.error ? (
            <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">
              ❌ Error: {data.error}
            </div>
          ) : (
            <div className="space-y-4">
              {/* All Vendors */}
              <div>
                <h3 className="font-semibold mb-2">All Vendors in Database:</h3>
                {data?.allVendors?.length > 0 ? (
                  <div className="bg-gray-50 p-4 rounded overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(data.allVendors, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-600">No vendors found in database</p>
                )}
              </div>

              {/* Filtered Query */}
              <div>
                <h3 className="font-semibold mb-2">Filtered Query (by current user):</h3>
                {data?.filteredVendor ? (
                  <div className="bg-green-50 p-4 rounded border border-green-200">
                    <p className="text-green-700 mb-2">✅ Vendor found for current user!</p>
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(data.filteredVendor, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                    <p className="text-yellow-700">⚠️ No vendor found for user ID: {data?.userId}</p>
                    {data?.queryError && (
                      <pre className="text-xs whitespace-pre-wrap mt-2">
                        Error: {JSON.stringify(data.queryError, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Raw Query Log */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Raw Query Log</h2>
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto whitespace-pre-wrap">
            {rawQuery}
          </pre>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <a href="/create-vendor-profile" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Create New Profile
          </a>
          <a href="/browse" className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-2">
            View Browse Page
          </a>
          <a href="/dashboard/vendor" className="inline-block px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 ml-2">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}