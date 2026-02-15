'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, CheckCircle2, Circle, FileText, Clock, CheckCheck, AlertCircle } from 'lucide-react';
import { getCandidateRequirements, updateRequirementItem } from '@/app/actions/zcc-requirements';

export default function CandidateRequirementsPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [user, setUser] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);

  useEffect(() => {
    loadRequirements();
  }, []);

  async function loadRequirements() {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }
      setUser(authUser);

      const result = await getCandidateRequirements(authUser.id);
      if (result.success) {
        setRequirements(result.requirements);
      }
    } catch (err) {
      console.error('Error loading requirements:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleItem(reqId, itemKey, currentDone) {
    setUpdatingItem(`${reqId}-${itemKey}`);
    try {
      const result = await updateRequirementItem(reqId, itemKey, !currentDone);
      if (result.success) {
        await loadRequirements(); // Refresh
      } else {
        alert(result.error || 'Failed to update');
      }
    } catch (err) {
      console.error('Error toggling item:', err);
    } finally {
      setUpdatingItem(null);
    }
  }

  const statusConfig = {
    pending: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCheck },
    expired: { label: 'Expired', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Loading requirements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/careers" className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-4 transition">
            <ArrowLeft size={20} />
            Back
          </Link>
          <h1 className="text-3xl font-bold mb-1">Requirements Checklists</h1>
          <p className="text-orange-100">Complete pre-work requirements from your employers</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {requirements.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No requirements yet</h3>
            <p className="text-gray-500">When an employer hires you, they may send a pre-work requirements checklist.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {requirements.map(req => {
              const checklist = Array.isArray(req.checklist) ? req.checklist : [];
              const completedCount = checklist.filter(item => item.done).length;
              const totalCount = checklist.length;
              const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const sc = statusConfig[req.status] || statusConfig.pending;
              const StatusIcon = sc.icon;

              return (
                <div key={req.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {/* Header */}
                  <div className="p-5 border-b bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{req.title || 'Requirements'}</h3>
                        <p className="text-sm text-gray-500">
                          For: {req.listings?.title || 'Job'} ({req.listings?.type || 'job'})
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${sc.color}`}>
                        <StatusIcon size={12} />
                        {sc.label}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-600">
                        {completedCount}/{totalCount}
                      </span>
                    </div>

                    {req.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{req.notes}"</p>
                    )}
                  </div>

                  {/* Checklist Items */}
                  <div className="divide-y">
                    {checklist.map((item, index) => {
                      const isUpdating = updatingItem === `${req.id}-${item.key}`;
                      return (
                        <button
                          key={item.key || index}
                          onClick={() => req.status !== 'completed' && handleToggleItem(req.id, item.key, item.done)}
                          disabled={isUpdating || req.status === 'completed'}
                          className={`w-full flex items-center gap-3 p-4 text-left transition hover:bg-gray-50 disabled:cursor-not-allowed ${item.done ? 'bg-green-50/50' : ''}`}
                        >
                          {isUpdating ? (
                            <div className="w-5 h-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                          ) : item.done ? (
                            <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle size={20} className="text-gray-300 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  {req.completed_at && (
                    <div className="p-3 bg-green-50 border-t text-center">
                      <p className="text-sm text-green-700 font-medium">
                        ✓ Completed on {new Date(req.completed_at).toLocaleDateString('en-KE')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
