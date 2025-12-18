'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, Building2, CheckCircle, ArrowRight, Clock, MessageSquare, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import AuthGuard from '../../components/AuthGuard';

function PostRFQContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const [publicRFQs, setPublicRFQs] = useState([]);
  const [quoteStats, setQuoteStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicRFQs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('rfqs')
          .select('id, title, description, category, budget_range, location, county, deadline, status, created_at')
          .eq('rfq_type', 'public')
          .eq('visibility', 'public')
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching RFQs:', fetchError);
          setError(`Failed to load RFQs: ${fetchError.message}`);
          setPublicRFQs([]);
          return;
        }

        setPublicRFQs(data || []);

        // Fetch quote stats for all RFQs if any exist
        if (data && data.length > 0) {
          try {
            const { data: stats, error: statsError } = await supabase
              .from('rfq_quote_stats')
              .select('rfq_id, total_quotes')
              .in('rfq_id', data.map(r => r.id));

            if (!statsError && stats) {
              const statsMap = {};
              stats.forEach(stat => {
                statsMap[stat.rfq_id] = stat.total_quotes || 0;
              });
              setQuoteStats(statsMap);
            } else if (statsError) {
              console.warn('Warning: Could not fetch quote stats:', statsError.message);
              // Don't fail the whole page if stats fail to load
              setQuoteStats({});
            }
          } catch (statsErr) {
            console.warn('Warning: Stats fetch error:', statsErr);
            setQuoteStats({});
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching RFQs:', err);
        setError(`Error: ${err.message || 'Unknown error'}`);
        setPublicRFQs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicRFQs();
  }, []);

  useEffect(() => {
    // Handle RFQ type routing
    if (type === 'direct') {
      router.push('/post-rfq/direct');
    } else if (type === 'matched') {
      router.push('/post-rfq/wizard');
    } else if (type === 'public') {
      router.push('/post-rfq/public');
    }
  }, [type, router]);

  const calculateDaysLeft = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

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
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block">
                  <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-500 text-lg mt-4">Loading marketplace...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600 font-semibold">Error loading RFQs</p>
                <p className="text-red-500 text-sm mt-2">{error}</p>
              </div>
            ) : publicRFQs.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No active public RFQs at the moment</p>
                <p className="text-gray-400 text-sm mt-2">Be the first to post a public RFQ above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicRFQs.map((rfq) => {
                  const daysLeft = calculateDaysLeft(rfq.deadline);
                  const quoteCount = quoteStats[rfq.id] || 0;

                  const handleViewRFQ = async () => {
                    // Track the view
                    try {
                      await fetch('/api/track-rfq-view', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rfqId: rfq.id }),
                      });
                    } catch (err) {
                      console.error('Error tracking view:', err);
                    }
                    // Navigate to RFQ details
                    router.push(`/rfq/${rfq.id}`);
                  };

                  return (
                    <div
                      key={rfq.id}
                      className="bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all p-6 flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{rfq.title}</h4>
                          <p className="text-gray-600 text-sm line-clamp-2">{rfq.description}</p>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full ml-2 flex-shrink-0 whitespace-nowrap">
                          Open
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div>
                          <p className="text-gray-500 font-semibold text-xs">Budget</p>
                          <p className="font-bold text-gray-900">{rfq.budget_range}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-semibold text-xs">Location</p>
                          <p className="font-bold text-gray-900">{rfq.county}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-semibold text-xs">Category</p>
                          <p className="font-bold text-gray-900 text-xs line-clamp-1">{rfq.category}</p>
                        </div>
                        {daysLeft !== null && (
                          <div>
                            <p className="text-gray-500 font-semibold text-xs">Deadline</p>
                            <p className={`font-bold flex items-center gap-1 ${daysLeft <= 3 ? 'text-red-600' : 'text-gray-900'}`}>
                              <Clock className="w-3 h-3" />
                              {daysLeft} days
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Engagement Metrics - Like LinkedIn */}
                      <div className="flex gap-4 text-xs text-gray-600 mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-orange-500" />
                          <span className="font-semibold text-gray-900">{quoteCount}</span>
                          <span>quote{quoteCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleViewRFQ}
                        className="w-full text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-all mt-auto"
                        style={{ backgroundColor: '#ca8637' }}
                      >
                        View & Quote
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostRFQPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>}>
        <PostRFQContent />
      </Suspense>
    </AuthGuard>
  );
}
