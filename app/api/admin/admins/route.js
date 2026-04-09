import { supabase } from '@/lib/supabaseClient';

// POST: Add new admin
// GET: Fetch all admins with their roles
// PUT: Update admin role/status
// DELETE: Remove admin

export async function GET(req) {
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Fetch all admins
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(admins), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Check if user is super admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminData?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Only super admins can add admins' }), { status: 403 });
    }

    const body = await req.json();
    const { user_id, role, status, notes } = body;

    // Add admin
    const { data: newAdmin, error } = await supabase
      .from('admin_users')
      .insert({
        user_id,
        role,
        status,
        notes,
        created_by: user.id,
        is_admin: true
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(newAdmin), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Check if user is super admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminData?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Only super admins can update admins' }), { status: 403 });
    }

    const body = await req.json();
    const { id, role, status, notes } = body;

    // Update admin
    const { data: updated, error } = await supabase
      .from('admin_users')
      .update({ role, status, notes })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Check if user is super admin
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (adminData?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Only super admins can remove admins' }), { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('id');

    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Admin ID required' }), { status: 400 });
    }

    // Delete admin
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
