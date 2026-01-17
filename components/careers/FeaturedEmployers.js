/**
 * FeaturedEmployers Component
 * Grid of employer cards with mock data
 */

export default function FeaturedEmployers({ employers }) {
  return (
    <section className="w-full py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Featured Employers
          </h2>
          <p className="text-gray-600">
            Trusted companies hiring skilled workers on Zintra
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {employers.map((employer) => (
            <div
              key={employer.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-6"
            >
              {/* Logo */}
              <div className="text-5xl mb-4">{employer.logo}</div>

              {/* Company Name */}
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {employer.name}
              </h3>

              {/* Verified Badge */}
              {employer.verified && (
                <div className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full mb-3">
                  <span>✓</span> Verified
                </div>
              )}

              {/* Location */}
              <p className="text-sm text-gray-600 mb-4">📍 {employer.location}</p>

              {/* Job Count */}
              <div className="text-sm font-semibold text-[#ea8f1e]">
                {employer.jobCount} jobs open
              </div>
            </div>
          ))}
        </div>

        {/* TODO: Add pagination or "View All Employers" link */}
      </div>
    </section>
  );
}
