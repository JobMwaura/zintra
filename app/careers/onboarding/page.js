'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus, enableCandidateRole, enableEmployerRole } from '@/app/actions/vendor-zcc';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [roleStatus, setRoleStatus] = useState(null);
  const [error, setError] = useState(null);
  const [enablingRole, setEnablingRole] = useState(null);

  useEffect(() => {
    checkUserAndRoles();
  }, []);

  async function checkUserAndRoles() {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/careers/auth/login');
        return;
      }

      setUser(user);

      // Get role status
      const result = await getUserRoleStatus(user.id);
      setRoleStatus(result);

      // If user already has both candidate and employer roles, redirect to appropriate page
      if (result.roles.candidate && result.roles.employer) {
        router.push('/careers');
      }
    } catch (err) {
      console.error('Error checking roles:', err);
      setError('Failed to load onboarding');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnableCandidateRole() {
    try {
      setEnablingRole('candidate');
      const result = await enableCandidateRole(user.id);

      if (result.success) {
        // Refresh role status
        const newStatus = await getUserRoleStatus(user.id);
        setRoleStatus(newStatus);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error enabling candidate role:', err);
      setError('Failed to enable candidate role');
    } finally {
      setEnablingRole(null);
    }
  }

  async function handleEnableEmployerRole() {
    try {
      setEnablingRole('employer');
      
      // Use vendor data if available, otherwise require manual entry
      const companyData = roleStatus?.profiles?.vendorInfo ? {
        companyName: roleStatus.profiles.vendorInfo.name,
        companyEmail: roleStatus.profiles.vendorInfo.email,
        companyPhone: roleStatus.profiles.vendorInfo.phone,
        location: roleStatus.profiles.vendorInfo.location,
      } : {};

      const result = await enableEmployerRole(user.id, companyData);

      if (result.success) {
        // Refresh role status
        const newStatus = await getUserRoleStatus(user.id);
        setRoleStatus(newStatus);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error enabling employer role:', err);
      setError('Failed to enable employer role');
    } finally {
      setEnablingRole(null);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  const { candidate, employer, vendor } = roleStatus?.roles || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            What would you like to do?
          </h1>
          <p className="text-lg text-slate-600">
            You can do both — choose your roles to get started
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Candidate Role */}
          <RoleCard
            enabled={candidate}
            icon="🔍"
            title="Find Work"
            subtitle="Browse jobs & gigs"
            features={[
              'Apply to job listings',
              'Manage your profile',
              'Track applications',
              'Ratings & reviews',
            ]}
            buttonText={candidate ? 'Enabled ✓' : 'Enable Now'}
            onEnable={handleEnableCandidateRole}
            loading={enablingRole === 'candidate'}
            disabled={candidate || enablingRole !== null}
          />

          {/* Employer Role */}
          <RoleCard
            enabled={employer}
            icon="👔"
            title="Hire Talent"
            subtitle="Post jobs & find candidates"
            features={[
              vendor ? '✓ Already verified as vendor' : 'Create company profile',
              'Post jobs & gigs',
              'Manage applications',
              'Track hiring metrics',
            ]}
            buttonText={employer ? 'Enabled ✓' : 'Enable Now'}
            onEnable={handleEnableEmployerRole}
            loading={enablingRole === 'employer'}
            disabled={employer || enablingRole !== null}
            highlight={vendor}
          />
        </div>

        {/* Next Steps */}
        {(candidate || employer) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
            <p className="text-emerald-900 font-semibold mb-4">
              {!candidate && !employer
                ? 'Enable at least one role to continue'
                : candidate && employer
                ? '🎉 You\'re all set! Ready to get started?'
                : '✓ First step done! Complete your profile to continue.'}
            </p>
            {candidate && employer && (
              <button
                onClick={() => router.push('/careers')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                Go to Career Centre
              </button>
            )}
            {candidate && !employer && (
              <p className="text-sm text-slate-600">
                Next: Complete your candidate profile at <span className="font-mono">/careers/me</span>
              </p>
            )}
            {employer && !candidate && (
              <p className="text-sm text-slate-600">
                Next: Set up payment to post your first job
              </p>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">💡 About Roles</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ You can have multiple roles at the same time</li>
            <li>✓ Roles can be added or removed anytime</li>
            {vendor && (
              <li>✓ As a vendor, your employer profile is already verified</li>
            )}
            <li>✓ No additional KYC needed to switch roles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ enabled, icon, title, subtitle, features, buttonText, onEnable, loading, disabled, highlight }) {
  return (
    <div
      className={`relative rounded-xl border-2 p-6 transition ${
        enabled
          ? 'bg-emerald-50 border-emerald-300'
          : highlight
          ? 'bg-blue-50 border-blue-300 shadow-lg'
          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
      }`}
    >
      {highlight && !enabled && (
        <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          Verified Vendor
        </div>
      )}

      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-2xl font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 mb-4">{subtitle}</p>

      <ul className="space-y-2 mb-6">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start text-sm text-slate-700">
            <span className="text-emerald-600 font-bold mr-2">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onEnable}
        disabled={disabled}
        className={`w-full font-semibold py-2 px-4 rounded-lg transition ${
          enabled
            ? 'bg-emerald-600 text-white cursor-default'
            : disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
        }`}
      >
        {loading ? 'Setting up...' : buttonText}
      </button>
    </div>
  );
}
