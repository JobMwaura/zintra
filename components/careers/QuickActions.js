'use client';

import Link from 'next/link';
import { Briefcase, Zap, User, Search, Users } from 'lucide-react';

/**
 * QuickActions — prominent CTAs on the careers landing page.
 * Spec: "Post Job | Post Gig | Create Profile" + search tabs
 */
export default function QuickActions() {
  return (
    <section className="py-8 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            href="/careers/jobs"
            className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition group"
          >
            <Search size={24} className="text-blue-600 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Find Jobs</p>
              <p className="text-xs text-gray-500">Browse openings</p>
            </div>
          </Link>

          <Link
            href="/careers/gigs"
            className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition group"
          >
            <Zap size={24} className="text-orange-600 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Find Gigs</p>
              <p className="text-xs text-gray-500">Urgent work today</p>
            </div>
          </Link>

          <Link
            href="/careers/talent"
            className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition group"
          >
            <Users size={24} className="text-purple-600 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Talent</p>
              <p className="text-xs text-gray-500">Browse workers</p>
            </div>
          </Link>

          <Link
            href="/careers/employer/post-job"
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition group"
          >
            <Briefcase size={24} className="text-green-600 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Post Job</p>
              <p className="text-xs text-gray-500">Hire long-term</p>
            </div>
          </Link>

          <Link
            href="/careers/employer/post-gig"
            className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition group col-span-2 sm:col-span-1"
          >
            <Zap size={24} className="text-red-600 group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Post Gig</p>
              <p className="text-xs text-gray-500">Hire urgently</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
