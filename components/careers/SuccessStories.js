/**
 * SuccessStories Component - Worker Testimonials
 * Displays real worker success stories with ratings and earnings
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getCandidateRedirectPath } from '@/lib/auth-helpers';

const testimonials = [
  {
    id: 1,
    name: 'John Mwangi',
    role: 'Electrician',
    location: 'Nairobi',
    image: 'JM',
    quote: 'I earned KES 45K in my first month on Zintra. The jobs are legitimate and payments are fast.',
    rating: 5,
    earnings: 'KES 45K/month',
    duration: '3 months on Zintra'
  },
  {
    id: 2,
    name: 'Faith Kipchoge',
    role: 'Mason',
    location: 'Kiambu',
    image: 'FK',
    quote: 'I love Zintra because I can choose the jobs that work with my schedule. No pressure, genuine opportunities.',
    rating: 5,
    earnings: 'KES 35K-60K/month',
    duration: '5 months on Zintra'
  },
  {
    id: 3,
    name: 'James Okonkwo',
    role: 'Foreman',
    location: 'Mombasa',
    image: 'JO',
    quote: 'The best part? Zero upfront fees and payments within 48 hours. I\'ve recommended Zintra to all my friends.',
    rating: 5,
    earnings: 'KES 75K-120K/month',
    duration: '7 months on Zintra'
  }
];

export default function SuccessStories() {
  const router = useRouter();
  const [applyLink, setApplyLink] = useState('/user-registration');
  const [buttonText, setButtonText] = useState('Create Your Profile');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRedirectPath();
  }, []);

  async function loadRedirectPath() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user is candidate
        const { data } = await supabase
          .from('profiles')
          .select('is_candidate')
          .eq('id', user.id)
          .single();
        
        if (data?.is_candidate) {
          setApplyLink('/careers/me');
          setButtonText('View Your Profile');
        } else {
          setApplyLink('/user-registration');
          setButtonText('Create Your Profile');
        }
      } else {
        setApplyLink('/user-registration');
        setButtonText('Create Your Profile');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full bg-gray-50 border-b border-gray-200 py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Real Success Stories
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Hear from construction workers across Kenya earning real income through Zintra
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-lg p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 text-sm sm:text-base mb-5 leading-relaxed italic">
                "{testimonial.quote}"
              </p>

              {/* Divider */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                {/* Worker Info */}
                <div className="flex items-center gap-3">
                  {/* Avatar Circle */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#ea8f1e] text-white flex items-center justify-center font-bold text-sm">
                    {testimonial.image}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {testimonial.role} • {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-orange-50 rounded p-3">
                <p className="text-xs text-gray-600 mb-1">Earnings</p>
                <p className="font-bold text-[#ea8f1e] text-sm mb-2">
                  {testimonial.earnings}
                </p>
                <p className="text-xs text-gray-600">
                  {testimonial.duration}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-700 mb-4">
            Ready to start earning? Join our growing community of construction workers.
          </p>
          <Link href={applyLink}>
            <button className="inline-block px-6 py-2.5 bg-[#ea8f1e] text-white font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm sm:text-base">
              {buttonText}
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
