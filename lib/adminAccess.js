export async function getActiveAdminRecord(supabaseClient, userId) {
  if (!supabaseClient || !userId) {
    return { admin: null, error: null };
  }

  const { data, error } = await supabaseClient
    .from('admin_users')
    .select('id, role, status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return { admin: null, error };
  }

  if (!data || data.status !== 'active') {
    return { admin: null, error: null };
  }

  return { admin: data, error: null };
}

export async function hasActiveAdminAccess(supabaseClient, userId) {
  const { admin, error } = await getActiveAdminRecord(supabaseClient, userId);

  return {
    admin,
    error,
    isAdmin: Boolean(admin),
  };
}