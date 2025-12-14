'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, Check, Trash2 } from 'lucide-react';

export default function CleanupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [deleted, setDeleted] = useState([]);

  const cleanupDuplicates = async () => {
    setLoading(true);
    setMessage('');
    setDeleted([]);

    try {
      const userId = 'e63a82c1-e7d1-4bab-8b1a-2c72bf5e1cf5';

      console.log('Fetching all profiles for user...');
      const { data: profiles, error: fetchError } = await supabase
        .from('vendors')
        .select('id, company_name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setMessage(`❌ Error fetching profiles: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      console.log('Found profiles:', profiles);

      if (profiles.length <= 1) {
        setMessage('✅ No duplicates found! You have exactly 1 profile.');
        setLoading(false);
        return;
      }

      // Keep the latest (first in sorted list), delete the rest
      const keepProfile = profiles[0];
      const deleteProfiles = profiles.slice(1);

      console.log('Keeping:', keepProfile);
      console.log('Deleting:', deleteProfiles);

      setMessage(`Found ${profiles.length} profiles. Keeping the latest, deleting ${deleteProfiles.length} duplicates...`);

      // Delete duplicates
      for (const profile of deleteProfiles) {
        const { error: deleteError } = await supabase
          .from('vendors')
          .delete()
          .eq('id', profile.id);

        if (deleteError) {
          console.error('Error deleting profile:', profile.id, deleteError);
        } else {
          console.log('✅ Deleted:', profile.id);
          setDeleted(prev => [...prev, profile]);
        }
      }

      setMessage(`✅ Cleanup complete! Deleted ${deleteProfiles.length} duplicate profiles. Keeping: ${keepProfile.company_name} (${keepProfile.id})`);
      setLoading(false);
    } catch (err) {
      console.error('Cleanup error:', err);
      setMessage(`❌ Error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-4">Cleanup Duplicate Profiles</h1>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-900">
              ⚠️ You have <strong>6 duplicate profiles</strong> in the database. This is why the profile page isn't working properly.
            </p>
            <p className="text-yellow-800 text-sm mt-2">
              This tool will delete the old duplicates and keep only your latest profile.
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.includes('✅')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.includes('✅') ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message}
            </div>
          )}

          {deleted.length > 0 && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-900 mb-2">✅ Deleted {deleted.length} profiles:</p>
              <ul className="space-y-1 text-sm text-green-800">
                {deleted.map(p => (
                  <li key={p.id}>• {p.company_name} ({p.id.substring(0, 8)}...)</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={cleanupDuplicates}
            disabled={loading}
            className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            {loading ? 'Cleaning up...' : 'Delete Duplicates & Keep Latest'}
          </button>

          <div className="mt-8 space-y-3">
            <p className="text-sm text-gray-600">After cleanup is complete:</p>
            <a href="/my-profile" className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center">
              Go to My Profile
            </a>
            <a href="/dashboard/vendor" className="block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-center">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}