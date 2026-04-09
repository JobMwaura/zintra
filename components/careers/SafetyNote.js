/**
 * SafetyNote Component - Compact
 * Subtle footer safety banner
 */

'use client';

import Link from 'next/link';

export default function SafetyNote() {
  return (
    <section className="w-full bg-gray-50 py-6 sm:py-8 border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 items-start max-w-4xl">
          <span className="text-base mt-0.5 flex-shrink-0">🛡️</span>
          
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              <strong>Safety is our priority.</strong> All profiles are verified. Never pay upfront or share banking details. <button className="text-[#ea8f1e] font-semibold hover:underline">Report suspicious listings</button> or <Link href="/careers/safety" className="text-[#ea8f1e] font-semibold hover:underline">learn more</Link>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
