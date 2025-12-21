'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function StatusUpdateCard({ update, vendor, currentUser, onDelete }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(update.likes_count || 0);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);

  const handleLike = async () => {
    setLoading(true);
    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('vendor_status_update_likes')
          .delete()
          .eq('update_id', update.id)
          .eq('user_id', currentUser?.id);

        if (error) throw error;
        setLiked(false);
        setLikesCount(Math.max(0, likesCount - 1));
      } else {
        // Like
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
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {vendor.logo_url && (
            <img
              src={vendor.logo_url}
              alt={vendor.company_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div>
            <h4 className="font-semibold text-slate-900">{vendor.company_name}</h4>
            <p className="text-xs text-slate-500">
              {new Date(update.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {canDelete && (
          <div className="relative group">
            <button className="p-2 hover:bg-slate-100 rounded-lg">
              <MoreVertical className="w-4 h-4 text-slate-500" />
            </button>
            <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition z-10">
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
      <p className="text-slate-700 mb-4 whitespace-pre-wrap break-words">{update.content}</p>

      {/* Images Grid */}
      {update.images && update.images.length > 0 && (
        <div className="mb-4">
          {update.images.length === 1 ? (
            <img
              src={update.images[0]}
              alt="Update"
              className="w-full rounded-lg object-cover max-h-96"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {update.images.map((image, idx) => (
                <img
                  key={idx}
                  src={image}
                  alt={`Update ${idx + 1}`}
                  className="w-full rounded-lg object-cover h-40"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-slate-600 mb-4 pb-4 border-b border-slate-200">
        <button className="flex items-center gap-1 hover:text-amber-600">
          <Heart className="w-4 h-4" />
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 hover:text-amber-600"
        >
          <MessageCircle className="w-4 h-4" />
          {update.comments_count || 0} {(update.comments_count || 0) === 1 ? 'comment' : 'comments'}
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition ${
            liked
              ? 'text-red-600 bg-red-50 hover:bg-red-100'
              : 'text-slate-600 hover:bg-slate-100'
          } disabled:opacity-50`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          Like
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition">
          <MessageCircle className="w-5 h-5" />
          Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition">
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600 mb-3">Comments feature coming soon</p>
        </div>
      )}
    </div>
  );
}
