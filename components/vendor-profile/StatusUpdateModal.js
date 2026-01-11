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

  // Compress image using canvas
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
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
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
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

      const { presignedUrl } = await presignResponse.json();
      console.log('✅ Got presigned URL');

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

      // Extract S3 URL from presigned URL (remove query parameters)
      const s3Url = presignedUrl.split('?')[0];
      console.log('✅ Uploaded to S3:', s3Url);

      return s3Url;
    } catch (err) {
      console.error('❌ S3 upload error:', err);
      throw err;
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uploadedUrls = [];

      // Sequential uploads to prevent overload
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileKey = `${Date.now()}-${i}`;

        try {
          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => {
            setPreviewUrls((prev) => [...prev, e.target.result]);
          };
          reader.readAsDataURL(file);

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
          setError(`Failed to upload image ${i + 1}: ${err.message}`);
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[fileKey];
            return newProgress;
          });
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
    if (!content.trim()) {
      setError('Please write something in your update');
      return;
    }

    setLoading(true);
    try {
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

      const { update } = await response.json();

      setContent('');
      setImages([]);
      setPreviewUrls([]);
      setError(null);

      if (onSuccess) {
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
