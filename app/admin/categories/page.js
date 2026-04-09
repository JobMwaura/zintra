'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit2, Trash2, Search, FolderOpen, ArrowLeft, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showMessage('Error loading categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        icon: category.icon || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug when name changes
      ...(name === 'name' ? { slug: generateSlug(value) } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showMessage('Category name is required', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || generateSlug(formData.name),
        description: formData.description.trim() || null,
        icon: formData.icon.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingCategory.id);

        if (error) throw error;
        showMessage('Category updated successfully!', 'success');
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([payload]);

        if (error) throw error;
        showMessage('Category created successfully!', 'success');
      }

      handleCloseModal();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showMessage(error.message || 'Failed to save category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showMessage('Category deleted successfully!', 'success');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showMessage(error.message || 'Failed to delete category. It may be in use.', 'error');
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Link href="/admin/dashboard" className="hover:text-gray-900">Admin</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Categories</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage product and service categories</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Categories</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : categories.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : categories.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Search className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Filtered</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : filteredCategories.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Add Button */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search categories by name, slug, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </div>

        {/* Categories Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Loader className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No categories found' : 'No categories yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by creating your first category'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => handleOpenModal()}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
              >
                Add Category
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Icon
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <FolderOpen className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{category.name}</p>
                          <p className="text-xs text-gray-500">{new Date(category.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {category.slug || '-'}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {category.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{category.icon || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id, category.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Architectural & Design"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slug (URL-friendly identifier)
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g., architectural_design"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated from name if left blank</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Icon (Lucide icon name)
                </label>
                <input
                  type="text"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  placeholder="e.g., Hammer, Wrench, Package"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find icons at <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">lucide.dev</a>
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingCategory ? 'Update Category' : 'Create Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
