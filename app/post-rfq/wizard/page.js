'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RfqProvider } from '@/context/RfqContext';
import RFQModal from '@/components/RFQModal/RFQModal';

export default function WizardRFQPage() {
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
            <h1 className="text-3xl font-bold text-blue-600">Wizard RFQ</h1>
            <div className="w-32" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info section */}
        <div className="mb-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Wizard RFQ - Let Us Find Vendors</h2>
          <p className="text-blue-800 mb-4">
            Not sure which vendors are best for your project? Let our wizard help match you with the right vendors.
          </p>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Describe your project requirements
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Our system matches you with suitable vendors
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Option to add or exclude vendors
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Semi-private visibility (only matched vendors see it)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Great for getting multiple competitive quotes
            </li>
          </ul>
        </div>

        {/* Modal */}
        {mounted && showModal && (
          <RFQModal
            rfqType="wizard"
            isOpen={true}
            onClose={handleClose}
          />
        )}

        {/* No modal state */}
        {mounted && !showModal && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Wizard RFQ form closed</p>
            <Link
              href="/post-rfq"
              className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
