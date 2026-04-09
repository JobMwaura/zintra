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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/careers" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              Z
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">Career Centre</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* Main Site Links */}
            <div className="flex items-center gap-4 pr-4 border-r border-gray-200">
              <Link
                href="/"
                className="text-gray-700 hover:text-orange-500 font-medium transition text-sm"
              >
                Home
              </Link>
              <Link
                href="/browse"
                className="text-gray-700 hover:text-orange-500 font-medium transition text-sm"
              >
                Find Vendors
              </Link>
              <Link
                href="/post-rfq"
                className="text-gray-700 hover:text-orange-500 font-medium transition text-sm"
              >
                Post RFQ
              </Link>
            </div>

            {/* Career Centre Browse Links */}
            <div className="flex items-center gap-4 pr-4 border-r border-gray-200">
              <Link
                href="/careers/jobs"
                className="text-gray-700 hover:text-orange-500 font-medium transition text-sm"
              >
                Find Jobs
              </Link>
              <Link
                href="/careers/gigs"
                className="text-gray-700 hover:text-orange-500 font-medium transition text-sm"
              >
                Find Gigs
              </Link>
              <Link
                href="/careers/talent"
                className="text-gray-700 hover:text-orange-500 font-medium transition text-sm"
              >
                Talent
              </Link>
            </div>

            {/* Auth / Role Links */}
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-orange-500 font-medium transition"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition"
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
                    className="text-gray-700 hover:text-orange-500 font-medium transition"
                  >
                    Get Started
                  </Link>
                ) : (
                  <>
                    {roles?.candidate && (
                      <Link
                        href="/careers/me"
                        className="text-gray-700 hover:text-orange-500 font-medium transition"
                      >
                        My Profile
                      </Link>
                    )}
                    {roles?.candidate && (
                      <Link
                        href="/careers/me/verification"
                        className="text-gray-700 hover:text-orange-500 font-medium transition"
                      >
                        Verification
                      </Link>
                    )}
                    {roles?.candidate && (
                      <Link
                        href="/careers/me/requirements"
                        className="text-gray-700 hover:text-orange-500 font-medium transition"
                      >
                        Requirements
                      </Link>
                    )}
                    {roles?.candidate && (
                      <Link
                        href="/careers/notifications"
                        className="text-gray-700 hover:text-orange-500 font-medium transition"
                      >
                        Notifications
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/dashboard"
                        className="text-gray-700 hover:text-orange-500 font-medium transition"
                      >
                        Dashboard
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/applicants"
                        className="text-gray-700 hover:text-orange-500 font-medium transition"
                      >
                        Applicants
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/orders"
                        className="text-gray-700 hover:text-orange-500 font-medium transition"
                      >
                        Orders
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/credits"
                        className="text-gray-700 hover:text-orange-500 font-medium transition"
                      >
                        Credits
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/post-job"
                        className="text-gray-700 hover:text-orange-500 font-medium transition"
                      >
                        Post Job
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/post-gig"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition"
                      >
                        Post Gig
                      </Link>
                    )}
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 transition flex items-center gap-2"
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
            {/* Main Site Links */}
            <div className="pb-3 border-b border-gray-200">
              <Link
                href="/"
                className="block text-gray-700 hover:text-orange-500 font-medium py-2 text-sm"
              >
                ← Back to Home
              </Link>
              <Link
                href="/browse"
                className="block text-gray-700 hover:text-orange-500 font-medium py-2 text-sm"
              >
                Find Vendors
              </Link>
              <Link
                href="/post-rfq"
                className="block text-gray-700 hover:text-orange-500 font-medium py-2 text-sm"
              >
                Post RFQ
              </Link>
            </div>

            {/* Career Centre Browse Links */}
            <div className="pb-3 border-b border-gray-200">
              <Link
                href="/careers/jobs"
                className="block text-gray-700 hover:text-orange-500 font-medium py-2 text-sm"
              >
                Find Jobs
              </Link>
              <Link
                href="/careers/gigs"
                className="block text-gray-700 hover:text-orange-500 font-medium py-2 text-sm"
              >
                Find Gigs
              </Link>
              <Link
                href="/careers/talent"
                className="block text-gray-700 hover:text-orange-500 font-medium py-2 text-sm"
              >
                Talent
              </Link>
            </div>

            {/* Auth / Role Links */}
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="block text-gray-700 hover:text-orange-500 font-medium py-2"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  className="block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg text-center transition"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {!roles?.candidate && !roles?.employer ? (
                  <Link
                    href="/careers/onboarding"
                    className="block text-gray-700 hover:text-orange-500 font-medium py-2"
                  >
                    Get Started
                  </Link>
                ) : (
                  <>
                    {roles?.candidate && (
                      <Link
                        href="/careers/me"
                        className="block text-gray-700 hover:text-orange-500 font-medium py-2"
                      >
                        My Profile
                      </Link>
                    )}
                    {roles?.candidate && (
                      <Link
                        href="/careers/me/verification"
                        className="block text-gray-700 hover:text-orange-500 font-medium py-2"
                      >
                        Verification
                      </Link>
                    )}
                    {roles?.candidate && (
                      <Link
                        href="/careers/me/requirements"
                        className="block text-gray-700 hover:text-orange-500 font-medium py-2"
                      >
                        Requirements
                      </Link>
                    )}
                    {roles?.candidate && (
                      <Link
                        href="/careers/notifications"
                        className="block text-gray-700 hover:text-orange-500 font-medium py-2"
                      >
                        Notifications
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/dashboard"
                        className="block text-gray-700 hover:text-orange-500 font-medium py-2"
                      >
                        Dashboard
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/applicants"
                        className="block text-gray-700 hover:text-orange-500 font-medium py-2"
                      >
                        Applicants
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/orders"
                        className="block text-gray-700 hover:text-orange-500 font-medium py-2"
                      >
                        Orders
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/credits"
                        className="block text-gray-700 hover:text-orange-500 font-medium py-2"
                      >
                        Credits
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/post-job"
                        className="block text-gray-700 hover:text-orange-500 font-medium py-2"
                      >
                        Post Job
                      </Link>
                    )}
                    {roles?.employer && (
                      <Link
                        href="/careers/employer/post-gig"
                        className="block bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg text-center transition"
                      >
                        Post Gig
                      </Link>
                    )}
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-gray-600 hover:text-gray-900 font-medium py-2 transition"
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
