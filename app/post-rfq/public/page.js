'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RfqProvider } from '@/context/RfqContext';
import PublicRFQModalWrapper from '@/components/PublicRFQModalWrapper';

export default function PublicRFQPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <RfqProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/post-rfq"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to RFQ Types
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-green-600">Public RFQ</h1>
              <div className="w-32" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!submitted ? (
            <>
              {/* Info section */}
              <div className="mb-12 bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-green-900 mb-2">Public RFQ - Open to All Vendors</h2>
                <p className="text-green-800 mb-4">
                  Reach the widest vendor network. Your RFQ will be visible to any vendor who matches your scope.
                </p>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Publicly visible to relevant vendors
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    No pre-selected vendors needed
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Any qualified vendor can submit a quote
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Category-based form tailored to your project
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Best for accessing a larger vendor pool
                  </li>
                </ul>
              </div>

              {/* Modal */}
              <PublicRFQModalWrapper onSuccess={() => setSubmitted(true)} />
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">RFQ Posted Successfully!</h2>
                <p className="text-gray-600 mb-6">
                  Your public RFQ is now visible to relevant vendors. You can expect responses soon.
                </p>
              </div>
              <Link
                href="/post-rfq"
                className="inline-block px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Create Another RFQ
              </Link>
            </div>
          )}
        </div>
      </div>
    </RfqProvider>
  );
}
