'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { LogOut, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';

export default function UserDashboard() {
  const { user, signOut } = useAuth();
  const supabase = createClient();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setError('No user logged in');
        setLoading(false);
        return;
      }

      try {
        // Fetch user data from users table
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching user data:', fetchError);
          setError('Failed to load user data');
        } else {
          setUserData(data);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, supabase]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Logged In</h1>
          <p className="text-gray-600 mb-6">Please log in to access your dashboard.</p>
          <Link href="/login">
            <button
              className="px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition"
              style={{ backgroundColor: '#ea8f1e' }}
            >
              Go to Login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img src="/zintra-svg-logo.svg" alt="Zintra" className="h-8 w-auto" />
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/browse" className="text-gray-700 hover:text-gray-900 font-medium">
                Browse
              </Link>
              <Link href="/post-rfq" className="text-gray-700 hover:text-gray-900 font-medium">
                Post RFQ
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">
                About
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ea8f1e' }}>
                  <User className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Dashboard Card */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#5f6466' }}>
                Welcome Back, {userData?.full_name || user?.email?.split('@')[0]}!
              </h1>
              <p className="text-gray-600 mb-8">Here's your dashboard</p>

              {/* Phone Verification Status */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#5f6466' }}>
                  Account Status
                </h2>

                <div className={`p-4 rounded-lg border-2 ${
                  userData?.phone_verified
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {userData?.phone_verified ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    )}
                    <div>
                      <h3 className={`font-semibold ${
                        userData?.phone_verified ? 'text-green-900' : 'text-yellow-900'
                      }`}>
                        {userData?.phone_verified ? 'Phone Verified' : 'Phone Not Verified'}
                      </h3>
                      <p className={`text-sm ${
                        userData?.phone_verified ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {userData?.phone_verified
                          ? `Your phone number (${userData?.phone_number || 'N/A'}) has been verified via SMS OTP`
                          : 'Please verify your phone number to complete your account setup'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Profile Information */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#5f6466' }}>
                  Profile Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <p className="text-gray-900 font-medium">
                      {userData?.full_name || 'Not set'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900 font-medium">{user?.email}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <p className="text-gray-900 font-medium">
                        {userData?.phone_number || 'Not verified yet'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <p className="text-gray-900 font-medium">
                      {userData?.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : 'Not set'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <p className="text-gray-900 font-medium">
                      {userData?.bio || 'No bio added yet'}
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/edit-profile">
                <button
                  className="px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Edit Profile
                </button>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#5f6466' }}>
                Quick Links
              </h3>
              <div className="space-y-3">
                <Link href="/browse">
                  <button className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                    Browse Vendors
                  </button>
                </Link>
                <Link href="/post-rfq">
                  <button className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                    Post RFQ
                  </button>
                </Link>
                <Link href="/my-rfqs">
                  <button className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                    My RFQs
                  </button>
                </Link>
                <Link href="/messages">
                  <button className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                    Messages
                  </button>
                </Link>
              </div>
            </div>

            {/* Account Settings Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#5f6466' }}>
                Account Settings
              </h3>
              <div className="space-y-3">
                <Link href="/edit-profile">
                  <button className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                    Edit Profile
                  </button>
                </Link>
                <Link href="/change-password">
                  <button className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                    Change Password
                  </button>
                </Link>
                <Link href="/preferences">
                  <button className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                    Preferences
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
