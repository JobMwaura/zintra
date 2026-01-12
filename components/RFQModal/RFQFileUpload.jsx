'use client';

import { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Loader, File, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

/**
 * RFQFileUpload Component
 * 
 * Allows users to upload files and documents for RFQ creation and responses.
 * Supports images, PDFs, Word documents, Excel sheets, and ZIP files.
 * Files are uploaded directly to AWS S3 via presigned URLs.
 * 
 * Props:
 *   - onUpload: Callback when file is successfully uploaded
 *   - onRemove: Callback when file is removed
 *   - files: Array of uploaded files
 *   - maxFiles: Maximum number of files allowed (default: 10)
 *   - maxSize: Maximum file size in MB (default: 50)
 *   - uploadType: 'rfq-attachment' | 'vendor-response' | 'form-field' (default: 'rfq-attachment')
 *   - allowedTypes: Custom MIME types (optional)
 */
export default function RFQFileUpload({
  onUpload = () => {},
  onRemove = () => {},
  files = [],
  maxFiles = 10,
  maxSize = 50,
  uploadType = 'rfq-attachment',
  allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const maxSizeBytes = maxSize * 1024 * 1024;

  /**
   * Get file type icon
   */
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (!selectedFiles.length) return;

    for (const file of selectedFiles) {
      // Check if max files reached
      if (files.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        const allowedExtensions = allowedTypes
          .map(t => t.split('/')[1].toUpperCase())
          .join(', ');
        setError(`Invalid file type "${file.type.split('/')[1].toUpperCase()}". Allowed: ${allowedExtensions}`);
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
      // Get the user's session token for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Not authenticated. Please log in to upload files.');
      }

      // Step 1: Get presigned URL from our API
      const presignedResponse = await fetch('/api/rfq/upload-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadType,
        }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const { uploadUrl, fileUrl, key } = await presignedResponse.json();

      // Step 2: Upload file directly to S3 with progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      // Return promise for async handling
      await new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

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
      console.error('❌ File upload error:', err);
      setError(err.message || 'Failed to upload file. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-blue-50', 'border-blue-300');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      const event = {
        target: { files: droppedFiles },
      };
      handleFileSelect(event);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Section */}
      {files.length < maxFiles && (
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
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative rounded-xl border-2 border-dashed p-8 text-center
              transition-all cursor-pointer
              ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50'}
              ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'}
            `}
          >
            {uploading ? (
              <>
                <Loader className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
                <p className="text-sm font-medium text-gray-700">Uploading... {uploadProgress}%</p>
                {/* Progress bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, Images, Documents up to {maxSize}MB
                </p>
              </>
            )}
          </div>

          {/* Info message */}
          {files.length === 0 && !uploading && !error && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <Upload className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 leading-relaxed">
                <p className="font-medium text-blue-900">Upload supporting documents (optional)</p>
                <p className="text-xs mt-1 text-blue-600">
                  PDFs, quotes, BOQ, datasheets, photos, and more help get better responses
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900 font-medium">{error}</p>
        </div>
      )}

      {/* Uploaded files */}
      {files.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">
              {files.length} file{files.length !== 1 ? 's' : ''} uploaded
            </h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {files.length}/{maxFiles}
            </span>
          </div>

          <div className="space-y-2">
            {files.map((file, idx) => (
              <div
                key={file.key || idx}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                {/* File icon */}
                <div className="text-gray-600 flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Success badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                  <button
                    onClick={() => onRemove(file.key)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
