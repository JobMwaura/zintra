'use client';

import { useState, useEffect, useCallback } from 'react';
import UniversalRFQModal from './UniversalRFQModal';
import { getRFQTemplate } from '@/lib/rfqTemplates';

/**
 * RFQ Modal Dispatcher Component
 * 
 * Intelligent component that:
 * 1. Loads the correct RFQ template based on selected category
 * 2. Routes to UniversalRFQModal for rendering
 * 3. Handles template loading and error states
 * 4. Manages form submission with proper data structure
 * 
 * Props:
 *   isOpen: Boolean to show/hide modal
 *   categorySlug: Category slug to load (e.g., 'architectural_design')
 *   vendorId: Optional vendor ID for attribution
 *   onClose: Callback when modal closes
 *   onSubmit: Callback when form submits (receives formData with category info)
 * 
 * Usage:
 *   <RFQModalDispatcher
 *     isOpen={showRFQ}
 *     categorySlug="architectural_design"
 *     onClose={handleClose}
 *     onSubmit={handleSubmit}
 *   />
 */
export default function RFQModalDispatcher({
  isOpen = false,
  categorySlug,
  vendorId,
  onClose = () => {},
  onSubmit = async () => {},
}) {
  const [template, setTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load template when categorySlug changes
   */
  useEffect(() => {
    if (!isOpen || !categorySlug) {
      setTemplate(null);
      return;
    }

    const loadTemplate = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedTemplate = await getRFQTemplate(categorySlug);
        setTemplate(loadedTemplate);
      } catch (err) {
        setError(err.message || 'Failed to load RFQ template. Please try again.');
        console.error('Error loading RFQ template:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [isOpen, categorySlug]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (formData) => {
      try {
        // Call the parent onSubmit with enriched data
        await onSubmit({
          ...formData,
          categorySlug,
          templateVersion: template?.templateVersion,
          submittedAt: new Date().toISOString(),
        });

        // Close modal on successful submission
        onClose();
      } catch (err) {
        console.error('Error submitting RFQ:', err);
        throw err;
      }
    },
    [onSubmit, categorySlug, template, onClose]
  );

  // Don't render if modal is not open
  if (!isOpen) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-700">Loading RFQ template...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Template</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the modal with loaded template
  if (template) {
    return (
      <UniversalRFQModal
        template={template}
        categorySlug={categorySlug}
        vendorId={vendorId}
        onClose={onClose}
        onSubmit={handleSubmit}
      />
    );
  }

  return null;
}
