'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Share2, MoreVertical, ChevronLeft, ChevronRight, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function StatusUpdateCard({ update, vendor, currentUser, onDelete }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(update.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(update.comments_count || 0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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

  // Fetch comments when showing comments section
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/status-updates/comments?updateId=${update.id}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      
      const data = await response.json();
      setComments(data.comments || []);
      console.log('✅ Fetched', data.comments?.length || 0, 'comments');
    } catch (err) {
      console.error('❌ Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleShowComments = async () => {
    if (!showComments) {
      // Opening comments section - fetch comments
      await fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    // Check if user is signed in
    if (!currentUser) {
      router.push('/auth/signin');
      return;
    }
    
    if (!commentText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/status-updates/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updateId: update.id,
          content: commentText.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post comment');
      }

      const data = await response.json();
      console.log('✅ Comment posted:', data.comment.id);

      // Add new comment to list
      setComments(prev => [...prev, data.comment]);
      setCommentText('');
      setCommentsCount(prev => prev + 1);
    } catch (err) {
      console.error('❌ Error posting comment:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/status-updates/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete comment');
      }

      console.log('✅ Comment deleted:', commentId);

      // Remove comment from list
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentsCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('❌ Error deleting comment:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canDelete = currentUser?.id === vendor?.user_id;

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Delete S3 images first
      if (update.images && update.images.length > 0) {
        console.log('🗑️ Deleting', update.images.length, 'S3 images...');
        
        // Extract file keys from images (they could be presigned URLs or raw keys)
        const imageKeys = update.images
          .map(img => {
            if (typeof img !== 'string') return null;
            
            // If it's a presigned URL, extract the key before the query string
            if (img.startsWith('https://')) {
              try {
                const url = new URL(img);
                // The key is in the pathname, e.g., /vendor-profiles/status-updates/filename.jpg
                const key = url.pathname.substring(1); // Remove leading slash
                console.log('   Extracted key from URL:', key.substring(0, 60) + '...');
                return key;
              } catch (err) {
                console.error('   Failed to extract key from URL:', img);
                return null;
              }
            }
            
            // If it's already a file key, use it as-is
            return img;
          })
          .filter(Boolean);
        
        console.log('   Image keys to delete:', imageKeys.length);
        
        // Call API to delete S3 files
        const deleteImagesResponse = await fetch('/api/status-updates/delete-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            updateId: update.id,
            imageKeys: imageKeys,
          }),
        });

        if (!deleteImagesResponse.ok) {
          const errorData = await deleteImagesResponse.json();
          console.warn('⚠️ Warning: Failed to delete some S3 images:', errorData.message);
          // Continue with database deletion even if S3 deletion fails
        } else {
          console.log('✅ S3 images deleted successfully');
        }
      }

      // Delete database record
      const { error } = await supabase
        .from('vendor_status_updates')
        .delete()
        .eq('id', update.id);

      if (error) {
        console.error('❌ Delete error:', error);
        alert('Failed to delete update: ' + error.message);
        return;
      }

      console.log('✅ Update deleted from database');
      // Call parent callback to remove from list
      if (onDelete) onDelete(update.id);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('❌ Delete failed:', err);
      alert('Failed to delete update');
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
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <MoreVertical className="w-4 h-4 text-slate-600" />
            </button>
            {showMenu && (
              <div 
                className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  disabled={loading}
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <div className="border-t border-slate-100" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                    setShowMenu(false);
                  }}
                  disabled={loading}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 font-medium cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
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
          onClick={handleShowComments}
          className="flex items-center gap-1.5 hover:text-blue-600 transition"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}</span>
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
        <button
          onClick={handleShowComments}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded transition font-medium text-sm text-slate-600 hover:bg-slate-100"
        >
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded transition font-medium text-sm text-slate-600 hover:bg-slate-100">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-slate-100 bg-slate-50">
          {/* Comments List */}
          <div className="px-4 py-3 max-h-64 overflow-y-auto">
            {loadingComments ? (
              <p className="text-sm text-slate-500 text-center py-4">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white rounded-lg p-3 text-sm">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-medium text-slate-900">
                          {comment.auth_users?.user_metadata?.name || comment.auth_users?.email || 'Anonymous'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatTime(comment.created_at)}
                        </p>
                      </div>
                      {currentUser?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={loading}
                          className="p-1 text-slate-400 hover:text-red-600 transition disabled:opacity-50"
                          title="Delete comment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment Input Form */}
          {currentUser && (
            <form
              onSubmit={handleAddComment}
              className="px-4 py-3 border-t border-slate-200 bg-white flex gap-2"
            >
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={500}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={loading || !commentText.trim()}
                className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : 'Post'}
              </button>
            </form>
          )}

          {!currentUser && (
            <div className="px-4 py-3 text-center text-sm bg-white border-t border-slate-200">
              <p className="text-slate-600 mb-3">Sign in to comment</p>
              <button
                onClick={() => router.push('/auth/signin')}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog - Rendered as Portal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Update?</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this update? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
