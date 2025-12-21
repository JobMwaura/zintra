'use client';

import { useState } from 'react';
import { X, Image as ImageIcon, Heart, MessageCircle, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function StatusUpdateModal({ vendor, onClose, onSuccess }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setLoading(true);
    try {
      const uploadedUrls = [];

      for (const file of files) {
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrls((prev) => [...prev, e.target.result]);
        };
        reader.readAsDataURL(file);

        // Upload to Supabase Storage
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('vendor-status-images')
          .upload(`${vendor.id}/${filename}`, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from('vendor-status-images')
          .getPublicUrl(`${vendor.id}/${filename}`);

        if (publicUrl?.publicUrl) {
          uploadedUrls.push(publicUrl.publicUrl);
        }
      }

      setImages([...images, ...uploadedUrls]);
      setError(null);
    } catch (err) {
      console.error('Image upload failed:', err);
      setError('Failed to upload images. Please try again.');
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
      const { data, error: insertError } = await supabase
        .from('vendor_status_updates')
        .insert({
          vendor_id: vendor.id,
          content: content.trim(),
          images: images.length > 0 ? images : null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setContent('');
      setImages([]);
      setPreviewUrls([]);
      setError(null);
      
      if (onSuccess) {
        onSuccess(data);
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
