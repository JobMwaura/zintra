'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import { getWalletBalance, publishGigWithCredits } from '@/app/actions/zcc-wallet';
import { ZCC_COSTS } from '@/lib/zcc/credit-config';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, AlertCircle, CheckCircle, Zap, Clock, MapPin, Users, DollarSign, Calendar } from 'lucide-react';

const GIG_CATEGORIES = [
  'Construction', 'Plumbing', 'Electrical', 'Carpentry', 'Painting',
  'Landscaping', 'HVAC', 'Roofing', 'Masonry', 'Cleaning',
  'Welding', 'Tiling', 'Moving / Labour', 'Demolition', 'Other',
];

const DURATION_OPTIONS = [
  '1 day', '2 days', '3 days', '1 week', '2 weeks', '1 month', 'Custom',
];

export default function PostGigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    payMin: '',
    payMax: '',
    startDate: '',
    duration: '',
    customDuration: '',
    workersNeeded: '1',
    requirements: '',
    isRealOpportunity: false,
  });

  const [featuredOption, setFeaturedOption] = useState(null); // null | '24h' | '72h'

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const [roleResult, walletResult] = await Promise.all([
        getUserRoleStatus(user.id),
        getWalletBalance(user.id),
      ]);

      if (!roleResult.roles.employer) {
        router.push('/careers/onboarding');
        return;
      }

      setEmployer(roleResult.profiles.employerProfile);

      if (walletResult.success) {
        setBalance(walletResult.balance);
      }
    } catch (err) {
      console.error('Error loading:', err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  }

  function getTotalCost() {
    let cost = ZCC_COSTS.GIG_POST;
    if (featuredOption === '24h') cost += ZCC_COSTS.FEATURED_GIG_24H;
    if (featuredOption === '72h') cost += ZCC_COSTS.FEATURED_GIG_72H;
    return cost;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validation
      if (!formData.title.trim()) throw new Error('Gig title is required');
      if (!formData.description.trim()) throw new Error('Description is required');
      if (!formData.category) throw new Error('Category is required');
      if (!formData.location.trim()) throw new Error('Location is required');
      if (!formData.isRealOpportunity) throw new Error('Please confirm this is a real opportunity');

      const totalCost = getTotalCost();
      if (balance < totalCost) {
        throw new Error(`Insufficient credits. You have ${balance} but need ${totalCost}. Buy more credits first.`);
      }

      const duration = formData.duration === 'Custom' ? formData.customDuration : formData.duration;

      const result = await publishGigWithCredits(
        user.id,
        {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          payMin: formData.payMin,
          payMax: formData.payMax,
          startDate: formData.startDate,
          duration: duration,
          workersNeeded: formData.workersNeeded,
          requirements: formData.requirements,
        },
        featuredOption
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(true);
      setBalance(result.balance);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/careers/employer/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Gig Published!</h2>
          <p className="text-gray-600 mb-4">Your gig is now live and visible to workers.</p>
          <p className="text-sm text-gray-500">Remaining balance: <strong>{balance} credits</strong></p>
          <p className="text-sm text-gray-400 mt-4">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const totalCost = getTotalCost();
  const canAfford = balance >= totalCost;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/careers/employer/dashboard" className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-4 transition">
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Zap size={32} />
            <div>
              <h1 className="text-3xl font-bold">Post a Gig</h1>
              <p className="text-orange-100">Find workers fast for short-term tasks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Credit Balance Bar */}
        <div className={`mb-6 rounded-lg p-4 flex items-center justify-between ${canAfford ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-3">
            <DollarSign size={20} className={canAfford ? 'text-green-500' : 'text-red-500'} />
            <div>
              <p className="text-sm font-medium text-gray-700">Your balance: <strong>{balance} credits</strong></p>
              <p className="text-xs text-gray-500">This gig costs {totalCost} credits</p>
            </div>
          </div>
          {!canAfford && (
            <Link href="/careers/credits" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
              Buy Credits
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gig Details */}
          <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Zap size={20} className="text-orange-500" />
              Gig Details
            </h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gig Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder='e.g. "Need 2 tilers for bathroom renovation"'
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the work needed, tools required, site conditions..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select category</option>
                {GIG_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <MapPin size={14} className="inline mr-1" />
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Ruaka, Kiambu"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Pay Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Day Rate Min (KES)</label>
                <input
                  type="number"
                  value={formData.payMin}
                  onChange={(e) => setFormData({ ...formData, payMin: e.target.value })}
                  placeholder="e.g. 2000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Day Rate Max (KES)</label>
                <input
                  type="number"
                  value={formData.payMax}
                  onChange={(e) => setFormData({ ...formData, payMax: e.target.value })}
                  placeholder="e.g. 3500"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Start Date + Duration + Workers Needed */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Clock size={14} className="inline mr-1" />
                  Duration
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  <option value="">Select duration</option>
                  {DURATION_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <Users size={14} className="inline mr-1" />
                  Workers Needed
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.workersNeeded}
                  onChange={(e) => setFormData({ ...formData, workersNeeded: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {formData.duration === 'Custom' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Custom Duration</label>
                <input
                  type="text"
                  value={formData.customDuration}
                  onChange={(e) => setFormData({ ...formData, customDuration: e.target.value })}
                  placeholder='e.g. "5 days" or "3 weeks"'
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
            )}

            {/* Requirements */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Requirements (optional)</label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="PPE, tools, certifications, experience level..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Featured Add-on */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Boost Your Gig (optional)</h2>
            <p className="text-sm text-gray-600 mb-4">Get more applicants faster by featuring your gig</p>

            <div className="space-y-3">
              <label className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition ${
                featuredOption === null ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="featured"
                    checked={featuredOption === null}
                    onChange={() => setFeaturedOption(null)}
                    className="text-orange-500"
                  />
                  <span className="font-medium">No boost</span>
                </div>
                <span className="text-sm text-gray-500">Free</span>
              </label>

              <label className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition ${
                featuredOption === '24h' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="featured"
                    checked={featuredOption === '24h'}
                    onChange={() => setFeaturedOption('24h')}
                    className="text-orange-500"
                  />
                  <div>
                    <span className="font-medium">🔥 Urgent 24h</span>
                    <p className="text-xs text-gray-500">Urgent badge + top of search for 24 hours</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-orange-600">+{ZCC_COSTS.FEATURED_GIG_24H} credits</span>
              </label>

              <label className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition ${
                featuredOption === '72h' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="featured"
                    checked={featuredOption === '72h'}
                    onChange={() => setFeaturedOption('72h')}
                    className="text-orange-500"
                  />
                  <div>
                    <span className="font-medium">⭐ Featured 72h</span>
                    <p className="text-xs text-gray-500">Featured section + top of search for 3 days</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-orange-600">+{ZCC_COSTS.FEATURED_GIG_72H} credits</span>
              </label>
            </div>
          </div>

          {/* Confirmation */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRealOpportunity}
                onChange={(e) => setFormData({ ...formData, isRealOpportunity: e.target.checked })}
                className="mt-1 text-orange-500 rounded"
              />
              <span className="text-sm text-gray-700">
                I confirm this is a real gig opportunity. I will not request payment from workers or ask for registration fees.
                Violations will result in account suspension.
              </span>
            </label>
          </div>

          {/* Cost Summary + Submit */}
          <div className="bg-gray-900 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-300">Gig post</span>
              <span className="font-semibold">{ZCC_COSTS.GIG_POST} credits</span>
            </div>
            {featuredOption && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-300">Featured add-on ({featuredOption})</span>
                <span className="font-semibold">
                  {featuredOption === '24h' ? ZCC_COSTS.FEATURED_GIG_24H : ZCC_COSTS.FEATURED_GIG_72H} credits
                </span>
              </div>
            )}
            <div className="border-t border-gray-700 pt-4 mb-6">
              <div className="flex items-center justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-orange-400">{totalCost} credits</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Balance after: {balance - totalCost} credits</p>
            </div>

            <button
              type="submit"
              disabled={submitting || !canAfford}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition text-lg"
            >
              {submitting ? 'Publishing...' : !canAfford ? 'Insufficient Credits' : 'Publish Gig'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
