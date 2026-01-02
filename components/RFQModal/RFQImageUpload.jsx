'use client';

import { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Image as ImageIcon, Loader } from 'lucide-react';

/**
 * RFQImageUpload Component
 * 
 * Allows users to upload reference images for RFQs
 * Images are uploaded directly to AWS S3 via presigned URLs
 * 
 * Props:
 *   - onUpload: Callback when image is successfully uploaded
 *   - onRemove: Callback when image is removed
 *   - images: Array of uploaded images with { fileUrl, key, fileName, size, uploadedAt }
 *   - maxImages: Maximum number of images allowed (default: 5)
 *   - maxSize: Maximum file size in MB (default: 10)
 */
export default function RFQImageUpload({
  onUpload = () => {},
  onRemove = () => {},
  images = [],
  maxImages = 5,
  maxSize = 10,
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSizeBytes = maxSize * 1024 * 1024;

  /**
   * Handle file selection
   */
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    
    if (!files.length) return;

    for (const file of files) {
      // Check if max images reached
      if (images.length >= maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type. Allowed: JPEG, PNG, WebP, GIF`);
        return;
      }

      // Validate file size
      if (file.size > maxSizeBytes) {
        setError(`File too large. Maximum: ${maxSize}MB`);
        return;
      }

      // Upload the file
      await uploadFile(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Upload file to S3
   */
  const uploadFile = async (file) => {
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL from our API
      const presignedResponse = await fetch('/api/rfq/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, fileUrl, key } = await presignedResponse.json();

      // Step 2: Upload file directly to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      // Step 3: Call onUpload callback with file info
      onUpload({
        fileUrl,
        key,
        fileName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      });

      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle image removal
   */
  const handleRemoveImage = (imageKey) => {
    onRemove(imageKey);
    setError(null);
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Section */}
      {images.length < maxImages && (
        <div className="w-full">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />

          {/* Upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative w-full border-2 border-dashed rounded-xl p-8 md:p-10
              transition-all cursor-pointer
              ${uploading 
                ? 'border-gray-300 bg-gray-50' 
                : error
                  ? 'border-red-300 bg-red-50 hover:border-red-400'
                  : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/50'
              }
            `}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              {uploading ? (
                <>
                  <Loader className="w-8 h-8 text-orange-500 animate-spin" />
                  <p className="text-sm font-semibold text-gray-900">Uploading...</p>
                  <div className="w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">{uploadProgress}%</p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100">
                    <Upload className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">
                      Click to upload
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      or drag and drop • PNG, JPG, WebP, GIF • Max {maxSize}MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900 font-medium">{error}</p>
        </div>
      )}

      {/* Uploaded images */}
      {images.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              {images.length} image{images.length !== 1 ? 's' : ''} uploaded
            </h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {images.length}/{maxImages}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image, idx) => (
              <div
                key={image.key || idx}
                className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square"
              >
                {/* Image thumbnail */}
                <img
                  src={image.fileUrl}
                  alt={image.fileName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Success badge */}
                <div className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white">
                  <Check className="w-4 h-4" />
                </div>

                {/* Overlay with remove button */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleRemoveImage(image.key)}
                    className="p-2.5 bg-red-600 hover:bg-red-700 rounded-full text-white transition-all hover:scale-110"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* File info tooltip */}
                <div className="absolute -bottom-16 left-0 right-0 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-lg">
                    <p className="truncate font-medium">{image.fileName}</p>
                    <p className="text-gray-400">{formatFileSize(image.size)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info message */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <span className="text-xs text-blue-700 leading-relaxed">
              ✅ Images will be sent to vendors with your RFQ
            </span>
          </div>
        </div>
      )}

      {/* Empty state message */}
      {images.length === 0 && !uploading && !error && (
        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <ImageIcon className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 leading-relaxed">
            <p className="font-medium text-gray-900">Add reference images (optional)</p>
            <p className="text-xs mt-1 text-gray-600">
              Photos, plans, or sketches help vendors understand your project better
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
