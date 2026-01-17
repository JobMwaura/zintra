/**
 * FastHireGigs Component - Conversion-Focused
 * High-contrast gig cards with clear hierarchy: role + location + pay first
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
    <section className="w-full py-16 sm:py-20 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Available Gigs
          </h2>
          <Link href="/careers/gigs" className="text-[#ea8f1e] font-semibold hover:underline text-sm">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              className="bg-white rounded-lg border border-gray-300 hover:border-[#ea8f1e] hover:shadow-lg transition-all overflow-hidden flex flex-col"
            >
              {/* Header - Role + Urgency Badge */}
              <div className="bg-[#ea8f1e] px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-base">{gig.role}</h3>
                  <span className="text-xs bg-red-600 px-2 py-1 rounded font-semibold">Urgent</span>
                </div>
                <p className="text-sm text-orange-100">{gig.employer}</p>
              </div>

              {/* Key Info - Location + Pay + Duration */}
              <div className="flex-1 p-5 space-y-3 text-sm">
                {/* Location - Primary */}
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">📍 Location</p>
                  <p className="font-semibold text-gray-900">{gig.location}</p>
                </div>

                {/* Pay - High Emphasis */}
                <div className="bg-orange-50 border-l-4 border-[#ea8f1e] pl-3 py-2">
                  <p className="text-gray-500 text-xs font-bold uppercase mb-1">Daily Rate</p>
                  <p className="font-bold text-[#ea8f1e] text-lg">KES {gig.pay.toLocaleString()}</p>
                </div>

                {/* Duration + Start Date - Secondary */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500 font-bold uppercase mb-0.5">Duration</p>
                    <p className="text-gray-700">{gig.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-bold uppercase mb-0.5">Starts</p>
                    <p className="text-gray-700">{formatDate(gig.startDate)}</p>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="p-5 border-t border-gray-200">
                <button className="w-full px-4 py-3 bg-[#ea8f1e] text-white font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm">
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
