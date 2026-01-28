/**
 * WhyZintra Component - Trust & Differentiators
 * Displays 3 key differentiators that set Zintra apart
 */

'use client';

import { Shield, CheckCircle2, Zap } from 'lucide-react';

const differentiators = [
  {
    icon: Shield,
    title: 'Verified Employers Only',
    description: 'All employers verified with business registration and background checks. No scams, only legitimate work.'
  },
  {
    icon: CheckCircle2,
    title: 'No Upfront Fees',
    description: 'Zero payment required upfront. Get paid securely within 24 hours of work completion.'
  },
  {
    icon: Zap,
    title: 'Fast Payments',
    description: 'Most workers receive payment within 24-48 hours. No lengthy waiting periods.'
  }
];

export default function WhyZintra() {
  return (
    <section className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200 py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Why Join Zintra?
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Built by workers, for workers. The safest way to find construction work in Kenya.
          </p>
        </div>

        {/* 3-Column Grid - Differentiators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {differentiators.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                {/* Icon Circle */}
                <div className="flex items-center justify-center w-14 h-14 bg-orange-100 rounded-full mb-4">
                  <Icon size={28} className="text-[#ea8f1e]" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Supporting Stats */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-[#ea8f1e] mb-1">
                2,400+
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Active Workers
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-[#ea8f1e] mb-1">
                180+
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Verified Employers
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-[#ea8f1e] mb-1">
                650+
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Gigs Completed
              </p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-[#ea8f1e] mb-1">
                KES 50M+
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                Paid to Workers
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
