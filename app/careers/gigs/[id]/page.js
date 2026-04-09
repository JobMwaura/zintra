'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  AlertCircle,
  CheckCircle,
  Share2,
  Calendar,
  User,
} from 'lucide-react';

export default function GigDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gig, setGig] = useState(null);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [hasProfile, setHasProfile] = useState(null);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  useEffect(() => {
    loadGig();
  }, []);

  // Check ZCC profile + existing application
  useEffect(() => {
    if (!authLoading && user) {
      checkCandidateStatus();
    }
  }, [authLoading, user, params.id]);

  async function checkCandidateStatus() {
    try {
      const supabase = createClient();
      const gigId = params.id;

      // Check for candidate_profiles record
      const { data: candidate } = await supabase
        .from('candidate_profiles')
        .select('id, full_name')
        .eq('id', user.id)
        .maybeSingle();

      setHasProfile(!!candidate?.full_name);

      // Check if already applied
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('listing_id', gigId)
        .eq('candidate_id', user.id)
        .maybeSingle();

      if (existingApp) {
        setApplied(true);
      }
    } catch (err) {
      console.error('Error checking candidate status:', err);
    }
  }

  async function loadGig() {
    try {
      const supabase = createClient();
      const gigId = params.id;

      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          category,
          location,
          pay_min,
          pay_max,
          pay_currency,
          job_type,
          start_date,
          duration,
          status,
          type,
          created_at,
          updated_at,
          employer:employer_id(
            id,
            company_name,
            company_logo_url,
            company_description,
            location
          ),
          applications(count)
        `)
        .eq('id', gigId)
        .eq('type', 'gig')
        .single();

      if (error) {
        throw new Error(error.message || 'Gig not found');
      }

      setGig(data);
    } catch (err) {
      console.error('Error loading gig:', err);
      setError(err.message || 'Failed to load gig details');
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!user) {
      router.push('/login?redirect=/careers/gigs/' + params.id);
      return;
    }

    // No ZCC profile → prompt
    if (!hasProfile) {
      setShowProfilePrompt(true);
      return;
    }

    if (applied) return;

    setApplying(true);
    try {
      const supabase = createClient();

      // Double-check not already applied
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('listing_id', gig.id)
        .eq('candidate_id', user.id)
        .maybeSingle();

      if (existingApp) {
        setApplied(true);
        return;
      }

      // Create application
      const { error: createError } = await supabase.from('applications').insert({
        listing_id: gig.id,
        candidate_id: user.id,
        status: 'applied',
      });

      if (createError) throw createError;

      setApplied(true);
      // Reload gig to update application count
      setTimeout(() => loadGig(), 1000);
    } catch (err) {
      console.error('Error applying to gig:', err);
      alert('Failed to apply. Please try again.');
    } finally {
      setApplying(false);
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return 'Negotiable';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const timeUntilStart = (startDate) => {
    if (!startDate) return 'TBD';
    const start = new Date(startDate);
    const today = new Date();
    const daysUntil = Math.ceil((start - today) / (1000 * 60 * 60 * 24));

    if (daysUntil === 0) return 'Starts Today';
    if (daysUntil === 1) return 'Starts Tomorrow';
    if (daysUntil < 0) return 'Started';
    if (daysUntil < 7) return `Starts in ${daysUntil} days`;
    return `Starts in ${Math.ceil(daysUntil / 7)} weeks`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !gig) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
          <AlertCircle size={48} className="mx-auto text-red-600 mb-4" />
          <h1 className="text-2xl font-bold text-red-900 mb-2">Gig Not Found</h1>
          <p className="text-red-700 mb-6">{error || 'This gig is no longer available'}</p>
          <button
            onClick={() => router.push('/careers/gigs')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Back to Gigs
          </button>
        </div>
      </main>
    );
  }

  const applicantCount = gig.applications?.[0]?.count || 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-bold mb-4"
          >
            <ArrowLeft size={20} />
            Back to Gigs
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{gig.title}</h1>
          <p className="text-gray-600 mt-2">{gig.category}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alert Banner */}
            {gig.status !== 'active' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-bold text-yellow-900">This gig is no longer active</p>
                  <p className="text-yellow-700 text-sm">Status: {gig.status}</p>
                </div>
              </div>
            )}

            {/* Description Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About This Gig</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {gig.description || 'No detailed description provided.'}
              </p>
            </div>

            {/* Key Details Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Gig Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {/* Location */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={18} className="text-orange-500" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{gig.location}</p>
                </div>

                {/* Duration */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-orange-500" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{gig.duration || gig.job_type || 'N/A'}</p>
                </div>

                {/* Start Date */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-orange-500" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Starts</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatDate(gig.start_date)}</p>
                </div>

                {/* Pay Min */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={18} className="text-orange-500" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Min Pay</p>
                  </div>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(gig.pay_min)}</p>
                </div>

                {/* Pay Max */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={18} className="text-orange-500" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Max Pay</p>
                  </div>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(gig.pay_max)}</p>
                </div>

                {/* Time Until Start */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase size={18} className="text-orange-500" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Timeline</p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{timeUntilStart(gig.start_date)}</p>
                </div>
              </div>
            </div>

            {/* Employer Info */}
            {gig.employer && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About The Employer</h2>
                <div className="flex items-start gap-4">
                  {gig.employer.logo_url && (
                    <img
                      src={gig.employer.logo_url}
                      alt={gig.employer.company_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{gig.employer.company_name}</h3>
                    {gig.employer.location && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin size={14} />
                        {gig.employer.location}
                      </p>
                    )}
                    {gig.employer.description && (
                      <p className="text-gray-700 text-sm mt-2 line-clamp-3">{gig.employer.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Similar Gigs CTA */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-2">Looking for more gigs?</h3>
              <p className="text-blue-700 text-sm mb-4">Check out other available opportunities in your area.</p>
              <button
                onClick={() => router.push('/careers/gigs')}
                className="text-blue-600 hover:text-blue-700 font-bold"
              >
                View all gigs →
              </button>
            </div>
          </div>

          {/* Right Column - Sticky Apply Section */}
          <div className="lg:col-span-1">
            {/* Pay Card */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white mb-6 sticky top-24">
              <p className="text-orange-100 text-sm font-semibold mb-1">Estimated Pay Range</p>
              <div className="text-3xl font-bold mb-6">
                {gig.pay_min && gig.pay_max ? (
                  <>
                    {formatCurrency(gig.pay_min)} <span className="text-lg">-</span> {formatCurrency(gig.pay_max)}
                  </>
                ) : (
                  'Negotiable'
                )}
              </div>

              {/* Applicants Count */}
              <div className="bg-orange-400 bg-opacity-30 rounded p-3 mb-6">
                <p className="text-xs font-bold text-orange-100 uppercase">Applications</p>
                <p className="text-2xl font-bold">{applicantCount}</p>
              </div>

              {/* ZCC Profile Prompt */}
              {showProfilePrompt && !hasProfile && (
                <div className="bg-white bg-opacity-95 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Career Centre Profile Required</p>
                      <p className="text-xs text-gray-600 mb-3">
                        Create your ZCC profile so employers can see your skills and experience.
                      </p>
                      <button
                        onClick={() => router.push('/careers/profile')}
                        className="w-full px-4 py-2 rounded-lg font-semibold text-white text-sm bg-orange-600 hover:bg-orange-700 transition mb-2"
                      >
                        Create ZCC Profile
                      </button>
                      <button
                        onClick={() => setShowProfilePrompt(false)}
                        className="w-full text-xs text-orange-200 hover:text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <button
                onClick={handleApply}
                disabled={applying || applied || gig.status !== 'active'}
                className={`w-full font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2 ${
                  applied
                    ? 'bg-green-500 text-white cursor-default'
                    : gig.status !== 'active'
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-white text-orange-600 hover:bg-orange-50'
                }`}
              >
                {applied ? (
                  <>
                    <CheckCircle size={20} />
                    Application Sent
                  </>
                ) : applying ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Applying...
                  </>
                ) : (
                  'Apply Now'
                )}
              </button>

              {!user && (
                <p className="text-xs text-orange-100 mt-3 text-center">
                  Sign in required to apply
                </p>
              )}
            </div>

            {/* Share Button */}
            <button className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2">
              <Share2 size={18} />
              Share Gig
            </button>

            {/* Gig Status Badge */}
            <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    gig.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                ></div>
                <p className="font-bold text-gray-900 capitalize">{gig.status}</p>
              </div>
            </div>

            {/* Posted Date */}
            <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Posted</p>
              <p className="font-medium text-gray-900">{formatDate(gig.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
