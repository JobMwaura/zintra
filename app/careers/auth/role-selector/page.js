'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function RoleSelector() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Create profile entry if it doesn't exist
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email,
          is_candidate: role === 'candidate',
          is_employer: role === 'employer',
        },
        { onConflict: 'id' }
      );

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = insert duplicate key violates unique constraint (profile already exists)
        console.error('Error creating profile:', profileError);
        setError('Failed to set role. Please try again.');
        setLoading(false);
        return;
      }

      // Redirect to appropriate profile setup page
      if (role === 'candidate') {
        router.push('/careers/me');
      } else if (role === 'employer') {
        router.push('/careers/me/employer');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Zintra</h1>
          <p className="text-xl text-gray-600">Choose your role to get started</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Candidate Card */}
          <button
            onClick={() => handleRoleSelect('candidate')}
            disabled={loading && selectedRole !== 'candidate'}
            className={`p-8 rounded-lg border-2 transition ${
              selectedRole === 'candidate'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            } ${loading && selectedRole !== 'candidate' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-5xl mb-4">👤</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">I'm Looking for Work</h2>
            <p className="text-gray-600 mb-6">
              Find jobs and gigs that match your skills. Get hired by verified employers.
            </p>
            <ul className="space-y-2 text-sm text-gray-700 text-left mb-6">
              <li>✓ Browse jobs and gigs</li>
              <li>✓ Get verified badges</li>
              <li>✓ Build your reputation</li>
              <li>✓ Earn KES at your own pace</li>
            </ul>
            <div className={`px-6 py-2 rounded-lg font-semibold transition ${
              selectedRole === 'candidate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              {loading && selectedRole === 'candidate' ? 'Setting up...' : 'Continue'}
            </div>
          </button>

          {/* Employer Card */}
          <button
            onClick={() => handleRoleSelect('employer')}
            disabled={loading && selectedRole !== 'employer'}
            className={`p-8 rounded-lg border-2 transition ${
              selectedRole === 'employer'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            } ${loading && selectedRole !== 'employer' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-5xl mb-4">🏢</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">I'm Hiring</h2>
            <p className="text-gray-600 mb-6">
              Post jobs or gigs and find talented workers. Build your team fast.
            </p>
            <ul className="space-y-2 text-sm text-gray-700 text-left mb-6">
              <li>✓ Post jobs & gigs</li>
              <li>✓ Access verified workers</li>
              <li>✓ Manage applications</li>
              <li>✓ Scale your hiring</li>
            </ul>
            <div className={`px-6 py-2 rounded-lg font-semibold transition ${
              selectedRole === 'employer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              {loading && selectedRole === 'employer' ? 'Setting up...' : 'Continue'}
            </div>
          </button>
        </div>

        {/* Footer Link */}
        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
