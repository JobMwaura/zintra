import React, { useState, useEffect } from 'react';

/**
 * RfqCategorySelector
 *
 * Displays all RFQ categories and filters templates by selected rfqType.
 * Returns the selected category slug and template.
 *
 * Props:
 * - categories: Array of category objects { slug, label }
 * - templates: Array of template objects { id, categorySlug, label, rfqTypes, ... }
 * - rfqType: Type of RFQ ('direct', 'wizard', 'public')
 * - onSelect: Callback when category/template selected: (category, template)
 * - onBack: Callback for back button
 * - disabled: Boolean to disable selection
 *
 * Flow:
 * 1. Show all categories (filtered to available ones for rfqType)
 * 2. On category click, show templates for that category
 * 3. On template select, call onSelect()
 */
const RfqCategorySelector = ({
  categories = [],
  templates = [],
  rfqType = 'direct',
  onSelect,
  onBack,
  disabled = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredTemplates, setFilteredTemplates] = useState([]);

  // When category changes, filter templates for that category + rfqType
  useEffect(() => {
    if (selectedCategory) {
      const categoryTemplates = templates.filter(
        (t) =>
          t.categorySlug === selectedCategory.slug &&
          t.rfqTypes.includes(rfqType)
      );
      setFilteredTemplates(categoryTemplates);
    }
  }, [selectedCategory, rfqType, templates]);

  // Get unique categories that have templates for this rfqType
  const availableCategories = React.useMemo(() => {
    const categorySlugs = new Set(
      templates
        .filter((t) => t.rfqTypes.includes(rfqType))
        .map((t) => t.categorySlug)
    );

    return categories.filter((cat) => categorySlugs.has(cat.slug));
  }, [categories, templates, rfqType]);

  // Category grid view
  const renderCategoryGrid = () => {
    return (
      <div className="space-y-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Category</h2>
          <p className="text-gray-600">
            Choose the category that best matches your project to get specific questions tailored for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableCategories.map((category) => {
            // Count templates for this category
            const templateCount = templates.filter(
              (t) =>
                t.categorySlug === category.slug &&
                t.rfqTypes.includes(rfqType)
            ).length;

            return (
              <button
                key={category.slug}
                onClick={() => !disabled && setSelectedCategory(category)}
                disabled={disabled}
                className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{category.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {templateCount} {templateCount === 1 ? 'template' : 'templates'}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {availableCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories available for this RFQ type.</p>
          </div>
        )}
      </div>
    );
  };

  // Template selection view (after category is selected)
  const renderTemplateSelection = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack ? () => { setSelectedCategory(null); onBack?.(); } : () => setSelectedCategory(null)}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium mb-2"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {selectedCategory?.label}
          </h2>
          <p className="text-gray-600">
            Select a template type for your {selectedCategory?.label.toLowerCase()} project.
          </p>
        </div>

        {filteredTemplates.length > 0 ? (
          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => !disabled && onSelect?.(selectedCategory, template)}
                disabled={disabled}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
              >
                <h3 className="font-semibold text-gray-900">{template.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="mt-3 flex items-center text-blue-600">
                  <span className="text-sm font-medium">Select</span>
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No templates available for this category.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {selectedCategory ? renderTemplateSelection() : renderCategoryGrid()}
    </div>
  );
};

export default RfqCategorySelector;
