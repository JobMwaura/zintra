'use client';

import { useState, useCallback } from 'react';
import { Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import CategorySelector from './CategorySelector';

/**
 * Vendor Profile Category Management Component
 * 
 * Integrated component that vendors use to manage their service categories
 * after initial registration. Allows updating primary and secondary categories.
 * 
 * Props:
 *   vendorId: ID of the vendor
 *   initialPrimary: Initial primary category slug
 *   initialSecondary: Initial secondary categories array
 *   onSave: Callback when changes are saved (receives {primary, secondary})
 * 
 * Usage:
 *   <CategoryManagement
 *     vendorId={vendorId}
 *     initialPrimary="architectural_design"
 *     initialSecondary={["doors_windows_glass"]}
 *     onSave={handleSave}
 *   />
 */
export default function CategoryManagement({
  vendorId,
  initialPrimary = '',
  initialSecondary = [],
  onSave = async () => {},
}) {
  const [primaryCategory, setPrimaryCategory] = useState(initialPrimary);
  const [secondaryCategories, setSecondaryCategories] = useState(initialSecondary);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Handle primary category change
   */
  const handlePrimaryChange = useCallback((slug) => {
    setPrimaryCategory(slug);
    setHasChanges(true);
    setMessage({ type: '', text: '' });
  }, []);

  /**
   * Handle secondary categories change
   */
  const handleSecondaryChange = useCallback((slugs) => {
    setSecondaryCategories(slugs);
    setHasChanges(true);
    setMessage({ type: '', text: '' });
  }, []);

  /**
   * Save changes to backend
   */
  const handleSave = useCallback(async () => {
    if (!primaryCategory) {
      setMessage({
        type: 'error',
        text: 'Please select a primary category before saving.',
      });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/vendor/update-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          primaryCategorySlug: primaryCategory,
          secondaryCategories,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update categories');
      }

      setMessage({
        type: 'success',
        text: '✅ Categories updated successfully!',
      });
      setHasChanges(false);

      // Call parent callback
      await onSave({
        primary: primaryCategory,
        secondary: secondaryCategories,
      });
    } catch (error) {
      console.error('Error updating categories:', error);
      setMessage({
        type: 'error',
        text: `Error: ${error.message || 'Failed to update categories'}`,
      });
    } finally {
      setIsSaving(false);
    }
  }, [primaryCategory, secondaryCategories, vendorId, onSave]);

  /**
   * Reset to initial values
   */
  const handleReset = useCallback(() => {
    setPrimaryCategory(initialPrimary);
    setSecondaryCategories(initialSecondary);
    setHasChanges(false);
    setMessage({ type: '', text: '' });
  }, [initialPrimary, initialSecondary]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Service Categories</h2>
        <p className="text-gray-600 text-sm mt-1">
          Update the categories where you offer services. This helps customers find you.
        </p>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Category Selector Component */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CategorySelector
          primaryCategory={primaryCategory}
          secondaryCategories={secondaryCategories}
          onPrimaryChange={handlePrimaryChange}
          onSecondaryChange={handleSecondaryChange}
          maxSecondaryCategories={5}
          showDescription={true}
        />
      </div>

      {/* Summary */}
      {primaryCategory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              <strong>Primary Category:</strong> {primaryCategory}
            </li>
            {secondaryCategories.length > 0 && (
              <li>
                <strong>Secondary Categories:</strong> {secondaryCategories.join(', ')}
              </li>
            )}
            {secondaryCategories.length === 0 && (
              <li className="text-gray-600">
                No secondary categories selected (optional)
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {hasChanges && (
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700"
          >
            <X className="w-4 h-4 inline mr-2" />
            Reset
          </button>
        )}

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isSaving || !primaryCategory}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium ml-auto flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}

        {!hasChanges && (
          <div className="ml-auto text-sm text-gray-600">
            No unsaved changes
          </div>
        )}
      </div>
    </div>
  );
}
