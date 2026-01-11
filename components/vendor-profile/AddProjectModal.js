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

  // Helper: Compress image before upload
  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1920; // Max width for compressed image
          const maxHeight = 1440; // Max height
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              // Create a new File object from the compressed blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.85 // 85% quality
          );
        };
      };
    });
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

      // Get session token once for all uploads
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session || !session.access_token) {
        throw new Error('Not authenticated - please log in again');
      }

      // Validate all files first
      const validatedFiles = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError(`${file.name} is too large (max 10MB)`);
          continue;
        }
        validatedFiles.push(file);
      }

      if (validatedFiles.length === 0) {
        setLoading(false);
        return;
      }

      // Step 1: Compress all images in parallel
      console.log(`📦 Compressing ${validatedFiles.length} images...`);
      const compressionPromises = validatedFiles.map(async (file) => {
        const compressed = await compressImage(file);
        console.log(
          `✅ ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB`
        );
        return { originalFile: file, compressedFile: compressed };
      });

      const compressedFiles = await Promise.all(compressionPromises);

      // Step 2: Get all presigned URLs in parallel
      console.log(`🔑 Requesting ${compressedFiles.length} presigned URLs...`);
      const presignedPromises = compressedFiles.map(async ({ originalFile, compressedFile }) => {
        const timestamp = Date.now() + Math.random(); // Unique timestamp
        const random = Math.random().toString(36).substring(7);
        const filename = `${Math.floor(timestamp)}-${random}-${originalFile.name}`;
        const photoId = `${Math.floor(timestamp)}-${random}`;

        const presignedResponse = await fetch('/api/portfolio/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            fileName: filename,
            contentType: 'image/jpeg',
          }),
        });

        if (!presignedResponse.ok) {
          const result = await presignedResponse.json();
          throw new Error(result.error || `Failed to get URL for ${originalFile.name}`);
        }

        const { uploadUrl, fileUrl, key } = await presignedResponse.json();
        return { filename, photoId, originalFile, compressedFile, uploadUrl, fileUrl, key };
      });

      const presignedUrls = await Promise.all(presignedPromises);

      // Step 3: Upload all files to S3 in parallel
      console.log(`📤 Uploading ${presignedUrls.length} files to S3...`);
      const uploadPromises = presignedUrls.map(async ({
        filename,
        photoId,
        originalFile,
        compressedFile,
        uploadUrl,
        fileUrl,
        key,
      }) => {
        try {
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'image/jpeg',
            },
            body: compressedFile,
          });

          if (!uploadResponse.ok) {
            throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
          }

          // Create preview
          const preview = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(originalFile);
          });

          return {
            id: photoId,
            filename,
            type: 'after',
            caption: '',
            preview,
            isUploaded: true,
            imageUrl: fileUrl,
            s3Key: key,
          };
        } catch (uploadErr) {
          console.error(`Upload failed for ${originalFile.name}:`, uploadErr);
          setError(`Failed to upload ${originalFile.name}: ${uploadErr.message}`);
          return null;
        }
      });

      const uploadedPhotos = await Promise.all(uploadPromises);
      const validPhotos = uploadedPhotos.filter((p) => p !== null);

      console.log(`✅ Successfully uploaded ${validPhotos.length} photos`);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...validPhotos],
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
        // IMAGES ARE NOW REQUIRED - at least 1 photo must be uploaded
        return formData.photos.length > 0 && formData.photos.every((p) => p.isUploaded);
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

    // IMAGES ARE REQUIRED
    if (formData.photos.length === 0) {
      setError('At least one photo is required to create a portfolio project');
      return;
    }

    if (!formData.photos.every((p) => p.isUploaded)) {
      setError('All photos must finish uploading before submitting');
      return;
    }

    setLoading(true);
    setError('');
    setError('');

    try {
      // Create project
      const projectPayload = {
        vendorId,
        title: formData.title.trim(),
        categorySlug: formData.categorySlug,
        description: formData.description.trim(),
        budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : null,
        budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : null,
        timeline: formData.timeline || null,
        location: formData.location || null,
        status: formData.isPublished ? 'published' : 'draft',
      };

      console.log('📤 Sending project data:', projectPayload);

      const projectResponse = await fetch('/api/portfolio/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectPayload),
      });

      console.log('📥 Project response status:', projectResponse.status);
      const projectResult = await projectResponse.json();
      console.log('📥 Project response:', projectResult);

      if (!projectResponse.ok) {
        throw new Error(projectResult.message || 'Failed to create project');
      }

      const { project } = projectResult;

      // Create images sequentially (not in parallel) to avoid overwhelming the serverless function
      console.log(`📤 Uploading ${formData.photos.length} images sequentially...`);
      for (let i = 0; i < formData.photos.length; i++) {
        const photo = formData.photos[i];
        console.log(`📤 Uploading image ${i + 1}/${formData.photos.length}...`);
        
        const imageResponse = await fetch('/api/portfolio/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: project.id,
            imageUrl: photo.imageUrl,
            imageType: photo.type,
            caption: photo.caption || null,
            displayOrder: i,
          }),
        });

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json();
          console.error(`❌ Image ${i + 1} upload failed:`, errorData);
          throw new Error(`Failed to save image ${i + 1}: ${errorData.message || 'Unknown error'}`);
        }
        
        const imageData = await imageResponse.json();
        console.log(`✅ Image ${i + 1} saved successfully:`, imageData);
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Project Photos</h3>
                <p className="text-sm text-gray-600">Upload before, during, and after photos (max 12)</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                ⚠️ Required
              </span>
            </div>

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
