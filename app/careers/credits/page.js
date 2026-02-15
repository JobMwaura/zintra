'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import { getWalletBalance, getCreditProducts, topupCredits, getTransactionHistory, addTestWalletCredits } from '@/app/actions/zcc-wallet';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, Wallet, Zap, CheckCircle, Shield, Clock, ChevronDown, ChevronUp, CreditCard, Smartphone } from 'lucide-react';

export default function CreditsStorePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState(null);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('employer'); // 'employer' | 'candidate'
  const [packs, setPacks] = useState([]);
  const [actionCosts, setActionCosts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [activeTab]);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const [roleResult, walletResult, txResult] = await Promise.all([
        getUserRoleStatus(user.id),
        getWalletBalance(user.id),
        getTransactionHistory(user.id, 10),
      ]);

      setRoles(roleResult.roles);

      if (walletResult.success) {
        setBalance(walletResult.balance);
      }

      if (txResult.success) {
        setTransactions(txResult.transactions);
      }

      // Set default tab based on roles
      if (roleResult.roles?.candidate && !roleResult.roles?.employer) {
        setActiveTab('candidate');
      }
    } catch (err) {
      console.error('Error loading credits page:', err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const result = await getCreditProducts(activeTab);
      if (result.success) {
        setPacks(result.packs);
        setActionCosts(result.actions);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    }
  }

  async function handlePurchase(pack) {
    if (!user) return;

    setPurchasing(pack.sku);
    setError(null);
    setSuccess(null);

    try {
      if (paymentMethod === 'test') {
        // Test mode: instant credit
        const result = await addTestWalletCredits(user.id, pack.credits_amount);
        if (result.success) {
          setBalance(result.balance);
          setSuccess(`${pack.credits_amount} credits added! New balance: ${result.balance}`);
          // Refresh history
          const txResult = await getTransactionHistory(user.id, 10);
          if (txResult.success) setTransactions(txResult.transactions);
        } else {
          setError(result.error);
        }
      } else if (paymentMethod === 'mpesa') {
        // TODO: Integrate M-Pesa STK Push
        setError('M-Pesa integration coming soon. Use Test Mode for now.');
      } else if (paymentMethod === 'card') {
        // TODO: Integrate card payments
        setError('Card payments coming soon. Use Test Mode for now.');
      }
    } catch (err) {
      setError('Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/careers" className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-4 transition">
            <ArrowLeft size={20} />
            Back to Career Centre
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Wallet size={32} />
                Credits Store
              </h1>
              <p className="text-orange-100 mt-2">Purchase credit packs to post jobs, unlock contacts, and boost listings</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[160px]">
              <p className="text-orange-100 text-sm">Your Balance</p>
              <p className="text-3xl font-bold">{balance.toLocaleString()}</p>
              <p className="text-orange-100 text-xs">credits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success / Error messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
            <p className="text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('employer')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'employer'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Employer Packs
          </button>
          <button
            onClick={() => setActiveTab('candidate')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'candidate'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Candidate Packs
          </button>
        </div>

        {/* Payment Method */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Payment Method</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'mpesa', label: 'M-Pesa', icon: <Smartphone size={18} />, desc: 'Lipa na M-Pesa' },
              { id: 'card', label: 'Card', icon: <CreditCard size={18} />, desc: 'Visa / Mastercard' },
              { id: 'test', label: 'Test Mode', icon: <Zap size={18} />, desc: 'Instant (dev only)' },
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition ${
                  paymentMethod === method.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className={paymentMethod === method.id ? 'text-orange-500' : 'text-gray-400'}>
                  {method.icon}
                </span>
                <div className="text-left">
                  <p className="font-semibold text-sm">{method.label}</p>
                  <p className="text-xs text-gray-500">{method.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Credit Packs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {packs.map(pack => {
            const isPopular = pack.metadata?.popular;
            return (
              <div
                key={pack.sku}
                className={`relative bg-white rounded-xl shadow-md overflow-hidden border-2 transition hover:shadow-lg ${
                  isPopular ? 'border-orange-500' : 'border-transparent'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{pack.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{pack.description}</p>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {pack.credits_amount.toLocaleString()}
                    </span>
                    <span className="text-gray-500 ml-1">credits</span>
                  </div>

                  <div className="mb-6">
                    <span className="text-2xl font-bold text-orange-600">
                      KSh {pack.price_kes.toLocaleString()}
                    </span>
                  </div>

                  {/* What's included */}
                  {pack.metadata?.includes && (
                    <ul className="space-y-2 mb-6 text-sm">
                      {Object.entries(pack.metadata.includes).map(([key, value]) => (
                        <li key={key} className="flex items-center gap-2 text-gray-700">
                          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                          <span>{value} {key.replace(/_/g, ' ')}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => handlePurchase(pack)}
                    disabled={purchasing === pack.sku}
                    className={`w-full font-semibold py-3 rounded-lg transition ${
                      isPopular
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    } disabled:opacity-50`}
                  >
                    {purchasing === pack.sku ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Credit Costs Reference */}
        {actionCosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Credit Costs Reference</h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Action</th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {actionCosts.map((action, idx) => (
                    <tr key={action.sku} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900">{action.name}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="font-bold text-orange-600">{action.credits_amount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="mb-12">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4 hover:text-orange-500 transition"
          >
            <Clock size={20} />
            Transaction History
            {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showHistory && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No transactions yet. Purchase a credit pack to get started!
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Type</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Description</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Credits</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, idx) => (
                      <tr key={tx.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {new Date(tx.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            tx.type === 'topup' || tx.type === 'bonus' ? 'bg-green-100 text-green-800' :
                            tx.type === 'spend' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">{tx.description || tx.reference || '-'}</td>
                        <td className={`px-6 py-3 text-sm text-right font-semibold ${
                          tx.credits_delta > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.credits_delta > 0 ? '+' : ''}{tx.credits_delta}
                        </td>
                        <td className="px-6 py-3 text-sm text-right text-gray-600">{tx.balance_after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Free allowances info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Shield className="text-blue-500 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Free Allowances</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Candidates can apply to <strong>5 jobs/gigs per month</strong> for free</li>
                <li>• New employers receive <strong>100 free credits</strong> on signup</li>
                <li>• Vendors who enable employer mode receive <strong>2,000 free credits</strong></li>
                <li>• &quot;Top Rated&quot; status is <strong>earned, never purchased</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
