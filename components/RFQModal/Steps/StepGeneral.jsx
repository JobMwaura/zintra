'use client';

export default function StepGeneral({
  formData,
  onFieldChange,
  errors
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Project Details
        </h3>

        <div className="space-y-4">
          {/* Project Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title
            </label>
            <input
              type="text"
              value={formData.projectTitle || ''}
              onChange={(e) => onFieldChange('projectTitle', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.projectTitle ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="e.g., Home Kitchen Renovation"
            />
            {errors.projectTitle && (
              <p className="text-sm text-red-600 mt-1">{errors.projectTitle}</p>
            )}
          </div>

          {/* Project Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Summary
            </label>
            <textarea
              value={formData.projectSummary || ''}
              onChange={(e) => onFieldChange('projectSummary', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.projectSummary ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Describe your project in detail..."
            />
            {errors.projectSummary && (
              <p className="text-sm text-red-600 mt-1">{errors.projectSummary}</p>
            )}
          </div>

          {/* County */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              County *
            </label>
            <input
              type="text"
              value={formData.county || ''}
              onChange={(e) => onFieldChange('county', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.county ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter county"
            />
            {errors.county && (
              <p className="text-sm text-red-600 mt-1">{errors.county}</p>
            )}
          </div>

          {/* Town */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Town/City *
            </label>
            <input
              type="text"
              value={formData.town || ''}
              onChange={(e) => onFieldChange('town', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.town ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter town or city"
            />
            {errors.town && (
              <p className="text-sm text-red-600 mt-1">{errors.town}</p>
            )}
          </div>

          {/* Directions (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Directions (Optional)
            </label>
            <textarea
              value={formData.directions || ''}
              onChange={(e) => onFieldChange('directions', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Add any directions or special access instructions..."
            />
          </div>

          {/* Budget Min */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Min ($) *
              </label>
              <input
                type="number"
                value={formData.budgetMin || ''}
                onChange={(e) => onFieldChange('budgetMin', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.budgetMin ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Minimum budget"
              />
              {errors.budgetMin && (
                <p className="text-sm text-red-600 mt-1">{errors.budgetMin}</p>
              )}
            </div>

            {/* Budget Max */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Max ($) *
              </label>
              <input
                type="number"
                value={formData.budgetMax || ''}
                onChange={(e) => onFieldChange('budgetMax', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.budgetMax ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Maximum budget"
              />
              {errors.budgetMax && (
                <p className="text-sm text-red-600 mt-1">{errors.budgetMax}</p>
              )}
            </div>
          </div>

          {/* Desired Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desired Start Date
            </label>
            <input
              type="date"
              value={formData.desiredStartDate || ''}
              onChange={(e) => onFieldChange('desiredStartDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
