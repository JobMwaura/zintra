/**
 * FastHireGigs Component - Compact High-Impact
 * Compressed gig cards with inline meta + prominent pay
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCandidateRedirectPath } from '@/lib/auth-helpers';

export default function FastHireGigs({ gigs }) {
  const router = useRouter();

  const handleApply = async (gigId) => {
    const redirectPath = await getCandidateRedirectPath(gigId, 'gig');
    router.push(redirectPath);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <section className="w-full py-8 sm:py-10 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Available Gigs
          </h2>
          <Link href="/careers/gigs" className="text-[#ea8f1e] font-semibold hover:underline text-xs sm:text-sm">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              className="bg-white rounded border border-gray-300 hover:border-[#ea8f1e] hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              {/* Header - Role + Urgency */}
              <div className="bg-[#ea8f1e] px-3 py-3 text-white">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <h3 className="font-bold text-sm">{gig.role}</h3>
                  <span className="text-xs bg-red-600 px-1.5 py-0.5 rounded font-semibold">Urgent</span>
                </div>
                <p className="text-xs text-orange-100">{gig.employer}</p>
              </div>

              {/* Compact Meta + Pay */}
              <div className="flex-1 p-3 space-y-2 text-xs">
                {/* Single line meta */}
                <p className="text-gray-600 font-medium">
                  {gig.location} • {gig.duration} • Starts {formatDate(gig.startDate)}
                </p>

                {/* Pay - High Emphasis */}
                <div className="bg-orange-50 border-l-4 border-[#ea8f1e] pl-2 py-1.5">
                  <p className="text-gray-500 text-xs font-bold">Daily Rate</p>
                  <p className="font-bold text-[#ea8f1e] text-base">KES {gig.pay.toLocaleString()}</p>
                </div>
              </div>

              {/* Apply Button */}
              <div className="p-3 border-t border-gray-200">
                <button 
                  onClick={() => handleApply(gig.id)}
                  className="w-full px-3 py-1.5 bg-[#ea8f1e] text-white font-bold rounded hover:bg-[#d97706] transition-colors text-xs"
                >
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
