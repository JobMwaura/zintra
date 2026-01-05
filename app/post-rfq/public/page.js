'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import RFQModal from '@/components/RFQModal/RFQModal';
import { ChevronLeft, Globe } from 'lucide-react';

/**
 * Public RFQ Page
 * 
 * Entry Point: "Post Public RFQ" CTA from RFQ hub page
 * 
 * Key Characteristics:
 * - User posts RFQ publicly to the marketplace
 * - Category determines which vendors see it
 * - Vendors with matching primary/secondary categories can browse and respond
 * - All vendors can see public RFQs (but only relevant ones in their feed)
 * - Competitive quotes - multiple vendors can submit
 * - Public visibility - RFQ is discoverable on the platform
 */
function PublicRFQContent() {
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
            className="flex items-center text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to RFQ Options
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Public RFQ Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-100">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Post a Public RFQ
              </h2>
              <p className="text-gray-600">
                Post your project publicly on our marketplace and let qualified vendors compete for your business. 
                You'll receive multiple quotes and can compare options before deciding.
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-green-600 font-bold">✓</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Competitive Quotes</p>
                  <p className="text-gray-600 text-sm">Multiple vendors submit bids</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-green-600 font-bold">✓</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Easy Comparison</p>
                  <p className="text-gray-600 text-sm">Compare vendors side-by-side</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-green-600 font-bold">✓</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Best Price Discovery</p>
                  <p className="text-gray-600 text-sm">Find the best deal for your project</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-green-600 font-bold">✓</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Vendor Reviews</p>
                  <p className="text-gray-600 text-sm">Make informed decisions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-semibold">Public visibility:</span> Vendors in your chosen category will see your RFQ
            </p>
          </div>
        </div>

        {/* RFQ Modal - Always Open */}
        {modalOpen && (
          <RFQModal
            rfqType="public"
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

export default function PublicRFQPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <PublicRFQContent />
    </Suspense>
  );
}
