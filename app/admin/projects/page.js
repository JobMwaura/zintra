'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit2, Trash2, Search, FileText, ArrowLeft, X, CheckCircle, AlertCircle, Loader, Eye, Star, MapPin, TrendingUp, Users, Image } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsAdmin() {
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'completed' | 'in_progress'
  const [featuredFilter, setFeaturedFilter] = useState('all'); // 'all' | 'featured' | 'regular'
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('vendor_portfolio_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, company_name, email, user_id');

      if (vendorsError) throw vendorsError;

      // Create vendor lookup map by user_id (since projects use vendor_id which is actually user_id)
      const vendorMap = {};
      vendorsData.forEach(v => {
        vendorMap[v.user_id] = v;
      });

      // Merge vendor info into projects
      const enrichedProjects = projectsData.map(project => ({
        ...project,
        vendor: vendorMap[project.vendor_id] || null
      }));

      setProjects(enrichedProjects);
      setVendors(vendorsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('Error loading projects', 'error');
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

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedProject(null);
  };

  const handleToggleFeatured = async (projectId, currentStatus) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('vendor_portfolio_projects')
        .update({ is_featured: !currentStatus })
        .eq('id', projectId);

      if (error) throw error;
      showMessage(`Project ${!currentStatus ? 'featured' : 'unfeatured'} successfully!`, 'success');
      fetchData();
    } catch (error) {
      console.error('Error updating project:', error);
      showMessage(error.message || 'Failed to update project', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleTogglePinned = async (projectId, currentStatus) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('vendor_portfolio_projects')
        .update({ is_pinned: !currentStatus })
        .eq('id', projectId);

      if (error) throw error;
      showMessage(`Project ${!currentStatus ? 'pinned' : 'unpinned'} successfully!`, 'success');
      fetchData();
    } catch (error) {
      console.error('Error updating project:', error);
      showMessage(error.message || 'Failed to update project', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProject = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vendor_portfolio_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showMessage('Project deleted successfully!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deleting project:', error);
      showMessage(error.message || 'Failed to delete project', 'error');
    }
  };

  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = 
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.category_slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.vendor?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    // Featured filter
    const matchesFeatured = 
      featuredFilter === 'all' || 
      (featuredFilter === 'featured' && project.is_featured) ||
      (featuredFilter === 'regular' && !project.is_featured);

    return matchesSearch && matchesStatus && matchesFeatured;
  });

  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'completed').length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    featured: projects.filter(p => p.is_featured).length,
    totalViews: projects.reduce((sum, p) => sum + (p.view_count || 0), 0),
  };

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
              <span className="text-gray-900 font-medium">Projects</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio Projects Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage vendor portfolio projects and showcase work</p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Featured</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.featured}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Views</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, description, category, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
              </select>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Projects</option>
                <option value="featured">Featured Only</option>
                <option value="regular">Regular Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Loader className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' || featuredFilter !== 'all'
                ? 'No projects found'
                : 'No projects yet'}
            </h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' || featuredFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Portfolio projects will appear here as vendors add them'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
                {/* Cover Image */}
                {project.cover_image_url ? (
                  <div className="h-48 bg-gray-200 relative">
                    <img 
                      src={project.cover_image_url} 
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                    {project.is_featured && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        Featured
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                    <Image className="w-16 h-16 text-gray-400" />
                    {project.is_featured && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        Featured
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  {/* Title & Status */}
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        project.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {project.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                      {project.is_pinned && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Pinned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {project.description || 'No description provided'}
                  </p>

                  {/* Vendor */}
                  <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 font-medium">
                      {project.vendor?.company_name || 'Unknown Vendor'}
                    </span>
                  </div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{project.view_count || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      <span>{project.media_count || 0} images</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleViewDetails(project)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleToggleFeatured(project.id, project.is_featured)}
                      disabled={updating}
                      className={`px-3 py-2 rounded-lg transition text-sm font-medium ${
                        project.is_featured
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={project.is_featured ? 'Unfeature' : 'Feature'}
                    >
                      <Star className={`w-4 h-4 ${project.is_featured ? 'fill-yellow-600' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id, project.title)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Project Details</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Cover Image */}
              {selectedProject.cover_image_url && (
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={selectedProject.cover_image_url} 
                    alt={selectedProject.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Title & Status */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{selectedProject.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedProject.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {selectedProject.status === 'completed' ? 'Completed' : 'In Progress'}
                  </span>
                  {selectedProject.is_featured && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-600" />
                      Featured
                    </span>
                  )}
                  {selectedProject.is_pinned && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      Pinned
                    </span>
                  )}
                </div>
              </div>

              {/* Vendor Info */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor</label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{selectedProject.vendor?.company_name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{selectedProject.vendor?.email || '-'}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedProject.description || 'No description provided'}
                </p>
              </div>

              {/* Project Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <p className="text-gray-900">{selectedProject.category_slug || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <p className="text-gray-900">
                    {selectedProject.county && selectedProject.area
                      ? `${selectedProject.area}, ${selectedProject.county}`
                      : selectedProject.county || selectedProject.area || '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Client Type</label>
                  <p className="text-gray-900 capitalize">{selectedProject.client_type || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Timeline</label>
                  <p className="text-gray-900">{selectedProject.timeline_type || '-'}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Views</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedProject.view_count || 0}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Saves</p>
                  <p className="text-2xl font-bold text-green-600">{selectedProject.save_count || 0}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Quote Requests</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedProject.quote_request_count || 0}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-sm text-gray-600">
                <p>Created: {new Date(selectedProject.created_at).toLocaleString()}</p>
                <p>Updated: {new Date(selectedProject.updated_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Close
              </button>
              <button
                onClick={() => handleToggleFeatured(selectedProject.id, selectedProject.is_featured)}
                disabled={updating}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium disabled:opacity-50"
              >
                {selectedProject.is_featured ? 'Unfeature' : 'Feature'}
              </button>
              <button
                onClick={() => handleTogglePinned(selectedProject.id, selectedProject.is_pinned)}
                disabled={updating}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
              >
                {selectedProject.is_pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={() => {
                  handleDeleteProject(selectedProject.id, selectedProject.title);
                  handleCloseModal();
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
