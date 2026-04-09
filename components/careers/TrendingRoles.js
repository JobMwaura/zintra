/**
 * TrendingRoles Component - Compact
 * Trending roles with View all CTA
 */

'use client';

import Link from 'next/link';

export default function TrendingRoles({ roles }) {
  return (
    <section className="w-full py-8 sm:py-10 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Trending Roles
          </h2>
          <Link href="/careers/roles" className="text-[#ea8f1e] font-semibold hover:underline text-xs sm:text-sm">
            Browse all →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Link
              key={role}
              href={`/careers/jobs?role=${encodeURIComponent(role)}`}
              className="px-3 py-1 bg-white border-2 border-gray-300 rounded text-xs sm:text-sm font-medium text-gray-700 hover:border-[#ea8f1e] hover:text-[#ea8f1e] transition-colors"
            >
              {role}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
