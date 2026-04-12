import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hasActiveAdminAccess } from '@/lib/adminAccess';
import { isMissingColumnError } from '@/lib/rfqPersistence';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function stripField(payload, fieldName) {
  const nextPayload = { ...payload };
  delete nextPayload[fieldName];
  return nextPayload;
}

async function authenticateAdmin(request, requireSuperAdmin = false) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      response: NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 }),
    };
  }

  const { admin, isAdmin, error: adminError } = await hasActiveAdminAccess(supabase, user.id);
  if (adminError) {
    return {
      response: NextResponse.json({ error: adminError.message }, { status: 500 }),
    };
  }

  if (!isAdmin) {
    return {
      response: NextResponse.json({ error: 'Admin access required' }, { status: 403 }),
    };
  }

  if (requireSuperAdmin && admin.role !== 'super_admin') {
    return {
      response: NextResponse.json({ error: 'Only super admins can perform this action' }, { status: 403 }),
    };
  }

  return { user, admin, response: null };
}

async function findAuthUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return data.users.find((user) => (user.email || '').trim().toLowerCase() === normalizedEmail) || null;
}

async function saveAdminRecord(payload, mode = 'insert', id = null) {
  let nextPayload = { ...payload };

  for (;;) {
    let query = mode === 'insert'
      ? supabase.from('admin_users').insert(nextPayload)
      : supabase.from('admin_users').update(nextPayload).eq('id', id);

    const { data, error } = await query.select().single();

    if (!error) {
      return { data, error: null };
    }

    const removableField = ['notes'].find(
      (field) => Object.prototype.hasOwnProperty.call(nextPayload, field) && isMissingColumnError(error, field)
    );

    if (!removableField) {
      return { data: null, error };
    }

    nextPayload = stripField(nextPayload, removableField);
  }
}

export async function GET(request) {
  const auth = await authenticateAdmin(request, false);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { data: adminsData, error: adminsError } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (adminsError) {
      throw adminsError;
    }

    const { data: authUsersData, error: authUsersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authUsersError) {
      throw authUsersError;
    }

    const authUsersById = new Map((authUsersData.users || []).map((user) => [user.id, user]));
    const admins = (adminsData || []).map((adminRecord) => {
      const authUser = authUsersById.get(adminRecord.user_id);
      return {
        ...adminRecord,
        email: adminRecord.email || authUser?.email || 'Unknown',
        lastSignIn: authUser?.last_sign_in_at || null,
      };
    });

    return NextResponse.json({ admins }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await authenticateAdmin(request, true);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const normalizedEmail = String(body.email || '').trim().toLowerCase();
    const role = body.role || 'admin';
    const status = body.status || 'active';
    const notes = body.notes || null;

    if (!normalizedEmail || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    let authUser = await findAuthUserByEmail(normalizedEmail);
    if (!authUser) {
      const { data: createdUserData, error: createUserError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: randomUUID(),
        email_confirm: true,
      });

      if (createUserError || !createdUserData.user) {
        throw createUserError || new Error('Failed to create auth user for admin');
      }

      authUser = createdUserData.user;
    }

    const { data: existingAdmin, error: existingAdminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (existingAdminError && existingAdminError.code !== 'PGRST116') {
      throw existingAdminError;
    }

    if (existingAdmin) {
      const { data: updatedAdmin, error: updateError } = await saveAdminRecord(
        {
          email: normalizedEmail,
          role,
          status,
          notes,
        },
        'update',
        existingAdmin.id
      );

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ admin: updatedAdmin }, { status: 200 });
    }

    const { data: newAdmin, error: insertError } = await saveAdminRecord({
      user_id: authUser.id,
      email: normalizedEmail,
      role,
      status,
      notes,
    });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ admin: newAdmin }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await authenticateAdmin(request, true);
  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const { id, role, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Admin id is required' }, { status: 400 });
    }

    const { data: updatedAdmin, error } = await saveAdminRecord(
      { role, status, notes },
      'update',
      id
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ admin: updatedAdmin }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await authenticateAdmin(request, true);
  if (auth.response) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('id');

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', adminId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
