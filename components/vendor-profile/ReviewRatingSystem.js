'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function ReviewRatingSystem({ vendor, currentUser, onReviewAdded }) {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmitReview = async () => {
    if (!currentUser) {
      setError('Please sign in to leave a review');
      return;
    }

    if (selectedRating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!reviewText.trim()) {
      setError('Please write a review');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Get the reviewer's full name
      const { data: userData } = await supabase.auth.getUser();
      const reviewerName = 
        userData?.user?.user_metadata?.full_name || 
        userData?.user?.email?.split('@')[0] || 
        'Anonymous';

      // Insert the review
      const { data, error: insertError } = await supabase
        .from('reviews')
        .insert({
          vendor_id: vendor.id,
          reviewer_id: currentUser.id,
          reviewer_name: reviewerName,
          rating: selectedRating,
          comment: reviewText.trim(),
        })
        .select();

      if (insertError) throw insertError;

      console.log('✅ Review submitted successfully:', data);
      
      // Reset form
      setSelectedRating(0);
      setReviewText('');
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

      // Trigger callback to refresh reviews
      if (onReviewAdded) {
        onReviewAdded(data[0]);
      }
    } catch (err) {
      console.error('❌ Error submitting review:', err);
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rating Stars Section */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-slate-900 mb-4">Rate This Vendor</h4>
        
        <div className="flex items-center justify-center gap-3 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setSelectedRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
              disabled={submitting}
            >
              <Star
                className={`w-12 h-12 transition ${
                  (hoverRating || selectedRating) >= star
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-slate-300'
                }`}
              />
            </button>
          ))}
        </div>

        {selectedRating > 0 && (
          <p className="text-center text-slate-700 font-semibold">
            {selectedRating === 1 && 'Poor - Needs Improvement'}
            {selectedRating === 2 && 'Fair - Below Average'}
            {selectedRating === 3 && 'Good - Meets Expectations'}
            {selectedRating === 4 && 'Very Good - Exceeds Expectations'}
            {selectedRating === 5 && 'Excellent - Outstanding!'}
          </p>
        )}
      </section>

      {/* Review Writing Section */}
      {currentUser ? (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-900 mb-4">Write a Review</h4>
          
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                ✅ Review submitted successfully! Thank you for your feedback.
              </div>
            )}

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this vendor. Be specific about products/services, quality, delivery time, customer service, and overall satisfaction..."
              maxLength={1000}
              disabled={submitting}
              className="w-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-slate-900 placeholder-slate-500 disabled:bg-slate-100"
              rows={6}
            />

            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{reviewText.length}/1000 characters</span>
              {selectedRating > 0 && (
                <span className="flex items-center gap-1">
                  Rating: 
                  <span className="flex gap-0.5">
                    {[...Array(selectedRating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                  </span>
                </span>
              )}
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={submitting || selectedRating === 0 || !reviewText.trim()}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                submitting || selectedRating === 0 || !reviewText.trim()
                  ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-slate-900 font-semibold mb-2">Sign in to leave a review</p>
          <p className="text-slate-600 text-sm mb-4">
            Please log in to share your experience with other customers
          </p>
        </section>
      )}
    </div>
  );
}
