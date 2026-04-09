/**
 * HowItWorks Component - Compact
 * Process guide with optimized spacing
 */

export default function HowItWorks({ workersSteps, employersSteps }) {
  return (
    <section className="w-full py-10 sm:py-12 border-b border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center">
          How It Works
        </h2>
        <p className="text-center text-gray-600 mb-10 text-sm">
          Simple steps to get started on Zintra
        </p>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* For Workers */}
          <div className="bg-white rounded p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>👷</span> For Workers
            </h3>

            <div className="space-y-4">
              {workersSteps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#ea8f1e] text-white font-bold flex items-center justify-center text-sm">
                      {step.step}
                    </div>
                    {index < workersSteps.length - 1 && (
                      <div className="w-1 h-8 bg-gray-300 mt-2"></div>
                    )}
                  </div>

                  <div className="pb-4 flex-1 pt-0.5">
                    <h4 className="text-base font-bold text-gray-900 mb-1">
                      {step.title}
                    </h4>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Employers */}
          <div className="bg-white rounded p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>🏢</span> For Employers
            </h3>

            <div className="space-y-4">
              {employersSteps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white font-bold flex items-center justify-center text-sm">
                      {step.step}
                    </div>
                    {index < employersSteps.length - 1 && (
                      <div className="w-1 h-8 bg-gray-300 mt-2"></div>
                    )}
                  </div>

                  <div className="pb-4 flex-1 pt-0.5">
                    <h4 className="text-base font-bold text-gray-900 mb-1">
                      {step.title}
                    </h4>
                    <p className="text-gray-600 text-xs leading-relaxed">
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
