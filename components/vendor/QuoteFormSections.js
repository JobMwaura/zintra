'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';

/**
 * QuoteFormSections Component
 * Comprehensive quote form with 3 sections:
 * - Section 1: Quote Overview
 * - Section 2: Pricing & Breakdown
 * - Section 3: Inclusions/Exclusions
 */

export default function QuoteFormSections({ formData, setFormData, error, setError }) {
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    pricing: true,
    inclusions: true,
  });

  // Toggle section expand/collapse
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Update form data (memoized to prevent recreation on every render)
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  }, [error, setError]);

  // Update nested line item (memoized)
  const updateLineItem = useCallback((index, field, value) => {
    const newLineItems = [...formData.line_items];
    newLineItems[index] = {
      ...newLineItems[index],
      [field]: value
    };
    
    // Auto-calculate line total
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(newLineItems[index].quantity || 0);
      const price = parseFloat(newLineItems[index].unitPrice || 0);
      newLineItems[index].lineTotal = (qty * price).toFixed(2);
    }
    
    setFormData(prev => ({
      ...prev,
      line_items: newLineItems
    }));
  }, [formData.line_items]);

  // Add new line item
  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        {
          description: '',
          quantity: 1,
          unit: '',
          unitPrice: 0,
          lineTotal: 0
        }
      ]
    }));
  };

  // Remove line item
  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  // Calculate subtotal from line items
  const calculateSubtotal = () => {
    return formData.line_items.reduce((sum, item) => {
      return sum + (parseFloat(item.lineTotal) || 0);
    }, 0).toFixed(2);
  };

  // Calculate VAT
  const calculateVAT = () => {
    if (!formData.vat_included) return 0;
    const subtotal = parseFloat(calculateSubtotal());
    const additionalCosts = 
      (parseFloat(formData.transport_cost) || 0) +
      (parseFloat(formData.labour_cost) || 0) +
      (parseFloat(formData.other_charges) || 0);
    return ((subtotal + additionalCosts) * 0.16).toFixed(2); // Kenya VAT is 16%
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    const subtotal = parseFloat(calculateSubtotal());
    const additionalCosts = 
      (parseFloat(formData.transport_cost) || 0) +
      (parseFloat(formData.labour_cost) || 0) +
      (parseFloat(formData.other_charges) || 0);
    const vat = parseFloat(calculateVAT());
    return (subtotal + additionalCosts + vat).toFixed(2);
  };

  // ============================================================================
  // SECTION 1: QUOTE OVERVIEW
  // ============================================================================

  const Section1 = useMemo(() => () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Quote Overview</h3>

      {/* Quote Title */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Quote Title *
        </label>
        <input
          type="text"
          value={formData.quote_title}
          onChange={(e) => updateFormData('quote_title', e.target.value)}
          placeholder="E.g., 'Internet installation & Wi-Fi optimization – Ruiru'"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <p className="text-xs text-slate-500 mt-1">Give your quote a descriptive title</p>
      </div>

      {/* Brief Introduction */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Brief Introduction *
        </label>
        <textarea
          value={formData.intro_text}
          onChange={(e) => updateFormData('intro_text', e.target.value)}
          placeholder="E.g., 'Thank you for the opportunity. Below is our quote based on your requirements, including materials, labour and support.'"
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">Greet the buyer and introduce your quote</p>
      </div>

      {/* Quote Validity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Quote Valid Until *
          </label>
          <select
            value={formData.validity_days}
            onChange={(e) => updateFormData('validity_days', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="custom">Custom date</option>
          </select>
        </div>

        {formData.validity_days === 'custom' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Custom Date
            </label>
            <input
              type="date"
              value={formData.validity_custom_date}
              onChange={(e) => updateFormData('validity_custom_date', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}
      </div>

      {/* Earliest Start Date */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Earliest Date We Can Start (Optional)
        </label>
        <input
          type="date"
          value={formData.earliest_start_date}
          onChange={(e) => updateFormData('earliest_start_date', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>
    </div>
  ), [formData, updateFormData]);

  // ============================================================================
  // SECTION 2: PRICING & BREAKDOWN
  // ============================================================================

  const Section2 = useMemo(() => () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Pricing & Breakdown</h3>

      {/* Pricing Model Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Pricing Model *
        </label>
        <div className="space-y-2">
          {[
            { value: 'fixed', label: 'Fixed total price' },
            { value: 'range', label: 'Price range (minimum to maximum)' },
            { value: 'per_unit', label: 'Per unit / per item' },
            { value: 'per_day', label: 'Per day / hourly' },
          ].map(option => (
            <label key={option.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="pricing_model"
                value={option.value}
                checked={formData.pricing_model === option.value}
                onChange={(e) => updateFormData('pricing_model', e.target.value)}
                className="w-4 h-4 text-amber-600"
              />
              <span className="text-sm font-medium text-slate-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* FIXED PRICE MODEL */}
      {formData.pricing_model === 'fixed' && (
        <div className="space-y-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Total Price (KES) *
            </label>
            <input
              type="number"
              value={formData.quoted_price}
              onChange={(e) => updateFormData('quoted_price', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.vat_included}
              onChange={(e) => updateFormData('vat_included', e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded"
            />
            <span className="text-sm font-medium text-slate-700">Is VAT included in this price?</span>
          </label>
        </div>
      )}

      {/* RANGE PRICE MODEL */}
      {formData.pricing_model === 'range' && (
        <div className="space-y-4 bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Minimum Price (KES) *
              </label>
              <input
                type="number"
                value={formData.price_min}
                onChange={(e) => updateFormData('price_min', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Maximum Price (KES) *
              </label>
              <input
                type="number"
                value={formData.price_max}
                onChange={(e) => updateFormData('price_max', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.vat_included}
              onChange={(e) => updateFormData('vat_included', e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded"
            />
            <span className="text-sm font-medium text-slate-700">Is VAT included in this range?</span>
          </label>
        </div>
      )}

      {/* PER UNIT MODEL */}
      {formData.pricing_model === 'per_unit' && (
        <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Unit Type *
            </label>
            <input
              type="text"
              value={formData.unit_type}
              onChange={(e) => updateFormData('unit_type', e.target.value)}
              placeholder="E.g., 'per metre', 'per point', 'per room'"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Unit Price (KES) *
              </label>
              <input
                type="number"
                value={formData.unit_price}
                onChange={(e) => updateFormData('unit_price', e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Estimated Units *
              </label>
              <input
                type="number"
                value={formData.estimated_units}
                onChange={(e) => updateFormData('estimated_units', e.target.value)}
                placeholder="0"
                step="1"
                min="0"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {formData.unit_price && formData.estimated_units && (
            <div className="bg-white p-3 rounded border border-blue-300">
              <p className="text-sm text-slate-600">Estimated Total:</p>
              <p className="text-xl font-bold text-blue-600">
                KES {(parseFloat(formData.unit_price) * parseFloat(formData.estimated_units)).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PER DAY/HOURLY MODEL */}
      {formData.pricing_model === 'per_day' && (
        <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-200">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Daily / Hourly Rate (KES) *
            </label>
            <input
              type="number"
              value={formData.unit_price}
              onChange={(e) => updateFormData('unit_price', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Estimated Days / Hours *
            </label>
            <input
              type="number"
              value={formData.estimated_units}
              onChange={(e) => updateFormData('estimated_units', e.target.value)}
              placeholder="0"
              step="0.5"
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {formData.unit_price && formData.estimated_units && (
            <div className="bg-white p-3 rounded border border-green-300">
              <p className="text-sm text-slate-600">Estimated Total:</p>
              <p className="text-xl font-bold text-green-600">
                KES {(parseFloat(formData.unit_price) * parseFloat(formData.estimated_units)).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* LINE ITEM BREAKDOWN TABLE */}
      <div className="space-y-3 border-t pt-6">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-slate-900">Item Breakdown (Optional)</h4>
          <button
            type="button"
            onClick={addLineItem}
            className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded transition"
          >
            <Plus size={16} /> Add item
          </button>
        </div>

        {formData.line_items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-2 px-2 font-semibold text-slate-900">Description</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-900 w-20">Qty</th>
                  <th className="text-left py-2 px-2 font-semibold text-slate-900 w-20">Unit</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-900 w-32">Unit Price</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-900 w-32">Line Total</th>
                  <th className="text-center py-2 px-2 font-semibold text-slate-900 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {formData.line_items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                        placeholder="E.g., Router supply"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                        min="0"
                        step="1"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                        placeholder="Pcs"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(idx, 'unitPrice', e.target.value)}
                        placeholder="0"
                        step="0.01"
                        min="0"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                      />
                    </td>
                    <td className="py-2 px-2 text-right font-semibold text-slate-900">
                      {parseFloat(item.lineTotal).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="text-red-600 hover:text-red-700 transition"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADDITIONAL COSTS */}
      <div className="space-y-3 border-t pt-6">
        <h4 className="font-semibold text-slate-900">Additional Costs</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Transport / Delivery (KES)
            </label>
            <input
              type="number"
              value={formData.transport_cost}
              onChange={(e) => updateFormData('transport_cost', e.target.value)}
              placeholder="0"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Labour Cost (KES)
            </label>
            <input
              type="number"
              value={formData.labour_cost}
              onChange={(e) => updateFormData('labour_cost', e.target.value)}
              placeholder="0"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Other Charges (KES)
            </label>
            <input
              type="number"
              value={formData.other_charges}
              onChange={(e) => updateFormData('other_charges', e.target.value)}
              placeholder="0"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* PRICE SUMMARY */}
      <div className="space-y-2 border-t pt-6 bg-slate-50 p-4 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Subtotal:</span>
          <span className="font-semibold text-slate-900">KES {calculateSubtotal()}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Additional Costs:</span>
          <span className="font-semibold text-slate-900">
            KES {(
              (parseFloat(formData.transport_cost) || 0) +
              (parseFloat(formData.labour_cost) || 0) +
              (parseFloat(formData.other_charges) || 0)
            ).toFixed(2)}
          </span>
        </div>

        {formData.vat_included && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">VAT (16%):</span>
            <span className="font-semibold text-slate-900">KES {calculateVAT()}</span>
          </div>
        )}

        <div className="flex justify-between border-t pt-2">
          <span className="font-bold text-slate-900">Grand Total:</span>
          <span className="text-2xl font-bold text-amber-600">KES {calculateGrandTotal()}</span>
        </div>
      </div>
    </div>
  ), [formData, updateFormData, updateLineItem, calculateSubtotal, calculateVAT, calculateGrandTotal]);

  // ============================================================================
  // SECTION 3: INCLUSIONS / EXCLUSIONS
  // ============================================================================

  const Section3 = useMemo(() => () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">What's Included & Excluded</h3>

      {/* What is Included */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          What is Included in This Quote? *
        </label>
        <textarea
          value={formData.inclusions}
          onChange={(e) => updateFormData('inclusions', e.target.value)}
          placeholder="E.g., Router supply, internal cabling up to 10 points, configuration, 7-day support after installation."
          rows={4}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">Be specific about what you're providing</p>
      </div>

      {/* What is NOT Included */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          What is NOT Included? (Exclusions & Assumptions) *
        </label>
        <textarea
          value={formData.exclusions}
          onChange={(e) => updateFormData('exclusions', e.target.value)}
          placeholder="E.g., ISP monthly subscription fee, additional trunking beyond 50m, civil works, wall chasing, ceiling repairs."
          rows={4}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">Be clear about what you're NOT providing to avoid disputes</p>
      </div>

      {/* Client Responsibilities */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Client Responsibilities / Dependencies (Optional)
        </label>
        <textarea
          value={formData.client_responsibilities}
          onChange={(e) => updateFormData('client_responsibilities', e.target.value)}
          placeholder="E.g., Client to provide power points, secure router location, site access between 8am–5pm."
          rows={4}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">Help the buyer understand what they need to provide or do</p>
      </div>
    </div>
  ), [formData, updateFormData]);

  // ============================================================================
  // RENDER ALL SECTIONS
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Section 1: Quote Overview */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <button
          type="button"
          onClick={() => toggleSection('overview')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-xl font-bold text-slate-900">Section 1: Quote Overview</h2>
          <ChevronDown
            size={24}
            className={`text-slate-600 transition ${expandedSections.overview ? 'rotate-180' : ''}`}
          />
        </button>

        <div style={{ display: expandedSections.overview ? 'block' : 'none' }}>
          {Section1()}
        </div>
      </div>

      {/* Section 2: Pricing & Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <button
          type="button"
          onClick={() => toggleSection('pricing')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-xl font-bold text-slate-900">Section 2: Pricing & Breakdown</h2>
          <ChevronDown
            size={24}
            className={`text-slate-600 transition ${expandedSections.pricing ? 'rotate-180' : ''}`}
          />
        </button>

        <div style={{ display: expandedSections.pricing ? 'block' : 'none' }}>
          {Section2()}
        </div>
      </div>

      {/* Section 3: Inclusions/Exclusions */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <button
          type="button"
          onClick={() => toggleSection('inclusions')}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-xl font-bold text-slate-900">Section 3: What's Included & Excluded</h2>
          <ChevronDown
            size={24}
            className={`text-slate-600 transition ${expandedSections.inclusions ? 'rotate-180' : ''}`}
          />
        </button>

        <div style={{ display: expandedSections.inclusions ? 'block' : 'none' }}>
          {Section3()}
        </div>
      </div>
    </div>
  );
}
