'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Detect if a user is an existing vendor
 * Used to show "Career Centre" tab in vendor dashboard
 */
export async function detectVendor(userId) {
  try {
    const supabase = await createClient();
    
    // Check if user is a vendor in vendors table
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('id, name, logo_url')
      .eq('user_id', userId)
      .single();
    
    if (error || !vendor) {
      return {
        isVendor: false,
        vendor: null,
      };
    }
    
    // Check if vendor has employer profile in ZCC
    const { data: employerProfile } = await supabase
      .from('employer_profiles')
      .select('id, company_name, is_vendor_employer')
      .eq('vendor_id', vendor.id)
      .single();
    
    return {
      isVendor: true,
      vendor: {
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorLogo: vendor.logo_url,
      },
      hasEmployerProfile: !!employerProfile,
      employerProfile: employerProfile || null,
    };
  } catch (error) {
    console.error('Error detecting vendor:', error);
    return {
      isVendor: false,
      error: 'Failed to detect vendor status',
    };
  }
}

/**
 * Create employer profile for vendor entering ZCC
 */
export async function createVendorEmployerProfile(vendorId, userId) {
  try {
    const supabase = await createClient();
    
    // Get vendor details
    const { data: vendor } = await supabase
      .from('vendors')
      .select('name, email, phone, location, logo_url')
      .eq('id', vendorId)
      .single();
    
    if (!vendor) {
      return { success: false, error: 'Vendor not found' };
    }
    
    // Create employer profile linked to vendor
    const { data: employerProfile, error } = await supabase
      .from('employer_profiles')
      .insert({
        id: userId, // Use user ID as employer ID (same as profiles.id)
        vendor_id: vendorId,
        is_vendor_employer: true,
        company_name: vendor.name,
        company_email: vendor.email,
        company_phone: vendor.phone,
        county: vendor.location,
        company_logo_url: vendor.logo_url,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating employer profile:', error);
      return { success: false, error: 'Failed to create employer profile' };
    }
    
    // Auto-create free subscription for vendor
    await supabase
      .from('subscriptions')
      .insert({
        employer_id: userId,
        plan: 'free',
        status: 'active',
      });
    
    return { success: true, employerProfile };
  } catch (error) {
    console.error('Error in createVendorEmployerProfile:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get vendor employer dashboard stats
 */
export async function getVendorEmployerStats(employerId) {
  try {
    const supabase = await createClient();
    
    const { data: stats } = await supabase
      .from('employer_dashboard_stats')
      .select('*')
      .eq('employer_id', employerId)
      .single();
    
    return { success: true, stats };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { success: false, error: 'Failed to load dashboard' };
  }
}

/**
 * Get vendor's posted jobs
 */
export async function getVendorJobs(employerId) {
  try {
    const supabase = await createClient();
    
    const { data: jobs, error } = await supabase
      .from('listings')
      .select(
        `
        id,
        title,
        type,
        status,
        location,
        pay_min,
        pay_max,
        views,
        applicants_count,
        created_at,
        featured,
        featured_until
      `
      )
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { success: true, jobs };
  } catch (error) {
    console.error('Error fetching vendor jobs:', error);
    return { success: false, error: 'Failed to load jobs' };
  }
}

/**
 * Get vendor's recent applications
 */
export async function getVendorApplications(employerId, limit = 5) {
  try {
    const supabase = await createClient();
    
    const { data: applications, error } = await supabase
      .from('applications')
      .select(
        `
        id,
        status,
        created_at,
        listing:listings(id, title),
        candidate:profiles(id, full_name, avatar_url)
      `
      )
      .in(
        'listing_id',
        await supabase
          .from('listings')
          .select('id')
          .eq('employer_id', employerId)
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return { success: true, applications };
  } catch (error) {
    console.error('Error fetching applications:', error);
    return { success: false, error: 'Failed to load applications' };
  }
}
