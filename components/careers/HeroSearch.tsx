/**
 * HeroSearch Component
 * Main hero section with title, subtitle, CTAs, and search bar
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";

export default function HeroSearch() {
  const [searchData, setSearchData] = useState({
    role: "",
    location: "",
    type: "job",
    payRange: "",
    startDate: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual search navigation
    // For now, just log the search data
    console.log("Search submitted:", searchData);
    // Later: router.push(`/careers/${searchData.type}?role=${searchData.role}&location=${searchData.location}`)
  };

  return (
    <section className="w-full bg-gradient-to-br from-[#ea8f1e] via-[#f59e0b] to-[#d97706] py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero Text */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Zintra Career Centre
          </h1>
          <p className="text-lg sm:text-xl text-orange-50 max-w-2xl mx-auto">
            Connect with verified construction employers and gig opportunities
            across Kenya
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-12">
          <Link
            href="/careers/profile"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#ea8f1e] font-semibold rounded-lg hover:bg-orange-50 transition-colors shadow-lg"
          >
            Create Profile
          </Link>
          <Link
            href="/careers/jobs"
            className="inline-flex items-center justify-center px-5 sm:px-6 py-3 sm:py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#ea8f1e] transition-colors"
          >
            Find Jobs
          </Link>
          <Link
            href="/careers/gigs"
            className="inline-flex items-center justify-center px-5 sm:px-6 py-3 sm:py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#ea8f1e] transition-colors"
          >
            Find Gigs
          </Link>
          <Link
            href="/careers/post-job"
            className="inline-flex items-center justify-center px-5 sm:px-6 py-3 sm:py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#ea8f1e] transition-colors"
          >
            Post a Job
          </Link>
          <Link
            href="/careers/post-gig"
            className="inline-flex items-center justify-center px-5 sm:px-6 py-3 sm:py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#ea8f1e] transition-colors"
          >
            Post a Gig
          </Link>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-xl p-6 sm:p-8 shadow-2xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Role/Skill Input */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Role / Skill
              </label>
              <input
                type="text"
                id="role"
                name="role"
                placeholder="e.g., Mason, Electrician"
                value={searchData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea8f1e] focus:border-transparent"
              />
            </div>

            {/* Location Input */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="e.g., Nairobi, Mombasa"
                value={searchData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea8f1e] focus:border-transparent"
              />
            </div>

            {/* Type Select */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type
              </label>
              <select
                id="type"
                name="type"
                value={searchData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea8f1e] focus:border-transparent"
              >
                <option value="job">Job</option>
                <option value="gig">Gig</option>
                <option value="both">Both</option>
              </select>
            </div>

            {/* Pay Range Select */}
            <div>
              <label
                htmlFor="payRange"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Pay Range
              </label>
              <select
                id="payRange"
                name="payRange"
                value={searchData.payRange}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea8f1e] focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="0-2000">KES 0 - 2,000</option>
                <option value="2000-5000">KES 2,000 - 5,000</option>
                <option value="5000-10000">KES 5,000 - 10,000</option>
                <option value="10000-20000">KES 10,000 - 20,000</option>
                <option value="20000+">KES 20,000+</option>
              </select>
            </div>

            {/* Start Date Input */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={searchData.startDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ea8f1e] focus:border-transparent"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-8 py-3 bg-[#ea8f1e] text-white font-semibold rounded-lg hover:bg-[#d97706] transition-colors shadow-md flex-1 sm:flex-initial"
            >
              <Search size={20} />
              Search
            </button>
            <button
              type="reset"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
