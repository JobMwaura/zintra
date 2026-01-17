/**
 * FeaturedEmployers Component - Minimalist
 * Clean grid of employer cards
 */

export default function FeaturedEmployers({ employers }) {
  return (
    <section className="w-full py-12 sm:py-16 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Featured Employers
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employers.map((employer) => (
            <div
              key={employer.id}
              className="bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors p-4"
            >
              {/* Logo */}
              <div className="text-3xl mb-3">{employer.logo}</div>

              {/* Company Name */}
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                {employer.name}
              </h3>

              {/* Verified Badge */}
              {employer.verified && (
                <div className="inline-flex items-center gap-1 text-xs font-medium text-green-700 mb-2">
                  <span>✓</span> Verified
                </div>
              )}

              {/* Details */}
              <div className="text-sm text-gray-600 space-y-1">
                <p>📍 {employer.location}</p>
                <p className="font-medium text-[#ea8f1e]">{employer.jobCount} jobs open</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
