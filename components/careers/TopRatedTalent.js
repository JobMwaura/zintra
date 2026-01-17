/**
 * TopRatedTalent Component - Conversion-Focused
 * Worker cards emphasizing role + county + rating
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
    <section className="w-full py-16 sm:py-20 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Top Rated Workers
          </h2>
          <Link href="/careers/talent" className="text-[#ea8f1e] font-semibold hover:underline text-sm">
            Browse all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {workers.map((worker, index) => (
            <div
              key={worker.id}
              className="bg-white rounded-lg border border-gray-300 hover:border-[#ea8f1e] hover:shadow-md transition-all p-5 flex flex-col"
            >
              {/* Avatar + Name + Role */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`${getAvatarColor(
                    index
                  )} w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}
                >
                  {worker.initials}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">
                    {worker.name}
                  </h3>
                  <p className="text-sm text-gray-700 font-semibold">{worker.role}</p>
                </div>
              </div>

              {/* County + Rating - Key Info */}
              <div className="space-y-3 mb-4 flex-1">
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">📍 Location</p>
                  <p className="text-sm font-medium text-gray-900">{worker.county}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-yellow-400">⭐</div>
                  <span className="font-bold text-gray-900">{worker.rating}</span>
                  <span className="text-xs text-gray-600">({worker.reviews} reviews)</span>
                </div>
              </div>

              {/* View Profile Button */}
              <button className="w-full py-3 border-2 border-[#ea8f1e] text-[#ea8f1e] font-bold rounded-lg hover:bg-orange-50 transition-colors text-sm">
                View Profile
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
