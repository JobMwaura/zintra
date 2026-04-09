'use client';

import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const REACTION_EMOJIS = ['👍', '👎', '❤️', '😂', '🔥', '😮', '😢', '🤔', '✨', '🎉'];

export default function ReactionPicker({ commentId, updateId, onReactionAdded, currentUser, isUpdate = false }) {
  const [showPicker, setShowPicker] = useState(false);
  const [reactions, setReactions] = useState({});
  const [loadingReactions, setLoadingReactions] = useState(false);
  const pickerRef = useRef(null);

  // Fetch reactions for this comment or update
  const fetchReactions = async () => {
    setLoadingReactions(true);
    try {
      const queryParam = isUpdate ? `updateId=${updateId}` : `commentId=${commentId}`;
      const endpoint = isUpdate 
        ? `/api/status-updates/reactions?${queryParam}`
        : `/api/status-updates/comments/reactions?${queryParam}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch reactions');
      
      const data = await response.json();
      
      // Convert array to map for easier lookup
      const reactionMap = {};
      data.reactions?.forEach(reaction => {
        reactionMap[reaction.emoji] = {
          count: reaction.count,
          users: reaction.users,
          userReacted: reaction.users.includes(currentUser?.id),
        };
      });
      
      setReactions(reactionMap);
      console.log('✅ Fetched reactions:', Object.keys(reactionMap).length);
    } catch (err) {
      console.error('❌ Error fetching reactions:', err);
    } finally {
      setLoadingReactions(false);
    }
  };

  // Load reactions on mount
  useEffect(() => {
    if (commentId || updateId) {
      fetchReactions();
    }
  }, [commentId, updateId]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReactionClick = async (emoji) => {
    if (!currentUser) {
      alert('Please sign in to react');
      return;
    }

    try {
      const endpoint = isUpdate 
        ? '/api/status-updates/reactions'
        : '/api/status-updates/comments/reactions';
      
      const body = isUpdate
        ? { updateId, emoji, userId: currentUser.id }
        : { commentId, emoji, userId: currentUser.id };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to add reaction');

      const data = await response.json();
      console.log('✅ Reaction:', data.action);

      // Refresh reactions
      await fetchReactions();
      
      if (onReactionAdded) {
        onReactionAdded(emoji, data.action);
      }

      setShowPicker(false);
    } catch (err) {
      console.error('❌ Error adding reaction:', err);
      alert('Failed to add reaction');
    }
  };

  const totalReactions = Object.values(reactions).reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="relative" ref={pickerRef}>
      {/* Reaction Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="p-1 text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
        title="Add reaction"
      >
        <Smile className="w-4 h-4" />
        {totalReactions > 0 && (
          <span className="text-xs bg-slate-200 rounded-full px-2 py-0.5">
            {totalReactions}
          </span>
        )}
      </button>

      {/* Reaction Picker */}
      {showPicker && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-300 rounded-lg shadow-lg p-2 flex gap-1 z-10">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              className="text-xl p-1 hover:bg-slate-100 rounded transition relative group"
              title={`React with ${emoji}`}
            >
              {emoji}
              {reactions[emoji]?.userReacted && (
                <span className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Reactions Display */}
      {totalReactions > 0 && !showPicker && (
        <div className="flex flex-wrap gap-1 mt-1">
          {Object.entries(reactions).map(([emoji, data]) => (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition ${
                data.userReacted
                  ? 'bg-blue-100 border border-blue-300 hover:bg-blue-200'
                  : 'bg-slate-100 border border-slate-300 hover:bg-slate-200'
              }`}
              title={`${data.count} reaction${data.count !== 1 ? 's' : ''}`}
            >
              <span>{emoji}</span>
              <span>{data.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
