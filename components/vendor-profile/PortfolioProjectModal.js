'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, DollarSign, Clock, Heart, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

/**
 * PortfolioProjectModal Component
 * 
 * Displays full project details including:
 * - Image type filter (before, during, after)
 * - Image carousel
 * - Project metadata
 * - Save/Share and quote request buttons
 */
export default function PortfolioProjectModal({
  isOpen = false,
  project = null,
  onClose = () => {},
  onEdit = () => {},
  onShare = () => {},
  onRequestQuote = () => {},
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedImageType, setSelectedImageType] = useState('after');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
    };
    getUser();
  }, []);

  // Check if project is saved when modal opens
  useEffect(() => {
    if (!isOpen || !project?.id || !authUser?.id) return;

    const checkSaveStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await fetch(`/api/portfolio/saves?projectId=${project.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();
        setIsSaved(data.saved || false);
      } catch (err) {
        console.error('❌ Error checking save status:', err);
      }
    };

    checkSaveStatus();
  }, [isOpen, project?.id, authUser?.id]);

  if (!isOpen || !project) return null;

  const images = project.images || [];
  
  // Filter images by selected type
  const filteredImages = useMemo(() => {
    return images.filter(img => img.imageType === selectedImageType);
  }, [images, selectedImageType]);

  const currentImage = filteredImages[currentImageIndex];

  // Get available image types
  const availableTypes = useMemo(() => {
    const types = new Set(images.map(img => img.imageType));
    return Array.from(types).sort((a, b) => {
      const order = { before: 0, during: 1, after: 2 };
      return (order[a] || 3) - (order[b] || 3);
    });
  }, [images]);

  // Format budget range
  const formatBudget = () => {
    if (!project.budgetMin && !project.budgetMax) return null;
    const min = project.budgetMin ? `KES ${project.budgetMin.toLocaleString()}` : '—';
    const max = project.budgetMax ? `KES ${project.budgetMax.toLocaleString()}` : '—';
    return `${min} – ${max}`;
  };

  // Format completion date
  const formatDate = () => {
    if (!project.completionDate) return null;
    return new Date(project.completionDate).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  // Handle save/unsave project
  const handleSaveProject = async () => {
    if (!authUser?.id) {
      alert('Please log in to save projects');
      return;
    }

    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/portfolio/saves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          action: isSaved ? 'unsave' : 'save',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save project');
      }

      setIsSaved(!isSaved);
      console.log(`✅ Project ${isSaved ? 'unsaved' : 'saved'}`);
    } catch (err) {
      console.error('❌ Error saving project:', err);
      alert('Failed to save project: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? filteredImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === filteredImages.length - 1 ? 0 : prev + 1));
  };

  // When changing image type, reset index
  const handleImageTypeChange = (type) => {
    setSelectedImageType(type);
    setCurrentImageIndex(0);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 flex items-center justify-between p-4 sm:p-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{project.title}</h2>
              <p className="text-sm text-slate-600 mt-1">{project.categorySlug}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Image Carousel */}
            {images.length > 0 ? (
              <div className="space-y-3">
                {/* Image Type Toggle (if multiple types available) */}
                {availableTypes.length > 1 && (
                  <div className="flex gap-2">
                    {availableTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleImageTypeChange(type)}
                        className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition ${
                          selectedImageType === type
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {type === 'before' && '📷 Before'}
                        {type === 'during' && '⏳ During'}
                        {type === 'after' && '✨ After'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Main Image */}
                <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                  {currentImage ? (
                    <img
                      src={currentImage?.imageUrl}
                      alt={`${project.title} - ${currentImage?.imageType}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      No {selectedImageType} images
                    </div>
                  )}
                  
                  {/* Image Badge */}
                  {currentImage && (
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold capitalize">
                      {currentImage?.imageType}
                    </div>
                  )}
                </div>

                {/* Image Navigation */}
                {filteredImages.length > 1 && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePrevImage}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    
                    <div className="flex gap-2">
                      {filteredImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`h-2 rounded-full transition ${
                            idx === currentImageIndex ? 'bg-amber-600 w-6' : 'bg-slate-300 w-2'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <button
                      onClick={handleNextImage}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                )}

                {/* Image List */}
                <div className="grid grid-cols-3 gap-2">
                  {filteredImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                        idx === currentImageIndex
                          ? 'border-amber-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={img.imageUrl}
                        alt={img.imageType}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Image Caption */}
                {currentImage?.caption && (
                  <p className="text-sm text-slate-600 italic">"{currentImage.caption}"</p>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                <p className="text-slate-500">No images available</p>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Project Description</h3>
              <p className="text-slate-700 leading-relaxed">{project.description}</p>
            </div>

            {/* Project Details Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Budget */}
              {formatBudget() && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span className="text-xs uppercase tracking-wide text-slate-600 font-semibold">Budget</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatBudget()}</p>
                </div>
              )}

              {/* Timeline */}
              {project.timeline && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs uppercase tracking-wide text-slate-600 font-semibold">Timeline</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{project.timeline}</p>
                </div>
              )}

              {/* Location */}
              {project.location && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span className="text-xs uppercase tracking-wide text-slate-600 font-semibold">Location</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{project.location}</p>
                </div>
              )}

              {/* Completion Date */}
              {formatDate() && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span className="text-xs uppercase tracking-wide text-slate-600 font-semibold">Completed</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatDate()}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={handleSaveProject}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  isSaved
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                } disabled:opacity-50`}
              >
                <Heart className={`w-5 h-5 inline mr-2 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => {
                  onShare?.();
                  onClose();
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                <Share2 className="w-5 h-5 inline mr-2" />
                Share
              </button>
              <button
                onClick={() => {
                  onRequestQuote?.();
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
              >
                Request Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
