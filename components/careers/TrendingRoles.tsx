/**
 * TrendingRoles Component
 * Pills of trending job roles
 */

"use client";

import Link from "next/link";

interface TrendingRolesProps {
  roles: string[];
}

export default function TrendingRoles({ roles }: TrendingRolesProps) {
  return (
    <section className="w-full bg-gray-50 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Trending Roles This Week
          </h2>
          <p className="text-gray-600">
            Popular skills and positions in high demand
          </p>
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-4">
          {roles.map((role) => (
            <Link
              key={role}
              href={`/careers/jobs?role=${encodeURIComponent(role)}`}
              className="inline-flex items-center px-5 sm:px-6 py-3 bg-white border border-gray-300 rounded-full font-medium text-gray-700 hover:bg-[#ea8f1e] hover:text-white hover:border-[#ea8f1e] transition-colors shadow-sm"
            >
              {role}
            </Link>
          ))}
        </div>

        {/* TODO: Add API integration to fetch trending roles dynamically */}
      </div>
    </section>
  );
}
