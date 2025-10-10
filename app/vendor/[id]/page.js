'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageSquare,
  Award,
  CheckCircle,
  X,
  Calendar,
  Users,
} from 'lucide-react';

export default function VendorProfile() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const params = useParams();
  const supabase = createClient();

  // Fetch vendor details
  useEffect(() => {
    const fetchVendor = async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error loading vendor:', error);
      } else {
        setVendor(data);
      }
      setLoading(false);
    };

    fetchVendor();
  }, [params.id, supabase]);

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(!!data.user);
    };
    checkUser();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading vendor details...
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Vendor not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img src="/zintra-svg-logo.svg" alt="Zintra" className="h-8 w-auto" />
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">
                Home
              </Link>
              <Link href="/browse" className="text-gray-700 hover:text-gray-900 font-medium">
                Browse
              </Link>
              <Link href="/post-rfq" className="text-gray-700 hover:text-gray-900 font-medium">
                Post RFQ
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">
                Contact
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setIsLoggedIn(false);
                  }}
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link href="/login">
                    <button className="text-gray-700 hover:text-gray-900 font-medium">Login</button>
                  </Link>
                  <Link href="/user-registration">
                    <button
                      className="text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
                      style={{ backgroundColor: '#ea8f1e' }}
                    >
                      Sign Up
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Vendor Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-6xl">🏗️</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {vendor.company_name}
                    </h1>
                    {vendor.verified && (
                      <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verified
                      </div>
                    )}
                    {vendor.badge && (
                      <div
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: '#ea8f1e' }}
                      >
                        {vendor.badge}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-lg mb-3">{vendor.tagline}</p>

                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center text-gray-700">
                      <MapPin className="w-5 h-5 mr-2" style={{ color: '#ea8f1e' }} />
                      {vendor.location}
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Award className="w-5 h-5 mr-2" style={{ color: '#ea8f1e' }} />
                      {vendor.category}
                    </div>
                    {vendor.member_since && (
                      <div className="flex items-center text-gray-700">
                        <Calendar className="w-5 h-5 mr-2" style={{ color: '#ea8f1e' }} />
                        Member since {vendor.member_since}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                      <span className="font-bold text-gray-900">{vendor.rating ?? '—'}</span>
                      <span className="text-gray-600 ml-1">
                        ({vendor.review_count ?? 0} reviews)
                      </span>
                    </div>
                    {vendor.projects_completed && (
                      <div className="flex items-center text-gray-700">
                        <Users className="w-5 h-5 mr-2" style={{ color: '#ea8f1e' }} />
                        {vendor.projects_completed} projects completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#5f6466' }}>
                About
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {vendor.description || 'No description available.'}
              </p>
            </div>

            {/* Services (if you later add them in DB) */}
            {vendor.services && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#5f6466' }}>
                  Services Offered
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {vendor.services.map((s, i) => (
                    <div key={i} className="flex items-center text-gray-700">
                      <CheckCircle
                        className="w-5 h-5 mr-2 flex-shrink-0"
                        style={{ color: '#ea8f1e' }}
                      />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Contact Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-4" style={{ color: '#5f6466' }}>
                Contact Information
              </h3>

              {isLoggedIn ? (
                <div className="space-y-3">
                  {vendor.phone && (
                    <a
                      href={`tel:${vendor.phone}`}
                      className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Phone className="w-5 h-5 mr-3" style={{ color: '#ea8f1e' }} />
                      <div>
                        <p className="text-xs text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{vendor.phone}</p>
                      </div>
                    </a>
                  )}

                  {vendor.email && (
                    <a
                      href={`mailto:${vendor.email}`}
                      className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Mail className="w-5 h-5 mr-3" style={{ color: '#ea8f1e' }} />
                      <div>
                        <p className="text-xs text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{vendor.email}</p>
                      </div>
                    </a>
                  )}

                  {vendor.website && (
                    <a
                      href={`https://${vendor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      <Globe className="w-5 h-5 mr-3" style={{ color: '#ea8f1e' }} />
                      <div>
                        <p className="text-xs text-gray-600">Website</p>
                        <p className="font-medium text-gray-900">{vendor.website}</p>
                      </div>
                    </a>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="w-full flex items-center justify-center p-3 border-2 rounded-lg font-medium transition"
                      style={{ borderColor: '#ea8f1e', color: '#ea8f1e' }}
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      View Phone Number
                    </button>

                    <button
                      onClick={() => setShowContactModal(true)}
                      className="w-full flex items-center justify-center p-3 border-2 rounded-lg font-medium transition"
                      style={{ borderColor: '#ea8f1e', color: '#ea8f1e' }}
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      View Email
                    </button>

                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Sign in</strong> to view contact details and message this vendor.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {vendor.certifications?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold mb-3" style={{ color: '#5f6466' }}>
                    Certifications
                  </h4>
                  <div className="space-y-2">
                    {vendor.certifications.map((cert, i) => (
                      <div
                        key={i}
                        className="flex items-center text-sm text-gray-700"
                      >
                        <CheckCircle
                          className="w-4 h-4 mr-2 flex-shrink-0"
                          style={{ color: '#ea8f1e' }}
                        />
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login/Register Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#fef3e2' }}
              >
                <Phone className="w-8 h-8" style={{ color: '#ea8f1e' }} />
              </div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: '#5f6466' }}
              >
                Sign in to View Contact
              </h2>
              <p className="text-gray-600">
                Create an account or sign in to view vendor contact information and send messages.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/login" className="block">
                <button
                  className="w-full py-3 rounded-lg font-semibold text-white hover:opacity-90"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Sign In
                </button>
              </Link>

              <Link href="/user-registration" className="block">
                <button
                  className="w-full py-3 border-2 rounded-lg font-semibold hover:bg-gray-50"
                  style={{ borderColor: '#ea8f1e', color: '#ea8f1e' }}
                >
                  Create Account
                </button>
              </Link>
            </div>

            <p className="text-xs text-center text-gray-500 mt-4">
              Free to join • Connect with verified vendors
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
