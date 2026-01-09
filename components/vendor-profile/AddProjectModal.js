'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Upload,
  Loader,
  Trash2,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function AddProjectModal({
  vendorId,
  vendorPrimaryCategory,
  isOpen = false,
  onClose = () => {},
  onSuccess = () => {},
}) {
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    categorySlug: vendorPrimaryCategory || '',
    description: '',
    photos: [], // Array of { file, type, caption, preview }
    budgetMin: '',
    budgetMax: '',
    timeline: '',
    location: '',
    isPublished: true,
  });

  // Loading & errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // Categories list (from vendor categories - this should match what's in your app)
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

  const photoTypes = [
    { value: 'before', label: 'Before', emoji: '📸' },
    { value: 'during', label: 'During', emoji: '⏳' },
    { value: 'after', label: 'After', emoji: '✨' },
  ];

  // Step 1: Title
  const handleTitleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      title: e.target.value.slice(0, 100),
    }));
    setError('');
  };

  // Step 2: Category
  const handleCategoryChange = (categorySlug) => {
    setFormData((prev) => ({ ...prev, categorySlug }));
    setError('');
  };

  // Step 3: Description
  const handleDescriptionChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      description: e.target.value.slice(0, 500),
    }));
    setError('');
  };

  // Step 4: Photo Upload
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check limits
    if (formData.photos.length + files.length > 12) {
      setError('Maximum 12 photos allowed per project');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newPhotos = [];

      for (const file of files) {
        // Validate image file
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed');
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          // 5MB limit
          setError(`${file.name} is too large (max 5MB)`);
          continue;
        }

        // Create preview
        const preview = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });

        const previewUrl = await preview;

        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const filename = `${timestamp}-${random}-${file.name}`;

        newPhotos.push({
          id: `${timestamp}-${random}`,
          file,
          filename,
          type: 'after', // Default type
          caption: '',
          preview: previewUrl,
          isUploaded: false,
        });

        // Upload to Supabase
        setUploadProgress((prev) => ({ ...prev, [filename]: 0 }));

        try {
          const { data, error: uploadError } = await supabase.storage
            .from('portfolio-images')
            .upload(`${vendorId}/${filename}`, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: publicUrl } = supabase.storage
            .from('portfolio-images')
            .getPublicUrl(`${vendorId}/${filename}`);

          if (publicUrl?.publicUrl) {
            setFormData((prev) => ({
              ...prev,
              photos: prev.photos.map((p) =>
                p.id === `${timestamp}-${random}`
                  ? { ...p, imageUrl: publicUrl.publicUrl, isUploaded: true }
                  : p
              ),
            }));
          }

          setUploadProgress((prev) => {
            const updated = { ...prev };
            delete updated[filename];
            return updated;
          });
        } catch (uploadErr) {
          console.error('Upload failed:', uploadErr);
          setError(`Failed to upload ${file.name}`);
          newPhotos.pop();
        }
      }

      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos],
      }));
    } catch (err) {
      console.error('Photo processing failed:', err);
      setError('Failed to process photos. Please try again.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePhotoTypeChange = (photoId, newType) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.map((p) =>
        p.id === photoId ? { ...p, type: newType } : p
      ),
    }));
  };

  const handlePhotoCaption = (photoId, caption) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.map((p) =>
        p.id === photoId ? { ...p, caption: caption.slice(0, 100) } : p
      ),
    }));
  };

  const removePhoto = (photoId) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== photoId),
    }));
  };

  // Step 5: Optional Details
  const handleOptionalChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  // Step 6: Publish
  const handlePublishToggle = () => {
    setFormData((prev) => ({
      ...prev,
      isPublished: !prev.isPublished,
    }));
  };

  // Validate & proceed
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim().length > 0;
      case 2:
        return formData.categorySlug.length > 0;
      case 3:
        return formData.description.trim().length > 0;
      case 4:
        // Photos are now optional - allow proceeding with no photos
        return formData.photos.length === 0 || formData.photos.every((p) => p.isUploaded);
      case 5:
        return true; // Optional details
      case 6:
        return true; // Final step
      default:
        return false;
    }
  };

  const proceedToNext = () => {
    if (canProceed() && currentStep < 6) {
      setCurrentStep(currentStep + 1);
      setError('');
    } else if (currentStep === 6 && canProceed()) {
      submitProject();
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  // Submit project
  const submitProject = async () => {
    if (!formData.title.trim() || !formData.categorySlug || !formData.description.trim()) {
      setError('Please fill in title, category, and description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create project
      const projectResponse = await fetch('/api/portfolio/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          title: formData.title.trim(),
          categorySlug: formData.categorySlug,
          description: formData.description.trim(),
          budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : null,
          budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : null,
          timeline: formData.timeline || null,
          location: formData.location || null,
          status: formData.isPublished ? 'published' : 'draft',
        }),
      });

      if (!projectResponse.ok) {
        const result = await projectResponse.json();
        throw new Error(result.message || 'Failed to create project');
      }

      const { project } = await projectResponse.json();

      // Create images
      const imagePromises = formData.photos.map((photo) =>
        fetch('/api/portfolio/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: project.id,
            imageUrl: photo.imageUrl,
            imageType: photo.type,
            caption: photo.caption || null,
            displayOrder: formData.photos.indexOf(photo),
          }),
        })
      );

      const imageResponses = await Promise.all(imagePromises);
      for (const res of imageResponses) {
        if (!res.ok) {
          throw new Error('Failed to save some images');
        }
      }

      // Success!
      setFormData({
        title: '',
        categorySlug: vendorPrimaryCategory || '',
        description: '',
        photos: [],
        budgetMin: '',
        budgetMax: '',
        timeline: '',
        location: '',
        isPublished: true,
      });
      setCurrentStep(1);
      
      if (onSuccess) {
        onSuccess(project);
      }
      onClose();
    } catch (err) {
      console.error('Project submission failed:', err);
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Title</h3>
            <p className="text-sm text-gray-600">Give your project a clear, descriptive title</p>
            <input
              type="text"
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="e.g., 3-Bedroom Bungalow with Modern Kitchen"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              maxLength="100"
            />
            <div className="text-xs text-gray-500 text-right">{formData.title.length}/100</div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Service Category</h3>
            <p className="text-sm text-gray-600">What category does this project belong to?</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`p-3 border rounded-lg text-left transition ${
                    formData.categorySlug === cat.slug
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-300 hover:border-amber-300'
                  }`}
                >
                  <div className="text-xl mb-1">{cat.emoji}</div>
                  <div className="text-xs font-medium text-gray-900">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Description</h3>
            <p className="text-sm text-gray-600">Briefly describe what was done and key features</p>
            <textarea
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="e.g., Built a modern 3-bedroom bungalow with open-plan kitchen, tiled throughout, and modern fixtures. Project took 6 months and included electrical, plumbing, and finishing work."
              rows="6"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              maxLength="500"
            />
            <div className="text-xs text-gray-500 text-right">{formData.description.length}/500</div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Photos</h3>
            <p className="text-sm text-gray-600">Upload before, during, and after photos (max 12)</p>

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-dashed border-amber-300 rounded-lg hover:bg-amber-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              <span>{loading ? 'Uploading...' : 'Click to upload or drag and drop'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={loading}
              className="hidden"
            />

            {/* Photos Grid */}
            {formData.photos.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700">
                  {formData.photos.length} photo{formData.photos.length !== 1 ? 's' : ''} uploaded
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {formData.photos.map((photo) => (
                    <div key={photo.id} className="space-y-2">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={photo.preview}
                          alt="Upload preview"
                          className="w-full h-full object-cover"
                        />
                        {!photo.isUploaded && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                        <button
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Photo Type Selector */}
                      <div className="flex gap-1">
                        {photoTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => handlePhotoTypeChange(photo.id, type.value)}
                            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition ${
                              photo.type === type.value
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {type.emoji} {type.label}
                          </button>
                        ))}
                      </div>

                      {/* Caption */}
                      <input
                        type="text"
                        value={photo.caption}
                        onChange={(e) => handlePhotoCaption(photo.id, e.target.value)}
                        placeholder="Optional caption..."
                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                        maxLength="100"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Optional Details</h3>
            <p className="text-sm text-gray-600">Help customers understand the scope (all optional)</p>

            <div className="space-y-3">
              {/* Budget Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Range (KES)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => handleOptionalChange('budgetMin', e.target.value)}
                    placeholder="Min (e.g., 300000)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-gray-500 flex items-center">to</span>
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => handleOptionalChange('budgetMax', e.target.value)}
                    placeholder="Max (e.g., 600000)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeline (e.g., "6 months")
                </label>
                <input
                  type="text"
                  value={formData.timeline}
                  onChange={(e) => handleOptionalChange('timeline', e.target.value)}
                  placeholder="e.g., 6 months, 3 weeks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location (e.g., "Nairobi, Westlands")
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleOptionalChange('location', e.target.value)}
                  placeholder="e.g., Nairobi, Westlands"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Review & Publish</h3>
            <p className="text-sm text-gray-600">Review your project before publishing</p>

            {/* Project Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase">Title</div>
                <div className="text-gray-900 font-medium">{formData.title}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase">Category</div>
                <div className="text-gray-900">
                  {categories.find((c) => c.slug === formData.categorySlug)?.label}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase">Description</div>
                <div className="text-sm text-gray-700 line-clamp-3">{formData.description}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase">Photos</div>
                <div className="text-gray-900">{formData.photos.length} photo(s)</div>
              </div>
              {formData.budgetMin || formData.budgetMax ? (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Budget</div>
                  <div className="text-gray-900">
                    KES {parseInt(formData.budgetMin).toLocaleString()}–
                    {parseInt(formData.budgetMax).toLocaleString()}
                  </div>
                </div>
              ) : null}
              {formData.timeline && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Timeline</div>
                  <div className="text-gray-900">{formData.timeline}</div>
                </div>
              )}
              {formData.location && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">Location</div>
                  <div className="text-gray-900">{formData.location}</div>
                </div>
              )}
            </div>

            {/* Publish Toggle */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {formData.isPublished ? '✨ Publish Now' : '📝 Save as Draft'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formData.isPublished
                      ? 'This project will be visible to customers immediately'
                      : 'Save as draft to complete or edit later'}
                  </div>
                </div>
                <button
                  onClick={handlePublishToggle}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    formData.isPublished ? 'bg-amber-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                      formData.isPublished ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isLoading = loading || Object.keys(uploadProgress).length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Portfolio Project</h2>
            <p className="text-sm text-gray-600">Step {currentStep} of 6</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded transition disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1 rounded-full transition ${
                  step <= currentStep ? 'bg-amber-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={goBack}
            disabled={currentStep === 1 || isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={proceedToNext}
            disabled={!canProceed() || isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
            <span>{currentStep === 6 ? 'Publish Project' : 'Next'}</span>
            {currentStep < 6 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
