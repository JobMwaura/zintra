'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Shield, Upload, FileText, Users, Award, ArrowLeft, Crown, Coins, CheckCircle2, XCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { ZCC_COSTS } from '@/lib/zcc/credit-config';
import { getVerificationStatus, submitVerification, purchaseFeaturedProfile } from '@/app/actions/zcc-verification';
import { getWalletBalance } from '@/app/actions/zcc-wallet';
import { getLevelProgress } from '@/app/actions/zcc-verification';
import { LevelBadge, VerificationStatusPill } from '@/components/careers/LevelBadge';

export default function VerificationPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [verifications, setVerifications] = useState({});
  const [profile, setProfile] = useState({});
  const [levelProgress, setLevelProgress] = useState(null);
  const [submitting, setSubmitting] = useState(null); // which type is submitting
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state for each verification type
  const [idNotes, setIdNotes] = useState('');
  const [refNotes, setRefNotes] = useState('');
  const [certNotes, setCertNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }
      setUser(authUser);

      // Fetch verification status + wallet balance in parallel
      const [verResult, balResult] = await Promise.all([
        getVerificationStatus(authUser.id),
        getWalletBalance(authUser.id),
      ]);

      if (verResult.success) {
        setVerifications(verResult.verifications);
        setProfile(verResult.profile);

        // Calculate level progress
        const lp = getLevelProgress(
          verResult.profile.completed_gigs || 0,
          verResult.profile.rating || 0
        );
        setLevelProgress(lp);
      }

      if (balResult.success) {
        setBalance(balResult.balance);
      }
    } catch (err) {
      console.error('Error loading verification data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitVerification(type) {
    setSubmitting(type);
    setError(null);
    setSuccess(null);

    const notesMap = {
      id_document: idNotes,
      references: refNotes,
      certificates: certNotes,
    };

    const result = await submitVerification(user.id, type, {
      notes: notesMap[type] || null,
    });

    if (result.success) {
      setSuccess(`${type.replace('_', ' ')} verification submitted for review!`);
      await loadData(); // Refresh
    } else {
      if (result.creditsNeeded) {
        setError(`Insufficient credits. You need ${result.creditsNeeded} credits. Visit the Credits Store to top up.`);
      } else {
        setError(result.error);
      }
    }

    setSubmitting(null);
    setTimeout(() => { setSuccess(null); setError(null); }, 5000);
  }

  async function handlePurchaseFeatured() {
    setPurchasing(true);
    setError(null);
    setSuccess(null);

    const result = await purchaseFeaturedProfile(user.id);

    if (result.success) {
      setSuccess('🌟 Your profile is now featured for 7 days!');
      await loadData();
    } else {
      if (result.creditsNeeded) {
        setError(`Insufficient credits. You need ${result.creditsNeeded} credits.`);
      } else {
        setError(result.error);
      }
    }

    setPurchasing(false);
    setTimeout(() => { setSuccess(null); setError(null); }, 5000);
  }

  const isFeatured = profile.featured_until && new Date(profile.featured_until) > new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  const verificationTypes = [
    {
      key: 'id_document',
      label: 'ID Document',
      description: 'Upload your national ID, passport, or driving licence for identity verification.',
      icon: FileText,
      notes: idNotes,
      setNotes: setIdNotes,
      placeholder: 'Enter your ID number or describe the document...',
    },
    {
      key: 'references',
      label: 'Professional References',
      description: 'Provide contact details for 2 professional references who can vouch for your work.',
      icon: Users,
      notes: refNotes,
      setNotes: setRefNotes,
      placeholder: 'Name, phone, relationship (e.g., "John Mwangi, +254712345678, Former Site Supervisor at ABC Construction")',
    },
    {
      key: 'certificates',
      label: 'Trade Certificates',
      description: 'Upload certificates for your trade qualifications, safety training, or NITA certifications.',
      icon: Award,
      notes: certNotes,
      setNotes: setCertNotes,
      placeholder: 'List your certificates and issuing bodies...',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/careers/me"
            className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-4 transition"
          >
            <ArrowLeft size={20} />
            Back to Profile
          </Link>
          <h1 className="text-3xl font-bold mb-2">Verification & Level</h1>
          <p className="text-orange-100">Get verified to build trust and unlock higher levels</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 text-sm">{error}</p>
              {error.includes('credits') && (
                <Link href="/careers/credits" className="text-red-700 underline text-sm font-semibold">
                  Go to Credits Store →
                </Link>
              )}
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Wallet Balance Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins size={24} className="text-orange-500" />
            <div>
              <p className="text-sm text-gray-500">Your Credit Balance</p>
              <p className="text-xl font-bold text-gray-900">{balance} credits</p>
            </div>
          </div>
          <Link
            href="/careers/credits"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition"
          >
            Buy Credits
          </Link>
        </div>

        {/* Worker Level Card */}
        {levelProgress && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield size={20} className="text-orange-500" />
                Your Worker Level
              </h2>
              <LevelBadge level={levelProgress.currentLevel.key} size="md" />
            </div>

            {/* Level Progress Bar */}
            <div className="flex items-center gap-2 mb-4">
              {['new', 'rising', 'trusted', 'top_rated'].map((lvl, i) => (
                <div key={lvl} className="flex-1">
                  <div className={`h-2 rounded-full ${i <= levelProgress.currentIndex ? 'bg-orange-500' : 'bg-gray-200'}`} />
                  <p className={`text-xs mt-1 text-center ${i <= levelProgress.currentIndex ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
                    {lvl === 'top_rated' ? 'Top Rated' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-500">Completed Gigs</p>
                <p className="text-lg font-bold text-gray-900">{levelProgress.completedGigs}</p>
                {levelProgress.nextLevel && (
                  <p className="text-xs text-gray-400">Need {levelProgress.nextLevel.min_completed} for next level</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Rating</p>
                <p className="text-lg font-bold text-gray-900">{Number(levelProgress.rating).toFixed(1)} / 5.0</p>
                {levelProgress.nextLevel && (
                  <p className="text-xs text-gray-400">Need {levelProgress.nextLevel.min_rating}+ for next level</p>
                )}
              </div>
            </div>

            {!levelProgress.nextLevel && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-800 font-semibold">🏆 You've reached the highest level!</p>
              </div>
            )}
          </div>
        )}

        {/* Verification Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Shield size={20} className="text-orange-500" />
            Verification Documents
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            First verification costs <strong>{ZCC_COSTS.VERIFICATION_BUNDLE} credits</strong> (covers all 3 types). Re-submissions are free.
          </p>

          <div className="space-y-6">
            {verificationTypes.map(vType => {
              const existing = verifications[vType.key];
              const status = existing?.status || null;
              const isRejected = status === 'rejected';
              const isPending = status === 'pending';
              const isApproved = status === 'approved';
              const canSubmit = !isPending && !isApproved;
              const Icon = vType.icon;

              return (
                <div key={vType.key} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon size={20} className="text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{vType.label}</h3>
                        <p className="text-sm text-gray-500">{vType.description}</p>
                      </div>
                    </div>
                    <VerificationStatusPill status={status} />
                  </div>

                  {/* Show rejection reason */}
                  {isRejected && existing.reject_reason && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700">
                        <strong>Reason:</strong> {existing.reject_reason}
                      </p>
                    </div>
                  )}

                  {/* Submission form */}
                  {canSubmit && (
                    <div className="mt-3 space-y-3">
                      <textarea
                        value={vType.notes}
                        onChange={(e) => vType.setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        placeholder={vType.placeholder}
                      />
                      <button
                        onClick={() => handleSubmitVerification(vType.key)}
                        disabled={submitting === vType.key || !vType.notes.trim()}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Upload size={16} />
                        {submitting === vType.key ? 'Submitting...' : (isRejected ? 'Re-submit' : 'Submit for Review')}
                      </button>
                    </div>
                  )}

                  {/* Approved state */}
                  {isApproved && (
                    <div className="mt-2 flex items-center gap-2 text-green-600">
                      <CheckCircle2 size={16} />
                      <span className="text-sm font-medium">Verified ✓</span>
                    </div>
                  )}

                  {/* Pending state */}
                  {isPending && (
                    <div className="mt-2 flex items-center gap-2 text-yellow-600">
                      <Clock size={16} />
                      <span className="text-sm">Under review — we'll notify you when complete</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Featured Profile Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Sparkles size={20} className="text-orange-500" />
            Featured Profile
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Boost your visibility! Featured profiles appear at the top of the Talent page for 7 days.
          </p>

          {isFeatured ? (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={20} className="text-orange-600" />
                <span className="font-bold text-orange-800">Your profile is featured!</span>
              </div>
              <p className="text-sm text-orange-700">
                Featured until <strong>{new Date(profile.featured_until).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-900">{ZCC_COSTS.FEATURED_PROFILE_7D} credits for 7 days</p>
                <p className="text-sm text-gray-500">Get seen by employers first</p>
              </div>
              <button
                onClick={handlePurchaseFeatured}
                disabled={purchasing}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                <Crown size={16} />
                {purchasing ? 'Processing...' : 'Get Featured'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
