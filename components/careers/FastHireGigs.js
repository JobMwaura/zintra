/**
 * FastHireGigs Component
 * Grid of available gig cards
 */

'use client';

import Link from 'next/link';

export default function FastHireGigs({ gigs }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <section className="w-full py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Fast-Hire Gigs Near You
          </h2>
          <p className="text-gray-600">
            Short-term opportunities ready to start soon
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
            >
              {/* Header Badge */}
              <div className="bg-gradient-to-r from-[#ea8f1e] to-[#f59e0b] px-4 py-3 text-white">
                <h3 className="text-lg font-bold">{gig.role}</h3>
                <p className="text-sm text-orange-50">{gig.employer}</p>
              </div>

              {/* Content */}
              <div className="flex-1 p-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs uppercase font-semibold">
                      Location
                    </p>
                    <p className="text-gray-900 font-medium">📍 {gig.location}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-semibold">
                        Duration
                      </p>
                      <p className="text-gray-900 font-medium">{gig.duration}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-semibold">
                        Start Date
                      </p>
                      <p className="text-gray-900 font-medium">
                        {formatDate(gig.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-500 text-xs uppercase font-semibold">
                      Daily Pay
                    </p>
                    <p className="text-[#ea8f1e] font-bold text-lg">
                      KES {gig.pay.toLocaleString()}
                    </p>
                  </div>

                  <p className="text-gray-600 text-xs">
                    {gig.applicants} people applied
                  </p>
                </div>
              </div>

              {/* Apply Button */}
              <div className="p-4 border-t border-gray-200">
                <button className="w-full px-4 py-2 bg-[#ea8f1e] text-white font-semibold rounded-lg hover:bg-[#d97706] transition-colors">
                  Apply Now
                </button>
              </div>

              {/* TODO: Link to /careers/gigs/[id] detail page */}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
