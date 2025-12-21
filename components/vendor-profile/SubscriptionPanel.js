'use client';

import { X, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SubscriptionPanel({ vendor, onClose, subscription, daysRemaining }) {
  const router = useRouter();
  if (!subscription) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Subscription</h2>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 text-center">
            <p className="text-slate-600 mb-4">No active subscription</p>
            <button 
              onClick={() => router.push('/subscription-plans')}
              className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Subscription</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-emerald-50 p-6 rounded-lg border border-amber-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-amber-900">{subscription.plan_type}</h3>
                <p className="text-amber-700">Active subscription</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>

            {daysRemaining && (
              <p className="text-sm text-amber-700">
                {daysRemaining} days remaining
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">Plan Price</p>
              <p className="text-2xl font-bold text-slate-900">KES {subscription.price || 'N/A'}</p>
            </div>

            {subscription.features && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Included Features</h4>
                <ul className="space-y-2">
                  {subscription.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-700">
                      <span className="w-2 h-2 bg-emerald-600 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
            >
              Close
            </button>
            <button 
              onClick={() => router.push('/subscription-plans')}
              className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
