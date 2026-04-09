'use client';

import { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';

/**
 * QuoteFormSections Component
 * 
 * Renders 3 sections of the vendor quote form:
 * 1. Quote Overview (title, validity, start date)
 * 2. Pricing & Breakdown (pricing model, costs, VAT)
 * 3. Inclusions/Exclusions (what's included/excluded, client responsibilities)
 */
export default function QuoteFormSections({ formData, setFormData, error, setError }) {
  const [expandedSection, setExpandedSection] = useState('overview');

  const handleFieldChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...formData.line_items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Calculate line total if description and qty/price exist
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].lineTotal = (parseFloat(updatedItems[index].quantity) || 0) * (parseFloat(updatedItems[index].unit_price) || 0);
    }

    setFormData(prev => ({
      ...prev,
      line_items: updatedItems
    }));
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        { description: '', quantity: '', unit_price: '', lineTotal: 0 }
      ]
    }));
  };

  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: Quote Overview */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedSection(expandedSection === 'overview' ? '' : 'overview')}
          className="w-full bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 flex items-center justify-between hover:bg-blue-100 transition"
        >
          <h3 className="font-bold text-blue-900">SECTION 1: Quote Overview</h3>
          <span className="text-blue-600">{expandedSection === 'overview' ? '−' : '+'}</span>
        </button>

        {expandedSection === 'overview' && (
          <div className="p-6 bg-white space-y-4">
            {/* Quote Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quote Title * <span className="text-xs text-gray-500">(e.g., "Office Cleaning Package")</span>
              </label>
              <input
                type="text"
                value={formData.quote_title}
                onChange={(e) => handleFieldChange('overview', 'quote_title', e.target.value)}
                placeholder="Give your quote a descriptive title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Intro Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Introduction / Pitch * <span className="text-xs text-gray-500">(Why should they choose you?)</span>
              </label>
              <textarea
                value={formData.intro_text}
                onChange={(e) => handleFieldChange('overview', 'intro_text', e.target.value)}
                placeholder="Briefly introduce yourself and why you're the best choice for this project..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Validity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quote Validity *
                </label>
                <select
                  value={formData.validity_days}
                  onChange={(e) => handleFieldChange('overview', 'validity_days', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="custom">Custom date</option>
                </select>
              </div>

              {formData.validity_days === 'custom' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.validity_custom_date}
                    onChange={(e) => handleFieldChange('overview', 'validity_custom_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Earliest Start Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Earliest Start Date *
              </label>
              <input
                type="date"
                value={formData.earliest_start_date}
                onChange={(e) => handleFieldChange('overview', 'earliest_start_date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Pricing & Breakdown */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedSection(expandedSection === 'pricing' ? '' : 'pricing')}
          className="w-full bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 flex items-center justify-between hover:bg-emerald-100 transition"
        >
          <h3 className="font-bold text-emerald-900">SECTION 2: Pricing & Breakdown</h3>
          <span className="text-emerald-600">{expandedSection === 'pricing' ? '−' : '+'}</span>
        </button>

        {expandedSection === 'pricing' && (
          <div className="p-6 bg-white space-y-4">
            {/* Pricing Model */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pricing Model * <span className="text-xs text-gray-500">(How are you charging?)</span>
              </label>
              <select
                value={formData.pricing_model}
                onChange={(e) => handleFieldChange('pricing', 'pricing_model', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="fixed">Fixed Price</option>
                <option value="range">Price Range</option>
                <option value="per_unit">Per Unit</option>
                <option value="per_day">Per Day</option>
              </select>
            </div>

            {/* Price Fields based on Model */}
            {formData.pricing_model === 'fixed' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Price *</label>
                <input
                  type="number"
                  value={formData.price_min}
                  onChange={(e) => handleFieldChange('pricing', 'price_min', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {formData.pricing_model === 'range' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Min Price *</label>
                  <input
                    type="number"
                    value={formData.price_min}
                    onChange={(e) => handleFieldChange('pricing', 'price_min', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price *</label>
                  <input
                    type="number"
                    value={formData.price_max}
                    onChange={(e) => handleFieldChange('pricing', 'price_max', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {(formData.pricing_model === 'per_unit' || formData.pricing_model === 'per_day') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit Type *</label>
                  <input
                    type="text"
                    value={formData.unit_type}
                    onChange={(e) => handleFieldChange('pricing', 'unit_type', e.target.value)}
                    placeholder={formData.pricing_model === 'per_unit' ? "e.g., 'sqm', 'person'" : "e.g., 'day', 'hour'"}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price per Unit *</label>
                  <input
                    type="number"
                    value={formData.unit_price}
                    onChange={(e) => handleFieldChange('pricing', 'unit_price', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Quantity</label>
                  <input
                    type="number"
                    value={formData.estimated_units}
                    onChange={(e) => handleFieldChange('pricing', 'estimated_units', e.target.value)}
                    placeholder="e.g., 100 (for 100 sqm or 100 days)"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-700">Line Items (Optional Breakdown)</label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg hover:bg-emerald-200 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              <div className="space-y-2">
                {formData.line_items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                      placeholder="Item description"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      step="0.01"
                      className="w-20 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(idx, 'unit_price', e.target.value)}
                      placeholder="Price"
                      step="0.01"
                      className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="w-24 px-3 py-2 bg-gray-100 rounded text-sm font-semibold text-gray-700">
                      {(item.lineTotal || 0).toLocaleString()}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Costs */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Cost</label>
                <input
                  type="number"
                  value={formData.transport_cost}
                  onChange={(e) => handleFieldChange('pricing', 'transport_cost', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Labour Cost</label>
                <input
                  type="number"
                  value={formData.labour_cost}
                  onChange={(e) => handleFieldChange('pricing', 'labour_cost', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Other Charges</label>
                <input
                  type="number"
                  value={formData.other_charges}
                  onChange={(e) => handleFieldChange('pricing', 'other_charges', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* VAT */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <input
                type="checkbox"
                id="vat_included"
                checked={formData.vat_included}
                onChange={(e) => handleFieldChange('pricing', 'vat_included', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="vat_included" className="text-sm font-semibold text-gray-700">
                Price includes VAT (16%)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Inclusions/Exclusions */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setExpandedSection(expandedSection === 'inclusions' ? '' : 'inclusions')}
          className="w-full bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 flex items-center justify-between hover:bg-purple-100 transition"
        >
          <h3 className="font-bold text-purple-900">SECTION 3: Inclusions & Exclusions</h3>
          <span className="text-purple-600">{expandedSection === 'inclusions' ? '−' : '+'}</span>
        </button>

        {expandedSection === 'inclusions' && (
          <div className="p-6 bg-white space-y-4">
            {/* Inclusions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What's Included? * <span className="text-xs text-gray-500">(List all deliverables and services)</span>
              </label>
              <textarea
                value={formData.inclusions}
                onChange={(e) => handleFieldChange('inclusions', 'inclusions', e.target.value)}
                placeholder="e.g., Website design, 5 pages, responsive design, SEO optimization, etc."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">💡 Tip: Use line breaks to list each item</p>
            </div>

            {/* Exclusions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What's NOT Included? * <span className="text-xs text-gray-500">(What's outside this quote?)</span>
              </label>
              <textarea
                value={formData.exclusions}
                onChange={(e) => handleFieldChange('inclusions', 'exclusions', e.target.value)}
                placeholder="e.g., Hosting, domain registration, content creation, ongoing maintenance, etc."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">💡 Tip: Be clear about what's NOT covered to avoid confusion</p>
            </div>

            {/* Client Responsibilities */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client Responsibilities <span className="text-xs text-gray-500">(What do they need to provide?)</span>
              </label>
              <textarea
                value={formData.client_responsibilities}
                onChange={(e) => handleFieldChange('inclusions', 'client_responsibilities', e.target.value)}
                placeholder="e.g., Logo files, product images, copy/content, access to their systems, etc."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
