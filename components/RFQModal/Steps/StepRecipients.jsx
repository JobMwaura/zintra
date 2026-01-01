'use client';

import { Check } from 'lucide-react';

export default function StepRecipients({
  rfqType,
  selectedVendors,
  allowOtherVendors,
  visibilityScope,
  responseLimit,
  vendors,
  category,
  county,
  onVendorToggle,
  onAllowOthersChange,
  onVisibilityScopeChange,
  onResponseLimitChange,
  errors
}) {
  // Filter vendors by category and county
  const filteredVendors = vendors.filter(v => {
    const matchesCounty = !county || v.county === county;
    const matchesCategory = !category || (v.categories && v.categories.includes(category));
    return matchesCounty && matchesCategory && v.verified;
  });

  return (
    <div className="space-y-6">
      {rfqType === 'direct' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Select Vendors
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose at least one vendor to receive your RFQ.
          </p>

          {errors.selectedVendors && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-sm text-red-600">{errors.selectedVendors}</p>
            </div>
          )}

          <div className="space-y-3">
            {filteredVendors.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No verified vendors found for this category and county.
              </p>
            ) : (
              filteredVendors.map(vendor => (
                <div
                  key={vendor.id}
                  onClick={() => onVendorToggle(vendor.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedVendors.includes(vendor.id)
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{vendor.company_name}</p>
                      <p className="text-sm text-gray-600">{vendor.location}</p>
                      {vendor.rating && (
                        <p className="text-sm text-gray-500">⭐ {vendor.rating}/5</p>
                      )}
                    </div>
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                        selectedVendors.includes(vendor.id)
                          ? 'border-orange-600 bg-orange-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedVendors.includes(vendor.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {rfqType === 'wizard' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Suggest Vendors (Optional)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            You can suggest vendors or allow anyone to respond.
          </p>

          <div className="space-y-4">
            {/* Vendor Selection */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Pre-suggest vendors
              </p>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredVendors.map(vendor => (
                  <div
                    key={vendor.id}
                    onClick={() => onVendorToggle(vendor.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors text-sm ${
                      selectedVendors.includes(vendor.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{vendor.company_name}</span>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedVendors.includes(vendor.id)
                            ? 'border-orange-600 bg-orange-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedVendors.includes(vendor.id) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Allow Others Checkbox */}
            <div className="border-t pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOtherVendors}
                  onChange={(e) => onAllowOthersChange(e.target.checked)}
                  className="w-4 h-4 accent-orange-600"
                />
                <span className="text-sm text-gray-700">
                  Allow other vendors to respond
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-7">
                Vendors not selected above can also submit responses.
              </p>
            </div>

            {errors.recipients && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-sm text-red-600">{errors.recipients}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {rfqType === 'public' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            RFQ Settings
          </h3>

          <div className="space-y-4">
            {/* Visibility Scope */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who can see this RFQ?
              </label>
              <select
                value={visibilityScope}
                onChange={(e) => onVisibilityScopeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="category">All vendors in this category</option>
                <option value="county">Vendors in this county</option>
                <option value="state">Vendors in this state</option>
                <option value="national">All vendors nationwide</option>
              </select>
            </div>

            {/* Response Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many responses do you want?
              </label>
              <select
                value={responseLimit}
                onChange={(e) => onResponseLimitChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="5">Up to 5 responses</option>
                <option value="10">Up to 10 responses</option>
                <option value="25">Up to 25 responses</option>
                <option value="50">Up to 50 responses</option>
                <option value="999">Unlimited responses</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                You'll receive responses in order received until the limit is reached.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
