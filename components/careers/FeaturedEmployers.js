/**
 * FeaturedEmployers Component - Conversion-Focused
 * Cards with clear hierarchy + View all CTA
 */

import Link from 'next/link';

export default function FeaturedEmployers({ employers }) {
  return (
    <section className="w-full py-16 sm:py-20 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Featured Employers
            </h2>
          </div>
          <Link href="/careers/employers" className="text-[#ea8f1e] font-semibold hover:underline text-sm">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {employers.map((employer) => (
            <div
              key={employer.id}
              className="bg-white rounded-lg border border-gray-300 hover:border-[#ea8f1e] hover:shadow-md transition-all p-5"
            >
              {/* Logo */}
              <div className="text-4xl mb-3">{employer.logo}</div>

              {/* Company Name */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {employer.name}
              </h3>

              {/* Verified Badge - Standardized */}
              {employer.verified && (
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-300 px-2.5 py-1 rounded mb-3">
                  <span>✓</span> Verified
                </div>
              )}

              {/* Details - Clear Hierarchy */}
              <div className="text-sm text-gray-700 space-y-2 mb-4">
                <div>
                  <p className="text-gray-500 text-xs font-semibold mb-0.5">Location</p>
                  <p>📍 {employer.location}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold mb-0.5">Open Jobs</p>
                  <p className="font-bold text-[#ea8f1e]">{employer.jobCount} jobs</p>
                </div>
                <p className="text-xs text-gray-500 pt-2">Responds in &lt; 2 hours</p>
              </div>

              {/* View Button */}
              <button className="w-full py-2 border-2 border-[#ea8f1e] text-[#ea8f1e] font-semibold text-sm rounded-lg hover:bg-orange-50 transition-colors">
                View Jobs
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
