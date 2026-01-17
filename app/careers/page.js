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

export default function CareersPage() {
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
      <FastHireGigs gigs={mockGigs} />

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
