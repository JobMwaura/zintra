'use client';

export default function StepCategory({
  selectedCategory,
  selectedJobType,
  categories,
  jobTypes,
  categoryNeedsJobType,
  onCategoryChange,
  onJobTypeChange,
  errors
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What type of project do you need?
        </h3>

        {/* Category Selection */}
        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.selectedCategory
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
          >
            <option value="">Select a category...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.selectedCategory && (
            <p className="text-sm text-red-600">{errors.selectedCategory}</p>
          )}
        </div>

        {/* Job Type Selection (conditional) */}
        {categoryNeedsJobType && selectedCategory && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              What type of work? *
            </label>
            <select
              value={selectedJobType}
              onChange={(e) => onJobTypeChange(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.selectedJobType
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            >
              <option value="">Select a job type...</option>
              {jobTypes.map(jt => (
                <option key={jt.id} value={jt.id}>
                  {jt.name}
                </option>
              ))}
            </select>
            {errors.selectedJobType && (
              <p className="text-sm text-red-600">{errors.selectedJobType}</p>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          {categoryNeedsJobType && !selectedJobType
            ? 'Select both a category and job type to proceed.'
            : 'Your selections help us show the most relevant vendors and custom questions.'}
        </p>
      </div>
    </div>
  );
}
