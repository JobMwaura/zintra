'use client';

import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * CounterOfferForm Component
 * Form for submitting counter offers with price, scope changes, and delivery date
 * 
 * Props:
 * - quoteId: string - Quote UUID
 * - originalPrice: number - Original quote price
 * - currentPrice: number - Current negotiation price
 * - onSubmit: function - Callback when form is submitted
 * - loading: boolean - Loading state
 * - error: string - Error message
 * - userRole: string - 'buyer' or 'vendor'
 * - disabled: boolean - Whether form is disabled
 */
export default function CounterOfferForm({
  quoteId,
  originalPrice,
  currentPrice,
  onSubmit,
  loading = false,
  error = null,
  userRole = 'buyer',
  disabled = false
}) {
  const [formData, setFormData] = useState({
    proposedPrice: currentPrice || originalPrice,
    scopeChanges: '',
    deliveryDate: '',
    paymentTerms: '',
    notes: '',
    responseByDays: 3
  });

  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Calculate price difference and percentage
  const priceDifference = formData.proposedPrice - originalPrice;
  const pricePercentChange = originalPrice > 0 
    ? ((priceDifference / originalPrice) * 100).toFixed(1)
    : 0;
  const differenceFromCurrent = formData.proposedPrice - currentPrice;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = ['proposedPrice', 'responseByDays'].includes(name) ? parseFloat(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));

    // Clear messages on change
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    // Validate form
    if (!formData.proposedPrice || formData.proposedPrice < 0) {
      setSubmitError('Please enter a valid price');
      return;
    }

    if (formData.proposedPrice === currentPrice && !formData.scopeChanges) {
      setSubmitError('Please change the price or provide scope changes');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await onSubmit({
        quoteId,
        proposedPrice: formData.proposedPrice,
        scopeChanges: formData.scopeChanges || null,
        deliveryDate: formData.deliveryDate || null,
        paymentTerms: formData.paymentTerms || null,
        notes: formData.notes || null,
        responseByDays: formData.responseByDays
      });

      // Reset form on success
      setFormData({
        proposedPrice: formData.proposedPrice,
        scopeChanges: '',
        deliveryDate: '',
        paymentTerms: '',
        notes: '',
        responseByDays: 3
      });

      setSuccessMessage('Counter offer submitted successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      setSubmitError(err.message || 'Failed to submit counter offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
        <h3 className="text-xl font-bold text-gray-900">
          {userRole === 'buyer' ? 'Make a Counter Offer' : 'Submit Your Revised Quote'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {userRole === 'buyer' 
            ? 'Negotiate the price and terms with the vendor'
            : 'Present your best offer to close the deal'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Messages */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Validation Error</p>
              <p className="text-sm text-red-800 mt-1">{submitError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Success</p>
              <p className="text-sm text-green-800 mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Price Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Proposed Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">₹</span>
              <input
                type="number"
                name="proposedPrice"
                value={formData.proposedPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                disabled={disabled || isSubmitting}
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Price comparison */}
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-gray-600">Original Price</p>
                <p className="font-semibold text-gray-900">₹{originalPrice?.toLocaleString()}</p>
              </div>
              <div className={`p-3 rounded ${
                priceDifference < 0 ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className={priceDifference < 0 ? 'text-green-600' : 'text-red-600'}>
                  Change
                </p>
                <p className={`font-semibold ${priceDifference < 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {priceDifference >= 0 ? '+' : ''}{priceDifference.toLocaleString()} ({pricePercentChange}%)
                </p>
              </div>
            </div>

            {/* Current vs Proposed */}
            {currentPrice !== originalPrice && (
              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-600 mb-1">Difference from current negotiation price</p>
                <p className={`text-sm font-semibold ${
                  differenceFromCurrent < 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {differenceFromCurrent >= 0 ? '+' : ''}₹{differenceFromCurrent.toLocaleString()} ({((differenceFromCurrent / currentPrice) * 100).toFixed(1)}%)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scope Changes */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Scope Changes <span className="text-gray-500">(Optional)</span>
          </label>
          <textarea
            name="scopeChanges"
            value={formData.scopeChanges}
            onChange={handleChange}
            disabled={disabled || isSubmitting}
            placeholder="Describe any changes to the scope, deliverables, or specifications..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.scopeChanges.length} / 500 characters
          </p>
        </div>

        {/* Delivery Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Proposed Delivery Date <span className="text-gray-500">(Optional)</span>
          </label>
          <input
            type="date"
            name="deliveryDate"
            value={formData.deliveryDate}
            onChange={handleChange}
            disabled={disabled || isSubmitting}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Payment Terms */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Payment Terms <span className="text-gray-500">(Optional)</span>
          </label>
          <input
            type="text"
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={handleChange}
            disabled={disabled || isSubmitting}
            placeholder="e.g., 50% upfront, 50% on delivery"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Notes <span className="text-gray-500">(Optional)</span>
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={disabled || isSubmitting}
            placeholder="Add any additional information or context..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Response Deadline */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Request Response By <span className="text-gray-500">(Days)</span>
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              name="responseByDays"
              value={formData.responseByDays}
              onChange={handleChange}
              disabled={disabled || isSubmitting}
              min="1"
              max="30"
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600">
              By {new Date(Date.now() + formData.responseByDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              disabled || isSubmitting
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Counter Offer'}
          </button>
        </div>
      </form>
    </div>
  );
}
