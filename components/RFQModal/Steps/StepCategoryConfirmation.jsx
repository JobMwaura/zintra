'use client';

import { CheckCircle, ChevronRight } from 'lucide-react';

export default function StepCategoryConfirmation({
  vendorName,
  vendorCategory,
  onConfirm,
  onChangeCategory
}) {
  if (!vendorCategory) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Complete Your Profile
          </h2>
          <p className="text-gray-600">
            Please specify a category for this RFQ
          </p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">⚠️ Vendor Profile Incomplete:</span> This vendor 
            hasn't specified their primary category yet. You can still send a general RFQ, but 
            responses may take longer.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
          >
            <span>Send General RFQ</span>
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={onChangeCategory}
            className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:border-gray-400 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Request Quote for {vendorName}
        </h2>
        <p className="text-gray-600">
          Confirm the category for this RFQ request
        </p>
      </div>

      {/* Category Confirmation Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-500 text-white shadow-md">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-blue-900">
              Primary Category Selected
            </h3>
            <p className="text-blue-800 mt-3 text-lg font-bold">
              {vendorCategory}
            </p>
            <p className="text-blue-700 text-sm mt-3 leading-relaxed">
              This is <span className="font-semibold">{vendorName}</span>'s primary area of 
              expertise. Your RFQ will be specifically tailored for this category, which helps 
              ensure you receive accurate, relevant quotes.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onConfirm}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 group"
        >
          <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>✓ Continue with {vendorCategory}</span>
        </button>

        <button
          onClick={onChangeCategory}
          className="w-full border-2 border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <ChevronRight className="w-5 h-5 transform rotate-180" />
          <span>← Change Category</span>
        </button>
      </div>

      {/* Helpful Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">💡 Tip:</span> Sending RFQs to vendors in their 
          area of expertise typically results in 40% faster responses and higher quality quotes.
        </p>
      </div>

      {/* Divider for visual clarity */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      {/* Alternative Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Need a different category?</span> Some vendors 
          offer multiple services. Click "Change Category" to explore other options.
        </p>
      </div>
    </div>
  );
}
