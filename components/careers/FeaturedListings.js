'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Clock, DollarSign, Star, Zap, Users } from 'lucide-react';

/**
 * FeaturedListings — shows paid featured jobs/gigs from zcc_featured_posts.
 * Falls back to latest active listings if no featured posts exist yet.
 * Each card is labeled "Featured" or "Urgent" per the spec.
 */
export default function FeaturedListings({ type = 'job', limit = 4 }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, [type]);

  async function fetchFeatured() {
    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      // 1. Try to get featured posts first
      const { data: featuredData } = await supabase
        .from('zcc_featured_posts')
        .select('post_id, label, ends_at')
        .gt('ends_at', now)
        .lte('starts_at', now)
        .order('starts_at', { ascending: false })
        .limit(limit);

      let postIds = (featuredData || []).map(f => f.post_id);
      let featuredMap = {};
      (featuredData || []).forEach(f => {
        featuredMap[f.post_id] = f.label;
      });

      let query;

      if (postIds.length > 0) {
        // Fetch the featured listings
        query = supabase
          .from('listings')
          .select(`
            id, title, description, type, location, pay_min, pay_max, pay_currency,
            start_date, duration, status, created_at,
            employer_id
          `)
          .in('id', postIds)
          .eq('status', 'active')
          .eq('type', type);
      } else {
        // Fallback: latest active listings of this type
        query = supabase
          .from('listings')
          .select(`
            id, title, description, type, location, pay_min, pay_max, pay_currency,
            start_date, duration, status, created_at,
            employer_id
          `)
          .eq('status', 'active')
          .eq('type', type)
          .order('created_at', { ascending: false })
          .limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching featured listings:', error);
        return;
      }

      // Attach featured label
      const enriched = (data || []).map(listing => ({
        ...listing,
        featured_label: featuredMap[listing.id] || null,
      }));

      setListings(enriched);
    } catch (err) {
      console.error('Error in fetchFeatured:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse flex space-x-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 bg-gray-200 rounded-lg h-48" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) return null;

  const isGig = type === 'gig';
  const sectionTitle = isGig ? '⚡ Featured Gigs — Urgent Today' : '🏗️ Featured Jobs';
  const viewAllLink = isGig ? '/careers/gigs' : '/careers/jobs';

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{sectionTitle}</h2>
          <Link
            href={viewAllLink}
            className="text-orange-500 hover:text-orange-600 font-semibold text-sm transition"
          >
            View All →
          </Link>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map(listing => (
            <Link
              key={listing.id}
              href={`/careers/${isGig ? 'gigs' : 'jobs'}/${listing.id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-100 group"
            >
              {/* Featured / Urgent Badge */}
              {listing.featured_label && (
                <div className={`px-4 py-1.5 text-xs font-bold text-white flex items-center gap-1 ${
                  listing.featured_label === 'urgent' 
                    ? 'bg-red-500' 
                    : listing.featured_label === 'sponsored'
                    ? 'bg-blue-500'
                    : 'bg-orange-500'
                }`}>
                  {listing.featured_label === 'urgent' ? (
                    <><Zap size={12} /> URGENT</>
                  ) : listing.featured_label === 'sponsored' ? (
                    <><Star size={12} /> SPONSORED</>
                  ) : (
                    <><Star size={12} /> FEATURED</>
                  )}
                </div>
              )}

              <div className="p-5">
                {/* Title */}
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition line-clamp-2">
                  {listing.title}
                </h3>

                {/* Location */}
                {listing.location && (
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-2">
                    <MapPin size={14} />
                    <span>{listing.location}</span>
                  </div>
                )}

                {/* Pay */}
                {(listing.pay_min || listing.pay_max) && (
                  <div className="flex items-center gap-1.5 text-gray-600 text-sm mb-2">
                    <DollarSign size={14} />
                    <span>
                      {listing.pay_min ? `KSh ${listing.pay_min.toLocaleString()}` : ''}
                      {listing.pay_min && listing.pay_max ? ' - ' : ''}
                      {listing.pay_max ? `KSh ${listing.pay_max.toLocaleString()}` : ''}
                      {isGig ? ' /day' : ' /month'}
                    </span>
                  </div>
                )}

                {/* Gig-specific: Duration */}
                {isGig && listing.duration && (
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {listing.duration}
                    </span>
                  </div>
                )}

                {/* Start date */}
                {listing.start_date && (
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                    <Clock size={12} />
                    <span>Starts {new Date(listing.start_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
