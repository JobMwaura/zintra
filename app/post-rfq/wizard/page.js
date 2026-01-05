'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import RFQModal from '@/components/RFQModal/RFQModal';
import { ChevronLeft } from 'lucide-react';

/**
 * Wizard RFQ Page
 * 
 * Entry Point: "Request a Quote" CTA from RFQ hub page
 * 
 * Key Characteristics:
 * - User selects category first (no pre-selection)
 * - Step-by-step guided form
 * - System automatically matches vendors based on category
 * - Vendors are matched by primary or secondary category
 * - Can optionally allow user to select from matched vendors
 * - RFQ is NOT public (sent to matched vendors only)
 */
function WizardRFQContent() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(true);

  const handleModalClose = () => {
    setModalOpen(false);
    // Return to RFQ hub
    setTimeout(() => {
      router.push('/post-rfq');
    }, 300);
  };

  const handleGoBack = () => {
    router.push('/post-rfq');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleGoBack}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to RFQ Options
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wizard Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Request a Quote (Guided)
          </h2>
          <p className="text-gray-600">
            We'll guide you through the process step-by-step. First, select the category that best matches your project, 
            then provide details. We'll automatically send your RFQ to vendors who specialize in that category.
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">How it works:</span> Choose a category → Fill in details → Matched vendors respond
            </p>
          </div>
        </div>

        {/* RFQ Modal - Always Open */}
        {modalOpen && (
          <RFQModal
            rfqType="wizard"
            isOpen={modalOpen}
            onClose={handleModalClose}
            vendorCategories={[]}
            vendorName={null}
            preSelectedCategory={null}
          />
        )}
      </div>
    </div>
  );
}

export default function WizardRFQPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <WizardRFQContent />
    </Suspense>
  );
}
