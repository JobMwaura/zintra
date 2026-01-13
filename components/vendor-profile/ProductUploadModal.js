'use client';

import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { ALL_CATEGORIES_FLAT } from '@/lib/constructionCategories';

export default function ProductUploadModal({ vendor, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    unit: '',
    sale_price: '',
    offer_label: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  // Get session on mount
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setError('Product name and price are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        console.log('📸 Uploading product image to AWS S3:', imageFile.name);
        
        // Step 1: Get presigned URL from API
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const filename = `${Math.floor(timestamp)}-${random}-${imageFile.name}`;
        
        const presignedResponse = await fetch('/api/products/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            fileName: filename,
            contentType: imageFile.type,
          }),
        });

        if (!presignedResponse.ok) {
          const result = await presignedResponse.json();
          throw new Error(result.error || 'Failed to get presigned URL');
        }

        const { uploadUrl, fileUrl } = await presignedResponse.json();
        console.log('✅ Got presigned URL for product image');

        // Step 2: Upload file directly to S3
        const uploadResult = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile,
        });

        if (!uploadResult.ok) {
          throw new Error(`S3 upload failed with status ${uploadResult.status}`);
        }

        imageUrl = fileUrl;
        console.log('✅ Product image uploaded to S3:', imageUrl);
      }

      // Save product to database
      console.log('💾 Saving product to database:', {
        vendor_id: vendor.id,
        name: form.name,
        price: form.price,
        image_url: imageUrl,
      });

      const { data: product, error: saveError } = await supabase
        .from('vendor_products')
        .insert([
          {
            vendor_id: vendor.id,
            name: form.name,
            description: form.description,
            price: form.price,
            category: form.category,
            unit: form.unit || null,
            sale_price: form.sale_price || null,
            offer_label: form.offer_label || null,
            image_url: imageUrl,
            status: 'In Stock',
          },
        ])
        .select()
        .single();

      if (saveError) {
        console.error('❌ Database save error:', saveError);
        throw saveError;
      }

      console.log('✅ Product saved:', product);
      onSuccess(product);
    } catch (err) {
      console.error('❌ Product upload failed:', err);
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">Add Product</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Portland Cement Bag"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your product..."
              rows="3"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Price & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Price *
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder="e.g., per bag, per sq.ft"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
            >
              <option value="">Select a category...</option>
              {ALL_CATEGORIES_FLAT.map((cat) => (
                <option key={cat.label} value={cat.label}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sale Price & Offer Label */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Sale Price (optional)
              </label>
              <input
                type="number"
                name="sale_price"
                value={form.sale_price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Offer Label
              </label>
              <input
                type="text"
                name="offer_label"
                value={form.offer_label}
                onChange={handleChange}
                placeholder="e.g., Limited Time"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Product Image (optional)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-amber-300 transition cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-input"
              />
              <label htmlFor="image-input" className="cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  {imageFile ? imageFile.name : 'Click to upload image'}
                </p>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
