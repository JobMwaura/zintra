'use client';

import { useState } from 'react';
import { LogIn, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function StepAuth({ user, onUserChange }) {
  const [mode, setMode] = useState('prompt'); // 'prompt' | 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: loginErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginErr) {
        setError(loginErr.message);
        return;
      }

      if (data?.user) {
        onUserChange(data.user);
        setSuccessMsg('Signed in successfully!');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signupErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (signupErr) {
        setError(signupErr.message);
        return;
      }

      if (data?.user) {
        // If email confirmation is required, the user won't be fully signed in
        if (data.session) {
          onUserChange(data.user);
          setSuccessMsg('Account created and signed in!');
        } else {
          // Try to auto-login after signup
          const { data: loginData } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (loginData?.user) {
            onUserChange(loginData.user);
            setSuccessMsg('Account created and signed in!');
          } else {
            setSuccessMsg('Account created! Please check your email to verify, then log in.');
            setMode('login');
          }
        }
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Verify Your Account
        </h3>

        {user ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-900">Account Verified ✓</p>
                <p className="text-sm text-green-800 mt-1">{user.email}</p>
                <p className="text-xs text-green-700 mt-2">
                  You're logged in and ready to submit your RFQ. Click "Next" to review and send.
                </p>
              </div>
            </div>
          </div>
        ) : mode === 'prompt' ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <LogIn className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Sign In Required</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Please log in or create an account to submit your RFQ.
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    We need to verify your identity before sending RFQs to vendors.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMode('login')}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Create Account
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Your information is secure and will never be shared with vendors.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Toggle between login/signup */}
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                  mode === 'login' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                  mode === 'signup' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error / Success messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                {successMsg}
              </div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  required
                  minLength={mode === 'signup' ? 6 : 1}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'login' ? 'Signing In...' : 'Creating Account...'}</>
                ) : (
                  <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center">
              Your information is secure and will never be shared with vendors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
