'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, MapPin, Briefcase, Star, Search, Crown, CheckCircle2 } from 'lucide-react';
import { LevelBadge, VerificationBadges, FeaturedBadge } from '@/components/careers/LevelBadge';

export default function TalentPage() {
  const supabase = createClient();
  const [workers, setWorkers] = useState([]);
  const [featuredWorkers, setFeaturedWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [uniqueRoles, setUniqueRoles] = useState([]);

  useEffect(() => {
    fetchWorkers();
  }, []);

  async function fetchWorkers() {
    try {
      setLoading(true);

      // Fetch all workers from candidate_profiles with profile data + level/verification fields
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('id, full_name, avatar_url, city, role, bio, skills, availability, hourly_rate, level, rating, completed_gigs, verified_id, verified_references, tools_ready, featured_until')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const workersData = data || [];

      // Separate featured workers (featured_until > now)
      const now = new Date().toISOString();
      const featured = workersData.filter(w => w.featured_until && w.featured_until > now);
      setFeaturedWorkers(featured);
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

  // Filter workers based on search, role, and level
  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = !searchTerm || 
      worker.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || worker.role === filterRole;
    const matchesLevel = !filterLevel || worker.level === filterLevel;
    return matchesSearch && matchesRole && matchesLevel;
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
          >
            <option value="">All Levels</option>
            <option value="top_rated">⭐ Top Rated</option>
            <option value="trusted">✓ Trusted</option>
            <option value="rising">↑ Rising</option>
            <option value="new">New</option>
          </select>
        </div>

        {/* Featured Workers Section */}
        {featuredWorkers.length > 0 && !searchTerm && !filterRole && !filterLevel && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Crown size={24} className="text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Professionals</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredWorkers.map(worker => (
                <div
                  key={`featured-${worker.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden ring-2 ring-orange-400"
                >
                  {/* Featured ribbon */}
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                      {worker.avatar_url ? (
                        <img src={worker.avatar_url} alt={worker.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-4xl text-gray-500">{worker.full_name?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2">
                      <FeaturedBadge size="sm" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{worker.full_name || 'Unnamed Worker'}</h3>
                      <LevelBadge level={worker.level || 'new'} size="sm" />
                    </div>
                    {worker.role && (
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Briefcase size={16} />
                        <span className="text-sm">{worker.role}</span>
                      </div>
                    )}
                    {worker.city && (
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <MapPin size={16} />
                        <span className="text-sm">{worker.city}</span>
                      </div>
                    )}
                    <VerificationBadges
                      verifiedId={worker.verified_id}
                      verifiedReferences={worker.verified_references}
                      toolsReady={worker.tools_ready}
                      variant="compact"
                    />
                    <div className="flex items-center gap-2 mt-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} className={i < Math.round(worker.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">({worker.completed_gigs || 0} gigs)</span>
                    </div>
                    <Link
                      href={`/careers/talent/${worker.id}`}
                      className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg text-center transition"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Workers Header */}
        {featuredWorkers.length > 0 && !searchTerm && !filterRole && !filterLevel && (
          <h2 className="text-2xl font-bold text-gray-900 mb-4">All Professionals</h2>
        )}

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
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {worker.full_name || 'Unnamed Worker'}
                    </h3>
                    <LevelBadge level={worker.level || 'new'} size="sm" />
                  </div>

                  {/* Role */}
                  {worker.role && (
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Briefcase size={16} />
                      <span className="text-sm">{worker.role}</span>
                    </div>
                  )}

                  {/* Location */}
                  {worker.city && (
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin size={16} />
                      <span className="text-sm">{worker.city}</span>
                    </div>
                  )}

                  {/* Verification Badges */}
                  <div className="mb-2">
                    <VerificationBadges
                      verifiedId={worker.verified_id}
                      verifiedReferences={worker.verified_references}
                      toolsReady={worker.tools_ready}
                      variant="compact"
                    />
                  </div>

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
                          className={i < Math.round(worker.rating || worker.average_rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">
                      ({worker.completed_gigs || worker.ratings_count || 0} {worker.completed_gigs !== undefined ? 'gigs' : 'reviews'})
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
