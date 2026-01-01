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
              relative w-full border-2 border-dashed rounded-lg p-6
              transition-all cursor-pointer
              ${uploading ? 'border-gray-300 bg-gray-50' : 'border-orange-300 hover:border-orange-500 hover:bg-orange-50'}
              ${error ? 'border-red-300 bg-red-50' : ''}
            `}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              {uploading ? (
                <>
                  <Loader className="w-8 h-8 text-orange-500 animate-spin" />
                  <p className="text-sm font-medium text-gray-700">Uploading...</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-orange-500" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, WebP, GIF up to {maxSize}MB
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
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Uploaded images */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              Reference Images ({images.length}/{maxImages})
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image, idx) => (
              <div
                key={image.key || idx}
                className="relative group"
              >
                {/* Image thumbnail */}
                <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.fileUrl}
                    alt={image.fileName}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Overlay with remove button */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => handleRemoveImage(image.key)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors"
                    title="Remove image"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* File info tooltip */}
                <div className="absolute -bottom-12 left-0 right-0 hidden group-hover:block">
                  <div className="bg-gray-900 text-white text-xs rounded p-2 whitespace-nowrap">
                    <p className="truncate">{image.fileName}</p>
                    <p className="text-gray-300">{formatFileSize(image.size)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Image metadata */}
          {images.length > 0 && (
            <div className="text-xs text-gray-600 space-y-1">
              <p>📦 All images stored in AWS S3</p>
              <p>✅ Images will be included in your RFQ submission</p>
            </div>
          )}
        </div>
      )}

      {/* Info message */}
      {images.length === 0 && !uploading && (
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Reference Images (Optional)</p>
            <p>Upload photos, plans, or documents to help vendors better understand your project.</p>
          </div>
        </div>
      )}
    </div>
  );
}
