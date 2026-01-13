'use client';

import React, { useState, useRef, useMemo } from 'react';
import { X, Trash2, Upload, Loader } from 'lucide-react';

/**
 * EditPortfolioProjectModal Component
 * 
 * Allows editing:
 * - Project title, description, category
 * - Status (draft/published)
 * - Budget, timeline, location, completion date
 * - Add/remove images
 */
export default function EditPortfolioProjectModal({
  isOpen = false,
  project = null,
  onClose = () => {},
  onSave = () => {},
  onDelete = () => {},
}) {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    categorySlug: project?.categorySlug || '',
    status: project?.status || 'published',
    budgetMin: project?.budgetMin || '',
    budgetMax: project?.budgetMax || '',
    timeline: project?.timeline || '',
    location: project?.location || '',
    completionDate: project?.completionDate ? new Date(project.completionDate).toISOString().split('T')[0] : '',
    isFeatured: project?.isFeatured || false,
  });

  const [images, setImages] = useState(project?.images || []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const categories = [
    { slug: 'building-and-masonry', label: 'Building & Masonry', emoji: '🏗️' },
    { slug: 'carpentry-and-finishes', label: 'Carpentry & Finishes', emoji: '🪵' },
    { slug: 'electrical', label: 'Electrical', emoji: '⚡' },
    { slug: 'plumbing', label: 'Plumbing', emoji: '🔧' },
    { slug: 'painting', label: 'Painting', emoji: '🎨' },
    { slug: 'roofing', label: 'Roofing', emoji: '🏠' },
    { slug: 'landscaping', label: 'Landscaping', emoji: '🌳' },
    { slug: 'general-contractor', label: 'General Contractor', emoji: '👷' },
    { slug: 'interior-design', label: 'Interior Design', emoji: '🛋️' },
    { slug: 'renovation', label: 'Renovation', emoji: '🔨' },
  ];

  const canSave = useMemo(() => {
    return formData.title.trim() && formData.description.trim() && images.length > 0;
  }, [formData, images]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRemoveImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      await onSave({
        ...formData,
        budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : null,
        budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : null,
        images,
      });
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete project: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 flex items-center justify-between p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Edit Project</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g., 3-Bedroom Modern Home"
                maxLength="100"
              />
              <p className="text-xs text-slate-500 mt-1">{formData.title.length}/100</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleInputChange('categorySlug', cat.slug)}
                    className={`p-3 border rounded-lg text-left transition ${
                      formData.categorySlug === cat.slug
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-300 hover:border-amber-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{cat.emoji}</div>
                    <div className="text-xs font-medium text-slate-900">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                rows="5"
                placeholder="Describe the project..."
                maxLength="500"
              />
              <p className="text-xs text-slate-500 mt-1">{formData.description.length}/500</p>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Images * ({images.length})
              </label>
              
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group">
                      <img
                        src={img.imageUrl}
                        alt={img.imageType}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <button
                          onClick={() => handleRemoveImage(img.id)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute top-1 right-1 bg-black/70 text-white px-2 py-0.5 rounded text-xs font-semibold capitalize">
                        {img.imageType}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-amber-500 hover:text-amber-600 transition text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Add More Images
              </button>
              <input ref={fileInputRef} type="file" multiple accept="image/*" hidden />
            </div>

            {/* Budget */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Budget Min (KES)
                </label>
                <input
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => handleInputChange('budgetMin', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Budget Max (KES)
                </label>
                <input
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => handleInputChange('budgetMax', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., 200000"
                />
              </div>
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Timeline
              </label>
              <input
                type="text"
                value={formData.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g., 3 months"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g., Nairobi, Kenya"
              />
            </div>

            {/* Completion Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Completion Date
              </label>
              <input
                type="date"
                value={formData.completionDate}
                onChange={(e) => handleInputChange('completionDate', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Status
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={formData.status === 'draft'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  />
                  <span className="text-sm text-slate-700">Draft</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={formData.status === 'published'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  />
                  <span className="text-sm text-slate-700">Published</span>
                </label>
              </div>
            </div>

            {/* Featured Project */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="w-5 h-5 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-amber-900">⭐ Featured Project</span>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Featured projects appear first in your portfolio
                  </p>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
