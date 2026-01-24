'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, DollarSign, Package, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * QuoteDetailCard Component
 * Displays full vendor quote details in an expandable card format
 * Shows all 3 sections: Overview, Pricing Breakdown, Inclusions/Exclusions
 */
export default function QuoteDetailCard({ quote, vendor, isSelected, onSelect }) {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    pricing: true,
    inclusions: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Parse stored JSON data if needed
  const lineItems = typeof quote.line_items === 'string' 
    ? JSON.parse(quote.line_items) 
    : quote.line_items || [];

  // Calculate totals
  const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  const transportCost = parseFloat(quote.transport_cost) || 0;
  const labourCost = parseFloat(quote.labour_cost) || 0;
  const otherCharges = parseFloat(quote.other_charges) || 0;
  const subtotal = lineItemsTotal + transportCost + labourCost + otherCharges;
  const vatAmount = parseFloat(quote.vat_amount) || 0;
  const totalPrice = parseFloat(quote.total_price_calculated) || parseFloat(quote.quoted_price) || 0;

  return (
    <div
      onClick={() => onSelect?.()}
      className={`border rounded-lg transition cursor-pointer ${
        isSelected
          ? 'border-orange-500 bg-orange-50 shadow-lg'
          : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-md'
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">
              {quote.quote_title || 'Quote'}
            </h3>
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
              {quote.intro_text || quote.description || 'No description provided'}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              <span className="text-slate-600">
                <span className="font-semibold text-slate-900">Vendor:</span> {vendor?.company_name || 'Unknown'}
              </span>
              {vendor?.verified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  ✓ Verified
                </span>
              )}
              {vendor?.rating && (
                <span className="text-slate-600">
                  <span className="font-semibold">Rating:</span> {parseFloat(vendor.rating).toFixed(1)} ⭐
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-3xl font-bold text-orange-600">
              KSh {totalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Price</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
              quote.status === 'accepted'
                ? 'bg-green-100 text-green-700'
                : quote.status === 'rejected'
                ? 'bg-red-100 text-red-700'
                : quote.status === 'revised'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-700'
            }`}>
              {quote.status || 'submitted'}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Overview */}
      <div className="border-b border-slate-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSection('overview');
          }}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-900">Quote Overview</span>
          </div>
          {expandedSections.overview ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        {expandedSections.overview && (
          <div className="px-6 py-4 bg-slate-50 space-y-4 text-sm">
            {/* Vendor's Proposal/Description - Show prominently */}
            {(quote.description || quote.intro_text) && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="font-semibold text-slate-900 mb-2">Vendor's Proposal</p>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {quote.description || quote.intro_text}
                </p>
              </div>
            )}
            
            {/* Overview Fields */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-2">
              {quote.validity_days && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Validity Period:</span>
                  <span className="font-semibold text-slate-900">
                    {quote.validity_days} days
                    {quote.validity_custom_date && ` (until ${new Date(quote.validity_custom_date).toLocaleDateString()})`}
                  </span>
                </div>
              )}
              {quote.earliest_start_date && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Earliest Start Date:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(quote.earliest_start_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {quote.delivery_timeline && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery Timeline:</span>
                  <span className="font-semibold text-slate-900">{quote.delivery_timeline}</span>
                </div>
              )}
              {quote.pricing_model && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Pricing Model:</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {quote.pricing_model.replace('_', ' ')}
                  </span>
                </div>
              )}
              {quote.submitted_at && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Submitted:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(quote.submitted_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Pricing & Breakdown */}
      <div className="border-b border-slate-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSection('pricing');
          }}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-slate-900">Pricing Breakdown</span>
          </div>
          {expandedSections.pricing ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        {expandedSections.pricing && (
          <div className="px-6 py-4 bg-slate-50 space-y-4 text-sm">
            {/* Line Items if available */}
            {lineItems.length > 0 && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="font-semibold text-slate-900 mb-3">Line Items</p>
                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{item.description || `Item ${idx + 1}`}</p>
                        <p className="text-xs text-slate-500">
                          {item.quantity} × KSh {parseFloat(item.price || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-900 text-right">
                        KSh {(item.lineTotal || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Breakdown */}
            <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-2">
              {lineItems.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Line Items Subtotal:</span>
                  <span className="font-semibold text-slate-900">
                    KSh {lineItemsTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
              {transportCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Transport Cost:</span>
                  <span className="font-semibold text-slate-900">
                    KSh {transportCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
              {labourCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Labour Cost:</span>
                  <span className="font-semibold text-slate-900">
                    KSh {labourCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
              {otherCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Other Charges:</span>
                  <span className="font-semibold text-slate-900">
                    KSh {otherCharges.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold text-slate-900">
                  KSh {subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              {vatAmount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>VAT ({quote.vat_included ? 'Included' : 'Additional'}):</span>
                  <span className="font-semibold">
                    KSh {vatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}

              <div className="border-t border-slate-300 pt-2 flex justify-between text-lg">
                <span className="font-bold text-slate-900">Total:</span>
                <span className="font-bold text-orange-600">
                  KSh {totalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Alternative pricing models */}
            {quote.pricing_model === 'range' && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="font-semibold text-slate-900 mb-2">Price Range</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Minimum:</span>
                  <span className="font-semibold text-slate-900">
                    KSh {(quote.price_min || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Maximum:</span>
                  <span className="font-semibold text-slate-900">
                    KSh {(quote.price_max || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            )}

            {quote.pricing_model === 'per_unit' && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="font-semibold text-slate-900 mb-2">Per Unit Pricing</p>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Unit Type:</span>
                  <span className="font-semibold text-slate-900">{quote.unit_type}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Price per Unit:</span>
                  <span className="font-semibold text-slate-900">
                    KSh {(quote.unit_price || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Estimated Units:</span>
                  <span className="font-semibold text-slate-900">{quote.estimated_units}</span>
                </div>
              </div>
            )}

            {quote.pricing_model === 'per_day' && (
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="font-semibold text-slate-900 mb-2">Daily Rate Pricing</p>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Price per Day:</span>
                  <span className="font-semibold text-slate-900">
                    KSh {(quote.unit_price || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Estimated Days:</span>
                  <span className="font-semibold text-slate-900">{quote.estimated_units}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Inclusions & Exclusions */}
      <div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSection('inclusions');
          }}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-slate-900">Inclusions & Exclusions</span>
          </div>
          {expandedSections.inclusions ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        {expandedSections.inclusions && (
          <div className="px-6 py-4 bg-slate-50 space-y-4 text-sm">
            {/* Main Description/Proposal if exists */}
            {quote.description && (
              <div className="bg-white rounded-lg p-4 border border-slate-200 mb-4">
                <p className="font-semibold text-slate-900 mb-2">📝 Vendor's Detailed Proposal</p>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {quote.description}
                </p>
              </div>
            )}

            {quote.inclusions && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <p className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  What's Included
                </p>
                <div className="text-slate-700 whitespace-pre-wrap">
                  {quote.inclusions}
                </div>
              </div>
            )}

            {quote.exclusions && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                <p className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  What's NOT Included
                </p>
                <div className="text-slate-700 whitespace-pre-wrap">
                  {quote.exclusions}
                </div>
              </div>
            )}

            {quote.client_responsibilities && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
                <p className="font-semibold text-slate-900 mb-2">👤 Client Responsibilities</p>
                <div className="text-slate-700 whitespace-pre-wrap">
                  {quote.client_responsibilities}
                </div>
              </div>
            )}

            {quote.warranty && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <p className="font-semibold text-slate-900 mb-2">🛡️ Warranty & Support</p>
                <div className="text-slate-700 whitespace-pre-wrap">
                  {quote.warranty}
                </div>
              </div>
            )}

            {quote.payment_terms && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500">
                <p className="font-semibold text-slate-900 mb-2">💳 Payment Terms</p>
                <div className="text-slate-700 whitespace-pre-wrap">
                  {quote.payment_terms}
                </div>
              </div>
            )}

            {/* Attachments if any */}
            {quote.attachments && quote.attachments.length > 0 && (
              <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                <p className="font-semibold text-slate-900 mb-2">📎 Attachments</p>
                <div className="space-y-2">
                  {quote.attachments.map((attachment, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-600">
                      <span className="text-orange-600">📄</span>
                      <span className="truncate">{typeof attachment === 'string' ? attachment : attachment.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
