/**
 * FastHireGigs Component - Minimalist
 * Simple grid of available gig cards
 */

'use client';

import Link from 'next/link';

export default function FastHireGigs({ gigs }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <section className="w-full py-12 sm:py-16 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Available Gigs
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              className="bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-[#ea8f1e] px-4 py-3 text-white">
                <h3 className="font-bold text-sm">{gig.role}</h3>
                <p className="text-xs text-orange-100">{gig.employer}</p>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 space-y-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs font-semibold">📍 Location</p>
                  <p className="text-gray-900">{gig.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">Duration</p>
                    <p className="text-gray-900">{gig.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-semibold">Start</p>
                    <p className="text-gray-900">{formatDate(gig.startDate)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-[#ea8f1e] font-bold text-base">
                    KES {gig.pay.toLocaleString()}/day
                  </p>
                </div>
              </div>

              {/* Apply Button */}
              <div className="p-4 border-t border-gray-200">
                <button className="w-full px-4 py-2 bg-[#ea8f1e] text-white font-medium text-sm rounded hover:opacity-90 transition-opacity">
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
