'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { MapPin, Phone, Mail, Globe, MessageSquare, Download, Bookmark, Star, Clock, CheckCircle, Award } from 'lucide-react';

export default function VendorProfilePage() {
  const params = useParams();
  const vendorId = params.id;
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true);
        console.log('Fetching vendor with ID:', vendorId);

        const { data, error: fetchError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .single();

        if (fetchError) {
          console.error('Error fetching vendor:', fetchError);
          setError('Failed to load vendor profile');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Vendor not found');
          setLoading(false);
          return;
        }

        console.log('✅ Vendor data loaded:', data);
        setVendor(data);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Exception:', err);
        setError('Error loading vendor profile');
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchVendor();
    }
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Vendor not found'}</p>
          <a href="/browse" className="text-orange-600 hover:underline">
            Back to browse vendors
          </a>
        </div>
      </div>
    );
  }

  const tabs = ['overview', 'products', 'services', 'gallery', 'reviews', 'faq'];

  // Calculate initials for avatar
  const initials = vendor.company_name
    ? vendor.company_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'V';

  // Mock data for sections not in database yet
  const mockServices = [
    { name: 'Service 1', description: 'Professional service' },
    { name: 'Service 2', description: 'Quality service' },
  ];

  const mockProducts = [
    { name: 'Product 1', price: 'Price TBD', inStock: true },
    { name: 'Product 2', price: 'Price TBD', inStock: true },
  ];

  const mockReviews = [
    {
      name: 'Customer Name',
      rating: 5,
      date: 'Recently',
      text: 'Great service!',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {/* Logo/Avatar */}
              <div className="w-20 h-20 bg-orange-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
              
              {/* Company Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{vendor.company_name}</h1>
                  {vendor.verified && (
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-3">{vendor.description || 'Professional vendor services'}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  {vendor.location && (
                    <span className="flex items-center gap-1 text-gray-700">
                      <MapPin className="w-4 h-4" /> {vendor.location}
                      {vendor.county && `, ${vendor.county}`}
                    </span>
                  )}
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center gap-1 text-gray-700">
                    <span className="text-yellow-500">★</span> {vendor.rating || 'New'} 
                    {vendor.review_count && `(${vendor.review_count} reviews)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition">
                <MessageSquare className="w-5 h-5" />
                Contact Vendor
              </button>
              <button className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition">
                <Download className="w-5 h-5" />
                Request Quote
              </button>
              <button
                onClick={() => setSaved(!saved)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition ${
                  saved 
                    ? 'bg-orange-100 border-orange-600 text-orange-600' 
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{vendor.rating || 'N/A'}</p>
              <p className="text-sm text-gray-600">Rating</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2 text-orange-600 text-2xl font-bold">
                {vendor.review_count || 0}
              </div>
              <p className="text-sm text-gray-600">Reviews</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2 text-orange-600 text-2xl font-bold">
                {vendor.projects_completed || 0}
              </div>
              <p className="text-sm text-gray-600">Projects</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Clock className="w-5 h-5 text-gray-700" />
                <span className="font-bold text-gray-900">{vendor.response_time || '24 hrs'}</span>
              </div>
              <p className="text-sm text-gray-600">Response Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium transition capitalize ${
                activeTab === tab
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-8">
              {/* About Section */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About {vendor.company_name}</h2>
                <p className="text-gray-700 leading-relaxed">
                  {vendor.description || 'Professional vendor providing quality services and materials.'}
                </p>
              </section>

              {/* Services Section */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Services Offered</h2>
                <div className="space-y-3">
                  {mockServices.map((service, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Featured Products */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Products</h2>
                <div className="grid grid-cols-2 gap-4">
                  {mockProducts.map((product, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="bg-gray-200 h-32 rounded mb-3"></div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h3>
                      <p className="text-orange-600 font-bold mb-2">{product.price}</p>
                      {product.inStock && (
                        <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1 text-xs font-medium rounded">
                          In Stock
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="col-span-1">
              {/* Price Range */}
              {vendor.price_range && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Price Range</h3>
                  <p className="text-2xl font-bold text-orange-600 mb-2">{vendor.price_range}</p>
                  <p className="text-xs text-gray-600">Varies by project scope and complexity</p>
                </div>
              )}

              {/* Certifications */}
              {vendor.certifications && vendor.certifications.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Certifications
                  </h3>
                  <div className="space-y-2">
                    {vendor.certifications.map((cert, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  {vendor.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-orange-600 mt-1" />
                      <div>
                        <p className="text-xs text-gray-600">Primary Phone</p>
                        <p className="font-semibold text-gray-900">{vendor.phone}</p>
                      </div>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-orange-600 mt-1" />
                      <div>
                        <p className="text-xs text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">{vendor.email}</p>
                      </div>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-orange-600 mt-1" />
                      <div>
                        <p className="text-xs text-gray-600">Website</p>
                        <p className="font-semibold text-blue-600 text-sm">{vendor.website}</p>
                      </div>
                    </div>
                  )}
                  {vendor.whatsapp && (
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-orange-600 mt-1" />
                      <div>
                        <p className="text-xs text-gray-600">WhatsApp</p>
                        <p className="font-semibold text-gray-900">{vendor.whatsapp}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
              <div className="space-y-4">
                {mockReviews.map((review, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                    <p className="text-gray-700 text-sm mt-3">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-5xl font-bold text-gray-900 mb-2">{vendor.rating || 'N/A'}</p>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        vendor.rating && i < Math.round(vendor.rating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">Based on {vendor.review_count || 0} reviews</p>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs - placeholder */}
        {['products', 'services', 'gallery', 'faq'].includes(activeTab) && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg capitalize">
              {activeTab} content coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}