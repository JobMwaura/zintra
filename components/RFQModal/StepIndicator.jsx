'use client';

import { Check } from 'lucide-react';

export default function StepIndicator({ currentStep, steps }) {
  const currentStepIndex = steps.findIndex(s => s.name.toLowerCase() === currentStep);

  return (
    <div className="bg-gray-50 px-6 py-4 sm:px-8">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <div
              className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-colors ${
                index < currentStepIndex
                  ? 'bg-green-100 text-green-700'
                  : index === currentStepIndex
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index < currentStepIndex ? (
                <Check className="w-5 h-5" />
              ) : (
                step.number
              )}
            </div>

            {/* Step Label (hidden on small screens) */}
            <div className="hidden sm:block ml-2">
              <p className={`text-xs font-medium ${
                index === currentStepIndex
                  ? 'text-gray-900'
                  : 'text-gray-600'
              }`}>
                {step.name}
              </p>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 sm:mx-3 rounded transition-colors ${
                  index < currentStepIndex
                    ? 'bg-green-100'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
