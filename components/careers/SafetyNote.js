/**
 * SafetyNote Component - Minimalist
 * Subtle footer safety banner
 */

'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function SafetyNote() {
  return (
    <section className="w-full bg-gray-50 py-8 sm:py-12 border-t border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 items-start">
          {/* Icon */}
          <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />

          {/* Content */}
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <strong>Safety First:</strong> All profiles are verified. Never share banking details or send money outside Zintra.{' '}
              <Link href="/careers/safety" className="text-[#ea8f1e] hover:underline">
                Learn more
              </Link>
              {' '} •{' '}
              <button className="text-[#ea8f1e] hover:underline">
                Report suspicious activity
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
