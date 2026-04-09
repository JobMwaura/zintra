/**
 * Zintra Career Centre - TypeScript Types
 * Shared types for profiles, listings, applications, monetization
 */

// ============================================
// IDENTITY & AUTH
// ============================================

export type UserRole = 'candidate' | 'employer' | 'admin';

export interface Profile {
  id: string;
  email: string;
  is_candidate: boolean;
  is_employer: boolean;
  full_name: string | null;
  phone: string | null;
  location: string | null; // County
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateProfile extends Profile {
  candidate: {
    id: string;
    skills: string[];
    availability: string;
    rate_per_day: number | null;
    verified_id: boolean;
    verified_references: boolean;
    tools_ready: boolean;
    bio: string | null;
    experience_years: number;
    completed_gigs: number;
    rating: number;
    no_shows: number;
    updated_at: string;
  };
}

export interface EmployerProfile extends Profile {
  employer: {
    id: string;
    company_name: string;
    company_registration: string | null;
    verification_level: 'unverified' | 'verified' | 'trusted';
    company_phone: string | null;
    company_email: string | null;
    county: string | null;
    company_logo_url: string | null;
    company_description: string | null;
    jobs_posted: number;
    gigs_posted: number;
    total_hires: number;
    rating: number;
    updated_at: string;
  };
}

// ============================================
// MARKETPLACE: LISTINGS & APPLICATIONS
// ============================================

export type ListingType = 'job' | 'gig';
export type ListingStatus = 'active' | 'paused' | 'closed' | 'filled';

export interface Listing {
  id: string;
  employer_id: string;
  type: ListingType;
  title: string;
  description: string | null;
  role_category: string | null;
  location: string;
  start_date: string | null;
  duration: string | null; // For gigs: "3 days", "1 week"
  pay_min: number | null;
  pay_max: number | null;
  pay_currency: string;
  status: ListingStatus;
  featured: boolean;
  featured_until: string | null;
  urgent_badge: boolean;
  views: number;
  applicants_count: number;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 'applied' | 'shortlisted' | 'interview' | 'hired' | 'rejected';

export interface Application {
  id: string;
  listing_id: string;
  candidate_id: string;
  status: ApplicationStatus;
  answers: Record<string, any>;
  employer_notes: string | null;
  employer_rating: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// MONETIZATION: PLANS & BILLING
// ============================================

export type PlanType = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface Subscription {
  id: string;
  employer_id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  started_at: string;
  ends_at: string | null;
}

export type BoostType = 'featured' | 'urgent' | 'extra_reach';

export interface ListingBoost {
  id: string;
  listing_id: string;
  employer_id: string;
  boost_type: BoostType;
  starts_at: string;
  ends_at: string;
  cost_kes: number | null;
  created_at: string;
}

export type CreditType = 'contact_unlock' | 'outreach' | 'boost';

export interface CreditsLedger {
  id: string;
  employer_id: string;
  credit_type: CreditType;
  delta: number;
  balance: number;
  reason: string | null;
  created_at: string;
}

export interface ContactUnlock {
  id: string;
  employer_id: string;
  candidate_id: string;
  listing_id: string | null;
  unlocked_at: string;
}

// ============================================
// MESSAGING
// ============================================

export interface Conversation {
  id: string;
  employer_id: string;
  candidate_id: string;
  listing_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read: boolean;
  created_at: string;
}

// ============================================
// RATINGS & REPUTATION
// ============================================

export interface Rating {
  id: string;
  from_user_id: string;
  to_user_id: string;
  listing_id: string | null;
  context: 'employer_to_worker' | 'worker_to_employer';
  score: number; // 1-5
  comment: string | null;
  created_at: string;
}

// ============================================
// CAPABILITIES & ENTITLEMENTS
// ============================================

/**
 * Feature capabilities based on plan
 * Resolved by capabilities resolver
 */
export interface EmployerCapabilities {
  plan: PlanType;
  max_active_listings: number;
  contact_unlocks_included: number;
  can_use_filters: boolean;
  can_shortlist: boolean;
  can_bulk_outreach: boolean;
  can_invite_to_apply: boolean;
  can_view_analytics: boolean;
  can_team_accounts: boolean;
}

export interface CandidateCapabilities {
  can_apply: boolean;
  can_message: boolean;
  has_premium_visibility: boolean;
  verification_level: 'unverified' | 'id_verified' | 'references_verified';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}
