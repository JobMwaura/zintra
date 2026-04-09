/**
 * FeaturedEmployers Component - Compact
 * Tighter cards with optimized hierarchy
 */

import Link from 'next/link';

export default function FeaturedEmployers({ employers }) {
  return (
    <section className="w-full py-8 sm:py-10 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Featured Employers
          </h2>
          <Link href="/careers/employers" className="text-[#ea8f1e] font-semibold hover:underline text-xs sm:text-sm">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employers.map((employer) => (
            <div
              key={employer.id}
              className="bg-white rounded border border-gray-300 hover:border-[#ea8f1e] hover:shadow-md transition-all p-4"
            >
              {/* Logo */}
              <div className="text-3xl mb-2">{employer.logo}</div>

              {/* Company Name */}
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {employer.name}
              </h3>

              {/* Verified Badge */}
              {employer.verified && (
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-300 px-2 py-0.5 rounded mb-2">
                  <span>✓</span> Verified
                </div>
              )}

              {/* Details - Compact */}
              <div className="text-xs text-gray-700 space-y-1 mb-3">
                <div>
                  <p className="text-gray-500 font-semibold mb-0.5">Location</p>
                  <p>📍 {employer.location}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-semibold mb-0.5">Open Jobs</p>
                  <p className="font-bold text-[#ea8f1e]">{employer.jobCount} jobs</p>
                </div>
              </div>

              {/* View Button */}
              <button className="w-full py-1.5 text-xs border-2 border-[#ea8f1e] text-[#ea8f1e] font-semibold rounded hover:bg-orange-50 transition-colors">
                View Jobs
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
