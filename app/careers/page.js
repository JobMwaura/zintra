/**
 * Zintra Career Centre Landing Page
 * Main page showcasing jobs, gigs, employers, and talent
 */

'use client';

import { useState, useEffect } from 'react';
import HeroSearch from '@/components/careers/HeroSearch';
import TrustStrip from '@/components/careers/TrustStrip';
import FeaturedEmployers from '@/components/careers/FeaturedEmployers';
import TrendingRoles from '@/components/careers/TrendingRoles';
import FastHireGigs from '@/components/careers/FastHireGigs';
import TopRatedTalent from '@/components/careers/TopRatedTalent';
import HowItWorks from '@/components/careers/HowItWorks';
import SafetyNote from '@/components/careers/SafetyNote';
import { createClient } from '@/lib/supabase/client';

import {
  mockEmployers,
  mockTrendingRoles,
  mockGigs,
  mockTopRatedWorkers,
  howItWorksWorkers,
  howItWorksEmployers,
  trustItems,
} from '@/lib/careers-mock-data';

export default function CareersPage() {
  const [realGigs, setRealGigs] = useState(mockGigs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealGigs();
  }, []);

  async function fetchRealGigs() {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          location,
          duration,
          pay_min,
          pay_max,
          pay_currency,
          start_date,
          employer:employer_id(id, company_name, company_logo_url),
          applications:applications(count)
        `)
        .eq('type', 'gig')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error || !data) {
        console.error('Error fetching gigs:', error);
        setRealGigs(mockGigs);
        return;
      }

      // Transform database gigs to match FastHireGigs component format
      const transformedGigs = data.map(gig => ({
        id: gig.id,
        role: gig.title,
        location: gig.location || 'Kenya',
        duration: gig.duration || '1 week',
        pay: gig.pay_min || 0,
        startDate: gig.start_date || new Date().toISOString(),
        employer: gig.employer?.company_name || 'Unknown Employer',
        applicants: gig.applications?.[0]?.count || 0,
      }));

      setRealGigs(transformedGigs);
    } catch (err) {
      console.error('Error in fetchRealGigs:', err);
      setRealGigs(mockGigs);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-full bg-white">
      {/* Hero & Search */}
      <HeroSearch />

      {/* Trust Strip */}
      <TrustStrip items={trustItems} />

      {/* Featured Employers */}
      <FeaturedEmployers employers={mockEmployers} />

      {/* Trending Roles */}
      <TrendingRoles roles={mockTrendingRoles} />

      {/* Fast-Hire Gigs */}
      <FastHireGigs gigs={realGigs} />

      {/* Top Rated Talent */}
      <TopRatedTalent workers={mockTopRatedWorkers} />

      {/* How It Works */}
      <HowItWorks
        workersSteps={howItWorksWorkers}
        employersSteps={howItWorksEmployers}
      />

      {/* Safety Note */}
      <SafetyNote />
    </main>
  );
}
