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
      .maybeSingle();

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
 * Get the appropriate redirect path based on vendor's verification status
 * For posting jobs/gigs (employer action)
 * 
 * Logic:
 * 1. Not logged in → /vendor-registration
 * 2. Not an employer → /vendor-registration
 * 3. Employer but vendor doesn't exist → /vendor-registration
 * 4. Vendor exists but not verified → Posting page with verify params or registration
 * 5. Vendor fully verified (phone + email) → Go to /careers/post-job or /careers/post-gig
 */
export async function getEmployerRedirectPath(postType) {
  try {
    const supabase = createClient();
    
    // STEP 1: GET USER - with proper error handling
    let user = null;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Auth error in getEmployerRedirectPath:', authError);
        return '/vendor-registration';
      }
      user = authUser;
    } catch (authErr) {
      console.error('Exception getting auth user:', authErr);
      return '/vendor-registration';
    }

    if (!user) {
      console.log('No user logged in, returning /vendor-registration');
      return '/vendor-registration';
    }

    console.log('User logged in:', user.id);

    // STEP 2: CHECK IF USER IS EMPLOYER IN PROFILES TABLE
    let profile = null;
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, is_employer')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
        // Continue anyway - profile might not exist yet
      }
      profile = profileData;
    } catch (profileErr) {
      console.error('Exception getting profile:', profileErr);
    }

    if (!profile?.is_employer) {
      console.log('User is not employer, returning /vendor-registration');
      return '/vendor-registration';
    }

    console.log('User is employer, checking vendors table...');

    // STEP 3: CHECK IF VENDOR EXISTS IN VENDORS TABLE
    // This is the critical check that might be failing
    let vendor = null;
    let vendorError = null;
    
    try {
      const { data: vendorData, error: vError } = await supabase
        .from('vendors')
        .select('id, company_name, phone_verified, email_verified')
        .eq('user_id', user.id)
        .single();

      vendorError = vError;
      vendor = vendorData;

      if (vendorError) {
        console.error('Vendor query error:', vendorError);
        // PGRST116 means no rows found, which is expected for non-vendors
        if (vendorError.code === 'PGRST116') {
          console.log('No vendor record found (PGRST116), redirecting to registration');
          return '/vendor-registration';
        }
        // Other errors might be RLS issues
        console.warn('Vendor query failed, assuming vendor not setup:', vendorError.message);
        return '/vendor-registration';
      }
    } catch (vendorQueryErr) {
      console.error('Exception querying vendors table:', vendorQueryErr);
      return '/vendor-registration';
    }

    // STEP 3a: VENDOR DOESN'T EXIST
    if (!vendor) {
      console.log('Vendor data is null, redirecting to registration');
      return '/vendor-registration';
    }

    console.log('Vendor found:', {
      id: vendor.id,
      company_name: vendor.company_name,
      phone_verified: vendor.phone_verified,
      email_verified: vendor.email_verified
    });

    // STEP 4: VENDOR EXISTS - CHECK VERIFICATION STATUS
    // Both phone AND email must be verified to post
    if (vendor.phone_verified && vendor.email_verified) {
      // ✅ FULLY VERIFIED - Go to posting form
      const postPath = postType === 'job' ? '/careers/post-job' : '/careers/post-gig';
      console.log('Vendor fully verified, redirecting to:', postPath);
      return postPath;
    }

    // STEP 5: PARTIALLY VERIFIED OR UNVERIFIED
    // Return to post page with verification params so it can show verification modal
    // instead of full registration form
    
    if (!vendor.phone_verified && !vendor.email_verified) {
      // Neither verified - needs verification before posting
      const path = `/vendor-registration?source=post-${postType}&redirect-after=true`;
      console.log('Vendor not verified, redirecting to:', path);
      return path;
    }
    
    if (!vendor.phone_verified) {
      // Phone not verified - go to post but show phone verification modal
      const path = `/careers/post-${postType}?verify=phone`;
      console.log('Phone not verified, redirecting to:', path);
      return path;
    }
    
    if (!vendor.email_verified) {
      // Email not verified - go to post but show email verification modal
      const path = `/careers/post-${postType}?verify=email`;
      console.log('Email not verified, redirecting to:', path);
      return path;
    }

    // Fallback (shouldn't reach here)
    const fallback = `/careers/post-${postType}`;
    console.log('Fallback, redirecting to:', fallback);
    return fallback;

  } catch (error) {
    console.error('Unexpected error in getEmployerRedirectPath:', error);
    return '/vendor-registration';
  }
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
