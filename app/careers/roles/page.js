'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Briefcase } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';

const COMMON_ROLES = [
  { name: 'Electrician', icon: '⚡', count: 0 },
  { name: 'Plumber', icon: '🔧', count: 0 },
  { name: 'Mason', icon: '🏗️', count: 0 },
  { name: 'Carpenter', icon: '🪵', count: 0 },
  { name: 'Foreman', icon: '👷', count: 0 },
  { name: 'Site Engineer', icon: '📐', count: 0 },
  { name: 'Heavy Equipment Operator', icon: '🚜', count: 0 },
  { name: 'QS (Quantity Surveyor)', icon: '📊', count: 0 },
];

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState(COMMON_ROLES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('listings')
        .select('job_type')
        .eq('type', 'job')
        .eq('status', 'active');

      if (!error && data) {
        // Count jobs per role
        const roleCounts = {};
        data.forEach(job => {
          if (job.job_type) {
            roleCounts[job.job_type] = (roleCounts[job.job_type] || 0) + 1;
          }
        });

        // Update roles with counts
        const updatedRoles = COMMON_ROLES.map(role => ({
          ...role,
          count: roleCounts[role.name] || 0
        })).sort((a, b) => b.count - a.count);

        setRoles(updatedRoles);
      }
    } catch (err) {
      console.error('Error loading roles:', err);
    } finally {
      setLoading(false);
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
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold">Browse by Role</h1>
          </div>
          <p className="text-gray-200">Find jobs matching your skills and experience</p>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => (
            <Link key={role.name} href={`/careers/jobs?role=${encodeURIComponent(role.name)}`}>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all p-6 flex flex-col items-center text-center cursor-pointer group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {role.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition">
                  {role.name}
                </h3>
                <p className="text-2xl font-bold text-orange-600">
                  {role.count}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {role.count === 1 ? 'job' : 'jobs'} available
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Browse All Jobs */}
        <div className="mt-12 text-center">
          <Link href="/careers/jobs">
            <button className="px-8 py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#ca8637' }}>
              Browse All Jobs
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
