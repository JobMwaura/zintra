'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, MapPin, Users, Star, Shield } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Link from 'next/link';

export default function EmployersPage() {
  const router = useRouter();
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEmployers();
  }, []);

  async function loadEmployers() {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('employer_profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw new Error(error.message);
      setEmployers(data || []);
    } catch (err) {
      console.error('Error loading employers:', err);
      setError('Failed to load employers');
    } finally {
      setLoading(false);
    }
  }

  const filteredEmployers = employers.filter(emp =>
    emp.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.company_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold">Featured Employers</h1>
          </div>
          <p className="text-gray-200">Explore verified employers in the construction industry</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <input
            type="text"
            placeholder="Search employers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Employers Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        ) : filteredEmployers.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-semibold">No employers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployers.map((employer) => (
              <div key={employer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-all p-6 flex flex-col">
                {/* Logo */}
                <div className="mb-4 flex justify-center">
                  {employer.company_logo_url ? (
                    <img
                      src={employer.company_logo_url}
                      alt={employer.company_name}
                      className="h-16 w-auto object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Name & Badge */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{employer.company_name}</h3>
                  {employer.is_verified && (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-blue-600 font-semibold">Verified</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
                  {employer.company_description || 'No description provided'}
                </p>

                {/* Info */}
                {employer.company_phone && (
                  <div className="mb-3 text-sm text-gray-600">
                    <p className="font-semibold text-gray-900">Phone</p>
                    <p>{employer.company_phone}</p>
                  </div>
                )}

                {employer.company_email && (
                  <div className="mb-4 text-sm text-gray-600">
                    <p className="font-semibold text-gray-900">Email</p>
                    <p className="break-all">{employer.company_email}</p>
                  </div>
                )}

                {/* View Jobs Button */}
                <Link href={`/careers/employer/${employer.id}/jobs`}>
                  <button className="w-full py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: '#ca8637' }}>
                    View Jobs
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
