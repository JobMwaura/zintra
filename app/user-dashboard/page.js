'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { isSafari } from '@/lib/safariCompat';
import Link from 'next/link';
import { LogOut, User, Phone, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import DashboardNotificationsPanel from '@/components/DashboardNotificationsPanel';

export default function UserDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const supabase = createClient();

  const [userData, setUserData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [user, supabase]);

  // Timeout for auth loading (in case it hangs)
  useEffect(() => {
    console.log('🔹 UserDashboard: Auth state:', { authLoading, user: user?.email, authTimeout });
    
    if (authLoading) {
      // Safari needs more time for auth to load
      const timeoutMs = isSafari() ? 5000 : 3000;
      const timeout = setTimeout(() => {
        console.error('⚠️ Auth loading timeout - likely not logged in');
        setAuthTimeout(true);
      }, timeoutMs);
      
      return () => clearTimeout(timeout);
    } else {
      // Auth loading is complete
      console.log('✅ UserDashboard: Auth loading complete, user:', user?.email || 'no user');
      setAuthTimeout(false);
    }
  }, [authLoading, user]);

  // ============================================================================
  // ✅ NEW: Redirect vendors to their vendor profile instead of user dashboard
  // ============================================================================
  useEffect(() => {
    const checkIfVendor = async () => {
      // Only run if user is loaded and authenticated
      if (authLoading || !user) {
        return;
      }

      try {
        console.log('🔹 UserDashboard: Checking if user is vendor...');
        
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        // PGRST116 is the normal "0 rows found" error - this means user is NOT a vendor
        if (vendorError && vendorError.code !== 'PGRST116') {
          console.error('⚠️ Error checking vendor status:', vendorError);
          return;
        }

        // If vendor record exists, user is a vendor - redirect them
        if (vendor?.id) {
          console.warn('⚠️ Vendor user accessed user-dashboard, redirecting to vendor profile...');
          window.location.href = `/vendor-profile/${vendor.id}`;
          return;
        }

        // If we get here: user is NOT a vendor, proceed with user dashboard
        console.log('✅ User is not a vendor, user dashboard is correct');
      } catch (error) {
        console.error('❌ Error in vendor redirect check:', error);
        // Don't block user dashboard if check fails
      }
    };

    checkIfVendor();
  }, [user, authLoading, supabase]);

  const fetchUserData = async () => {
    if (!user) {
      console.log('🔹 UserDashboard: No user, skipping fetchUserData');
      setError('No user logged in');
      setDataLoading(false);
      return;
    }

    try {
      console.log('🔹 UserDashboard: Fetching user data for:', user.id);
      
      // Add 10-second timeout to user data fetch
      await Promise.race([
        (async () => {
          // Use maybeSingle() instead of single() to handle 0 rows gracefully
          // This prevents 406 errors when user record doesn't exist yet
          const { data, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (fetchError) {
            // Only log if it's not a PGRST116 (0 rows returned) error
            if (fetchError.code !== 'PGRST116') {
              console.error('Error fetching user data:', fetchError);
              setError('Failed to load user data');
            } else {
              console.warn('⚠️ User record not found in database - this is normal for new registrations');
              // Create default user data structure
              const defaultUserData = {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || '',
                phone: null,
                phone_verified: false,
                bio: '',
                rfq_count: 0,
                rfqs_completed: 0,
                buyer_reputation: 'new',
              };
              console.log('✅ Using default user data for new user');
              setUserData(defaultUserData);
            }
          } else if (data) {
            console.log('✅ UserDashboard: User data fetched');
            setUserData(data);
          } else {
            // data is null (no record found) - use default
            console.warn('⚠️ User record not found in database - this is normal for new registrations');
            const defaultUserData = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              phone: null,
              phone_verified: false,
              bio: '',
              rfq_count: 0,
              rfqs_completed: 0,
              buyer_reputation: 'new',
            };
            setUserData(defaultUserData);
          }
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User data fetch timeout')), 10000)
        )
      ]);
    } catch (err) {
      console.error('Error in fetchUserData:', err);
      if (err.message === 'User data fetch timeout') {
        setError('User data loading timed out - some information may be unavailable');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  // Wait for AuthContext to restore user from session before showing "Not Logged In"
  // If loading takes too long (>3 seconds), assume not logged in
  if (authLoading && !authTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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
              <img src="/zintrass-new-logo.png" alt="Zintra" className="h-8 w-auto" />
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
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#5f6466' }}>
                  Account Status
                </h2>

                {/* Phone Verification */}
                <div className={`p-4 rounded-lg border-2 mb-4 ${
                  userData?.phone_verified
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
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
                    {!userData?.phone_verified && (
                      <button
                        onClick={() => setShowPhoneVerification(true)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold text-sm transition flex-shrink-0 ml-4"
                      >
                        Verify Now
                      </button>
                    )}
                  </div>
                </div>

                {/* Email Verification */}
                <div className={`p-4 rounded-lg border-2 ${
                  userData?.email_verified
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {userData?.email_verified ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                      )}
                      <div>
                        <h3 className={`font-semibold ${
                          userData?.email_verified ? 'text-green-900' : 'text-yellow-900'
                        }`}>
                          {userData?.email_verified ? 'Email Verified' : 'Email Not Verified'}
                        </h3>
                        <p className={`text-sm ${
                          userData?.email_verified ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                          {userData?.email_verified
                            ? `Your email address (${user?.email || 'N/A'}) has been verified`
                            : 'Please verify your email address to complete your account setup'}
                        </p>
                      </div>
                    </div>
                    {!userData?.email_verified && (
                      <button
                        onClick={() => setShowEmailVerification(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition flex-shrink-0 ml-4"
                      >
                        Verify Email
                      </button>
                    )}
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
            {/* Notifications Panel */}
            <DashboardNotificationsPanel />

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
                <Link href="/user-messages">
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
                <button 
                  onClick={() => alert('Change Password feature coming soon')}
                  className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
                  title="Coming soon"
                >
                  Change Password
                </button>
                <button 
                  onClick={() => alert('Preferences feature coming soon')}
                  className="w-full text-left px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
                  title="Coming soon"
                >
                  Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phone Verification Modal */}
      {showPhoneVerification && (
        <PhoneVerificationModal
          userEmail={user?.email}
          userPhone={userData?.phone_number}
          onClose={() => setShowPhoneVerification(false)}
          onSuccess={() => {
            setShowPhoneVerification(false);
            // Refresh user data to show updated verification status
            setLoading(true);
            fetchUserData();
          }}
          supabase={supabase}
        />
      )}

      {/* Email Verification Modal */}
      {showEmailVerification && (
        <EmailVerificationModal
          userEmail={user?.email}
          onClose={() => setShowEmailVerification(false)}
          onSuccess={() => {
            setShowEmailVerification(false);
            // Refresh user data to show updated verification status
            setLoading(true);
            fetchUserData();
          }}
          supabase={supabase}
        />
      )}
    </div>
  );
}

/**
 * Phone Verification Modal Component
 */
function PhoneVerificationModal({ userEmail, userPhone, onClose, onSuccess, supabase }) {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP
  const [phone, setPhone] = useState(userPhone || '');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      setMessage('Please enter a phone number');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          channel: 'sms',     // Fixed: was 'method'
          type: 'verification', // Fixed: was 'purpose'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ OTP sent! Check your SMS');
        setMessageType('success');
        setStep(2);
      } else {
        setMessage(data.error || 'Failed to send OTP');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      setMessage('Please enter a valid 6-digit code');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          otpCode: otpCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        // Get current user ID
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser?.id) {
          setMessage('Error: Could not get user ID');
          setMessageType('error');
          return;
        }

        // Update user profile with verified phone
        const { error: updateError } = await supabase
          .from('users')
          .update({
            phone_verified: true,
            phone_verified_at: new Date().toISOString(),
            phone_number: phone,
          })
          .eq('id', authUser.id);

        if (updateError) {
          console.error('Error updating phone_verified:', updateError);
          setMessage(`Failed to update profile: ${updateError.message}`);
          setMessageType('error');
          return;
        }

        console.log('✅ Phone verified and saved for user:', authUser.id);

        setMessage('✓ Phone verified successfully!');
        setMessageType('success');
        
        // Close modal and call onSuccess callback after showing success message
        setTimeout(() => {
          if (onSuccess && typeof onSuccess === 'function') {
            try {
              onSuccess();
            } catch (err) {
              console.warn('Error in onSuccess callback:', err);
            }
          }
        }, 1500);
      } else {
        setMessage(data.error || 'Invalid OTP code');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 1 ? 'Verify Your Phone' : 'Enter OTP Code'}
          </h2>
          <p className="text-gray-600">
            {step === 1 
              ? 'Enter your phone number to receive an OTP'
              : 'Enter the 6-digit code sent to your phone'}
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 ${
            messageType === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Step 1: Enter Phone */}
        {step === 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +254700000000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              disabled={loading}
            />
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Sending...' : 'Send OTP'}</span>
            </button>
          </div>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OTP Code
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
              disabled={loading}
            />
            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Verifying...' : 'Verify OTP'}</span>
            </button>
            <button
              onClick={() => setStep(1)}
              disabled={loading}
              className="w-full mt-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/**
 * Email Verification Modal Component
 */
function EmailVerificationModal({ userEmail, onClose, onSuccess, supabase }) {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Verify OTP
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleSendEmailOTP = async () => {
    if (!userEmail) {
      setMessage('No email address found');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          channel: 'email',     // Fixed: was 'method'
          type: 'verification', // Fixed: was 'purpose'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✓ Verification email sent! Check your inbox');
        setMessageType('success');
        setStep(2);
      } else {
        setMessage(data.error || 'Failed to send verification email');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      setMessage('Please enter a valid 6-digit code');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          otpCode: otpCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        // Get current user ID
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser?.id) {
          setMessage('Error: Could not get user ID');
          setMessageType('error');
          return;
        }

        // Update user profile with verified email
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email_verified: true,
            email_verified_at: new Date().toISOString(),
          })
          .eq('id', authUser.id);

        if (updateError) {
          console.error('Error updating email_verified:', updateError);
          setMessage(`Failed to update profile: ${updateError.message}`);
          setMessageType('error');
          return;
        }

        console.log('✅ Email verified and saved for user:', authUser.id);

        setMessage('✓ Email verified successfully!');
        setMessageType('success');
        
        // Close modal and call onSuccess callback after showing success message
        setTimeout(() => {
          if (onSuccess && typeof onSuccess === 'function') {
            try {
              onSuccess();
            } catch (err) {
              console.warn('Error in onSuccess callback:', err);
            }
          }
        }, 1500);
      } else {
        setMessage(data.error || 'Invalid verification code');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 1 ? 'Verify Your Email' : 'Enter Verification Code'}
          </h2>
          <p className="text-gray-600">
            {step === 1 
              ? `We'll send a verification code to ${userEmail}`
              : 'Enter the 6-digit code sent to your email'}
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 ${
            messageType === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Step 1: Send Email OTP */}
        {step === 1 && (
          <div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <p className="text-gray-900 font-medium">{userEmail}</p>
            </div>
            <button
              onClick={handleSendEmailOTP}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Sending...' : 'Send Verification Email'}</span>
            </button>
          </div>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
              disabled={loading}
            />
            <button
              onClick={handleVerifyEmailOTP}
              disabled={loading}
              className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Verifying...' : 'Verify Email'}</span>
            </button>
            <button
              onClick={() => setStep(1)}
              disabled={loading}
              className="w-full mt-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
