'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function Login() {
  const { signIn } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      // The signIn completes, but onAuthStateChange needs a moment to fire
      // and AuthContext needs to update with the new user
      await new Promise(resolve => setTimeout(resolve, 500));

      let redirectUrl = '/browse';

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

      console.log('🔹 Redirecting to:', redirectUrl);
      // Use a longer delay to ensure session is fully persisted and AuthContext updates
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 800); // increased from 1200ms to give plenty of time for session persistence

    } catch (err) {
      console.error('❌ Unexpected login error:', err);
      setMessage('❌ Something went wrong: ' + err.message);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img src="/zintrass-new-logo.png" alt="Zintra" className="h-8 w-auto" />
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
