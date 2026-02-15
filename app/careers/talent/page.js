'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, MapPin, Briefcase, Star, Search } from 'lucide-react';

export default function TalentPage() {
  const supabase = createClient();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [uniqueRoles, setUniqueRoles] = useState([]);

  useEffect(() => {
    fetchWorkers();
  }, []);

  async function fetchWorkers() {
    try {
      setLoading(true);

      // Fetch all workers from candidate_profiles with profile data
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('id, full_name, avatar_url, city, role, bio, skills, availability, hourly_rate')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const workersData = data || [];
      setWorkers(workersData);

      // Extract unique roles
      const roles = [...new Set(workersData.map(w => w.role).filter(Boolean))].sort();
      setUniqueRoles(roles);
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter workers based on search and role
  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = !searchTerm || 
      worker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || worker.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center pt-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-4 transition"
          >
            <ArrowLeft size={20} />
            Back
          </Link>
          <h1 className="text-4xl font-bold mb-4">Top-Rated Talent</h1>
          <p className="text-xl text-orange-100">
            Connect with experienced construction professionals
          </p>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Workers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkers.length > 0 ? (
            filteredWorkers.map(worker => (
              <div
                key={worker.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                {/* Avatar */}
                <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  {worker.avatar_url ? (
                    <img
                      src={worker.avatar_url}
                      alt={worker.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <span className="text-4xl text-gray-500">
                        {worker.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {worker.full_name || 'Unnamed Worker'}
                  </h3>

                  {/* Role */}
                  {worker.role && (
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Briefcase size={16} />
                      <span className="text-sm">{worker.role}</span>
                    </div>
                  )}

                  {/* Location */}
                  {worker.city && (
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <MapPin size={16} />
                      <span className="text-sm">{worker.city}</span>
                    </div>
                  )}

                  {/* Bio */}
                  {worker.bio && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {worker.bio}
                    </p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.round(worker.average_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      ({worker.ratings_count || 0} reviews)
                    </span>
                  </div>

                  {/* View Profile Button */}
                  <Link
                    href={`/careers/talent/${worker.id}`}
                    className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg text-center transition"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 text-lg">
                No workers found matching your criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
