'use client';

import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

export default function ModalFooter({ 
  currentStep, 
  steps, 
  onBack, 
  onNext, 
  onSubmit, 
  loading,
  isValid 
}) {
  const stepIndex = steps.findIndex(s => s.name.toLowerCase() === currentStep);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;
  const isReviewStep = currentStep === 'review';

  return (
    <div className="border-t border-gray-200 px-6 py-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Left: Back Button */}
      <button
        onClick={onBack}
        disabled={isFirstStep}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isFirstStep
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        aria-label="Go to previous step"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Center: Step Counter */}
      <div className="text-xs sm:text-sm text-gray-500">
        Step {stepIndex + 1} of {steps.length}
      </div>

      {/* Right: Next or Submit Button */}
      <button
        onClick={isReviewStep ? onSubmit : onNext}
        disabled={loading || !isValid}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          loading || !isValid
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-orange-600 text-white hover:bg-orange-700'
        }`}
        aria-label={isReviewStep ? 'Submit RFQ' : 'Go to next step'}
      >
        <span className="hidden sm:inline">
          {isReviewStep ? 'Submit' : 'Next'}
        </span>
        <span className="sm:hidden">
          {isReviewStep ? 'Submit' : 'Next'}
        </span>
        {loading ? (
          <div className="w-4 h-4 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
        ) : isReviewStep ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <ArrowRight className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
