/**
 * EmployerTestimonial Component - Case Study
 * Displays success story from an employer's perspective
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Users, CheckCircle2, TrendingUp } from 'lucide-react';
import { getEmployerRedirectPath } from '@/lib/auth-helpers';

export default function EmployerTestimonial() {
  const router = useRouter();
  const [postJobLink, setPostJobLink] = useState('/vendor-registration');
  const [postGigLink, setPostGigLink] = useState('/vendor-registration');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRedirectPaths();
  }, []);

  async function loadRedirectPaths() {
    try {
      const jobPath = await getEmployerRedirectPath('job');
      const gigPath = await getEmployerRedirectPath('gig');
      setPostJobLink(jobPath);
      setPostGigLink(gigPath);
    } catch (error) {
      console.error('Error loading redirect paths:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    {
      icon: Users,
      number: '12',
      label: 'Workers Hired'
    },
    {
      icon: CheckCircle2,
      number: '48',
      label: 'Projects Completed'
    },
    {
      icon: TrendingUp,
      number: '4.9★',
      label: 'Average Rating'
    },
    {
      icon: Building2,
      number: '2',
      label: 'Months on Zintra'
    }
  ];

  return (
    <section className="w-full bg-gradient-to-r from-slate-900 to-slate-800 py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Trusted by 180+ Employers
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            From small contractors to large construction firms, employers trust Zintra to find verified workers
          </p>
        </div>

        {/* Case Study */}
        <div className="bg-white rounded-lg overflow-hidden shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: Company Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 sm:p-10 flex flex-col justify-center">
              {/* Company Badge */}
              <div className="inline-flex items-center gap-2 mb-6 w-fit">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Building2 size={20} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  Featured Employer
                </span>
              </div>

              {/* Company Name */}
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                BuildRight Ltd.
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Leading construction contractor specializing in commercial and residential projects across Kenya
              </p>

              {/* Quote */}
              <blockquote className="border-l-4 border-[#ea8f1e] pl-4 mb-8">
                <p className="text-gray-700 italic mb-3">
                  "We used to struggle finding reliable workers. Zintra solved that problem. The vetting process is thorough and workers are professional. We've hired 12 workers in just 2 months and completed 48 projects."
                </p>
                <p className="font-semibold text-gray-900">
                  — Samuel Kipchoge, Project Manager
                </p>
              </blockquote>

              {/* Key Results */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Cut hiring time by 70%
                    </p>
                    <p className="text-xs text-gray-600">
                      Found verified workers in hours, not weeks
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      100% project completion rate
                    </p>
                    <p className="text-xs text-gray-600">
                      All 48 projects completed on schedule
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      5-star average worker quality
                    </p>
                    <p className="text-xs text-gray-600">
                      4.9 star average rating on all workers
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Stats Grid */}
            <div className="p-8 sm:p-10 bg-white flex flex-col justify-center">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-6">
                Results After 2 Months
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="text-center">
                      <div className="flex justify-center mb-3">
                        <Icon size={28} className="text-[#ea8f1e]" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                        {stat.number}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600 mb-4">
                  Ready to hire verified construction workers?
                </p>
                <Link href={postJobLink}>
                  <button className="w-full px-4 py-2.5 bg-[#ea8f1e] text-white font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm">
                    Post a Job
                  </button>
                </Link>
                <Link href={postGigLink}>
                  <button className="w-full mt-2 px-4 py-2.5 border-2 border-[#ea8f1e] text-[#ea8f1e] font-bold rounded-lg hover:bg-orange-50 transition-colors text-sm">
                    Post a Gig
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Trust Info */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-2xl font-bold text-[#ea8f1e] mb-2">180+</p>
            <p className="text-sm text-gray-600">Verified Employers</p>
            <p className="text-xs text-gray-500 mt-2">All background checked</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-2xl font-bold text-[#ea8f1e] mb-2">4.8★</p>
            <p className="text-sm text-gray-600">Employer Satisfaction</p>
            <p className="text-xs text-gray-500 mt-2">Based on 500+ reviews</p>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <p className="text-2xl font-bold text-[#ea8f1e] mb-2">48h</p>
            <p className="text-sm text-gray-600">Average Time to Hire</p>
            <p className="text-xs text-gray-500 mt-2">From posting to confirmed hire</p>
          </div>
        </div>
      </div>
    </section>
  );
}
