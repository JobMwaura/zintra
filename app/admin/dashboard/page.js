// File: app/admin/dashboard/page.js
// Purpose: Dashboard home page

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalVendors: 0,
    pendingRFQs: 0,
    activeUsers: 0,
    totalCategories: 0,
    activeSubscriptions: 0,
    totalPlans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get vendors count
        const { count: vendorCount } = await supabase
          .from('vendors')
          .select('*', { count: 'exact', head: true });

        // Get RFQs count
        const { count: rfqCount } = await supabase
          .from('rfqs')
          .select('*', { count: 'exact', head: true });

        // Get users count
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        // Get categories count
        const { count: categoryCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });

        // Get active subscriptions count
        const { count: activeSubCount } = await supabase
          .from('vendor_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get plans count
        const { count: plansCount } = await supabase
          .from('subscription_plans')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalVendors: vendorCount || 0,
          pendingRFQs: rfqCount || 0,
          activeUsers: userCount || 0,
          totalCategories: categoryCount || 0,
          activeSubscriptions: activeSubCount || 0,
          totalPlans: plansCount || 0,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to ZINTRA Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Vendors Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Vendors</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.totalVendors}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4 0a1 1 0 11-2 0 1 1 0 012 0m-5 6a1 1 0 11-2 0 1 1 0 012 0m5 0a1 1 0 11-2 0 1 1 0 012 0" />
              </svg>
            </div>
          </div>
        </div>

        {/* RFQs Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending RFQs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.pendingRFQs}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <a href="/admin/rfqs" className="mt-4 inline-block text-sm font-medium text-orange-600 hover:text-orange-700">
            View RFQ Management →
          </a>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.activeUsers}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a3 3 0 003-3v-2a3 3 0 00-3-3H3a3 3 0 00-3 3v2a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Categories Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Categories</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.totalCategories}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Subscriptions Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.activeSubscriptions}
              </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <a href="/admin/subscriptions" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Manage Subscriptions →
          </a>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a href="/admin/vendors" className="block p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700">
              → Manage Vendors
            </a>
            <a href="/admin/rfqs" className="block p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700">
              → View RFQs
            </a>
            <a href="/admin/categories" className="block p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700">
              → Manage Categories
            </a>
            <a href="/admin/users" className="block p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700">
              → Manage Users
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Database: Online</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">API: Online</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Auth: Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}