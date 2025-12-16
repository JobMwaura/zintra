'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, Building2, CheckCircle, ArrowRight } from 'lucide-react';

function PostRFQIndex() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  // If type is specified, redirect to appropriate wizard
  if (type === 'direct') {
    return router.push('/post-rfq/direct');
  }
  if (type === 'matched') {
    return router.push('/post-rfq/wizard');
  }
  if (type === 'public') {
    return router.push('/post-rfq/public');
  }

  // Show three RFQ type options
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img src="/zintrass-new-logo.png" alt="Zintra" className="h-32 w-auto" />
            </Link>
            <Link href="/">
              <button className="text-gray-700 hover:text-gray-900 font-medium transition-colors flex items-center gap-2">
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#535554' }}>Request for Quotation</h1>
          <p className="text-gray-600 text-lg">Choose how you want to find vendors for your project</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Type 1: Direct RFQ */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 border-b-2 border-orange-200">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-200 mb-3 mx-auto">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center">Direct RFQ</h3>
            </div>
            <div className="p-6">
              <p className="text-orange-600 text-sm font-semibold mb-4 text-center">I know who I want to contact</p>
              <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                Send your RFQ directly to specific vendors you trust and want to work with. You choose who receives your project details.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Select specific vendors</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Personal, targeted approach</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>2-5 quotes typically</span>
                </li>
              </ul>
              <button
                onClick={() => router.push('/post-rfq/direct')}
                className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: '#ca8637' }}
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Type 2: Wizard Auto-Match RFQ */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all overflow-hidden md:scale-105">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b-2 border-blue-200">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-200 mb-3 mx-auto">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center">Wizard RFQ</h3>
            </div>
            <div className="p-6">
              <p className="text-sm font-semibold mb-4 text-center text-blue-600">Help me find the right vendors</p>
              <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                Not sure who to contact? Our system automatically finds and matches qualified vendors based on category, location, and ratings.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Guided 5-step wizard</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Smart vendor matching</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>3-8 quality quotes</span>
                </li>
              </ul>
              <button
                onClick={() => router.push('/post-rfq/wizard')}
                className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: '#2563eb' }}
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Type 3: Public RFQ */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 border-b-2 border-purple-200">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-200 mb-3 mx-auto">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center">Public RFQ</h3>
            </div>
            <div className="p-6">
              <p className="text-sm font-semibold mb-4 text-center text-purple-600">Let all vendors compete</p>
              <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                Post your project to the public marketplace where any qualified vendor can see and submit quotes. Get competitive bids.
              </p>
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Transparent marketplace</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Competitive bidding</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>5-20+ quotes available</span>
                </li>
              </ul>
              <button
                onClick={() => router.push('/post-rfq/public')}
                className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: '#9333ea' }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-16 bg-blue-50 rounded-xl p-8 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Which RFQ type should I choose?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-orange-600 mb-2">Choose Direct RFQ if:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• You have preferred vendors in mind</li>
                <li>• You've worked with them before</li>
                <li>• You want a personal approach</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-blue-600 mb-2">Choose Wizard RFQ if:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• You don't know which vendors to choose</li>
                <li>• You want recommendations</li>
                <li>• You value quality matching</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-purple-600 mb-2">Choose Public RFQ if:</p>
              <ul className="space-y-1 text-gray-600">
                <li>• You want maximum options</li>
                <li>• Price comparison is important</li>
                <li>• You want competitive bidding</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Public RFQ Marketplace Section */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-2" style={{ color: '#535554' }}>Public RFQ Marketplace</h3>
            <p className="text-gray-600">Active projects open for bidding - Browse available opportunities</p>
          </div>

          {/* RFQs List */}
          <div className="space-y-4">
            {/* This will be populated with data from Supabase */}
            {/* For now, showing placeholder state */}
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No active public RFQs at the moment</p>
              <p className="text-gray-400 text-sm mt-2">Be the first to post a public RFQ above!</p>
            </div>

            {/* Sample RFQ Card Structure (commented for reference) */}
            {/* 
            <div className="bg-white rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-lg transition-all p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Kitchen Renovation</h4>
                  <p className="text-gray-600 text-sm line-clamp-2">Modern kitchen renovation with new cabinets, countertops, and appliances</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full ml-4">Open</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Budget</p>
                  <p className="text-lg font-bold text-gray-900">KSh 500K - 1M</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Location</p>
                  <p className="text-lg font-bold text-gray-900">Nairobi</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Deadline</p>
                  <p className="text-lg font-bold text-gray-900">Dec 24</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Quotes</p>
                  <p className="text-lg font-bold text-gray-900">3</p>
                </div>
              </div>
              <button className="w-full md:w-auto text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-all" style={{ backgroundColor: '#ca8637' }}>
                View & Quote
              </button>
            </div>
            */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostRFQPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>}>
      <PostRFQIndex />
    </Suspense>
  );
}
