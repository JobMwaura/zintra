'use client';

import { useState } from 'react';
import { addCreditsToVendor } from '@/app/actions/vendor-zcc';

export default function AddVendorCreditsPage() {
  const [vendorId, setVendorId] = useState('0608c7a8-bfa5-4c73-8354-365502ed387d');
  const [creditAmount, setCreditAmount] = useState(2000);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleAddCredits(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await addCreditsToVendor(vendorId, creditAmount);

      if (result.success) {
        setMessage(`✅ ${result.message}\nPayment ID: ${result.paymentId}\nCredits Added: ${result.creditsAdded}`);
        setCreditAmount(2000);
        setVendorId('');
      } else {
        setError(`❌ ${result.error}`);
      }
    } catch (err) {
      setError(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin: Add Vendor Credits</h1>
        <p className="text-slate-600 mb-6">Manually add credits to vendor employer accounts</p>

        <form onSubmit={handleAddCredits} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Vendor UUID</label>
            <input
              type="text"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              placeholder="e.g., 0608c7a8-bfa5-4c73-8354-365502ed387d"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Credit Amount</label>
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
              placeholder="2000"
              min="0"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 whitespace-pre-wrap text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-emerald-700 whitespace-pre-wrap text-sm font-medium">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !vendorId || !creditAmount}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            {loading ? 'Adding Credits...' : 'Add Credits'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ How it works:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Creates employer profile if needed</li>
            <li>✓ Creates payment record with "admin" method</li>
            <li>✓ Adds credits to employer_credits_ledger</li>
            <li>✓ Sets verification_level to "verified"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
