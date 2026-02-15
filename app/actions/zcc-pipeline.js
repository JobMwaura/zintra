'use server';

import { createClient } from '@/lib/supabase/server';
import { ZCC_COSTS, ZCC_SPEND_TYPES, ZCC_APP_STATUSES, ZCC_APP_STATUS_FLOW } from '@/lib/zcc/credit-config';

/**
 * Get all applications for a specific listing (employer's pipeline view).
 * Includes candidate profile data for each applicant.
 */
export async function getApplicationsForJob(employerId, listingId) {
  try {
    const supabase = await createClient();

    // First verify the employer owns this listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, type, status, employer_id')
      .eq('id', listingId)
      .eq('employer_id', employerId)
      .single();

    if (listingError || !listing) {
      return { success: false, error: 'Listing not found or access denied' };
    }

    // Get all applications with candidate info
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        cover_letter,
        employer_notes,
        employer_rating,
        answers,
        status_history,
        status_updated_at,
        created_at,
        updated_at,
        candidate_id
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (appsError) {
      return { success: false, error: appsError.message };
    }

    // Get candidate profiles for all applicants
    const candidateIds = (applications || []).map(a => a.candidate_id);
    
    let candidates = {};
    if (candidateIds.length > 0) {
      // Get from candidate_profiles
      const { data: candidateProfiles } = await supabase
        .from('candidate_profiles')
        .select('id, skills, availability, experience_years, verified_id, completed_gigs, rating, bio')
        .in('id', candidateIds);

      // Get from profiles (for name, phone, email, avatar)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email, avatar_url, location')
        .in('id', candidateIds);

      // Check which contacts are already unlocked
      const { data: unlocks } = await supabase
        .from('zcc_contact_unlocks')
        .select('candidate_id')
        .eq('employer_id', employerId)
        .in('candidate_id', candidateIds);

      const unlockedSet = new Set((unlocks || []).map(u => u.candidate_id));

      // Merge data
      for (const cp of (candidateProfiles || [])) {
        const profile = (profiles || []).find(p => p.id === cp.id);
        candidates[cp.id] = {
          ...cp,
          full_name: profile?.full_name || 'Unknown',
          avatar_url: profile?.avatar_url || null,
          location: profile?.location || null,
          // Only show contact info if unlocked
          phone: unlockedSet.has(cp.id) ? profile?.phone : null,
          email: unlockedSet.has(cp.id) ? profile?.email : null,
          contact_unlocked: unlockedSet.has(cp.id),
        };
      }

      // Handle candidates who may not have a candidate_profile yet
      for (const profile of (profiles || [])) {
        if (!candidates[profile.id]) {
          candidates[profile.id] = {
            id: profile.id,
            full_name: profile.full_name || 'Unknown',
            avatar_url: profile.avatar_url || null,
            location: profile.location || null,
            skills: [],
            experience_years: 0,
            verified_id: false,
            completed_gigs: 0,
            rating: 0,
            phone: unlockedSet.has(profile.id) ? profile.phone : null,
            email: unlockedSet.has(profile.id) ? profile.email : null,
            contact_unlocked: unlockedSet.has(profile.id),
          };
        }
      }
    }

    // Enrich applications with candidate data
    const enrichedApps = (applications || []).map(app => ({
      ...app,
      candidate: candidates[app.candidate_id] || {
        id: app.candidate_id,
        full_name: 'Unknown Candidate',
        skills: [],
        contact_unlocked: false,
      },
    }));

    // Group by status for pipeline view
    const pipeline = {};
    for (const status of ZCC_APP_STATUS_FLOW) {
      pipeline[status] = enrichedApps.filter(a => a.status === status);
    }
    pipeline.rejected = enrichedApps.filter(a => a.status === 'rejected');

    return {
      success: true,
      listing,
      applications: enrichedApps,
      pipeline,
      counts: {
        total: enrichedApps.length,
        applied: pipeline.applied?.length || 0,
        screened: pipeline.screened?.length || 0,
        shortlisted: pipeline.shortlisted?.length || 0,
        interview: pipeline.interview?.length || 0,
        offer: pipeline.offer?.length || 0,
        hired: pipeline.hired?.length || 0,
        rejected: pipeline.rejected?.length || 0,
      },
    };
  } catch (err) {
    console.error('Error getting applications for job:', err);
    return { success: false, error: 'Failed to load applications' };
  }
}

/**
 * Update an application's status in the pipeline.
 * Uses the atomic RPC for consistency.
 */
export async function updateApplicationStatus(employerId, applicationId, newStatus, notes = null) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('zcc_update_application_status', {
      p_application_id: applicationId,
      p_employer_id: employerId,
      p_new_status: newStatus,
      p_notes: notes,
    });

    if (error) {
      console.error('Status update RPC error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: data.success,
      oldStatus: data.old_status,
      newStatus: data.new_status,
      error: data.error,
    };
  } catch (err) {
    console.error('Error updating application status:', err);
    return { success: false, error: 'Failed to update status' };
  }
}

/**
 * Get all employer's jobs with application counts (for the applicants hub page).
 */
export async function getEmployerJobsWithApplicants(employerId) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        type,
        status,
        location,
        category,
        created_at,
        applications(count)
      `)
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // For each listing, get status breakdown
    const jobsWithCounts = await Promise.all(
      (data || []).map(async (job) => {
        const { data: statusCounts } = await supabase
          .from('applications')
          .select('status')
          .eq('listing_id', job.id);

        const counts = {};
        for (const app of (statusCounts || [])) {
          counts[app.status] = (counts[app.status] || 0) + 1;
        }

        return {
          ...job,
          application_count: job.applications?.[0]?.count || 0,
          status_counts: counts,
        };
      })
    );

    return { success: true, jobs: jobsWithCounts };
  } catch (err) {
    console.error('Error getting employer jobs with applicants:', err);
    return { success: false, error: 'Failed to load jobs' };
  }
}

/**
 * Create a Job Order when an applicant is hired.
 * Links employer, candidate, listing, and application together.
 */
export async function createJobOrder(employerId, applicationId, orderData = {}) {
  try {
    const supabase = await createClient();

    // Get the application details
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select(`
        id, listing_id, candidate_id, status,
        listings(id, title, employer_id, type, pay_min, pay_max, location)
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !app) {
      return { success: false, error: 'Application not found' };
    }

    // Verify ownership
    if (app.listings?.employer_id !== employerId) {
      return { success: false, error: 'Unauthorized: not your listing' };
    }

    // Check app is in 'hired' status (or 'offer')
    if (!['hired', 'offer'].includes(app.status)) {
      return { success: false, error: 'Application must be in hired or offer status' };
    }

    // Check if job order already exists for this application
    const { data: existingOrder } = await supabase
      .from('zcc_job_orders')
      .select('id')
      .eq('application_id', applicationId)
      .single();

    if (existingOrder) {
      return { success: true, alreadyExists: true, orderId: existingOrder.id };
    }

    // Create the job order
    const { data: order, error: orderError } = await supabase
      .from('zcc_job_orders')
      .insert({
        post_id: app.listing_id,
        application_id: applicationId,
        employer_id: employerId,
        candidate_id: app.candidate_id,
        agreed_amount: orderData.agreedAmount || app.listings?.pay_max || null,
        agreed_terms: orderData.terms || {},
        start_date: orderData.startDate || null,
        county: orderData.county || app.listings?.location || null,
        town: orderData.town || null,
        site_pin: orderData.sitePin || null,
        milestones: orderData.milestones || [],
        status: 'active',
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Job order creation failed:', orderError);
      return { success: false, error: 'Failed to create job order: ' + orderError.message };
    }

    // If app status is 'offer', move it to 'hired'
    if (app.status === 'offer') {
      await updateApplicationStatus(employerId, applicationId, 'hired', 'Job order created');
    }

    return {
      success: true,
      orderId: order.id,
      candidateId: app.candidate_id,
      listingTitle: app.listings?.title,
    };
  } catch (err) {
    console.error('Error creating job order:', err);
    return { success: false, error: 'Failed to create job order' };
  }
}

/**
 * Get job orders for an employer (active agreements).
 */
export async function getEmployerJobOrders(employerId, status = null) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('zcc_job_orders')
      .select(`
        id,
        agreed_amount,
        agreed_terms,
        start_date,
        county,
        town,
        milestones,
        status,
        created_at,
        updated_at,
        post_id,
        candidate_id
      `)
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    // Enrich with listing titles and candidate names
    const enrichedOrders = await Promise.all(
      (data || []).map(async (order) => {
        const { data: listing } = await supabase
          .from('listings')
          .select('title, type')
          .eq('id', order.post_id)
          .single();

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', order.candidate_id)
          .single();

        return {
          ...order,
          listing_title: listing?.title || 'Unknown',
          listing_type: listing?.type || 'job',
          candidate_name: profile?.full_name || 'Unknown',
          candidate_avatar: profile?.avatar_url || null,
        };
      })
    );

    return { success: true, orders: enrichedOrders };
  } catch (err) {
    console.error('Error getting job orders:', err);
    return { success: false, error: 'Failed to load job orders' };
  }
}
