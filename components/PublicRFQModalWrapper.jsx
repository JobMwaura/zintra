'use client';

import { useState, useEffect } from 'react';
import PublicRFQModal from './PublicRFQModal';

/**
 * PublicRFQModalWrapper
 * Wraps the PublicRFQModal component to manage its open/close state
 * and handle success callbacks. This ensures the beautiful category-based
 * RFQ form displays properly.
 */
export default function PublicRFQModalWrapper({ onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration check - ensure component is mounted before opening
  useEffect(() => {
    setIsHydrated(true);
    // Auto-open the modal when component mounts
    setIsOpen(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <PublicRFQModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSuccess={onSuccess}
    />
  );
}
