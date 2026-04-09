/**
 * ZCC Credit Configuration
 * Central source of truth for all credit costs and product SKUs.
 * These values match the zcc_credit_products table seeds.
 * Update DB seeds if you change these — or better, fetch from DB at runtime.
 */

// ============================================
// ACTION COSTS (in credits)
// ============================================

export const ZCC_COSTS = {
  // Employer posting costs
  JOB_POST: 30,
  GIG_POST: 20,

  // Featured listing add-ons
  FEATURED_JOB_7D: 50,
  FEATURED_JOB_14D: 80,
  FEATURED_JOB_30D: 120,
  FEATURED_GIG_24H: 15,
  FEATURED_GIG_72H: 30,

  // Contact & outreach
  CONTACT_UNLOCK: 10,
  BOOST_POST_24H: 20,

  // Candidate costs (only for premium features)
  VERIFICATION_BUNDLE: 50,
  FEATURED_PROFILE_7D: 80,
  APPLICATION_BOOST: 10,
  EXTRA_APPLICATIONS_10: 30,
};

// ============================================
// SKU MAPPINGS (match DB zcc_credit_products.sku)
// ============================================

export const ZCC_SKUS = {
  // Employer packs
  EMP_STARTER: 'emp_starter',
  EMP_GIG_PACK: 'emp_gig_pack',
  EMP_PRO: 'emp_pro',
  EMP_ENTERPRISE: 'emp_enterprise',

  // Candidate packs
  CAND_VERIFY: 'cand_verify',
  CAND_FEATURED: 'cand_featured',
  CAND_APPLY_PACK: 'cand_apply_pack',
  CAND_PRO: 'cand_pro',

  // Action SKUs
  ACTION_JOB_POST: 'action_job_post',
  ACTION_GIG_POST: 'action_gig_post',
  ACTION_FEATURED_JOB_7D: 'action_featured_job_7d',
  ACTION_FEATURED_JOB_14D: 'action_featured_job_14d',
  ACTION_FEATURED_JOB_30D: 'action_featured_job_30d',
  ACTION_FEATURED_GIG_24H: 'action_featured_gig_24h',
  ACTION_FEATURED_GIG_72H: 'action_featured_gig_72h',
  ACTION_CONTACT_UNLOCK: 'action_contact_unlock',
  ACTION_BOOST_24H: 'action_boost_24h',
};

// ============================================
// SPEND TYPES (match zcc_credit_spends.spend_type enum)
// ============================================

export const ZCC_SPEND_TYPES = {
  JOB_POST: 'job_post',
  GIG_POST: 'gig_post',
  FEATURED_JOB: 'featured_job',
  FEATURED_GIG: 'featured_gig',
  CONTACT_UNLOCK: 'contact_unlock',
  INVITE_TO_APPLY: 'invite_to_apply',
  BOOST_POST: 'boost_post',
  VERIFICATION_BUNDLE: 'verification_bundle',
  FEATURED_PROFILE: 'featured_profile',
  APPLICATION_BOOST: 'application_boost',
  EXTRA_APPLICATIONS: 'extra_applications',
};

// ============================================
// FREE ALLOWANCES
// ============================================

export const ZCC_FREE = {
  // Candidates get this many free applications per month
  FREE_APPLIES_PER_MONTH: 5,

  // New employer gets this many free credits on signup
  EMPLOYER_SIGNUP_CREDITS: 100,

  // Vendor-employer gets this many free credits
  VENDOR_EMPLOYER_SIGNUP_CREDITS: 2000,
};

// ============================================
// FEATURED DURATIONS
// ============================================

export const ZCC_FEATURED_DURATIONS = {
  JOB_7D: { days: 7, label: '7 days' },
  JOB_14D: { days: 14, label: '14 days' },
  JOB_30D: { days: 30, label: '30 days' },
  GIG_24H: { hours: 24, label: '24 hours' },
  GIG_72H: { hours: 72, label: '72 hours' },
};

// ============================================
// NOTIFICATION EVENTS
// ============================================

export const ZCC_EVENTS = {
  POST_PUBLISHED: 'post_published',
  APPLICATION_RECEIVED: 'application_received',
  SHORTLISTED: 'shortlisted',
  OFFER_MADE: 'offer_made',
  HIRED: 'hired',
  CONTACT_UNLOCKED: 'contact_unlocked',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
  SECURITY_OTP: 'security_otp',
  SECURITY_ALERT: 'security_alert',
};

// ============================================
// WORKER / EMPLOYER LEVELS
// ============================================

export const ZCC_LEVELS = {
  NEW: { key: 'new', label: 'New', min_completed: 0, min_rating: 0 },
  RISING: { key: 'rising', label: 'Rising', min_completed: 3, min_rating: 3.5 },
  TRUSTED: { key: 'trusted', label: 'Trusted', min_completed: 10, min_rating: 4.0 },
  TOP_RATED: { key: 'top_rated', label: 'Top Rated', min_completed: 25, min_rating: 4.5 },
};

// ============================================
// APPLICATION STATUSES (pipeline)
// ============================================

export const ZCC_APP_STATUSES = {
  APPLIED: 'applied',
  SCREENED: 'screened',
  SHORTLISTED: 'shortlisted',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected',
};

export const ZCC_APP_STATUS_FLOW = [
  'applied',
  'screened',
  'shortlisted',
  'interview',
  'offer',
  'hired',
];
