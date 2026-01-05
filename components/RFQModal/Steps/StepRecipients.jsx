'use client';

import { Check, AlertCircle, TrendingUp } from 'lucide-react';
import { matchVendorsToRFQ, filterVendorsByCategory, getMatchReason } from '@/lib/matching/categoryMatcher';

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
  // Phase 3: Enhanced vendor matching
  let filteredVendors = [];
  let matchedVendors = [];
  let otherVendors = [];
  
  if (rfqType === 'wizard') {
    // Wizard RFQ: Use smart matching (category + location + rating)
    matchedVendors = matchVendorsToRFQ(
      vendors.filter(v => v.verified),
      {
        categorySlug: category,
        county: county,
        town: undefined,
      },
      {
        minScore: 50,
        maxResults: 15,
        sortBy: 'score'
      }
    );
    
    // Get vendors that didn't match for potential fallback
    otherVendors = vendors.filter(v => 
      v.verified && 
      !matchedVendors.find(m => m.id === v.id)
    ).slice(0, 5);
    
    filteredVendors = matchedVendors;
  } else if (rfqType === 'direct') {
    // Direct RFQ: Show category-matched vendors first, then others
    const categoryMatched = filterVendorsByCategory(
      vendors.filter(v => v.verified),
      category
    );
    
    otherVendors = vendors.filter(v => 
      v.verified && 
      !categoryMatched.find(c => c.id === v.id)
    );
    
    filteredVendors = categoryMatched;
  } else {
    // Public RFQ: Basic filter
    filteredVendors = vendors.filter(v => {
      const matchesCounty = !county || v.county === county;
      const matchesCategory = !category || (v.categories && v.categories.includes(category));
      return matchesCounty && matchesCategory && v.verified;
    });
  }

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

          <div className="space-y-4">
            {/* Phase 3: Category-matched vendors */}
            {filteredVendors.length > 0 && (
              <div>
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium">Category Specialists</p>
                    <p className="text-xs mt-1">{filteredVendors.length} vendors specialize in {category}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredVendors.map(vendor => (
                    <div
                      key={vendor.id}
                      onClick={() => onVendorToggle(vendor.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedVendors.includes(vendor.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-green-200 hover:border-green-400 bg-green-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{vendor.company_name}</p>
                          <p className="text-sm text-gray-600">{vendor.location}</p>
                          {vendor.rating && (
                            <p className="text-sm text-gray-500">⭐ {vendor.rating}/5</p>
                          )}
                          <p className="text-xs text-green-700 mt-1 font-medium">✓ Specializes in {category}</p>
                        </div>
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                            selectedVendors.includes(vendor.id)
                              ? 'border-green-600 bg-green-600'
                              : 'border-green-400'
                          }`}
                        >
                          {selectedVendors.includes(vendor.id) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phase 3: Other vendors section */}
            {otherVendors.length > 0 && (
              <div className="border-t pt-4">
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">Other Vendors</p>
                    <p className="text-xs mt-1">{otherVendors.length} vendors available in other categories</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {otherVendors.map(vendor => (
                    <div
                      key={vendor.id}
                      onClick={() => onVendorToggle(vendor.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all text-sm ${
                        selectedVendors.includes(vendor.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-300 hover:border-orange-300 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{vendor.company_name}</p>
                          <p className="text-xs text-gray-500">{vendor.location}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
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
            )}

            {filteredVendors.length === 0 && otherVendors.length === 0 && (
              <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
                No verified vendors found. Please check your category and county selections.
              </p>
            )}
          </div>
        </div>
      )}

      {rfqType === 'wizard' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Matched Vendors
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            We've found vendors that match your project needs. Select the ones you'd like to suggest.
          </p>

          {/* Phase 3: Show matching info */}
          {matchedVendors.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Smart matching active</p>
                <p className="text-xs mt-1">Vendors are ranked by category expertise, location, and ratings</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Phase 3: Matched Vendors */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                {matchedVendors.length > 0 ? `${matchedVendors.length} Matched Vendors` : 'No vendors matched'}
              </p>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {matchedVendors.length === 0 ? (
                  <p className="text-sm text-gray-500">No vendors found matching your criteria</p>
                ) : (
                  matchedVendors.map(vendor => (
                    <div
                      key={vendor.id}
                      onClick={() => onVendorToggle(vendor.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedVendors.includes(vendor.id)
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-300'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{vendor.company_name || vendor.name}</p>
                          {vendor.matchScore && (
                            <p className="text-xs text-blue-600 mt-1">
                              ✓ {vendor.matchScore}% match
                            </p>
                          )}
                          {vendor.location && (
                            <p className="text-xs text-gray-500 mt-1">{vendor.location}</p>
                          )}
                          {vendor.rating && (
                            <p className="text-xs text-gray-500">⭐ {vendor.rating.toFixed(1)}/5</p>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedVendors.includes(vendor.id)
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedVendors.includes(vendor.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Phase 3: Show other vendors if available */}
            {otherVendors.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Other vendors ({otherVendors.length})
                </p>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {otherVendors.map(vendor => (
                    <div
                      key={vendor.id}
                      onClick={() => onVendorToggle(vendor.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all text-sm opacity-75 ${
                        selectedVendors.includes(vendor.id)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{vendor.company_name || vendor.name}</span>
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
            )}

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
