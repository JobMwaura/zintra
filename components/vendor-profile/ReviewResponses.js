'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ReviewResponses({ vendor, reviews, onClose, onSuccess }) {
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);

  const handleResponseChange = (reviewId, text) => {
    setResponses({
      ...responses,
      [reviewId]: text,
    });
  };

  const handleSaveResponse = async (reviewId) => {
    if (!responses[reviewId]?.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ vendor_response: responses[reviewId] })
        .eq('id', reviewId)
        .eq('vendor_id', vendor.id);

      if (error) throw error;

      setResponses({
        ...responses,
        [reviewId]: '',
      });

      onSuccess?.();
    } catch (err) {
      console.error('Save response failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-slate-900">Respond to Reviews</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">{review.reviewer_name}</p>
                    <p className="text-sm text-slate-600">{review.rating || 5} ⭐</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <p className="text-slate-700 mb-4 p-3 bg-slate-50 rounded">{review.review_text}</p>

                {review.vendor_response && (
                  <div className="mb-4 p-3 bg-emerald-50 rounded border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-900 mb-1">Your Response</p>
                    <p className="text-emerald-900">{review.vendor_response}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <textarea
                    value={responses[review.id] || ''}
                    onChange={(e) => handleResponseChange(review.id, e.target.value)}
                    placeholder="Write a response..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows="3"
                  />
                  <button
                    onClick={() => handleSaveResponse(review.id)}
                    disabled={!responses[review.id]?.trim() || loading}
                    className="w-full px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Response'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-600 py-8">No reviews yet</p>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
