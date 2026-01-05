'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RfqProvider } from '@/context/RfqContext';
import RFQModal from '@/components/RFQModal/RFQModal';

export default function DirectRFQPage() {
  const [showModal, setShowModal] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering interactive content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = () => {
    setShowModal(false);
  };

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
            <h1 className="text-3xl font-bold text-orange-600">Direct RFQ</h1>
            <div className="w-32" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info section */}
        <div className="mb-12 bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-orange-900 mb-2">Send a Direct RFQ</h2>
          <p className="text-orange-800 mb-4">
            Know exactly which vendor you want? Send them a direct RFQ with all the details they need.
          </p>
          <ul className="space-y-2 text-sm text-orange-800">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Select one or more vendors to contact
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              RFQ sent only to selected vendors
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Private - No public visibility
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Best for known/preferred vendors
            </li>
          </ul>
        </div>

        {/* Modal */}
        {mounted && showModal && (
          <RFQModal
            rfqType="direct"
            isOpen={true}
            onClose={handleClose}
          />
        )}

        {/* No modal state */}
        {mounted && !showModal && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Direct RFQ form closed</p>
            <Link
              href="/post-rfq"
              className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
