'use client';

import { useState } from 'react';
import { X, Image as ImageIcon, Heart, MessageCircle, Loader } from 'lucide-react';

export default function StatusUpdateModal({ vendor, onClose, onSuccess }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to create a fresh File object copy
  // This works around browser quirks where File objects become unreadable
  const cloneFile = async (file) => {
    try {
      console.log(`📋 Cloning file to work around browser quirks: ${file.name}`);
      
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Create a new Blob from the ArrayBuffer
      const blob = new Blob([arrayBuffer], { type: file.type });
      
      // Create a new File object from the Blob
      const clonedFile = new File([blob], file.name, {
        type: file.type,
        lastModified: file.lastModified,
      });
      
      console.log(`✅ File cloned successfully: ${clonedFile.name}`);
      return clonedFile;
    } catch (error) {
      console.error(`❌ Failed to clone file: ${error.message}`);
      // Return original file if cloning fails
      return file;
    }
  };

  // Helper function to read file with retry logic
  const readFileAsDataURL = (file, retries = 2) => {
    return new Promise((resolve, reject) => {
      const attemptRead = (attemptsLeft) => {
        console.log(`📖 Reading file: ${file.name} (${attemptsLeft} attempts left)`);
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
          if (!e.target || !e.target.result) {
            if (attemptsLeft > 0) {
              console.warn(`⚠️ Read succeeded but no result, retrying...`);
              setTimeout(() => attemptRead(attemptsLeft - 1), 200);
            } else {
              reject(new Error('Failed to read file: No data returned'));
            }
            return;
          }
          console.log(`✅ Successfully read file: ${file.name}`);
          resolve(e.target.result);
        };
        
        reader.onerror = (error) => {
          let errorMsg = 'Failed to read file';
          
          if (reader.error) {
            console.error(`❌ FileReader error:`, {
              name: reader.error.name,
              message: reader.error.message,
              code: reader.error.code
            });
            
            switch (reader.error.name) {
              case 'NotFoundError':
                errorMsg = 'File not found. The file may have been moved or deleted.';
                break;
              case 'SecurityError':
                errorMsg = 'Security error reading file. Please try a different file.';
                break;
              case 'NotReadableError':
                errorMsg = 'File is not readable. The file might be corrupted or locked by another program.';
                break;
              case 'AbortError':
                errorMsg = 'File read was aborted. Please try again.';
                break;
              default:
                errorMsg = `Failed to read file: ${reader.error.message || 'Unknown error'}`;
            }
          }
          
          // Retry on failure
          if (attemptsLeft > 0 && reader.error?.name !== 'SecurityError') {
            console.warn(`⚠️ Read failed, retrying in 200ms... (${attemptsLeft} attempts left)`);
            setTimeout(() => attemptRead(attemptsLeft - 1), 200);
          } else {
            reject(new Error(errorMsg));
          }
        };
        
        try {
          reader.readAsDataURL(file);
        } catch (error) {
          if (attemptsLeft > 0) {
            console.warn(`⚠️ Exception reading file, retrying...`);
            setTimeout(() => attemptRead(attemptsLeft - 1), 200);
          } else {
            reject(new Error('Failed to read file: ' + error.message));
          }
        }
      };
      
      attemptRead(retries);
    });
  };

  // Compress image using canvas
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      // Validate file first
      if (!file || !file.type || !file.type.startsWith('image/')) {
        reject(new Error('Invalid image file'));
        return;
      }

      console.log(`🔄 Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      // Add timeout to prevent indefinite hangs
      const timeoutId = setTimeout(() => {
        reject(new Error('File reading timed out. The file might be too large or inaccessible.'));
      }, 30000); // 30 second timeout

      // Use the retry helper to read the file
      readFileAsDataURL(file)
        .then((dataUrl) => {
          const img = new Image();
          img.src = dataUrl;
          
          img.onload = () => {
            try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Resize to max 1920x1440
            const maxWidth = 1920;
            const maxHeight = 1440;

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
            if (!ctx) {
              reject(new Error('Failed to create canvas context'));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              },
              'image/jpeg',
              0.85
            );
          } catch (error) {
            clearTimeout(timeoutId);
            reject(new Error('Failed to process image: ' + error.message));
          }
        };
        
        img.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error('Failed to load image'));
        };
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  };

  const uploadImageToS3 = async (file) => {
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;

    try {
      // Step 1: Get presigned URL from our API
      const presignResponse = await fetch('/api/status-updates/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''}`,
        },
        body: JSON.stringify({
          fileName: uniqueFilename,
          contentType: file.type || 'image/jpeg',
        }),
      });

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json();
        throw new Error(errorData.message || 'Failed to get presigned URL');
      }

      const { presignedUrl, fileKey } = await presignResponse.json();
      console.log('✅ Got presigned URL, fileKey:', fileKey);

      // Step 2: Upload directly to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'image/jpeg',
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
      }

      // Store the file key (not the full presigned URL) so we can generate fresh URLs later
      console.log('✅ Uploaded to S3, storing file key:', fileKey);

      return fileKey; // Return file key instead of presigned URL
    } catch (err) {
      console.error('❌ S3 upload error:', err);
      throw err;
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    // Reset file input to allow re-selecting the same file
    if (e.target) {
      e.target.value = '';
    }

    if (!files || files.length === 0) {
      return;
    }

    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    // Validate all files are valid images with detailed logging
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      console.log(`🔍 Validating file ${idx + 1}:`, {
        name: file?.name,
        type: file?.type,
        size: file?.size,
        lastModified: file?.lastModified,
        exists: !!file
      });
      
      if (!file || !file.type.startsWith('image/')) {
        setError('Please select only image files');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image files must be less than 10MB');
        return;
      }
      if (file.size === 0) {
        setError(`File "${file.name}" is empty. Please select a valid image file.`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    // Small delay to ensure file objects are stable after selection
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const uploadedUrls = [];

      // Sequential uploads to prevent overload
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        
        // Double-check file is still valid before processing
        if (!file || file.size === 0) {
          setError(`Image ${i + 1} is invalid or empty. Please select a valid image file.`);
          break;
        }
        
        const fileKey = `${Date.now()}-${i}`;

        try {
          // Clone file to work around browser File object quirks
          // This creates a fresh File object that's more reliably readable
          file = await cloneFile(file);
          
          // Create preview with retry logic
          console.log(`🖼️ Creating preview for file ${i + 1}: ${file.name}`);
          const previewUrl = await readFileAsDataURL(file);
          setPreviewUrls((prev) => [...prev, previewUrl]);
          console.log(`✅ Preview created for file ${i + 1}`);

          // Compress image
          setUploadProgress((prev) => ({
            ...prev,
            [fileKey]: 'Compressing...',
          }));

          const compressedFile = await compressImage(file);

          // Upload to S3
          setUploadProgress((prev) => ({
            ...prev,
            [fileKey]: 'Uploading...',
          }));

          const s3Url = await uploadImageToS3(compressedFile);
          uploadedUrls.push(s3Url);

          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[fileKey];
            return newProgress;
          });
        } catch (err) {
          console.error(`Error uploading file ${i + 1}:`, err);
          
          // Provide more specific error messages based on the error type
          let errorMessage = `Failed to upload image ${i + 1}: ${err.message}`;
          
          if (err.message.includes('Failed to read file')) {
            errorMessage = `Failed to read image ${i + 1}. The file might be corrupted, moved, or inaccessible. Please try selecting the file again or use a different image.`;
          } else if (err.message.includes('Failed to load image')) {
            errorMessage = `Failed to load image ${i + 1}. The file might not be a valid image or could be corrupted. Please try a different file.`;
          } else if (err.message.includes('Failed to compress image')) {
            errorMessage = `Failed to compress image ${i + 1}. The image might be in an unsupported format. Please try a JPG or PNG file.`;
          } else if (err.message.includes('Network')) {
            errorMessage = `Network error while uploading image ${i + 1}. Please check your internet connection and try again.`;
          }
          
          setError(errorMessage);
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[fileKey];
            return newProgress;
          });
          // Don't continue with remaining files if one fails
          break;
        }
      }

      if (uploadedUrls.length > 0) {
        setImages([...images, ...uploadedUrls]);
      }
    } finally {
      setLoading(false);
    }
  };


  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔔 Form submitted, loading state:', loading);
    if (loading) {
      console.warn('⚠️ Form already submitting, ignoring duplicate submit');
      return;
    }

    if (!content.trim()) {
      setError('Please write something in your update');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 POST /api/status-updates - Starting request');
      const response = await fetch('/api/status-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          content: content.trim(),
          images: images.length > 0 ? images : [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post update');
      }

      const responseData = await response.json();
      const { update } = responseData;

      console.log('✅ POST request completed, received update:', update.id);
      console.log('📸 Update images count:', update.images?.length || 0);

      setContent('');
      setImages([]);
      setPreviewUrls([]);
      setError(null);

      if (onSuccess) {
        console.log('🔔 Calling onSuccess with update:', update.id);
        onSuccess(update);
      }
      onClose();
    } catch (err) {
      console.error('Status update failed:', err);
      setError('Failed to post update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">Share an Update</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-slate-100 rounded disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Textarea */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              What's new with your business?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share updates about your business, special offers, achievements, or news..."
              maxLength={2000}
              disabled={loading}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none disabled:opacity-50"
              rows={6}
            />
            <p className="text-xs text-slate-500 mt-1">
              {content.length}/2000 characters
            </p>
          </div>

          {/* Image Preview Grid */}
          {(previewUrls.length > 0 || images.length > 0) && (
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-3">Images ({images.length}/5)</p>
              <div className="grid grid-cols-2 gap-3">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden">
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      disabled={loading}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded hover:bg-black/70 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([key, status]) => (
                <div key={key} className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>{status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Image Upload Button */}
          {images.length < 5 && (
            <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg hover:border-amber-400 cursor-pointer transition">
              <ImageIcon className="w-5 h-5 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">
                Add Images ({images.length}/5)
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={loading}
                className="hidden"
              />
            </label>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-5 h-5 animate-spin" />}
            {loading ? 'Posting...' : 'Post Update'}
          </button>
        </form>
      </div>
    </div>
  );
}
