'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * ✅ AuthGuard Component
 * Wraps pages that require authentication
 * Shows login prompt if not authenticated
 * Can be dismissed or redirects to login
 */
export default function AuthGuard({ children, fallback = null }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);
      } catch (err) {
        console.error('Error checking auth:', err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Still loading
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin inline-block h-8 w-8 border-4 border-slate-300 border-t-orange-600 rounded-full"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show fallback or login prompt
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white shadow-lg p-8 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="bg-orange-100 rounded-full p-4">
                <Lock className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Sign In Required</h1>
              <p className="text-slate-600">
                You need to sign in to post RFQs and request quotes from vendors.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/user-registration"
                className="w-full block text-center rounded-lg py-3 px-4 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition shadow-md"
              >
                <span className="flex items-center justify-center gap-2">
                  Create Account <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <Link
                href="/login"
                className="w-full block text-center rounded-lg py-3 px-4 text-sm font-semibold text-slate-900 border border-slate-300 hover:bg-slate-50 transition"
              >
                Sign In
              </Link>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-900">
                We use this to prevent spam and help vendors connect with serious buyers.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show content
  return children;
}
