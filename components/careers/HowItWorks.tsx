/**
 * HowItWorks Component
 * Two-column section showing process for workers and employers
 */

interface WorkflowStep {
  step: number;
  title: string;
  description: string;
}

interface HowItWorksProps {
  workersSteps: WorkflowStep[];
  employersSteps: WorkflowStep[];
}

export default function HowItWorks({
  workersSteps,
  employersSteps,
}: HowItWorksProps) {
  const stepIcons = ["👤", "🔍", "💼"];

  return (
    <section className="w-full py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            How it Works
          </h2>
          <p className="text-gray-600">
            Simple steps to get started on Zintra
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* For Workers */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <span className="text-3xl">👷</span> For Workers
            </h3>

            <div className="space-y-8">
              {workersSteps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  {/* Step Number Circle */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#ea8f1e] text-white font-bold flex items-center justify-center mb-3">
                      {stepIcons[index] || step.step}
                    </div>
                    {index < workersSteps.length - 1 && (
                      <div className="w-1 h-12 bg-gradient-to-b from-[#ea8f1e] to-gray-200"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-4">
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
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <span className="text-3xl">🏢</span> For Employers
            </h3>

            <div className="space-y-8">
              {employersSteps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                  {/* Step Number Circle */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-[#f59e0b] text-white font-bold flex items-center justify-center mb-3">
                      {stepIcons[index] || step.step}
                    </div>
                    {index < employersSteps.length - 1 && (
                      <div className="w-1 h-12 bg-gradient-to-b from-[#f59e0b] to-gray-200"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-4">
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
