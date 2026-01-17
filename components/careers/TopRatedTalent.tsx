/**
 * TopRatedTalent Component
 * Grid of top-rated workers/vendors
 */

interface Worker {
  id: number;
  name: string;
  initials: string;
  role: string;
  county: string;
  rating: number;
  reviews: number;
  toolsReady: boolean;
}

interface TopRatedTalentProps {
  workers: Worker[];
}

export default function TopRatedTalent({ workers }: TopRatedTalentProps) {
  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <section className="w-full bg-gray-50 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Top Rated Workers & Vendors
          </h2>
          <p className="text-gray-600">
            Skilled professionals verified and trusted by employers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((worker, index) => (
            <div
              key={worker.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow p-6 flex flex-col items-center text-center"
            >
              {/* Avatar */}
              <div
                className={`${getAvatarColor(
                  index
                )} w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4`}
              >
                {worker.initials}
              </div>

              {/* Name & Role */}
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {worker.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{worker.role}</p>

              {/* County */}
              <p className="text-sm text-gray-500 mb-4">📍 {worker.county}</p>

              {/* Rating */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="text-yellow-400">⭐</div>
                <span className="font-bold text-gray-900">{worker.rating}</span>
                <span className="text-sm text-gray-600">
                  ({worker.reviews} reviews)
                </span>
              </div>

              {/* Tools Ready Badge */}
              {worker.toolsReady && (
                <div className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full mb-4">
                  <span>🛠️</span> Tools Ready
                </div>
              )}

              {/* View Profile Button */}
              <button className="w-full px-4 py-2 border-2 border-[#ea8f1e] text-[#ea8f1e] font-semibold rounded-lg hover:bg-[#ea8f1e] hover:text-white transition-colors">
                View Profile
              </button>

              {/* TODO: Link to /careers/talent/[id] profile page */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
