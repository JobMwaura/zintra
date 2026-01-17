/**
 * SafetyNote Component - Trust-Building
 * Subtle footer safety banner with reporting CTA
 */

'use client';

import Link from 'next/link';

export default function SafetyNote() {
  return (
    <section className="w-full bg-gray-50 py-10 sm:py-12 border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-3 items-start max-w-4xl">
          <span className="text-lg mt-0.5">🛡️</span>
          
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Safety is our priority.</strong> All profiles are verified. Never pay upfront or share banking details. Suspicious listings? <button className="text-[#ea8f1e] font-semibold hover:underline">Report it</button> or <Link href="/careers/safety" className="text-[#ea8f1e] font-semibold hover:underline">learn more</Link>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
