/**
 * Authentication Helper Functions
 * Provides utilities for checking user authentication and role status
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Check if user is logged in and get their role
 * Returns: { isLoggedIn: boolean, userRole: 'candidate' | 'employer' | null, userId: string | null }
 */
export async function checkAuthStatus() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        isLoggedIn: false,
        userRole: null,
        userId: null,
      };
    }

    // Get user profile to check their role
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_candidate, is_employer')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return {
        isLoggedIn: true,
        userRole: null,
        userId: user.id,
      };
    }

    // Determine primary role
    let userRole = null;
    if (profile.is_employer) {
      userRole = 'employer';
    } else if (profile.is_candidate) {
      userRole = 'candidate';
    }

    return {
      isLoggedIn: true,
      userRole,
      userId: user.id,
    };
  } catch (error) {
    console.error('Error checking auth status:', error);
    return {
      isLoggedIn: false,
      userRole: null,
      userId: null,
    };
  }
}

/**
 * Get the appropriate redirect path based on user authentication
 * For posting jobs/gigs (employer action)
 */
export async function getEmployerRedirectPath(postType) {
  const { isLoggedIn, userRole } = await checkAuthStatus();

  if (!isLoggedIn) {
    // Not logged in - go to vendor registration
    return '/vendor-registration';
  }

  if (userRole === 'employer') {
    // Already logged in as employer - go straight to posting form
    return postType === 'job' ? '/careers/post-job' : '/careers/post-gig';
  }

  // Logged in as candidate but trying to post - redirect to vendor registration
  // They can use same email to create employer account
  return '/vendor-registration';
}

/**
 * Get the appropriate redirect path based on user authentication
 * For applying to jobs/gigs (candidate action)
 */
export async function getCandidateRedirectPath(jobId, applicationType) {
  const { isLoggedIn, userRole, userId } = await checkAuthStatus();

  if (!isLoggedIn) {
    // Not logged in - go to user registration
    return '/user-registration';
  }

  if (userRole === 'candidate') {
    // Already logged in as candidate - go to application form
    // Pass job ID as query param so form can pre-fill
    return applicationType === 'job' 
      ? `/careers/jobs/${jobId}/apply` 
      : `/careers/gigs/${jobId}/apply`;
  }

  // Logged in as employer but trying to apply - redirect to user registration
  // They can use same email to create candidate account
  return '/user-registration';
}

/**
 * Redirect to appropriate auth page based on action
 * This is a client-side helper to use with Next.js router
 */
export async function handleAuthRedirect(router, action, data = {}) {
  try {
    let redirectPath = '/';

    switch (action) {
      case 'post-job':
        redirectPath = await getEmployerRedirectPath('job');
        break;
      case 'post-gig':
        redirectPath = await getEmployerRedirectPath('gig');
        break;
      case 'apply-job':
        redirectPath = await getCandidateRedirectPath(data.jobId, 'job');
        break;
      case 'apply-gig':
        redirectPath = await getCandidateRedirectPath(data.jobId, 'gig');
        break;
      case 'view-profile':
        redirectPath = '/careers/me';
        break;
      default:
        redirectPath = '/';
    }

    router.push(redirectPath);
  } catch (error) {
    console.error('Error in handleAuthRedirect:', error);
    router.push('/');
  }
}
