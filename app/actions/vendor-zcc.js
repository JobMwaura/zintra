'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Get user's role status (what they can do)
 * Returns: candidate, vendor, buyer, employer enabled status + profiles
 */
export async function getUserRoleStatus(userId) {
  try {
    const supabase = await createClient();

    // Get candidate profile
    const { data: candidateProfile } = await supabase
      .from('candidate_profiles')
      .select('id, skills, availability')
      .eq('user_id', userId)
      .single();

    // Get employer profile
    const { data: employerProfile } = await supabase
      .from('employer_profiles')
      .select('id, company_name, is_vendor_employer, vendor_id')
      .eq('user_id', userId)
      .single();

    // Get vendor info (from vendors table)
    const { data: vendorInfo } = await supabase
      .from('vendors')
      .select('id, name, email, phone, location, logo_url')
      .eq('user_id', userId)
      .single();

    return {
      success: true,
      roles: {
        candidate: !!candidateProfile,
        employer: !!employerProfile,
        vendor: !!vendorInfo,
      },
      profiles: {
        candidateProfile: candidateProfile || null,
        employerProfile: employerProfile || null,
        vendorInfo: vendorInfo || null,
      },
    };
  } catch (error) {
    console.error('Error getting user role status:', error);
    return {
      success: false,
      error: 'Failed to get role status',
      roles: {
        candidate: false,
        employer: false,
        vendor: false,
      },
      profiles: {
        candidateProfile: null,
        employerProfile: null,
        vendorInfo: null,
      },
    };
  }
}

/**
 * Enable candidate role for user
 * Creates candidate profile if it doesn't exist
 */
export async function enableCandidateRole(userId) {
  try {
    const supabase = await createClient();

    // Check if candidate profile exists
    const { data: existing } = await supabase
      .from('candidate_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { success: true, message: 'Candidate role already enabled' };
    }

    // Create candidate profile
    const { error } = await supabase
      .from('candidate_profiles')
      .insert({
        user_id: userId,
        skills: [],
        availability: 'available',
        experience_years: 0,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Candidate role enabled' };
  } catch (error) {
    console.error('Error enabling candidate role:', error);
    return { success: false, error: 'Failed to enable candidate role' };
  }
}

/**
 * Enable employer role for user
 * If user is a vendor, prefill from vendor data
 * Otherwise, requires manual entry
 */
export async function enableEmployerRole(userId, companyData) {
  try {
    const supabase = await createClient();

    // Check if employer profile exists
    const { data: existing } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return { success: true, message: 'Employer role already enabled' };
    }

    // Get vendor info if exists (for prefilling)
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, name, email, phone, location, logo_url')
      .eq('user_id', userId)
      .single();

    // Prepare employer profile data
    const profileData = {
      user_id: userId,
      company_name: companyData?.companyName || vendor?.name || '',
      company_email: companyData?.companyEmail || vendor?.email || '',
      company_phone: companyData?.companyPhone || vendor?.phone || '',
      location: companyData?.location || vendor?.location || '',
      company_description: companyData?.description || '',
      verification_level: vendor ? 'verified' : 'unverified',
      is_vendor_employer: !!vendor,
      vendor_id: vendor?.id || null,
    };

    // Create employer profile
    const { error } = await supabase
      .from('employer_profiles')
      .insert(profileData);

    if (error) {
      return { success: false, error: error.message };
    }

    // Create free subscription for new employer
    const { data: profile } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profile) {
      await supabase
        .from('subscriptions')
        .insert({
          employer_id: profile.id,
          plan: 'free',
          status: 'active',
          started_at: new Date().toISOString(),
        });

      // Give initial credits (100 free credits for new employer)
      await supabase
        .from('credits_ledger')
        .insert({
          employer_id: profile.id,
          amount: 100,
          credit_type: 'plan_allocation',
          description: 'Welcome bonus: 100 free credits',
        });
    }

    return {
      success: true,
      message: 'Employer role enabled',
      isVendorEmployer: !!vendor,
      vendorInfo: vendor || null,
    };
  } catch (error) {
    console.error('Error enabling employer role:', error);
    return { success: false, error: 'Failed to enable employer role' };
  }
}

/**
 * Get employer dashboard stats
 * Single query to view with all metrics
 */
export async function getEmployerStats(employerId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employer_dashboard_stats')
      .select('*')
      .eq('employer_id', employerId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, stats: data };
  } catch (error) {
    console.error('Error fetching employer stats:', error);
    return { success: false, error: 'Failed to fetch dashboard stats' };
  }
}

/**
 * Get employer's active jobs
 */
export async function getEmployerJobs(employerId, limit = 10) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('listings')
      .select(
        `
        id,
        title,
        status,
        created_at,
        applications(count)
      `
      )
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, jobs: data || [] };
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    return { success: false, error: 'Failed to load jobs' };
  }
}

/**
 * Get recent applications for employer's jobs
 */
export async function getEmployerApplications(employerId, limit = 5) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('applications')
      .select(
        `
        id,
        status,
        created_at,
        candidate_id,
        listing_id,
        listings(title)
      `
      )
      .in(
        'listing_id',
        await supabase
          .from('listings')
          .select('id')
          .eq('employer_id', employerId)
          .then(res => res.data?.map(l => l.id) || [])
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, applications: data || [] };
  } catch (error) {
    console.error('Error fetching applications:', error);
    return { success: false, error: 'Failed to load applications' };
  }
}

/**
 * Get credits balance for employer
 */
export async function getEmployerCredits(employerId) {
  try {
    const supabase = await createClient();

    const { data: ledger, error } = await supabase
      .from('credits_ledger')
      .select('amount, credit_type')
      .eq('employer_id', employerId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Calculate balance
    const balance = ledger.reduce((sum, entry) => {
      if (['purchase', 'bonus', 'plan_allocation'].includes(entry.credit_type)) {
        return sum + entry.amount;
      } else {
        return sum - Math.abs(entry.amount);
      }
    }, 0);

    return { success: true, balance };
  } catch (error) {
    console.error('Error fetching credits:', error);
    return { success: false, error: 'Failed to fetch credits' };
  }
}
