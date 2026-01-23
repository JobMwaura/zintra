'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { isSafari } from '@/lib/safariCompat';

export default function Login() {
  const { signIn } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('user');
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'email-otp'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [otpData, setOtpData] = useState({
    email: '',
    code: '',
    step: 1, // 1: Enter email, 2: Enter OTP
    loading: false,
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Debug: Check if Supabase is initialized
  useEffect(() => {
    console.log('🔹 Login page mounted');
    console.log('🔹 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
    console.log('🔹 Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    setIsLoading(true);
    setMessage('');

    try {
      const { email, password } = formData;

      console.log('🔹 Attempting login:', { email, activeTab });

      // FIXED: Properly destructure both data and error from signIn
      const { data, error } = await signIn(email, password);

      if (error) {
        console.error('❌ Supabase login error:', error);
        const friendly =
          error.message === 'Invalid login credentials'
            ? '❌ Invalid credentials. If you just signed up, verify your email first or reset your password.'
            : '❌ ' + error.message;
        setMessage(friendly);
        setIsLoading(false);
        return;
      }

      if (!data || !data.user) {
        console.error('❌ No user data returned');
        setMessage('❌ Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Supabase login success:', data);
      console.log('🔹 User object:', data.user);
      console.log('🔹 Active tab:', activeTab);
      console.log('🔹 Session tokens:', { 
        accessToken: data.session?.access_token ? '✓ present' : '✗ missing',
        refreshToken: data.session?.refresh_token ? '✓ present' : '✗ missing'
      });
      setMessage('✅ Login successful! Redirecting...');

      // CRITICAL: Wait for Supabase to persist the session to localStorage
      // and verify the session was actually created
      // Safari needs more time for session persistence
      const delayMs = isSafari() ? 1000 : 500;
      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Verify session was persisted
      const { data: { session: verifySession } } = await supabase.auth.getSession();
      if (!verifySession) {
        console.error('❌ Session not persisted after login');
        setMessage('❌ Session error - please try logging in again');
        setIsLoading(false);
        return;
      }
      console.log('✅ Session verified:', verifySession.user.email);

      // Check if there's a redirect URL stored from before login
      const storedRedirect = sessionStorage.getItem('redirectAfterLogin');
      let redirectUrl = storedRedirect;
      sessionStorage.removeItem('redirectAfterLogin'); // Clear it after checking

      // If no stored redirect, use default logic based on user type
      if (!storedRedirect) {
        if (activeTab === 'vendor') {
          // VENDOR LOGIN: Fetch vendor ID and redirect to editable vendor profile
          console.log('✓ Vendor login detected, fetching vendor profile...');
          const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (vendorError) {
            console.error('❌ Error fetching vendor:', vendorError);
            redirectUrl = '/browse'; // fallback
          } else if (vendorData) {
            redirectUrl = `/vendor-profile/${vendorData.id}`;
            console.log('✓ Vendor found, redirecting to:', redirectUrl);
          } else {
            console.log('⚠️ No vendor profile found for user');
            redirectUrl = '/browse'; // fallback if no vendor profile
          }
        } else {
          // USER LOGIN: Redirect to user dashboard
          redirectUrl = '/user-dashboard';
          console.log('✓ User login detected, redirecting to user dashboard');
        }
      }

      // Ensure we have a redirect URL
      if (!redirectUrl) {
        console.warn('⚠️ No redirect URL set, using default /browse');
        redirectUrl = '/browse';
      }

      console.log('🔹 Redirecting to:', redirectUrl);
      // Safari needs more time for session persistence and context updates
      const redirectDelayMs = isSafari() ? 1200 : 800;
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, redirectDelayMs);

    } catch (err) {
      console.error('❌ Unexpected login error:', err);
      setMessage('❌ Something went wrong: ' + err.message);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Email OTP Login Functions
  const handleSendEmailOTP = async (e) => {
    e.preventDefault();
    
    if (!otpData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpData.email)) {
      setOtpData(prev => ({ ...prev, message: '❌ Please enter a valid email address' }));
      return;
    }

    setOtpData(prev => ({ ...prev, loading: true, message: '' }));

    try {
      // Send magic link for login
      const { error } = await supabase.auth.signInWithOtp({
        email: otpData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      setOtpData(prev => ({ 
        ...prev, 
        step: 2, 
        loading: false,
        message: `✅ Login link sent to ${otpData.email}! Check your inbox.`
      }));

    } catch (error) {
      console.error('Email OTP error:', error);
      setOtpData(prev => ({ 
        ...prev, 
        loading: false,
        message: `❌ Failed to send login link: ${error.message}`
      }));
    }
  };

  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    
    if (!otpData.code.trim()) {
      setOtpData(prev => ({ ...prev, message: '❌ Please enter the code from your email' }));
      return;
    }

    setOtpData(prev => ({ ...prev, loading: true, message: '' }));

    try {
      // For magic link, we don't verify codes manually
      // The user should click the link in their email
      setOtpData(prev => ({
        ...prev,
        loading: false,
        message: '📧 Please click the login link in your email to complete login'
      }));

    } catch (error) {
      console.error('OTP verification error:', error);
      setOtpData(prev => ({ 
        ...prev, 
        loading: false,
        message: `❌ Verification failed: ${error.message}`
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/zintrass-new-logo.png" alt="Zintra" className="h-8 w-auto" />
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
              <Link href="/browse" className="text-gray-700 hover:text-gray-900 font-medium">Browse</Link>
              <Link href="/post-rfq" className="text-gray-700 hover:text-gray-900 font-medium">Post RFQ</Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/user-registration">
                <button className="text-gray-700 hover:text-gray-900 font-medium">Sign Up</button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold" style={{ color: '#5f6466' }}>Welcome Back</h2>
              <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
            </div>

            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  console.log('✓ Switching to user tab');
                  setActiveTab('user');
                  setMessage('');
                  setFormData({ email: '', password: '', rememberMe: false });
                }}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === 'user'
                    ? 'border-b-2 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={activeTab === 'user' ? { borderBottomColor: '#ea8f1e', borderBottomWidth: '2px', color: '#ea8f1e' } : {}}
              >
                User Login
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('✓ Switching to vendor tab');
                  setActiveTab('vendor');
                  setMessage('');
                  setFormData({ email: '', password: '', rememberMe: false });
                }}
                className={`flex-1 py-3 text-center font-medium transition-colors ${
                  activeTab === 'vendor'
                    ? 'border-b-2 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={activeTab === 'vendor' ? { borderBottomColor: '#ea8f1e', borderBottomWidth: '2px', color: '#ea8f1e' } : {}}
              >
                Vendor Login
              </button>
            </div>

            {/* Login Method Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setOtpData({ email: '', code: '', step: 1, loading: false, message: '' });
                  setMessage('');
                }}
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'password'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Lock className="w-4 h-4 mr-2" />
                Password Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('email-otp');
                  setFormData({ email: '', password: '', rememberMe: false });
                  setErrors({});
                  setMessage('');
                }}
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'email-otp'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Link
              </button>
            </div>

            {/* Password Login Form */}
            {loginMethod === 'password' && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Email Address*
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Password*
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm hover:underline" style={{ color: '#ea8f1e' }}>
                    Forgot password?
                  </Link>
                </div>

                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.includes('✅') 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>
            )}

            {/* Email OTP Login Form */}
            {loginMethod === 'email-otp' && (
              <div className="space-y-6">
                {otpData.step === 1 ? (
                  // Step 1: Enter Email for OTP
                  <form onSubmit={handleSendEmailOTP}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                          Email Address*
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={otpData.email}
                            onChange={(e) => setOtpData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter your email to receive login link"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                            required
                          />
                        </div>
                      </div>

                      {otpData.message && (
                        <div className={`p-3 rounded-lg text-sm ${
                          otpData.message.includes('✅') 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {otpData.message}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={otpData.loading}
                        className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: '#ea8f1e' }}
                      >
                        {otpData.loading ? 'Sending...' : 'Send Login Link'}
                      </button>

                      <div className="text-center">
                        <p className="text-xs text-gray-500">
                          We'll send a secure login link to your email
                        </p>
                      </div>
                    </div>
                  </form>
                ) : (
                  // Step 2: Check Email Message
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                      <Mail className="w-8 h-8 text-orange-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        We sent a login link to <strong>{otpData.email}</strong>
                      </p>
                    </div>

                    {otpData.message && (
                      <div className={`p-3 rounded-lg text-sm ${
                        otpData.message.includes('✅') || otpData.message.includes('📧')
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {otpData.message}
                      </div>
                    )}

                    <div className="space-y-3">
                      <button
                        onClick={handleSendEmailOTP}
                        disabled={otpData.loading}
                        className="w-full border border-orange-500 text-orange-600 py-2 rounded-lg font-medium hover:bg-orange-50 transition disabled:opacity-50"
                      >
                        {otpData.loading ? 'Resending...' : 'Resend Link'}
                      </button>

                      <button
                        onClick={() => setOtpData({ email: '', code: '', step: 1, loading: false, message: '' })}
                        className="w-full text-gray-600 py-2 rounded-lg font-medium hover:text-gray-800 transition"
                      >
                        ← Use Different Email
                      </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                      <h4 className="font-medium text-blue-800 mb-2">📧 Email Login Instructions:</h4>
                      <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                        <li>Check your email inbox (and spam folder)</li>
                        <li>Click the "Login to Zintra" button</li>
                        <li>You'll be automatically logged in</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div className="space-y-3">
              <button type="button" className="w-full flex items-center justify-center py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-gray-700">Continue with Google</span>
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  href={activeTab === 'vendor' ? '/vendor-registration' : '/user-registration'} 
                  className="font-medium hover:underline"
                  style={{ color: '#ea8f1e' }}
                >
                  Sign up {activeTab === 'vendor' ? 'as vendor' : 'here'}
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <Link href="/about" className="hover:underline" style={{ color: '#ea8f1e' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link href="/about" className="hover:underline" style={{ color: '#ea8f1e' }}>Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
