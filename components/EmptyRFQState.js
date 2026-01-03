'use client';

/**
 * Improved Empty State Component
 * 
 * Shows friendly, actionable message when user has no RFQs
 */

import { Rocket, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function EmptyRFQState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
          <Rocket className="w-8 h-8 text-orange-600" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Ready to Get Quotes?
        </h2>

        {/* Description */}
        <p className="text-slate-600 mb-6 text-sm">
          Post your first request for quotation and let vendors compete to win your project. 
          Get quality quotes in as little as 24 hours.
        </p>

        {/* Features List */}
        <ul className="text-left space-y-3 mb-8 bg-slate-50 rounded-lg p-4">
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span className="text-sm text-slate-700">Compare quotes from multiple vendors</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span className="text-sm text-slate-700">See vendor ratings and reviews upfront</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-600 font-bold mt-0.5">✓</span>
            <span className="text-sm text-slate-700">Save time on vendor search and negotiation</span>
          </li>
        </ul>

        {/* Primary CTA */}
        <Link href="/post-rfq">
          <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition mb-3">
            Create Your First RFQ
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>

        {/* Secondary CTA */}
        <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
          Learn how RFQs work →
        </button>
      </div>
    </div>
  );
}
