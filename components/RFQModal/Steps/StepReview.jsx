'use client';

export default function StepReview({
  rfqType,
  formData,
  templateFieldsMetadata,
  vendors
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Review Your RFQ
        </h3>

        {/* Category Info */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Project Type</h4>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-600">Category:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formData.selectedCategory}
              </span>
            </p>
            {formData.selectedJobType && (
              <p>
                <span className="text-gray-600">Job Type:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formData.selectedJobType}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Template Fields */}
        {templateFieldsMetadata && templateFieldsMetadata.length > 0 && Object.keys(formData.templateFields || {}).length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Details</h4>
            <div className="space-y-2 text-sm">
              {templateFieldsMetadata.map(field => {
                const value = formData.templateFields[field.name];
                if (!value) return null;
                return (
                  <p key={field.name}>
                    <span className="text-gray-600">{field.label}:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Project Information</h4>
          <div className="space-y-2 text-sm">
            {formData.projectTitle && (
              <p>
                <span className="text-gray-600">Title:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formData.projectTitle}
                </span>
              </p>
            )}
            {formData.projectSummary && (
              <p>
                <span className="text-gray-600">Summary:</span>
                <span className="ml-2 text-gray-900">
                  {formData.projectSummary}
                </span>
              </p>
            )}
            <p>
              <span className="text-gray-600">Location:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formData.town}, {formData.county}
              </span>
            </p>
            <p>
              <span className="text-gray-600">Budget:</span>
              <span className="ml-2 font-medium text-gray-900">
                ${parseInt(formData.budgetMin).toLocaleString()} - ${parseInt(formData.budgetMax).toLocaleString()}
              </span>
            </p>
            {formData.desiredStartDate && (
              <p>
                <span className="text-gray-600">Start Date:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {new Date(formData.desiredStartDate).toLocaleDateString()}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Recipients */}
        {rfqType !== 'public' && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">
              {rfqType === 'direct' ? 'Selected Vendors' : 'Suggested Vendors'}
            </h4>
            {formData.selectedVendors && formData.selectedVendors.length > 0 ? (
              <div className="space-y-2 text-sm">
                {formData.selectedVendors.map(vendorId => {
                  const vendor = vendors.find(v => v.id === vendorId);
                  return vendor ? (
                    <p key={vendorId} className="font-medium text-gray-900">
                      • {vendor.company_name}
                    </p>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">
                {rfqType === 'wizard' && formData.allowOtherVendors
                  ? 'No specific vendors selected. Open to all matching vendors.'
                  : 'No vendors selected.'}
              </p>
            )}
            {rfqType === 'wizard' && formData.allowOtherVendors && (
              <p className="text-xs text-gray-500 mt-2 italic">
                ✓ Other vendors can also respond
              </p>
            )}
          </div>
        )}

        {/* Public Settings */}
        {rfqType === 'public' && (
          <div className="pb-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">RFQ Settings</h4>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-600">Visibility:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">
                  All {formData.visibilityScope} vendors
                </span>
              </p>
              <p>
                <span className="text-gray-600">Response Limit:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formData.responseLimit >= 999 ? 'Unlimited' : `Up to ${formData.responseLimit}`}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Once submitted, vendors will be able to see your RFQ and submit responses.
          You'll be notified when responses arrive.
        </p>
      </div>
    </div>
  );
}
