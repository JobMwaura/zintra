/**
 * HowItWorks Component - Minimalist
 * Simple two-column process guide
 */

export default function HowItWorks({ workersSteps, employersSteps }) {
  return (
    <section className="w-full py-12 sm:py-16 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
          How It Works
        </h2>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* For Workers */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6">👷 For Workers</h3>

            <div className="space-y-4">
              {workersSteps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#ea8f1e] text-white font-bold flex items-center justify-center text-sm">
                      {step.step}
                    </div>
                    {index < workersSteps.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-300"></div>
                    )}
                  </div>

                  <div className="pb-4 flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Employers */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-6">🏢 For Employers</h3>

            <div className="space-y-4">
              {employersSteps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white font-bold flex items-center justify-center text-sm">
                      {step.step}
                    </div>
                    {index < employersSteps.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-300"></div>
                    )}
                  </div>

                  <div className="pb-4 flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
