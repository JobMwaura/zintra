/**
 * TopRatedTalent Component - Minimalist
 * Grid of top-rated workers
 */

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
    <section className="w-full py-12 sm:py-16 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Top Rated Workers
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((worker, index) => (
            <div
              key={worker.id}
              className="bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors p-4 flex flex-col items-center text-center"
            >
              {/* Avatar */}
              <div
                className={`${getAvatarColor(
                  index
                )} w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold mb-3`}
              >
                {worker.initials}
              </div>

              {/* Name & Role */}
              <h3 className="font-semibold text-gray-900 mb-1">
                {worker.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{worker.role}</p>

              {/* Rating */}
              <div className="flex items-center justify-center gap-1 text-sm mb-3">
                <span>⭐ {worker.rating}</span>
                <span className="text-gray-600">({worker.reviews})</span>
              </div>

              {/* View Profile Button */}
              <button className="w-full px-4 py-2 border border-[#ea8f1e] text-[#ea8f1e] font-medium text-sm rounded hover:bg-[#ea8f1e] hover:text-white transition-colors">
                View Profile
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
