/**
 * TopRatedTalent Component - Compact
 * Compact worker cards emphasizing role + county + rating
 */

import Link from 'next/link';

export default function TopRatedTalent({ workers }) {
  const getAvatarColor = (index) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <section className="w-full py-8 sm:py-10 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Top Rated Workers
          </h2>
          <Link href="/careers/talent" className="text-[#ea8f1e] font-semibold hover:underline text-xs sm:text-sm">
            Browse all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((worker, index) => (
            <div
              key={worker.id}
              className="bg-white rounded border border-gray-300 hover:border-[#ea8f1e] hover:shadow-md transition-all p-4 flex flex-col"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(249, 115, 22, 0.05) 0px, rgba(249, 115, 22, 0.05) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(249, 115, 22, 0.05) 0px, rgba(249, 115, 22, 0.05) 1px, transparent 1px, transparent 3px)'
              }}
            >
              {/* Avatar + Name + Role */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`${getAvatarColor(
                    index
                  )} w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}
                >
                  {worker.initials}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm mb-0.5">
                    {worker.name}
                  </h3>
                  <p className="text-xs text-gray-700 font-semibold">{worker.role}</p>
                </div>
              </div>

              {/* County + Rating - Key Info */}
              <div className="space-y-2 mb-3 flex-1">
                <div>
                  <p className="text-gray-500 text-xs font-bold mb-0.5">Location</p>
                  <p className="text-xs font-medium text-gray-900">{worker.county}</p>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-sm">⭐</span>
                  <span className="font-bold text-gray-900 text-sm">{worker.rating}</span>
                  <span className="text-xs text-gray-600">({worker.reviews})</span>
                </div>
              </div>

              {/* View Profile Button */}
              <button className="w-full py-1.5 text-xs border-2 border-[#ea8f1e] text-[#ea8f1e] font-bold rounded hover:bg-orange-50 transition-colors">
                View Profile
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
