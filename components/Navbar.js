'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Home,
  Briefcase,
  FileText,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Search,
} from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setShowUserMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 group hover:opacity-80 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition">
              Z
            </div>
            <span className="font-bold text-gray-900 hidden sm:inline text-lg">Zintra</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Home</span>
            </Link>

            <Link
              href="/browse"
              className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition"
            >
              <Briefcase className="w-4 h-4" />
              <span className="text-sm font-medium">Browse Vendors</span>
            </Link>

            <Link
              href="/post-rfq"
              className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Post RFQ</span>
            </Link>
          </div>

          {/* Right Side: User Menu / Auth */}
          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {currentUser ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                    >
                      <User className="w-4 h-4 text-gray-700" />
                      <span className="text-sm font-medium text-gray-700 hidden sm:inline max-w-xs truncate">
                        {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-700" />
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</p>
                          <p className="text-sm font-medium text-gray-900 truncate mt-1">
                            {currentUser.user_metadata?.full_name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {currentUser.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <Link
                          href="/my-profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">My Profile</span>
                        </Link>

                        {/* Divider */}
                        <div className="border-t border-gray-200 my-2"></div>

                        {/* Sign Out */}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login">
                      <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 transition">
                        Sign In
                      </button>
                    </Link>
                    <Link href="/register">
                      <button className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                        Sign Up
                      </button>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden pb-4 space-y-2 border-t border-gray-200 pt-4">
            <Link href="/">
              <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-3">
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Home</span>
              </button>
            </Link>
            <Link href="/browse">
              <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-3">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm font-medium">Browse Vendors</span>
              </button>
            </Link>
            <Link href="/post-rfq">
              <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Post RFQ</span>
              </button>
            </Link>
            {currentUser && (
              <Link href="/my-profile">
                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-3">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">My Profile</span>
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
