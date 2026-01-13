'use client';

import { useState } from 'react';
import { Eye, Edit2, Share2, MessageSquare, Trash2 } from 'lucide-react';

/**
 * PortfolioProjectCard Component
 * 
 * Displays a single portfolio project as a card with:
 * - Cover image
 * - Project title
 * - Category badge
 * - Quick spec chips (completion date, budget, location)
 * - Action buttons (view, edit, share, request quote)
 * 
 * Props:
 * - project: Project object with title, description, images[], etc.
 * - canEdit: Boolean (true if vendor viewing own profile)
 * - onView: Callback when "View" clicked
 * - onEdit: Callback when "Edit" clicked
 * - onDelete: Callback when "Delete" clicked
 * - onShare: Callback when "Share" clicked
 * - onRequestQuote: Callback when "Request Quote" clicked
 */
export default function PortfolioProjectCard({
  project,
  canEdit = false,
  onView,
  onEdit,
  onDelete,
  onShare,
  onRequestQuote,
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  // Get cover image (first "after" image, or any image)
  const coverImage = project.images?.find(img => img.imageType === 'after')?.imageUrl ||
                     project.images?.[0]?.imageUrl;

  // Format budget range
  const formatBudget = () => {
    if (!project.budgetMin && !project.budgetMax) return null;
    const min = project.budgetMin ? `${project.budgetMin.toLocaleString()}` : '—';
    const max = project.budgetMax ? `${project.budgetMax.toLocaleString()}` : '—';
    return `${min}–${max}`;
  };

  // Format completion date
  const formatDate = () => {
    if (!project.completionDate) return null;
    return new Date(project.completionDate).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    setIsDeleting(true);
    try {
      await onDelete?.();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="group rounded-lg border border-slate-200 overflow-hidden hover:border-amber-300 transition hover:shadow-lg"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {coverImage && !imageErrors.cover ? (
          <img
            src={coverImage}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onError={(e) => {
              console.warn('❌ Portfolio image failed to load:', coverImage);
              setImageErrors(prev => ({ ...prev, cover: true }));
              // Fallback SVG for broken images
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23e2e8f0" width="400" height="400"/%3E%3Cg fill="%23999"%3E%3Ccircle cx="100" cy="100" r="30"/%3E%3Cpath d="M 50 250 L 150 150 L 250 250 L 350 100 L 350 350 Q 350 350 350 350 L 50 350 Z"/%3E%3C/g%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 gap-2">
            <div className="text-slate-500">
              <svg className="w-12 h-12 mx-auto opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-slate-500 font-medium text-sm">Image Unavailable</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex gap-2 flex-wrap">
          {/* Featured Badge */}
          {project.isFeatured && (
            <div className="bg-amber-500 text-white px-2 py-1 rounded text-xs font-semibold">
              ⭐ Featured
            </div>
          )}
          {/* Draft Badge */}
          {project.status === 'draft' && (
            <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
              Draft
            </div>
          )}
        </div>

        {/* Hover Overlay - Action Buttons */}
        {isHovering && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
            <button
              onClick={() => onView?.()}
              className="p-2 bg-white text-slate-900 rounded-lg hover:bg-amber-500 hover:text-white transition"
              title="View project"
            >
              <Eye className="w-5 h-5" />
            </button>
            {canEdit && (
              <>
                <button
                  onClick={() => onEdit?.()}
                  className="p-2 bg-white text-slate-900 rounded-lg hover:bg-amber-500 hover:text-white transition"
                  title="Edit project"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete?.()}
                  disabled={isDeleting}
                  className="p-2 bg-white text-slate-900 rounded-lg hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                  title="Delete project"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* View Count */}
        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          👁️ {project.viewCount || 0}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 text-sm">
          {project.title}
        </h3>

        {/* Category Badge */}
        {project.categorySlug && (
          <div className="inline-flex items-center mb-3 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
            🏢 {project.categorySlug.replace(/-/g, ' ')}
          </div>
        )}

        {/* Quick Spec Chips */}
        <div className="space-y-2 mb-4 text-xs text-slate-600">
          {formatDate() && (
            <div className="flex items-center gap-1">
              <span className="text-slate-400">✓</span> Completed: {formatDate()}
            </div>
          )}
          {formatBudget() && (
            <div className="flex items-center gap-1">
              <span className="text-slate-400">💰</span> Budget: {formatBudget()} KES
            </div>
          )}
          {project.location && (
            <div className="flex items-center gap-1">
              <span className="text-slate-400">📍</span> {project.location}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={() => onShare?.()}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-slate-600 hover:text-amber-700 font-medium text-xs transition"
            title="Share project"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
          {!canEdit && (
            <button
              onClick={() => onRequestQuote?.()}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium text-xs rounded transition"
              title="Request quote for similar project"
            >
              <MessageSquare className="w-4 h-4" /> Quote
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
