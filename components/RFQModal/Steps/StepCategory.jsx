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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
          What type of project do you need?
        </h2>
        <p className="text-gray-600 text-sm">
          Help us find the best vendors for your project
        </p>
      </div>

      {/* Category Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-900">
          Project Category <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={`w-full px-4 py-3 text-base border-2 rounded-xl transition-all appearance-none bg-white cursor-pointer focus:outline-none ${
            errors.selectedCategory
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
              : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: '2.5rem'
          }}
        >
          <option value="">Select a category...</option>
          {categories && categories.length > 0 ? (
            categories.map((cat, idx) => (
              <option key={cat.slug || idx} value={cat.slug || cat.label}>
                {cat.icon ? `${cat.icon} ` : ''}{cat.label}
              </option>
            ))
          ) : (
            <option disabled>Loading categories...</option>
          )}
        </select>
        {errors.selectedCategory && (
          <p className="text-sm text-red-600 font-medium">{errors.selectedCategory}</p>
        )}
      </div>

      {/* Job Type Selection (conditional) */}
      {categoryNeedsJobType && selectedCategory && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-900">
            Type of Work <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedJobType}
            onChange={(e) => onJobTypeChange(e.target.value)}
            className={`w-full px-4 py-3 text-base border-2 rounded-xl transition-all appearance-none bg-white cursor-pointer focus:outline-none ${
              errors.selectedJobType
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              paddingRight: '2.5rem'
            }}
          >
            <option value="">Select a job type...</option>
            {jobTypes && jobTypes.length > 0 ? (
              jobTypes.map((jt, idx) => (
                <option key={jt.slug || idx} value={jt.slug || jt.label}>
                  {jt.label}
                </option>
              ))
            ) : (
              <option disabled>Loading job types...</option>
            )}
          </select>
          {errors.selectedJobType && (
            <p className="text-sm text-red-600 font-medium">{errors.selectedJobType}</p>
          )}
        </div>
      )}

      {/* Helpful Info Box */}
      <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className="font-medium text-gray-900">💡 Pro tip:</span> {' '}
          {categoryNeedsJobType && !selectedJobType
            ? 'Select both a category and type of work to see custom questions tailored to your project.'
            : 'Your selections help us match you with the most qualified vendors for your specific needs.'}
        </p>
      </div>
    </div>
  );
}
