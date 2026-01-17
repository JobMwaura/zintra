'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Update candidate profile
 */
export async function updateCandidateProfile(candidateId, data) {
  try {
    const supabase = await createClient();

    // Update candidate_profiles
    const { error: candidateError } = await supabase
      .from('candidate_profiles')
      .upsert(
        {
          id: candidateId,
          skills: data.skills || [],
          availability: data.availability,
          rate_per_day: data.rate_per_day,
          bio: data.bio,
          experience_years: data.experience_years,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (candidateError) {
      console.error('Error updating candidate profile:', candidateError);
      return { success: false, error: 'Failed to update candidate profile' };
    }

    // Update profiles (base info)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone,
        location: data.location,
        is_candidate: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return { success: false, error: 'Failed to update profile' };
    }

    return { success: true, message: 'Candidate profile updated' };
  } catch (error) {
    console.error('Error in updateCandidateProfile:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update employer profile
 */
export async function updateEmployerProfile(employerId, data) {
  try {
    const supabase = await createClient();

    // Update employer_profiles
    const { error: employerError } = await supabase
      .from('employer_profiles')
      .upsert(
        {
          id: employerId,
          company_name: data.company_name,
          company_registration: data.company_registration,
          company_phone: data.company_phone,
          company_email: data.company_email,
          county: data.county,
          company_description: data.company_description,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (employerError) {
      console.error('Error updating employer profile:', employerError);
      return { success: false, error: 'Failed to update employer profile' };
    }

    // Update profiles (base info)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone,
        location: data.county,
        is_employer: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', employerId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return { success: false, error: 'Failed to update profile' };
    }

    return { success: true, message: 'Employer profile updated' };
  } catch (error) {
    console.error('Error in updateEmployerProfile:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get candidate profile
 */
export async function getCandidateProfile(candidateId) {
  try {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('candidate_profiles')
      .select(
        `
        *,
        profile:profiles(id, email, full_name, phone, location, avatar_url, created_at)
      `
      )
      .eq('id', candidateId)
      .single();

    if (error) {
      console.error('Error fetching candidate profile:', error);
      return { success: false, error: 'Failed to fetch profile' };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Error in getCandidateProfile:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get employer profile
 */
export async function getEmployerProfile(employerId) {
  try {
    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('employer_profiles')
      .select(
        `
        *,
        profile:profiles(id, email, full_name, phone, created_at)
      `
      )
      .eq('id', employerId)
      .single();

    if (error) {
      console.error('Error fetching employer profile:', error);
      return { success: false, error: 'Failed to fetch profile' };
    }

    return { success: true, profile };
  } catch (error) {
    console.error('Error in getEmployerProfile:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Enable candidate role
 */
export async function enableCandidateRole(userId) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ is_candidate: true })
      .eq('id', userId);

    if (error) {
      console.error('Error enabling candidate role:', error);
      return { success: false, error: 'Failed to enable candidate role' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in enableCandidateRole:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Enable employer role
 */
export async function enableEmployerRole(userId) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ is_employer: true })
      .eq('id', userId);

    if (error) {
      console.error('Error enabling employer role:', error);
      return { success: false, error: 'Failed to enable employer role' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in enableEmployerRole:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
