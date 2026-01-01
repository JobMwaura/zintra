'use client';

import { X } from 'lucide-react';

export default function ModalHeader({ rfqType, onClose }) {
  const titles = {
    direct: 'Create Direct RFQ',
    wizard: 'Create Guided RFQ',
    public: 'Create Public RFQ'
  };

  return (
    <div className="border-b border-gray-200 px-6 py-4 sm:px-8 flex items-center justify-between">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {titles[rfqType] || 'Create RFQ'}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {rfqType === 'direct' && 'Send directly to specific vendors'}
          {rfqType === 'wizard' && 'Suggest vendors but accept open responses'}
          {rfqType === 'public' && 'Open to all matching vendors'}
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close modal"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}
