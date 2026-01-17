'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Get user's role status (what they can do)
 * Returns: candidate, vendor, buyer, employer enabled status + profiles
 */
export async function getUserRoleStatus(userId) {
  try {
    const supabase = await createClient();

    // Get candidate profile (id = userId, not user_id)
    const { data: candidateProfile } = await supabase
      .from('candidate_profiles')
      .select('id, skills, availability')
      .eq('id', userId)
      .single();

    // Get employer profile (id = userId, not user_id)
    const { data: employerProfile } = await supabase
      .from('employer_profiles')
      .select('id, company_name, is_vendor_employer, vendor_id')
      .eq('id', userId)
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

    // Check if candidate profile exists (id = userId, not user_id)
    const { data: existing } = await supabase
      .from('candidate_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existing) {
      return { success: true, message: 'Candidate role already enabled' };
    }

    // Create candidate profile (id = userId, not user_id)
    const { error } = await supabase
      .from('candidate_profiles')
      .insert({
        id: userId, // Use userId as the primary key
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
      .eq('id', userId)
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
      id: userId, // Use userId as the primary key
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
      .eq('id', userId)
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

      // Give initial ZCC credits
      // Vendors get 2000 free credits, regular employers get 100
      const initialCredits = vendor ? 2000 : 100;
      const creditType = vendor ? 'free_credits' : 'purchased_credits';
      
      await supabase
        .from('zcc_credits')
        .insert({
          employer_id: profile.id,
          vendor_id: vendor?.id || null,
          total_credits: initialCredits,
          used_credits: 0,
          free_credits: initialCredits,
          purchased_credits: 0,
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

    const { data, error } = await supabase
      .from('zcc_credits')
      .select('total_credits, used_credits, balance, free_credits, purchased_credits')
      .eq('employer_id', employerId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      balance: data?.balance || 0,
      totalCredits: data?.total_credits || 0,
      usedCredits: data?.used_credits || 0,
      freeCredits: data?.free_credits || 0,
      purchasedCredits: data?.purchased_credits || 0,
    };
  } catch (error) {
    console.error('Error fetching credits:', error);
    return { success: false, error: 'Failed to fetch credits' };
  }
}

/**
 * Add test credits for development/testing
 * Updates zcc_credits table directly
 */
export async function addTestCredits(employerId, creditAmount = 500) {
  try {
    const supabase = await createClient();

    // Create a fake payment record
    const { data: payment, error: paymentError } = await supabase
      .from('employer_payments')
      .insert({
        employer_id: employerId,
        vendor_id: null,
        amount_kes: creditAmount * 4, // Rough conversion (1 credit ≈ 4 KES for testing)
        payment_method: 'test',
        status: 'completed',
        reference_id: `TEST-${Date.now()}`,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      return { success: false, error: 'Failed to create test payment: ' + paymentError.message };
    }

    // Get current credits
    const { data: currentCredits } = await supabase
      .from('zcc_credits')
      .select('total_credits, used_credits, purchased_credits, free_credits')
      .eq('employer_id', employerId)
      .single();

    if (currentCredits) {
      // Update existing credits
      const { error: updateError } = await supabase
        .from('zcc_credits')
        .update({
          total_credits: currentCredits.total_credits + creditAmount,
          purchased_credits: currentCredits.purchased_credits + creditAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('employer_id', employerId);

      if (updateError) {
        return { success: false, error: 'Failed to update credits: ' + updateError.message };
      }
    } else {
      // Create new credits record if it doesn't exist
      const { error: createError } = await supabase
        .from('zcc_credits')
        .insert({
          employer_id: employerId,
          total_credits: creditAmount,
          used_credits: 0,
          purchased_credits: creditAmount,
          free_credits: 0,
        });

      if (createError) {
        return { success: false, error: 'Failed to create credits: ' + createError.message };
      }
    }

    return { 
      success: true, 
      message: `Added ${creditAmount} test credits`,
      paymentId: payment.id,
      creditsAdded: creditAmount,
    };
  } catch (error) {
    console.error('Error adding test credits:', error);
    return { success: false, error: 'Failed to add test credits' };
  }
}

/**
 * Add credits to a vendor's employer account
 * Can be called with vendor UUID directly (for admin purposes)
 * Creates employer profile if it doesn't exist
 * For vendors: if no zcc_credits record exists, create with 2000 free credits
 */
export async function addCreditsToVendor(vendorId, creditAmount = 1000) {
  try {
    const supabase = await createClient();

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, user_id, name, email')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return { success: false, error: 'Vendor not found: ' + vendorError?.message };
    }

    const userId = vendor.user_id;

    // Check if employer profile exists
    const { data: existingEmployer } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    // If employer profile doesn't exist, create it with initial credits
    if (!existingEmployer) {
      const { error: createError } = await supabase
        .from('employer_profiles')
        .insert({
          id: userId,
          company_name: vendor.name || 'Unknown Company',
          company_email: vendor.email || '',
          vendor_id: vendorId,
          is_vendor_employer: true,
          verification_level: 'verified',
        });

      if (createError) {
        return { success: false, error: 'Failed to create employer profile: ' + createError.message };
      }

      // Create zcc_credits with 2000 free credits for new vendor employer
      const { error: creditsError } = await supabase
        .from('zcc_credits')
        .insert({
          employer_id: userId,
          vendor_id: vendorId,
          total_credits: 2000,
          used_credits: 0,
          free_credits: 2000,
          purchased_credits: 0,
        });

      if (creditsError) {
        return { success: false, error: 'Failed to create credits: ' + creditsError.message };
      }

      return {
        success: true,
        message: `Vendor employer account created with 2000 free ZCC credits`,
        vendorName: vendor.name,
        creditsAdded: 2000,
      };
    } else {
      // Employer already exists, add additional credits
      const { data: currentCredits } = await supabase
        .from('zcc_credits')
        .select('total_credits, purchased_credits, free_credits, used_credits')
        .eq('employer_id', userId)
        .single();

      if (currentCredits) {
        // Update existing credits
        const { error: updateError } = await supabase
          .from('zcc_credits')
          .update({
            total_credits: currentCredits.total_credits + creditAmount,
            free_credits: currentCredits.free_credits + creditAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('employer_id', userId);

        if (updateError) {
          return { success: false, error: 'Failed to update credits: ' + updateError.message };
        }
      }

      return {
        success: true,
        message: `Added ${creditAmount} free ZCC credits to vendor`,
        vendorName: vendor.name,
        creditsAdded: creditAmount,
      };
    }
  } catch (error) {
    console.error('Error adding credits to vendor:', error);
    return { success: false, error: 'Failed to add credits to vendor' };
  }
}
