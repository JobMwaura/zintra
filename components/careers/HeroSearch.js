/**
 * HeroSearch Component - Conversion-Focused
 * Hero section with proof points + prominent search + clear CTA hierarchy
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';

export default function HeroSearch() {
  const [searchType, setSearchType] = useState('jobs');
  const [searchData, setSearchData] = useState({
    role: '',
    location: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search submitted:', searchData, 'Type:', searchType);
  };

  return (
    <section className="w-full bg-white border-b border-gray-200 py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero Text with Proof Points */}
        <div className="mb-8 text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
            Find Verified Construction Jobs & Gigs Across Kenya
          </h1>
          <p className="text-base sm:text-lg text-gray-700 mb-1 font-semibold">
            Join 2,400+ workers earning KES 50K-150K monthly
          </p>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Work with 180+ trusted employers. Zero upfront fees. Fast, secure payments.
          </p>
          
          {/* Proof Points */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" />
              <span><strong>2,400+</strong> workers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" />
              <span><strong>180+</strong> verified employers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" />
              <span><strong>650+</strong> gigs completed</span>
            </div>
          </div>
        </div>

        {/* Search Container - Prominent */}
        <div className="max-w-3xl mx-auto mb-6">
          <form
            onSubmit={handleSearch}
            className="bg-gray-50 border-2 border-gray-300 rounded-lg p-5 sm:p-6"
          >
            {/* Jobs/Gigs Toggle */}
            <div className="flex gap-2 mb-4 border-b border-gray-200 pb-3">
              <button
                type="button"
                onClick={() => setSearchType('jobs')}
                className={`flex-1 py-2 px-3 text-sm font-semibold rounded text-center transition-colors ${
                  searchType === 'jobs'
                    ? 'bg-[#ea8f1e] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Find Jobs
              </button>
              <button
                type="button"
                onClick={() => setSearchType('gigs')}
                className={`flex-1 py-2 px-3 text-sm font-semibold rounded text-center transition-colors ${
                  searchType === 'gigs'
                    ? 'bg-[#ea8f1e] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                Find Gigs
              </button>
            </div>

            {/* Search Inputs - Simplified for Mobile */}
            {/* Desktop: 2 columns, Mobile: 1 column */}
            <div className="hidden sm:grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Role or Skill
                </label>
                <input
                  type="text"
                  name="role"
                  placeholder="Mason, Electrician, Foreman..."
                  value={searchData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#ea8f1e] focus:border-transparent text-sm h-10"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="Nairobi, Kiambu, Mombasa..."
                  value={searchData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#ea8f1e] focus:border-transparent text-sm h-10"
                />
              </div>
            </div>

            {/* Mobile: Single column (simplified) */}
            <div className="sm:hidden grid grid-cols-1 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Role or Skill
                </label>
                <input
                  type="text"
                  name="role"
                  placeholder="Electrician, Mason, Foreman..."
                  value={searchData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#ea8f1e] focus:border-transparent text-sm h-11"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  name="location"
                  placeholder="All Locations"
                  value={searchData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#ea8f1e] focus:border-transparent text-sm h-11"
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#ea8f1e] text-white font-bold rounded-lg hover:bg-[#d97706] transition-colors text-sm"
            >
              <Search size={18} />
              Search {searchType === 'jobs' ? 'Jobs' : 'Gigs'}
            </button>
          </form>
        </div>

        {/* Secondary CTA - Post a Job/Gig */}
        <div className="text-center text-xs sm:text-sm text-gray-600">
          <span>Are you an employer? </span>
          <Link href="/vendor-registration" className="text-[#ea8f1e] font-semibold hover:underline">
            Post a job
          </Link>
          <span> or </span>
          <Link href="/vendor-registration" className="text-[#ea8f1e] font-semibold hover:underline">
            post a gig
          </Link>
        </div>
      </div>
    </section>
  );
}
