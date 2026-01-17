'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Zap, ArrowRight } from 'lucide-react';

export default function ZCCCreditsCard({ vendorId, canEdit }) {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!canEdit) return; // Only show for vendor's own profile

    const fetchCredits = async () => {
      try {
        setLoading(true);

        // Get vendor's user_id
        const { data: vendor } = await supabase
          .from('vendors')
          .select('user_id')
          .eq('id', vendorId)
          .single();

        if (!vendor) return;

        // Get credits from ledger
        const { data: ledger, error } = await supabase
          .from('credits_ledger')
          .select('amount, credit_type')
          .eq('employer_id', vendor.user_id);

        if (error) {
          console.error('Error fetching credits:', error);
          return;
        }

        // Calculate balance
        const balance = ledger.reduce((sum, entry) => {
          if (['purchase', 'bonus', 'plan_allocation', 'admin_gift'].includes(entry.credit_type)) {
            return sum + entry.amount;
          } else {
            return sum - Math.abs(entry.amount);
          }
        }, 0);

        setCredits(Math.max(0, balance));
      } catch (err) {
        console.error('Error fetching credits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [vendorId, canEdit, supabase]);

  if (!canEdit) return null; // Only show to vendor

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 text-white p-2 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-600 font-medium">ZINTRA CAREER CENTRE</p>
            <p className="text-2xl font-bold text-slate-900">
              {loading ? '...' : `${credits ?? 0} Credits`}
            </p>
          </div>
        </div>
        <a
          href="/careers/employer/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Go to ZCC
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
      <p className="text-xs text-slate-600 mt-3">
        Use your credits to post jobs on Zintra Career Centre. You need 100 credits per job.
      </p>
    </div>
  );
}
