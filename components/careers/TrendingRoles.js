/**
 * TrendingRoles Component - Minimalist
 * Simple list of trending job roles
 */

'use client';

import Link from 'next/link';

export default function TrendingRoles({ roles }) {
  return (
    <section className="w-full py-12 sm:py-16 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Trending Roles
        </h2>

        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <Link
              key={role}
              href={`/careers/jobs?role=${encodeURIComponent(role)}`}
              className="inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-[#ea8f1e] hover:text-white hover:border-[#ea8f1e] transition-colors"
            >
              {role}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
