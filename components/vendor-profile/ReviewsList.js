'use client';

import { Star } from 'lucide-react';

export default function ReviewsList({ reviews, averageRating }) {
  if (!reviews || reviews.length === 0) {
    return (
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
        <p className="text-slate-600 mb-2">No reviews yet</p>
        <p className="text-sm text-slate-500">Be the first to share your experience with this vendor</p>
      </section>
    );
  }

  // Calculate rating distribution
  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      {/* Rating Summary */}
      <div className="mb-8 pb-8 border-b border-slate-200">
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Average Rating */}
          <div className="flex items-center justify-center sm:justify-start">
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold text-slate-900">
                  {averageRating?.toFixed(1) || '0'}
                </span>
                <span className="text-slate-600">/5.0</span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.round(averageRating || 0)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-600">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-semibold text-slate-700">{rating}</span>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{
                      width: `${
                        reviews.length > 0
                          ? (ratingDistribution[rating] / reviews.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm text-slate-600 w-8 text-right">
                  {ratingDistribution[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div>
        <h4 className="text-lg font-semibold text-slate-900 mb-4">Customer Reviews</h4>
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-slate-200 pb-6 last:border-0">
              {/* Reviewer Info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{review.author || 'Anonymous'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (review.rating || 0)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-slate-600 font-semibold">
                      {review.rating}.0
                      <span className="text-slate-500">
                        {' - '}
                        {review.rating === 5 && 'Excellent'}
                        {review.rating === 4 && 'Very Good'}
                        {review.rating === 3 && 'Good'}
                        {review.rating === 2 && 'Fair'}
                        {review.rating === 1 && 'Poor'}
                      </span>
                    </span>
                  </div>
                </div>
                <span className="text-sm text-slate-500 flex-shrink-0">
                  {new Date(review.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {/* Review Content */}
              <p className="text-slate-700 leading-relaxed">{review.comment}</p>

              {/* Vendor Response (if available) */}
              {review.vendor_response && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm font-semibold text-slate-900 mb-2">Vendor Response</p>
                  <p className="text-slate-700 text-sm">{review.vendor_response}</p>
                  {review.responded_at && (
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(review.responded_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
