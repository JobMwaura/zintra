// Image Upload Component for Vendor Profiles
// Handles file selection, validation, upload to S3, and preview

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

/**
 * VendorImageUpload Component
 * Provides image upload functionality with preview and progress tracking
 *
 * @param {string} vendorId - The vendor ID for authorization
 * @param {function} onUploadSuccess - Callback when upload completes successfully
 * @param {function} onUploadError - Callback if upload fails
 * @param {object} options - Configuration options
 */
export default function VendorImageUpload({
  vendorId,
  onUploadSuccess,
  onUploadError,
  options = {},
}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    label = 'Upload Profile Image',
  } = options;

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Reset messages
    setError(null);
    setSuccess(false);

    // Validate file
    if (selectedFile.size > maxSize) {
      setError(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
      return;
    }

    if (!allowedTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    // Set file and preview
    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  /**
   * Upload file to S3 using presigned URL
   */
  const handleUpload = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Step 1: Get presigned URL from our API
      const presignedResponse = await fetch('/api/vendor/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          vendorId,
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, fileUrl, key } = await presignedResponse.json();

      // Step 2: Upload file directly to S3 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Step 3: Call success callback with file info
      setSuccess(true);
      setProgress(100);
      setFile(null);
      setPreview(null);

      if (onUploadSuccess) {
        onUploadSuccess({
          fileUrl,
          key,
          fileName: file.name,
          size: file.size,
          type: file.type,
        });
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        setProgress(0);
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');

      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
    }
  };

  /**
   * Clear selected file and preview
   */
  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{label}</h3>

      {/* File Input */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="mb-4 relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✓ Upload successful!</p>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Uploading...
            </span>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex-1 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg
            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>

        <button
          onClick={handleClear}
          disabled={uploading}
          className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg
            hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Info */}
      <p className="mt-4 text-xs text-gray-500">
        Max size: {Math.round(maxSize / 1024 / 1024)}MB
        {/* {allowedTypes.map(t => t.split('/')[1]).join(', ')} */}
      </p>
    </div>
  );
}
