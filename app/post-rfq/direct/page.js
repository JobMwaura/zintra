'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import RFQModal from '@/components/RFQModal/RFQModal';
import { ChevronLeft } from 'lucide-react';

/**
 * Direct RFQ Page
 * 
 * Entry Point: RFQ Hub / Direct RFQ CTA ("Send RFQ to vendors")
 * 
 * Key Characteristics:
 * - User selects category first
 * - User then selects vendors (1+) from filtered list
 * - RFQ is PRIVATE (sent only to selected vendors)
 * - Modal opens fresh with no pre-selections
 */
function DirectRFQContent() {
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
            className="flex items-center text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to RFQ Hub
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <>
          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Send RFQ to Your Chosen Vendors
            </h2>
            <p className="text-gray-600">
              Select a category, fill out the form with your project details, then choose which vendors you'd like to send this RFQ to.
            </p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">How it works:</span> You choose the category and vendors. Your RFQ is private and sent only to the vendors you select.
              </p>
            </div>
          </div>

          {/* RFQ Modal - Always Open */}
          {modalOpen && (
            <RFQModal
              rfqType="direct"
              isOpen={modalOpen}
              onClose={handleModalClose}
              vendorCategories={[]}
              vendorName={null}
              preSelectedCategory={null}
            />
          )}
        </>
      </div>
    </div>
  );
}

export default function DirectRFQPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <DirectRFQContent />
    </Suspense>
  );
}
