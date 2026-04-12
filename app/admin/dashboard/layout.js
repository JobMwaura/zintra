// File: app/admin/dashboard/layout.js
// Purpose: Admin layout with server-side auth protection

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hasActiveAdminAccess } from '@/lib/adminAccess';
import AdminDashboardShell from './AdminDashboardShell';

export const dynamic = 'force-dynamic';

async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server components cannot always write cookies during render.
          }
        },
      },
    }
  );
}

export default async function AdminDashboardLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/admin/login');
  }

  const { isAdmin, error: adminError } = await hasActiveAdminAccess(supabase, user.id);

  if (adminError || !isAdmin) {
    redirect('/admin/login');
  }

  return <AdminDashboardShell userEmail={user.email || ''}>{children}</AdminDashboardShell>;
}