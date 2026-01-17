'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus, getEmployerCredits } from '@/app/actions/vendor-zcc';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, CheckCircle, Zap, TrendingUp, Award } from 'lucide-react';

const CREDIT_PACKAGES = [
  {
    id: 'starter',
    credits: 100,
    price: 500,
    label: 'Starter',
    popular: false,
    savings: 0,
    features: [
      'Post 1 job',
      'Unlock 0 contacts',
    ],
  },
  {
    id: 'pro',
    credits: 500,
    price: 2000,
    label: 'Pro',
    popular: true,
    savings: 10, // 10% bonus
    features: [
      'Post 5 jobs',
      'Unlock 50 contacts',
      '10% bonus credits',
    ],
  },
  {
    id: 'business',
    credits: 1000,
    price: 3500,
    label: 'Business',
    popular: false,
    savings: 17, // 17% bonus
    features: [
      'Post 10 jobs',
      'Unlock 100 contacts',
      'Boost 5 jobs',
      '17% bonus credits',
    ],
  },
  {
    id: 'enterprise',
    credits: 5000,
    price: 15000,
    label: 'Enterprise',
    popular: false,
    savings: 25, // 25% bonus
    features: [
      'Post 50+ jobs',
      'Unlimited unlocks',
      'Boost 50+ jobs',
      '25% bonus credits',
      'Priority support',
    ],
  },
];

const PAYMENT_METHODS = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    icon: '📱',
    description: 'Pay with M-Pesa - Instant & secure',
  },
  {
    id: 'card',
    name: 'Card',
    icon: '💳',
    description: 'Visa / Mastercard',
  },
  {
    id: 'pesapal',
    name: 'Pesapal',
    icon: '💰',
    description: 'Multiple payment options',
  },
];

export default function BuyCreditsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [credits, setCredits] = useState(0);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState('pro');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('mpesa');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/careers/auth/login');
        return;
      }

      setUser(user);

      // Check role status
      const roleResult = await getUserRoleStatus(user.id);

      if (!roleResult.roles.employer) {
        router.push('/careers/onboarding');
        return;
      }

      const employerProfile = roleResult.profiles.employerProfile;
      setEmployer(employerProfile);

      // Get credits balance
      const creditsResult = await getEmployerCredits(employerProfile.id);
      if (creditsResult.success) {
        setCredits(creditsResult.balance);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(e) {
    e.preventDefault();
    setError(null);

    try {
      setProcessing(true);

      const pkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage);
      if (!pkg) {
        throw new Error('Invalid package selected');
      }

      const supabase = createClient();

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('employer_payments')
        .insert({
          employer_id: employer.id,
          vendor_id: employer.vendor_id || null,
          amount_kes: pkg.price,
          payment_method: selectedPaymentMethod,
          status: 'pending',
        })
        .select()
        .single();

      if (paymentError) {
        throw new Error('Failed to create payment record: ' + paymentError.message);
      }

      // TODO: Integrate actual payment gateway
      // For now, we'll show a message about payment gateway integration

      // In a real implementation, you would:
      // 1. Call M-Pesa / Stripe / Pesapal API
      // 2. Get transaction reference
      // 3. Update payment record with reference_id
      // 4. Wait for webhook callback to confirm payment
      // 5. Then credit the account

      // For MVP, show instructional modal or redirect to payment processor
      alert(`
Payment Gateway Integration (To Be Implemented)

Package: ${pkg.label}
Credits: ${pkg.credits}
Amount: KES ${pkg.price}
Payment Method: ${selectedPaymentMethod.toUpperCase()}

This would integrate with:
- M-Pesa for mobile payments
- Stripe for cards
- Pesapal for multiple options

Payment record created (ID: ${payment.id})
Status: Pending
      `);

      // For now, log what would happen
      console.log('Payment initiated:', {
        paymentId: payment.id,
        package: pkg,
        amount: pkg.price,
        method: selectedPaymentMethod,
      });

      router.push('/careers/employer/dashboard');
    } catch (err) {
      console.error('Error processing purchase:', err);
      setError(err.message || 'Failed to process purchase');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!employer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-bold text-red-900 mb-2">Error</h1>
          <p className="text-red-700 mb-4">You must have an employer profile to buy credits.</p>
          <button
            onClick={() => router.push('/careers/onboarding')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Go to Onboarding
          </button>
        </div>
      </div>
    );
  }

  const selectedPkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage);
  const costPerCredit = (selectedPkg.price / selectedPkg.credits).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Buy Credits</h1>
              <p className="text-slate-600 mt-1">Scale your hiring with flexible credit packages</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Current Balance</p>
              <p className="text-3xl font-bold text-emerald-600">{credits} KES</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {CREDIT_PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`relative rounded-xl border-2 p-6 cursor-pointer transition ${
                selectedPackage === pkg.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              } ${pkg.popular ? 'ring-2 ring-blue-400' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-6 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold text-slate-900 mb-1">{pkg.label}</h3>
              <p className="text-slate-600 text-sm mb-4">
                Best for {pkg.label.toLowerCase()} users
              </p>

              <div className="mb-6">
                <p className="text-4xl font-bold text-slate-900">{pkg.credits}</p>
                <p className="text-sm text-slate-600">Credits</p>
                {pkg.savings > 0 && (
                  <p className="text-sm text-emerald-600 font-semibold mt-2">
                    +{pkg.savings}% Bonus
                  </p>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4 mb-6">
                <p className="text-2xl font-bold text-slate-900">
                  KES {pkg.price.toLocaleString()}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {costPerCredit} KES per credit
                </p>
              </div>

              <ul className="space-y-2 mb-6">
                {pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full font-semibold py-2 px-4 rounded-lg transition ${
                  selectedPackage === pkg.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                {selectedPackage === pkg.id ? '✓ Selected' : 'Select'}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Payment Details */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Payment Method</h2>

            <div className="space-y-3 mb-8">
              {PAYMENT_METHODS.map(method => (
                <label
                  key={method.id}
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedPaymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedPaymentMethod === method.id}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="w-5 h-5"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      <span className="text-2xl">{method.icon}</span>
                      {method.name}
                    </p>
                    <p className="text-sm text-slate-600">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">{selectedPkg.credits} Credits</span>
                  <span className="text-slate-900">KES {selectedPkg.price.toLocaleString()}</span>
                </div>
                {selectedPkg.savings > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Bonus ({selectedPkg.savings}%)</span>
                    <span>+ {Math.round(selectedPkg.credits * (selectedPkg.savings / 100))} Credits</span>
                  </div>
                )}
                <div className="border-t border-slate-300 pt-3 mt-3">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Total</span>
                    <span>KES {selectedPkg.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Confirmation & Submit */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 border border-blue-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Ready to Purchase?</h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Zap className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-slate-900">Instant Credits</p>
                  <p className="text-sm text-slate-600">Credits added to your account immediately after payment</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="text-emerald-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-slate-900">Flexible Packages</p>
                  <p className="text-sm text-slate-600">Choose the package that fits your hiring needs</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-slate-900">Bonus Credits</p>
                  <p className="text-sm text-slate-600">Get up to 25% bonus on larger packages</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePurchase} className="space-y-4">
              <button
                type="submit"
                disabled={processing}
                className={`w-full font-bold py-4 px-6 rounded-lg transition text-white flex items-center justify-center gap-2 ${
                  processing
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                }`}
              >
                {processing ? (
                  <>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>💳 Proceed to Payment</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                disabled={processing}
                className="w-full bg-slate-200 hover:bg-slate-300 disabled:bg-gray-300 text-slate-900 font-bold py-3 px-6 rounded-lg transition"
              >
                Cancel
              </button>
            </form>

            {/* Secure Payment Badge */}
            <div className="mt-6 pt-6 border-t border-blue-200 text-center text-xs text-slate-600">
              <p>🔒 Your payment information is secure and encrypted</p>
              <p className="mt-1">Trusted by 5,000+ employers</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-2">When will my credits be added?</h3>
              <p className="text-slate-600">Credits are added instantly after successful payment confirmation. You can start posting jobs immediately.</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Do credits expire?</h3>
              <p className="text-slate-600">No, your credits never expire. You can use them anytime you need to post jobs or boost your listings.</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">Can I get a refund?</h3>
              <p className="text-slate-600">Refunds are available for unused credits within 30 days of purchase. Contact support for more information.</p>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-slate-600">We accept M-Pesa, Visa/Mastercard, and Pesapal for maximum convenience.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
