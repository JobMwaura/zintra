'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Navbar from '@/components/Navbar';
import RFQModal from '@/components/RFQModal/RFQModal';
import { ChevronLeft, AlertCircle } from 'lucide-react';

/**
 * Direct RFQ Page
 * 
 * Entry Point: Vendor profile "Request Quote" button
 * Query Parameters:
 * - vendorId: The vendor ID to send the RFQ to
 * 
 * Key Characteristics:
 * - Category is LOCKED to vendor's primary category
 * - Vendor is PRE-SELECTED (recipient is determined)
 * - RFQ is PRIVATE (only visible to user and vendor)
 * - Modal opens automatically with vendor details
 */
function DirectRFQContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = searchParams.get('vendorId');

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(true);

  /**
   * Load vendor details to get primary category
   */
  useEffect(() => {
    if (!vendorId) {
      setError('No vendor specified. Please select a vendor to send an RFQ to.');
      setLoading(false);
      return;
    }

    const loadVendor = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('vendors')
          .select('id, name, primary_category, categories, email, phone, location')
          .eq('id', vendorId)
          .single();

        if (fetchError) {
          setError(`Failed to load vendor: ${fetchError.message}`);
          setVendor(null);
          return;
        }

        if (!data) {
          setError('Vendor not found. Please go back and try again.');
          setVendor(null);
          return;
        }

        setVendor(data);
      } catch (err) {
        setError(`Error loading vendor: ${err.message}`);
        setVendor(null);
      } finally {
        setLoading(false);
      }
    };

    loadVendor();
  }, [vendorId]);

  const handleModalClose = () => {
    setModalOpen(false);
    // Return to vendor profile
    setTimeout(() => {
      router.back();
    }, 300);
  };

  const handleGoBack = () => {
    router.back();
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
            Back to Vendor Profile
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading vendor details...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-md border-l-4 border-red-500 p-6">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Error</h3>
                <p className="text-gray-600 mt-1">{error}</p>
                <button
                  onClick={handleGoBack}
                  className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        ) : vendor ? (
          <>
            {/* Vendor Info Card */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Request a Quote from {vendor.name}
              </h2>
              <p className="text-gray-600">
                Fill out the form below to send a customized RFQ to this vendor. Your request will be category-specific 
                based on their primary expertise.
              </p>
              {vendor.primary_category && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Category:</span> {vendor.primary_category}
                  </p>
                </div>
              )}
            </div>

            {/* RFQ Modal - Always Open */}
            {modalOpen && (
              <RFQModal
                rfqType="direct"
                isOpen={modalOpen}
                onClose={handleModalClose}
                vendorCategories={vendor.primary_category ? [vendor.primary_category] : []}
                vendorName={vendor.name}
                preSelectedCategory={vendor.primary_category}
              />
            )}
          </>
        ) : null}
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
