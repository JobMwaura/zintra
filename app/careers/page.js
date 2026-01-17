/**
 * Zintra Career Centre Landing Page
 * Main page showcasing jobs, gigs, employers, and talent
 */

import HeroSearch from '@/components/careers/HeroSearch';
import TrustStrip from '@/components/careers/TrustStrip';
import FeaturedEmployers from '@/components/careers/FeaturedEmployers';
import TrendingRoles from '@/components/careers/TrendingRoles';
import FastHireGigs from '@/components/careers/FastHireGigs';
import TopRatedTalent from '@/components/careers/TopRatedTalent';
import HowItWorks from '@/components/careers/HowItWorks';
import SafetyNote from '@/components/careers/SafetyNote';
import { createClient } from '@/lib/supabase/server';

import {
  mockEmployers,
  mockTrendingRoles,
  mockGigs,
  mockTopRatedWorkers,
  howItWorksWorkers,
  howItWorksEmployers,
  trustItems,
} from '@/lib/careers-mock-data';

export const metadata = {
  title: 'Zintra Career Centre | Jobs & Gigs in Kenya',
  description:
    'Connect with verified construction employers and find jobs and gigs across Kenya. Secure, transparent, and trusted.',
  openGraph: {
    title: 'Zintra Career Centre',
    description: 'Construction jobs and gigs in Kenya',
    type: 'website',
  },
};

async function fetchRealGigs() {
  try {
    const supabase = await createClient();
    
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
        employer:employer_id(id, company_name, logo_url),
        applications:applications(count)
      `)
      .eq('type', 'gig')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(4);

    if (error || !data) {
      console.error('Error fetching gigs:', error);
      return mockGigs;
    }

    // Transform database gigs to match FastHireGigs component format
    return data.map(gig => ({
      id: gig.id,
      role: gig.title,
      location: gig.location || 'Kenya',
      duration: gig.duration || '1 week',
      pay: gig.pay_min || 0,
      startDate: gig.start_date || new Date().toISOString(),
      employer: gig.employer?.company_name || 'Unknown Employer',
      applicants: gig.applications?.[0]?.count || 0,
    }));
  } catch (err) {
    console.error('Error in fetchRealGigs:', err);
    return mockGigs;
  }
}

export default async function CareersPage() {
  const realGigs = await fetchRealGigs();

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
