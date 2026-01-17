/**
 * HowItWorks Component - Refined
 * Process guide with stronger visual hierarchy
 */

export default function HowItWorks({ workersSteps, employersSteps }) {
  return (
    <section className="w-full py-20 sm:py-24 border-b border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">
          How It Works
        </h2>
        <p className="text-center text-gray-600 mb-16 text-lg">
          Simple steps to get started on Zintra
        </p>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* For Workers */}
          <div className="bg-white rounded-lg p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-10 flex items-center gap-3">
              <span className="text-3xl">👷</span> For Workers
            </h3>

            <div className="space-y-6">
              {workersSteps.map((step, index) => (
                <div key={step.step} className="flex gap-5">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#ea8f1e] text-white font-bold flex items-center justify-center text-lg">
                      {step.step}
                    </div>
                    {index < workersSteps.length - 1 && (
                      <div className="w-1 h-12 bg-gray-300 mt-4"></div>
                    )}
                  </div>

                  <div className="pb-6 flex-1 pt-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      {step.title}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Employers */}
          <div className="bg-white rounded-lg p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-10 flex items-center gap-3">
              <span className="text-3xl">🏢</span> For Employers
            </h3>

            <div className="space-y-6">
              {employersSteps.map((step, index) => (
                <div key={step.step} className="flex gap-5">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#f59e0b] text-white font-bold flex items-center justify-center text-lg">
                      {step.step}
                    </div>
                    {index < employersSteps.length - 1 && (
                      <div className="w-1 h-12 bg-gray-300 mt-4"></div>
                    )}
                  </div>

                  <div className="pb-6 flex-1 pt-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      {step.title}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
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
