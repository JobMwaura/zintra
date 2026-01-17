'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import Link from 'next/link';
import { Menu, X, LogOut } from 'lucide-react';

export default function CareersNavbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndRoles();
  }, []);

  async function checkUserAndRoles() {
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!error && user) {
        setUser(user);
        const roleResult = await getUserRoleStatus(user.id);
        setRoles(roleResult.roles);
      }
    } catch (err) {
      console.error('Error checking user:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setRoles(null);
      router.push('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/careers" className="text-2xl font-bold text-blue-600">
            Zintra Career Centre
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!user ? (
              <>
                <Link
                  href="/careers/auth/login"
                  className="text-slate-700 hover:text-slate-900 font-medium transition"
                >
                  Login
                </Link>
                <Link
                  href="/careers/auth/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {!roles?.candidate && !roles?.employer ? (
                  /* User logged in but no roles enabled */
                  <Link
                    href="/careers/onboarding"
                    className="text-slate-700 hover:text-slate-900 font-medium transition"
                  >
                    Get Started
                  </Link>
                ) : (
                  <>
                    {roles?.candidate && (
                      <Link
                        href="/careers/me"
                        className="text-slate-700 hover:text-slate-900 font-medium transition"
                      >
                        My Profile
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/dashboard"
                        className="text-slate-700 hover:text-slate-900 font-medium transition"
                      >
                        Dashboard
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/post-job"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition"
                      >
                        Post Job
                      </Link>
                    )}
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-slate-900 transition flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? (
              <X size={24} className="text-slate-900" />
            ) : (
              <Menu size={24} className="text-slate-900" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            {!user ? (
              <>
                <Link
                  href="/careers/auth/login"
                  className="block text-slate-700 hover:text-slate-900 font-medium py-2"
                >
                  Login
                </Link>
                <Link
                  href="/careers/auth/signup"
                  className="block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-center transition"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {!roles?.candidate && !roles?.employer ? (
                  <Link
                    href="/careers/onboarding"
                    className="block text-slate-700 hover:text-slate-900 font-medium py-2"
                  >
                    Get Started
                  </Link>
                ) : (
                  <>
                    {roles?.candidate && (
                      <Link
                        href="/careers/me"
                        className="block text-slate-700 hover:text-slate-900 font-medium py-2"
                      >
                        My Profile
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/dashboard"
                        className="block text-slate-700 hover:text-slate-900 font-medium py-2"
                      >
                        Dashboard
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/post-job"
                        className="block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg text-center transition"
                      >
                        Post Job
                      </Link>
                    )}
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-slate-600 hover:text-slate-900 font-medium py-2 transition"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
