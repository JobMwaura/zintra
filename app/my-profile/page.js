'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Globe, MessageSquare, Download, Bookmark, Star, Clock, CheckCircle, Award } from 'lucide-react';

export default function VendorProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [saved, setSaved] = useState(false);

  // Mock vendor data - this would come from your database
  const vendor = {
    id: 'fa0f326d-9463-499d-b13e-980762267c12',
    company_name: 'Munich Pipes',
    category: 'Plumbing',
    description: 'Expert plumbing solutions and pipe installation services for residential and commercial properties.',
    verified: false,
    rating: 4.8,
    reviews: 128,
    projects: 89,
    response_time: '2 hrs',
    member_since: 'Oct 2025',
    location: 'Westlands, Nairobi',
    phone: '0714123456',
    email: 'eventsgear1@gmail.com',
    website: 'https://www.munichpipes.com',
    whatsapp: '0714123456',
    price_range: 'Premium',
    certifications: ['KNBS 9338393939'],
    logo: 'https://via.placeholder.com/100',
    
    // Mock data for fuller profile
    about: 'Munich Pipes has been a trusted provider of high-quality plumbing solutions and installation services for over 10 years. We pride ourselves on offering professional services backed by exceptional customer service and technical expertise.',
    
    services: [
      { name: 'Residential Plumbing', description: 'Pipe installation and repair for homes' },
      { name: 'Commercial Plumbing', description: 'Large-scale industrial plumbing solutions' },
      { name: 'Emergency Services', description: '24/7 emergency plumbing support' },
      { name: 'Maintenance Contracts', description: 'Preventive maintenance packages' }
    ],
    
    products: [
      { name: 'Premium PVC Pipes', price: '$2.50/meter', inStock: true },
      { name: 'Copper Fittings', price: '$15.00/unit', inStock: true },
      { name: 'Valve Systems', price: '$45.00/unit', inStock: true },
      { name: 'Installation Kit', price: '$89.99/kit', inStock: true }
    ],
    
    gallery: [
      { title: 'Residential Installation - Westlands', image: 'https://via.placeholder.com/200' },
      { title: 'Commercial Project - Nairobi CBD', image: 'https://via.placeholder.com/200' },
      { title: 'Emergency Repair', image: 'https://via.placeholder.com/200' }
    ],
    
    reviews_list: [
      {
        name: 'John Mwangi',
        rating: 5,
        date: '2 weeks ago',
        text: 'Excellent work on our office renovation. Professional team, completed on time and within budget. Highly recommend!'
      },
      {
        name: 'Sarah Kimani',
        rating: 5,
        date: '1 month ago',
        text: 'Built our dream home plumbing in Karen. Amazing attention to detail and quality craftsmanship. Great communication throughout.'
      },
      {
        name: 'David Ochieng',
        rating: 4,
        date: '2 months ago',
        text: 'Good quality on our warehouse project. Minor weather delays but they kept us informed. Overall very satisfied.'
      }
    ],

    faqs: [
      {
        question: 'What is your typical project lead time?',
        answer: 'Most projects are completed within 2-4 weeks depending on complexity. Emergency repairs are handled same-day.'
      },
      {
        question: 'Do you service outside Nairobi?',
        answer: 'Yes, we provide services throughout Kenya. Travel costs apply for areas outside Nairobi.'
      },
      {
        question: 'What warranty do your services carry?',
        answer: 'All installations come with a 2-year warranty on workmanship and materials.'
      }
    ]
  };

  const tabs = ['overview', 'products', 'services', 'gallery', 'reviews', 'faq'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {/* Logo */}
              <div className="w-20 h-20 bg-orange-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                MP
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
                <p className="text-gray-600 mb-3">{vendor.description}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-700">
                    <MapPin className="w-4 h-4" /> {vendor.location}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center gap-1 text-gray-700">
                    <span className="text-yellow-500">★</span> {vendor.rating} ({vendor.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">
                <MessageSquare className="w-5 h-5" />
                Contact Vendor
              </button>
              <button className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">
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
          <div className="grid grid-cols-5 gap-4 mt-8 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{vendor.rating} / 5.0</p>
              <p className="text-sm text-gray-600">Rating</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2 text-orange-600 text-2xl font-bold">
                {vendor.reviews}
              </div>
              <p className="text-sm text-gray-600">Reviews</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2 text-orange-600 text-2xl font-bold">
                {vendor.projects}
              </div>
              <p className="text-sm text-gray-600">Projects</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Clock className="w-5 h-5 text-gray-700" />
                <span className="font-bold text-gray-900">{vendor.response_time}</span>
              </div>
              <p className="text-sm text-gray-600">Response Time</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2 text-gray-900 font-bold">
                {vendor.member_since}
              </div>
              <p className="text-sm text-gray-600">Member Since</p>
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
            {/* Main Content */}
            <div className="col-span-2 space-y-8">
              {/* About Section */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About {vendor.company_name}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{vendor.about}</p>
              </section>

              {/* Services Section */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Services Offered</h2>
                <div className="space-y-3">
                  {vendor.services.map((service, idx) => (
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
                  {vendor.products.map((product, idx) => (
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
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Price Range</h3>
                <p className="text-2xl font-bold text-orange-600 mb-2">{vendor.price_range}</p>
                <p className="text-xs text-gray-600">Varies by project scope and complexity</p>
              </div>

              {/* Certifications */}
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

              {/* Contact Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-orange-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-600">Primary Phone</p>
                      <p className="font-semibold text-gray-900">{vendor.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-orange-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-600">Email</p>
                      <p className="font-semibold text-gray-900">{vendor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-orange-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-600">Website</p>
                      <p className="font-semibold text-blue-600 text-sm">{vendor.website}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-orange-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-600">WhatsApp</p>
                      <p className="font-semibold text-gray-900">{vendor.whatsapp}</p>
                    </div>
                  </div>
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
                {vendor.reviews_list.map((review, idx) => (
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
                <p className="text-5xl font-bold text-gray-900 mb-2">{vendor.rating}</p>
                <div className="flex justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(vendor.rating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">Based on {vendor.reviews} reviews</p>
              </div>
            </div>
          </div>
        )}

        {/* FAQ TAB */}
        {activeTab === 'faq' && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {vendor.faqs.map((faq, idx) => (
                <details key={idx} className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer">
                  <summary className="font-semibold text-gray-900 flex items-center justify-between">
                    {faq.question}
                    <span className="text-orange-600">+</span>
                  </summary>
                  <p className="text-gray-700 mt-3 text-sm">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Other tabs - placeholder */}
        {['products', 'services', 'gallery'].includes(activeTab) && (
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