'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import CareersNavbar from '@/components/careers/CareersNavbar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, MapPin, Briefcase, Star, Mail, Phone, Award, CheckCircle2 } from 'lucide-react';

export default function TalentProfilePage() {
  const params = useParams();
  const workerId = params.id;
  const supabase = createClient();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkerProfile();
  }, [workerId]);

  async function fetchWorkerProfile() {
    try {
      setLoading(true);
      setError(null);

      // Fetch worker profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          city,
          phone,
          email,
          role,
          bio,
          skills,
          experience,
          certifications,
          average_rating,
          ratings_count,
          account_type,
          created_at,
          updated_at
        `)
        .eq('id', workerId)
        .single();

      if (profileError) {
        throw new Error('Worker profile not found');
      }

      // Fetch worker reviews/ratings
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer:reviewer_id(full_name)')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch worker applications and completed gigs
      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          gig:gig_id(title, pay_max, completed)
        `)
        .eq('worker_id', workerId)
        .limit(5);

      setWorker({
        ...profileData,
        reviews: reviewsData || [],
        applications: applicationsData || [],
      });
    } catch (err) {
      console.error('Error fetching worker profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CareersNavbar />
        <div className="flex items-center justify-center pt-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CareersNavbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/careers/talent"
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Talent
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold">
              {error || 'Worker profile not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Parse skills if it's a string
  const skills = typeof worker.skills === 'string' ? worker.skills.split(',').map(s => s.trim()) : (worker.skills || []);
  const certifications = typeof worker.certifications === 'string' ? worker.certifications.split(',').map(c => c.trim()) : (worker.certifications || []);

  return (
    <div className="min-h-screen bg-gray-50">
      <CareersNavbar />

      {/* Back Button & Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/careers/talent"
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-6 font-semibold"
          >
            <ArrowLeft size={20} />
            Back to Talent
          </Link>
        </div>
      </div>

      {/* Main Profile Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              {/* Avatar */}
              <div className="w-full h-40 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {worker.avatar_url ? (
                  <img
                    src={worker.avatar_url}
                    alt={worker.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl text-white font-bold">
                    {worker.full_name?.charAt(0) || '?'}
                  </span>
                )}
              </div>

              {/* Name & Role */}
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{worker.full_name}</h1>
              {worker.role && (
                <p className="text-lg text-orange-600 font-semibold mb-4">{worker.role}</p>
              )}

              {/* Rating */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < Math.round(worker.average_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900">
                    {(worker.average_rating || 0).toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Based on {worker.ratings_count || 0} reviews
                </p>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                {worker.city && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin size={16} className="text-orange-500 flex-shrink-0" />
                    <span className="text-sm">{worker.city}</span>
                  </div>
                )}
                {worker.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail size={16} className="text-orange-500 flex-shrink-0" />
                    <a href={`mailto:${worker.email}`} className="text-sm hover:text-orange-500 transition break-all">
                      {worker.email}
                    </a>
                  </div>
                )}
                {worker.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone size={16} className="text-orange-500 flex-shrink-0" />
                    <a href={`tel:${worker.phone}`} className="text-sm hover:text-orange-500 transition">
                      {worker.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Hire Button */}
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition">
                Hire This Worker
              </button>

              {/* Edit Profile Button (only if own profile) */}
              <Link
                href="/careers/profile"
                className="block w-full mt-2 text-center bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-lg transition text-sm"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            {worker.bio && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{worker.bio}</p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award size={24} className="text-orange-500" />
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {worker.experience && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase size={24} className="text-orange-500" />
                  Experience
                </h2>
                <p className="text-gray-700 whitespace-pre-line">{worker.experience}</p>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={24} className="text-orange-500" />
                  Certifications
                </h2>
                <ul className="space-y-2">
                  {certifications.map((cert, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{cert}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recent Reviews */}
            {worker.reviews && worker.reviews.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
                <div className="space-y-4">
                  {worker.reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {review.reviewer?.full_name || 'Anonymous'}
                          </span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
