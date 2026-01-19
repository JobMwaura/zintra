'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, MapPin, Clock, DollarSign, Briefcase, ChevronRight } from 'lucide-react';
import Link from 'next/link';

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filterLocation, setFilterLocation] = useState(searchParams.get('location') || '');
  const [filterRole, setFilterRole] = useState(searchParams.get('role') || '');
  const [locations, setLocations] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, searchTerm, filterLocation, filterRole]);

  async function loadJobs() {
    try {
      const supabase = createClient();

      // Fetch all active jobs from listings table
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          location,
          pay_min,
          pay_max,
          pay_currency,
          job_type,
          start_date,
          duration,
          status,
          type,
          created_at,
          employer:employer_id(id, company_name, company_logo_url)
        `)
        .eq('type', 'job')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setJobs(data || []);

      // Extract unique locations and roles
      const uniqueLocations = [...new Set(data?.map(j => j.location) || [])].sort();
      const uniqueRoles = [...new Set(data?.map(j => j.job_type) || [])].sort();

      setLocations(uniqueLocations);
      setRoles(uniqueRoles);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = jobs;

    // Search by title or description
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        j =>
          j.title.toLowerCase().includes(query) ||
          j.description?.toLowerCase().includes(query)
      );
    }

    // Filter by location
    if (filterLocation) {
      filtered = filtered.filter(j => j.location === filterLocation);
    }

    // Filter by role/job type
    if (filterRole) {
      filtered = filtered.filter(j => j.job_type === filterRole);
    }

    setFilteredJobs(filtered);
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
            <h1 className="text-3xl font-bold">Available Jobs</h1>
          </div>
          <p className="text-gray-200 max-w-2xl">
            Browse construction and trade jobs across Kenya. Full-time and part-time opportunities with verified employers.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-3 items-center flex-wrap">
            {/* Search Input */}
            <div className="flex-1 min-w-64 relative">
              <input
                type="text"
                placeholder="Search jobs by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-semibold">No jobs found</p>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Link key={job.id} href={`/careers/jobs/${job.id}`}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all p-6 flex flex-col cursor-pointer group h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                    </div>
                    <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 bg-blue-100 text-blue-700">
                      {job.job_type}
                    </span>
                  </div>

                  {/* Company Info */}
                  {job.employer && (
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        {job.employer.company_logo_url ? (
                          <img
                            src={job.employer.company_logo_url}
                            alt={job.employer.company_name}
                            className="w-8 h-8 rounded object-contain"
                          />
                        ) : (
                          <Briefcase className="w-8 h-8 text-gray-300" />
                        )}
                        <p className="text-sm font-semibold text-gray-900">{job.employer.company_name}</p>
                      </div>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="space-y-3 mb-4 flex-grow">
                    {/* Pay */}
                    {(job.pay_min || job.pay_max) && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-gray-900">
                          KES {job.pay_min?.toLocaleString() || '—'} - {job.pay_max?.toLocaleString() || '—'}
                        </span>
                      </div>
                    )}

                    {/* Location */}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{job.location}</span>
                    </div>

                    {/* Duration */}
                    {job.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{job.duration}</span>
                      </div>
                    )}

                    {/* Start Date */}
                    {job.start_date && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Starts: {new Date(job.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <button className="w-full py-3 rounded-lg font-semibold text-white transition-all group-hover:opacity-90"
                    style={{ backgroundColor: '#ca8637' }}>
                    View Job <ChevronRight className="w-4 h-4 inline ml-1" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingSpinner /></div>}>
      <JobsPageContent />
    </Suspense>
  );
}
