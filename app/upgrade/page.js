'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import { getBillingStatus, isStripeConfigured } from '@/app/actions/billing';
import {
  ArrowLeft, Crown, Zap, Shield, Check, CheckCircle, Smartphone,
  Loader, AlertCircle, Star, Building2, Briefcase, ChevronDown, ChevronUp,
  Clock, RefreshCw, CreditCard, ExternalLink,
} from 'lucide-react';

const TIER_LABELS = { free: 'Free', pro: 'Pro', premium: 'Premium' };
const TIER_COLORS = {
  free: 'bg-gray-100 text-gray-700 border-gray-300',
  pro: 'bg-orange-100 text-orange-800 border-orange-400',
  premium: 'bg-amber-100 text-amber-800 border-amber-500',
};

export default function UpgradePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Purchase flow
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [phone, setPhone] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseId, setPurchaseId] = useState(null);
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const pollRef = useRef(null);

  // Payment method: 'mpesa' or 'card'
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [stripeAvailable, setStripeAvailable] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Active scope tab
  const [activeScope, setActiveScope] = useState('marketplace_vendor');

  // History
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadPage();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function loadPage() {
    try {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      const [roleResult, billingResult, stripeResult] = await Promise.all([
        getUserRoleStatus(currentUser.id),
        getBillingStatus(currentUser.id),
        isStripeConfigured(),
      ]);

      setRoles(roleResult.roles);
      setBilling(billingResult);
      setStripeAvailable(stripeResult.configured);

      // Default scope based on roles
      if (roleResult.roles?.employer && !roleResult.roles?.vendor) {
        setActiveScope('zcc_employer');
      }
    } catch (err) {
      console.error('Error loading upgrade page:', err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  }

  // ─── M-Pesa Purchase Flow ─────────────────────────────────
  async function handleBuyPass(product) {
    setSelectedProduct(product);
    setError(null);
    setSuccess(null);
    setPurchaseStatus(null);
    setPurchaseId(null);
  }

  async function initiatePurchase() {
    if (!phone || phone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/pass/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_code: selectedProduct.product_code,
          phone: phone,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      setPurchaseId(data.purchase_id);
      setPurchaseStatus('initiated');
      startPolling(data.purchase_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setPurchasing(false);
    }
  }

  function startPolling(purchaseId) {
    if (pollRef.current) clearInterval(pollRef.current);

    let pollCount = 0;
    pollRef.current = setInterval(async () => {
      pollCount++;
      if (pollCount > 60) {
        clearInterval(pollRef.current);
        setPurchaseStatus('timeout');
        return;
      }

      try {
        const res = await fetch(`/api/billing/pass/status?purchase_id=${purchaseId}`);
        const data = await res.json();

        if (data.status === 'paid') {
          clearInterval(pollRef.current);
          setPurchaseStatus('paid');
          setSuccess(`🎉 ${selectedProduct.name} activated! Your capabilities have been upgraded.`);
          // Refresh billing data
          if (user) {
            const updated = await getBillingStatus(user.id);
            setBilling(updated);
          }
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(pollRef.current);
          setPurchaseStatus(data.status);
          setError(data.status === 'cancelled' ? 'Payment was cancelled' : 'Payment failed. Please try again.');
        }
      } catch {
        // Keep polling
      }
    }, 3000);
  }

  function cancelPurchaseFlow() {
    if (pollRef.current) clearInterval(pollRef.current);
    setSelectedProduct(null);
    setPurchaseId(null);
    setPurchaseStatus(null);
    setPhone('');
    setPaymentMethod('mpesa');
  }

  // ─── Stripe Checkout Flow ─────────────────────────────────
  async function handleStripeCheckout(product) {
    setStripeLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_code: product.product_code }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setStripeLoading(false);
    }
  }

  async function openCustomerPortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to open billing portal');
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setPortalLoading(false);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────
  function getActiveTier(scope) {
    return billing?.activeTiers?.[scope] || 'free';
  }

  function getActivePass(scope) {
    return billing?.passes?.find(p => p.billing_products?.scope === scope);
  }

  function getActiveSubscription(scope) {
    return billing?.subscriptions?.find(s => s.billing_products?.scope === scope && ['active', 'trialing'].includes(s.status));
  }

  function getProductsForScope(scope) {
    if (!billing?.products) return [];
    return billing.products.filter(p => p.scope === scope && p.tier !== 'free');
  }

  function getEntitlements(productId) {
    if (!billing?.products) return [];
    const product = billing.products.find(p => p.id === productId);
    return product?.billing_entitlements || [];
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-KE', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  function daysRemaining(dateStr) {
    if (!dateStr) return 0;
    const diff = new Date(dateStr) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // ─── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const scopeTabs = [
    { id: 'marketplace_vendor', label: 'Vendor Plans', icon: <Building2 size={18} />, show: roles?.vendor },
    { id: 'zcc_employer', label: 'Employer Plans', icon: <Briefcase size={18} />, show: roles?.employer },
  ].filter(t => t.show);

  // If user has no roles, show both
  const visibleTabs = scopeTabs.length > 0 ? scopeTabs : [
    { id: 'marketplace_vendor', label: 'Vendor Plans', icon: <Building2 size={18} /> },
    { id: 'zcc_employer', label: 'Employer Plans', icon: <Briefcase size={18} /> },
  ];

  const currentTier = getActiveTier(activeScope);
  const activePass = getActivePass(activeScope);
  const activeSub = getActiveSubscription(activeScope);
  const products = getProductsForScope(activeScope);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-4 transition">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Crown size={32} />
            Upgrade Your Plan
          </h1>
          <p className="text-orange-100 mt-2">
            Unlock premium features with M-Pesa{stripeAvailable ? ' or Card payment' : ''} — upgrade in seconds.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Current Tier Banner */}
        {activePass && (
          <div className="mb-6 bg-white border-2 border-orange-300 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                currentTier === 'premium' ? 'bg-amber-100' : 'bg-orange-100'
              }`}>
                {currentTier === 'premium' ? <Star className="text-amber-600" size={24} /> : <Zap className="text-orange-600" size={24} />}
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {TIER_LABELS[currentTier]} Pass Active
                </p>
                <p className="text-sm text-gray-600">
                  Expires {formatDate(activePass.ends_at)} — {daysRemaining(activePass.ends_at)} days remaining
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${TIER_COLORS[currentTier]}`}>
              {TIER_LABELS[currentTier]}
            </span>
          </div>
        )}

        {/* Active Subscription Banner */}
        {activeSub && (
          <div className="mb-6 bg-white border-2 border-blue-300 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100">
                <CreditCard className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {activeSub.billing_products?.name || 'Subscription'} — Active
                </p>
                <p className="text-sm text-gray-600">
                  Renews {formatDate(activeSub.current_period_end)}
                  {activeSub.cancel_at_period_end && ' (cancels at end of period)'}
                </p>
              </div>
            </div>
            <button
              onClick={openCustomerPortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50"
            >
              {portalLoading ? <Loader className="w-4 h-4 animate-spin" /> : <ExternalLink size={16} />}
              Manage Subscription
            </button>
          </div>
        )}

        {/* Scope Tabs */}
        {visibleTabs.length > 1 && (
          <div className="flex gap-2 mb-8">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveScope(tab.id); setSelectedProduct(null); }}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition ${
                  activeScope === tab.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Purchase Modal ───────────────────────────────── */}
        {selectedProduct && (
          <div className="mb-8 bg-white border-2 border-orange-400 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {paymentMethod === 'mpesa' ? <Smartphone size={20} className="text-orange-500" /> : <CreditCard size={20} className="text-blue-500" />}
                {paymentMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Pay with Card'}
              </h3>
              <button onClick={cancelPurchaseFlow} className="text-gray-400 hover:text-gray-600 text-sm">
                ✕ Cancel
              </button>
            </div>

            <div className="p-6">
              {/* Payment Method Toggle */}
              {stripeAvailable && !purchaseId && !purchaseStatus && (
                <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition ${
                      paymentMethod === 'mpesa'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Smartphone size={16} />
                    M-Pesa (KES)
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition ${
                      paymentMethod === 'card'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <CreditCard size={16} />
                    Card (USD)
                  </button>
                </div>
              )}
              {/* Status: Waiting for STK Push result */}
              {purchaseId && purchaseStatus === 'initiated' && (
                <div className="text-center py-8">
                  <Loader className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 mb-2">Check your phone</p>
                  <p className="text-gray-600 mb-1">An M-Pesa prompt has been sent to your phone.</p>
                  <p className="text-gray-600 text-sm">Enter your PIN to complete the payment.</p>
                  <p className="text-xs text-gray-400 mt-4">Waiting for confirmation...</p>
                </div>
              )}

              {/* Status: Paid */}
              {purchaseStatus === 'paid' && (
                <div className="text-center py-8">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                  <p className="text-xl font-bold text-green-800 mb-2">Payment Successful!</p>
                  <p className="text-gray-600">{selectedProduct.name} is now active.</p>
                  <button
                    onClick={cancelPurchaseFlow}
                    className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Status: Failed / Cancelled */}
              {(purchaseStatus === 'failed' || purchaseStatus === 'cancelled' || purchaseStatus === 'timeout') && (
                <div className="text-center py-8">
                  <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-red-800 mb-2">
                    {purchaseStatus === 'timeout' ? 'Payment Timed Out' : purchaseStatus === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {purchaseStatus === 'timeout'
                      ? 'We didn\'t receive a confirmation. If you completed the payment, please wait or contact support.'
                      : 'Please try again.'}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => { setPurchaseId(null); setPurchaseStatus(null); }}
                      className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={cancelPurchaseFlow}
                      className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Initial: Phone input (M-Pesa) */}
              {!purchaseId && !purchaseStatus && paymentMethod === 'mpesa' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{selectedProduct.name}</p>
                      <p className="text-sm text-gray-600">
                        {selectedProduct.duration_days}-day pass
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      KSh {selectedProduct.price_kes?.toLocaleString()}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      M-Pesa Phone Number
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-mono text-sm bg-gray-100 px-3 py-2.5 rounded-lg">+254</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        placeholder="712345678"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                        maxLength={9}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Enter your Safaricom number (9 digits after 0)</p>
                  </div>

                  <button
                    onClick={initiatePurchase}
                    disabled={purchasing || phone.length < 9}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {purchasing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Sending to M-Pesa...
                      </>
                    ) : (
                      <>
                        <Smartphone size={18} />
                        Pay KSh {selectedProduct.price_kes?.toLocaleString()} via M-Pesa
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Card / Stripe checkout */}
              {!purchaseId && !purchaseStatus && paymentMethod === 'card' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{selectedProduct.name}</p>
                      <p className="text-sm text-gray-600">
                        Monthly subscription — cancel anytime
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      ${selectedProduct.price_usd || '—'}<span className="text-sm text-gray-500 font-normal">/mo</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleStripeCheckout(selectedProduct)}
                    disabled={stripeLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {stripeLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Redirecting to checkout...
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        Subscribe — ${selectedProduct.price_usd || '—'}/mo
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-3">
                    Powered by Stripe. You&apos;ll be redirected to a secure checkout page.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Plan Cards Grid ──────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {products.map(product => {
            const isCurrentTier = getActiveTier(activeScope) === product.tier;
            const isUpgrade = (TIER_RANK[product.tier] || 0) > (TIER_RANK[currentTier] || 0);
            const entitlements = getEntitlements(product.id);

            // Extract feature list from entitlements
            const features = entitlements
              .filter(e => e.capability_value?.type === 'boolean' && e.capability_value?.value === true)
              .map(e => {
                const key = e.capability_key;
                // Prettify key
                return key
                  .replace(`${activeScope}.`, '')
                  .split('_')
                  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');
              });

            const limits = entitlements
              .filter(e => e.capability_value?.type === 'number')
              .map(e => {
                const key = e.capability_key.replace(`${activeScope}.`, '')
                  .split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const val = e.capability_value.value;
                return val === -1 ? `Unlimited ${key}` : `${val} ${key}`;
              });

            const tierStr = entitlements.find(e => e.capability_key === `${activeScope}.tier`)
              ?.capability_value?.value || product.tier;

            return (
              <div
                key={product.id}
                className={`relative bg-white rounded-xl shadow-md overflow-hidden border-2 transition hover:shadow-lg ${
                  product.tier === 'premium' ? 'border-amber-400' :
                  product.tier === 'pro' ? 'border-orange-400' : 'border-transparent'
                } ${isCurrentTier ? 'ring-2 ring-green-400' : ''}`}
              >
                {/* Badge */}
                {product.tier === 'premium' && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-4 py-1.5 text-center">
                    ⭐ BEST VALUE
                  </div>
                )}
                {isCurrentTier && (
                  <div className="bg-green-500 text-white text-xs font-bold px-4 py-1.5 text-center">
                    ✓ CURRENT PLAN
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{product.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      KSh {product.price_kes?.toLocaleString()}
                    </span>
                    <span className="text-gray-500 ml-2">/ {product.duration_days} days</span>
                  </div>

                  {/* Features */}
                  <div className="mb-6 space-y-2">
                    {limits.map((lim, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Zap className="w-4 h-4 mt-0.5 text-orange-500 flex-shrink-0" />
                        <span>{lim}</span>
                      </div>
                    ))}
                    {features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {isCurrentTier ? (
                    <div className="w-full py-3 bg-green-100 text-green-700 font-semibold rounded-lg text-center">
                      Active
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuyPass(product)}
                      disabled={!!selectedProduct}
                      className={`w-full py-3 font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                        product.tier === 'premium'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      } disabled:opacity-50`}
                    >
                      <Zap size={18} />
                      {isUpgrade ? 'Upgrade' : 'Get'} — KSh {product.price_kes?.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Free Tier Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Shield size={20} className="text-blue-500" />
            Free Tier — Always Included
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
            {activeScope === 'marketplace_vendor' ? (
              <>
                <div className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4" /> Basic profile listing</div>
                <div className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4" /> Browse RFQs</div>
                <div className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4" /> Limited quotes</div>
                <div className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4" /> Basic messaging</div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4" /> Post 1 listing per month</div>
                <div className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4" /> View candidate profiles</div>
                <div className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4" /> Basic search</div>
                <div className="flex items-center gap-2"><Check className="text-green-500 w-4 h-4" /> Standard support</div>
              </>
            )}
          </div>
        </div>

        {/* Purchase History */}
        {billing?.history?.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4 hover:text-orange-500 transition"
            >
              <Clock size={20} />
              Purchase History
              {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {showHistory && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Product</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.history.map((h, idx) => (
                      <tr key={h.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-5 py-3 text-sm text-gray-600">{formatDate(h.created_at)}</td>
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{h.billing_products?.name || '-'}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">KSh {h.amount_kes?.toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            h.status === 'paid' ? 'bg-green-100 text-green-800' :
                            h.status === 'initiated' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Shield className="text-blue-500 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">How Plans Work</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>M-Pesa Pass:</strong> Prepaid for 30 days — no card needed. Instant activation.</li>
                {stripeAvailable && (
                  <li>• <strong>Card Subscription:</strong> Monthly auto-renewal via Stripe. Cancel anytime from your billing portal.</li>
                )}
                <li>• Upgrading replaces your current plan — no double billing.</li>
                <li>• Features activate <strong>instantly</strong> after payment confirmation.</li>
                <li>• Need help? Contact <a href="mailto:support@zintra.co.ke" className="underline">support@zintra.co.ke</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TIER_RANK = { free: 0, pro: 1, premium: 2 };
