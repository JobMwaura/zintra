'use client';

import { CheckCircle, ArrowRight } from 'lucide-react';

export default function StepSuccess({ rfqType, rfqId, onClose, recipientCount }) {
  return (
    <div className="text-center space-y-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          RFQ Created Successfully!
        </h3>
        <p className="text-gray-600 text-sm sm:text-base">
          Your RFQ has been submitted and is now active.
        </p>
      </div>

      {/* RFQ ID */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-xs sm:text-sm text-gray-600 mb-1">RFQ ID:</p>
        <p className="text-sm sm:text-base font-mono font-bold text-orange-600">
          {rfqId}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Save this ID for your records
        </p>
      </div>

      {/* Type-Specific Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
        {rfqType === 'direct' && (
          <div>
            <p className="font-medium text-blue-900 mb-2">
              ✓ Sent to {recipientCount} vendor{recipientCount !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-blue-800">
              The vendors you selected have been notified and can start submitting responses.
            </p>
          </div>
        )}

        {rfqType === 'wizard' && (
          <div>
            <p className="font-medium text-blue-900 mb-2">
              ✓ Open to vendors{recipientCount > 0 ? ` (+ ${recipientCount} pre-selected)` : ''}
            </p>
            <p className="text-sm text-blue-800">
              Matching vendors can see and respond to your RFQ.
            </p>
          </div>
        )}

        {rfqType === 'public' && (
          <div>
            <p className="font-medium text-blue-900 mb-2">
              ✓ Listed publicly
            </p>
            <p className="text-sm text-blue-800">
              Your RFQ is visible to qualifying vendors in your selected scope.
            </p>
          </div>
        )}

        {rfqType === 'vendor-request' && (
          <div>
            <p className="font-medium text-blue-900 mb-2">
              ✓ Sent directly to vendor
            </p>
            <p className="text-sm text-blue-800">
              The vendor has been notified via email and in-app notification. They can now review your request and submit a quote.
            </p>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="text-left space-y-2 bg-gray-50 rounded-lg p-4">
        <p className="font-medium text-gray-900 text-sm">What's next?</p>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• You'll see a confirmation in your notifications</li>
          <li>• Vendors will receive an email and in-app notification</li>
          <li>• You'll be notified when vendors submit quotes</li>
          <li>• Compare quotes in your <a href="/my-rfqs" className="text-orange-600 underline font-medium">My RFQs</a> dashboard</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="pt-4 space-y-3">
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-gray-500">
        Questions? Check our help center or contact support.
      </p>
    </div>
  );
}
