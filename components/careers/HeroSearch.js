/**
 * HeroSearch Component - Minimalist Design
 * Clean hero section with simplified search
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function HeroSearch() {
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
    console.log('Search submitted:', searchData);
  };

  return (
    <section className="w-full bg-white border-b border-gray-200 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero Text */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            Career Centre
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Find jobs and gigs with verified construction employers across Kenya
          </p>
        </div>

        {/* CTA Buttons - Minimal */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-12">
          <Link
            href="/careers/profile"
            className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-[#ea8f1e] text-white font-medium rounded hover:opacity-90 transition-opacity"
          >
            Create Profile
          </Link>
          <Link
            href="/careers/jobs"
            className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors"
          >
            Find Jobs
          </Link>
          <Link
            href="/careers/gigs"
            className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors"
          >
            Find Gigs
          </Link>
        </div>

        {/* Search Bar - Minimalist */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto"
        >
          <input
            type="text"
            name="role"
            placeholder="Role or skill"
            value={searchData.role}
            onChange={handleInputChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#ea8f1e] focus:border-transparent text-sm"
          />
          
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={searchData.location}
            onChange={handleInputChange}
            className="flex-1 px-4 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#ea8f1e] focus:border-transparent text-sm"
          />
          
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-2 bg-[#ea8f1e] text-white font-medium rounded hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Search size={18} />
            Search
          </button>
        </form>
      </div>
    </section>
  );
}
