'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function StatusUpdateCard({ update, vendor, currentUser, onDelete }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(update.likes_count || 0);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Handle both old format (array of strings) and new format (array of objects)
  const images = update.images || [];
  const imageUrls = images.map(img => 
    typeof img === 'string' ? img : img.imageUrl
  ).filter(Boolean);

  const currentImage = imageUrls[currentImageIndex];

  // Format time nicely
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  const handleLike = async () => {
    setLoading(true);
    try {
      if (liked) {
        const { error } = await supabase
          .from('vendor_status_update_likes')
          .delete()
          .eq('update_id', update.id)
          .eq('user_id', currentUser?.id);

        if (error) throw error;
        setLiked(false);
        setLikesCount(Math.max(0, likesCount - 1));
      } else {
        const { error } = await supabase
          .from('vendor_status_update_likes')
          .insert({
            update_id: update.id,
            user_id: currentUser?.id,
          });

        if (error) throw error;
        setLiked(true);
        setLikesCount(likesCount + 1);
      }
    } catch (err) {
      console.error('Like action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const canDelete = currentUser?.id === vendor.user_id;

  const handleDelete = async () => {
    if (!confirm('Delete this update?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('vendor_status_updates')
        .delete()
        .eq('id', update.id);

      if (error) throw error;
      if (onDelete) onDelete(update.id);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {vendor?.logo_url && (
            <img
              src={vendor.logo_url}
              alt={vendor?.company_name || 'Vendor'}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
          )}
          <div>
            <h4 className="font-semibold text-sm text-slate-900">
              {vendor?.company_name || 'Unknown Vendor'}
            </h4>
            <p className="text-xs text-slate-500">
              {formatTime(update.created_at)}
            </p>
          </div>
        </div>

        {canDelete && (
          <div className="relative group">
            <button className="p-1.5 hover:bg-slate-100 rounded-lg transition">
              <MoreVertical className="w-4 h-4 text-slate-600" />
            </button>
            <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-20 whitespace-nowrap">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
          {update.content}
        </p>
      </div>

      {/* Image Gallery */}
      {imageUrls.length > 0 && (
        <div className="bg-slate-50">
          <div className="relative bg-slate-200 aspect-video overflow-hidden flex items-center justify-center">
            {currentImage ? (
              <img
                src={currentImage}
                alt={`Update image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e2e8f0" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="12" fill="%23999" text-anchor="middle" dy=".3em"%3EImage Error%3C/text%3E%3C/svg%3E';
                }}
              />
            ) : (
              <div className="text-center text-slate-500">No image available</div>
            )}

            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev === 0 ? imageUrls.length - 1 : prev - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-slate-900 rounded-full shadow-md transition z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setCurrentImageIndex(prev => prev === imageUrls.length - 1 ? 0 : prev + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white text-slate-900 rounded-full shadow-md transition z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-xs font-semibold rounded-full">
                  {currentImageIndex + 1} / {imageUrls.length}
                </div>
              </>
            )}
          </div>

          {imageUrls.length > 1 && (
            <div className="px-3 py-2 flex gap-2 overflow-x-auto border-t border-slate-100 bg-white">
              {imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition ${
                    idx === currentImageIndex
                      ? 'border-blue-500 ring-2 ring-blue-300'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="px-4 py-3 flex items-center justify-between text-sm text-slate-600 border-b border-slate-100">
        <button className="flex items-center gap-1.5 hover:text-red-600 transition">
          <Heart className="w-4 h-4" />
          <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 hover:text-blue-600 transition"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{update.comments_count || 0} {(update.comments_count || 0) === 1 ? 'comment' : 'comments'}</span>
        </button>
      </div>

      {/* Actions */}
      <div className="px-4 py-2 flex gap-1.5">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded transition font-medium text-sm ${
            liked
              ? 'text-red-600 bg-red-50 hover:bg-red-100'
              : 'text-slate-600 hover:bg-slate-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          Like
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded transition font-medium text-sm text-slate-600 hover:bg-slate-100">
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded transition font-medium text-sm text-slate-600 hover:bg-slate-100">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-slate-100 px-4 py-3 bg-slate-50 rounded-b-lg">
          <p className="text-sm text-slate-600 text-center">Comments feature coming soon</p>
        </div>
      )}
    </div>
  );
}
