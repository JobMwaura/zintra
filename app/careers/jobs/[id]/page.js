'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MapPin, Clock, DollarSign, Share2, Briefcase, User, CheckCircle } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;
  const { user, loading: authLoading } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [hasProfile, setHasProfile] = useState(null); // null = not checked, true/false
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  // Check if user has a ZCC candidate profile + existing application
  useEffect(() => {
    if (!authLoading && user) {
      checkCandidateStatus();
    }
  }, [authLoading, user, jobId]);

  async function checkCandidateStatus() {
    try {
      const supabase = createClient();

      // Check if user has a candidate_profiles record
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
        .eq('listing_id', jobId)
        .eq('candidate_id', user.id)
        .maybeSingle();

      if (existingApp) {
        setApplied(true);
      }
    } catch (err) {
      console.error('Error checking candidate status:', err);
    }
  }

  async function loadJobDetails() {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
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
          employer:employer_id(id, company_name, company_logo_url, company_description, company_phone, company_email)
        `)
        .eq('id', jobId)
        .eq('type', 'job')
        .single();

      if (error) throw new Error(error.message);
      setJob(data);
    } catch (err) {
      console.error('Error loading job:', err);
      setError('Job not found');
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    // 1. Not logged in → redirect to login
    if (!user) {
      router.push('/login?redirect=/careers/jobs/' + jobId);
      return;
    }

    // 2. No ZCC candidate profile → show prompt to create one
    if (!hasProfile) {
      setShowProfilePrompt(true);
      return;
    }

    // 3. Already applied
    if (applied) return;

    setIsApplying(true);
    try {
      const supabase = createClient();

      // Double-check not already applied
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('listing_id', jobId)
        .eq('candidate_id', user.id)
        .maybeSingle();

      if (existingApp) {
        setApplied(true);
        return;
      }

      // Create application
      const { error: appError } = await supabase
        .from('applications')
        .insert({
          listing_id: jobId,
          candidate_id: user.id,
          status: 'applied',
        });

      if (appError) throw appError;

      setApplied(true);
    } catch (err) {
      console.error('Error applying:', err);
      alert('Failed to apply. Please try again.');
    } finally {
      setIsApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700 font-semibold text-lg">{error || 'Job not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-5 h-5" />
            Back to Jobs
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              {/* Title & Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                      {job.job_type}
                    </span>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Company Info */}
              {job.employer && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <div className="flex items-start gap-4">
                    {job.employer.company_logo_url ? (
                      <img
                        src={job.employer.company_logo_url}
                        alt={job.employer.company_name}
                        className="w-16 h-16 rounded-lg object-contain border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Briefcase className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{job.employer.company_name}</h3>
                      {job.employer.company_description && (
                        <p className="text-sm text-gray-600 mt-1">{job.employer.company_description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-200">
                {/* Pay */}
                {(job.pay_min || job.pay_max) && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Salary Range</p>
                    <p className="text-xl font-bold text-gray-900">
                      KES {job.pay_min?.toLocaleString()} - {job.pay_max?.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Location */}
                <div>
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> Location
                  </p>
                  <p className="text-xl font-bold text-gray-900">{job.location}</p>
                </div>

                {/* Duration */}
                {job.duration && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Duration
                    </p>
                    <p className="text-xl font-bold text-gray-900">{job.duration}</p>
                  </div>
                )}

                {/* Start Date */}
                {job.start_date && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Start Date
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {new Date(job.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Job Description</h3>
                <div className="prose prose-sm max-w-none text-gray-700">
                  {job.description ? (
                    <p className="whitespace-pre-wrap">{job.description}</p>
                  ) : (
                    <p className="text-gray-500">No description provided</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Apply Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ready to Apply?</h3>

              {/* Already applied state */}
              {applied && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-semibold text-sm">You&apos;ve applied for this job!</p>
                  </div>
                  <p className="text-xs text-green-600 mt-1">The employer will review your Career Centre profile.</p>
                </div>
              )}

              {/* Profile prompt modal */}
              {showProfilePrompt && !hasProfile && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <User className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Career Centre Profile Required</p>
                      <p className="text-xs text-gray-600 mb-3">
                        To apply for jobs, you need a Zintra Career Centre profile. This is separate from your Zintra platform account and lets employers see your skills and experience.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push('/careers/profile')}
                          className="px-4 py-2 rounded-lg font-semibold text-white text-sm transition-all hover:opacity-90"
                          style={{ backgroundColor: '#ca8637' }}
                        >
                          Create ZCC Profile
                        </button>
                        <button
                          onClick={() => setShowProfilePrompt(false)}
                          className="px-4 py-2 rounded-lg font-semibold text-gray-600 text-sm bg-gray-100 hover:bg-gray-200 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!applied && (
                <button
                  onClick={handleApply}
                  disabled={isApplying || applied}
                  className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#ca8637' }}
                >
                  {isApplying ? 'Applying...' : applied ? 'Applied ✓' : 'Apply Now'}
                </button>
              )}

              <p className="text-xs text-gray-500 mt-4 text-center">
                By applying, you agree to share your Career Centre profile with the employer.
              </p>

              {job.employer && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Contact Employer</h4>
                  {job.employer.company_phone && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Phone:</strong> {job.employer.company_phone}
                    </p>
                  )}
                  {job.employer.company_email && (
                    <p className="text-sm text-gray-600">
                      <strong>Email:</strong> {job.employer.company_email}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
