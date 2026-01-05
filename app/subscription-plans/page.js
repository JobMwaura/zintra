'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Check, AlertCircle, Loader } from 'lucide-react';

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPlansAndSubscription();
  }, []);

  const fetchPlansAndSubscription = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Fetch all subscription plans - no filter
      const { data: allPlans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*');

      if (plansError) {
        console.error('Error fetching plans:', plansError);
        setMessage(`Error fetching plans: ${plansError.message}`);
      } else {
        console.log('Plans fetched:', allPlans);
        setPlans(allPlans || []);
      }

      // Fetch current subscription
      const { data: activeSub, error: subError } = await supabase
        .from('vendor_subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError);
      } else if (activeSub) {
        console.log('Active subscription found:', activeSub);
        setCurrentSubscription(activeSub);
      } else {
        console.log('No active subscription');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setMessage(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      setMessage('Please log in first');
      return;
    }

    setMessage('Payment processing is currently disabled. Please contact support to upgrade your plan.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading subscription plans...</p>
      </div>
    );
  }

  const headerCtaHref = user ? `/vendor-profile/${currentSubscription?.vendor_id || ''}` : '/';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8 text-sm font-medium">
            <a href="/" className="text-gray-700 hover:text-gray-900">Home</a>
            <a href="/browse" className="text-gray-700 hover:text-gray-900">Browse</a>
            <a href="/post-rfq" className="text-gray-700 hover:text-gray-900">Post RFQ</a>
          </div>
          <div className="flex items-center gap-3">
            <a href={headerCtaHref || '/'} className="text-sm font-semibold text-amber-700 hover:underline">
              {user ? 'Back to Profile' : 'Back to Home'}
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">Select the perfect plan to grow your business</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-8 p-4 rounded-lg flex items-center gap-2 ${
            message.includes('✓') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.includes('✓') ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message}
          </div>
        )}

        {/* Current Subscription Alert */}
        {currentSubscription && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900 font-medium">
              ✓ You currently have an active subscription. Upgrading will replace your current plan.
            </p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No subscription plans available at the moment</p>
              {message && (
                <p className="text-red-600 text-sm">{message}</p>
              )}
            </div>
          ) : (
            plans.map((plan) => {
              const isCurrentPlan = currentSubscription?.plan_id === plan.id;
              
              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg shadow overflow-hidden transition transform hover:shadow-lg ${
                    isCurrentPlan ? 'ring-2 ring-orange-500' : ''
                  }`}
                >
                  {/* Badge */}
                  {isCurrentPlan && (
                    <div className="bg-orange-500 text-white py-2 px-4 text-center font-medium text-sm">
                      ✓ Current Plan
                    </div>
                  )}

                  {/* Plan Content */}
                  <div className="p-6">
                    {/* Plan Name */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">
                          KSh {plan.price.toLocaleString()}
                        </span>
                        <span className="text-gray-600 ml-2">/month</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Includes:</p>
                      <ul className="space-y-2">
                        {plan.features && plan.features.length > 0 ? (
                          plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} />
                              <span>{feature}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-600">Basic features included</li>
                        )}
                      </ul>
                    </div>

                    {/* Subscribe Button */}
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={purchasing === plan.id || isCurrentPlan}
                      className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        isCurrentPlan
                          ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                      style={!isCurrentPlan ? { backgroundColor: '#ea8f1e' } : {}}
                    >
                      {purchasing === plan.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        'Subscribe Now'
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Free Tier Info */}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">On Our Free Plan?</h3>
          <p className="text-gray-600 mb-4">
            Get started with our free tier and upgrade anytime when you're ready to unlock premium features.
          </p>
          <div className="inline-block text-left">
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 mt-0.5" style={{ color: '#10B981' }} />
                <span>Basic profile listing</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 mt-0.5" style={{ color: '#10B981' }} />
                <span>Limited messaging</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 mt-0.5" style={{ color: '#10B981' }} />
                <span>Customer inquiries</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
