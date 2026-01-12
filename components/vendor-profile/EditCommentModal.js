'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function EditCommentModal({ comment, onSave, onCancel, isLoading }) {
  const [editedContent, setEditedContent] = useState(comment.content);

  const handleSave = async () => {
    if (!editedContent.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    if (editedContent.trim() === comment.content) {
      onCancel();
      return;
    }

    await onSave(editedContent.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Edit Comment</h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          maxLength={500}
          disabled={isLoading}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-slate-100 resize-none h-24"
          placeholder="Edit your comment..."
        />

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? '...' : 'Save'}
          </button>
        </div>

        <div className="text-xs text-slate-500 mt-2">
          {editedContent.length}/500 characters
        </div>
      </div>
    </div>
  );
}
