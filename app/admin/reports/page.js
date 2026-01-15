'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, CheckCircle, AlertCircle, Loader, TrendingUp, Users, FileText, DollarSign, Download, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ReportsAdmin() {
  const [reports, setReports] = useState({
    vendors: { total: 0, active: 0, inactive: 0, growth: 0 },
    rfqs: { total: 0, active: 0, completed: 0, cancelled: 0 },
    users: { total: 0, verified: 0, unverified: 0 },
    revenue: { total: 0, monthly: 0, yearly: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      // Fetch vendor stats
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, business_status');

      if (vendorsError) throw vendorsError;

      // Fetch RFQ stats
      const { data: rfqsData, error: rfqsError } = await supabase
        .from('rfq_requests')
        .select('id, status');

      if (rfqsError) throw rfqsError;

      // Fetch users stats
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email_verified');

      if (usersError) throw usersError;

      // Calculate stats
      const vendorStats = {
        total: vendorsData?.length || 0,
        active: vendorsData?.filter(v => v.business_status === 'active').length || 0,
        inactive: vendorsData?.filter(v => v.business_status === 'inactive').length || 0,
        growth: 12.5, // Mock growth percentage
      };

      const rfqStats = {
        total: rfqsData?.length || 0,
        active: rfqsData?.filter(r => r.status === 'open' || r.status === 'in_progress').length || 0,
        completed: rfqsData?.filter(r => r.status === 'completed').length || 0,
        cancelled: rfqsData?.filter(r => r.status === 'cancelled').length || 0,
      };

      const userStats = {
        total: usersData?.length || 0,
        verified: usersData?.filter(u => u.email_verified).length || 0,
        unverified: usersData?.filter(u => !u.email_verified).length || 0,
      };

      const revenueStats = {
        total: 0, // Mock data
        monthly: 0,
        yearly: 0,
      };

      setReports({
        vendors: vendorStats,
        rfqs: rfqStats,
        users: userStats,
        revenue: revenueStats,
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
      showMessage('Error loading reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleExport = (reportType) => {
    showMessage(`Exporting ${reportType} report...`, 'success');
    // In production, generate and download CSV/Excel
  };

  const mainStats = [
    {
      label: 'Total Vendors',
      value: reports.vendors.total,
      change: `+${reports.vendors.growth}%`,
      icon: Users,
      color: 'blue',
      trend: 'up'
    },
    {
      label: 'Active RFQs',
      value: reports.rfqs.active,
      change: `${reports.rfqs.total} total`,
      icon: FileText,
      color: 'green',
      trend: 'up'
    },
    {
      label: 'Total Users',
      value: reports.users.total,
      change: `${reports.users.verified} verified`,
      icon: Users,
      color: 'purple',
      trend: 'up'
    },
    {
      label: 'Monthly Revenue',
      value: `$${reports.revenue.monthly.toLocaleString()}`,
      change: 'Coming soon',
      icon: DollarSign,
      color: 'orange',
      trend: 'neutral'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Link href="/admin/dashboard" className="hover:text-gray-900">Admin</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Reports & Analytics</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">Platform performance and business metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Loader className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading reports...</p>
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {mainStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`bg-${stat.color}-100 p-3 rounded-lg`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                    {stat.trend === 'up' && (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-medium mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.change}</p>
                </div>
              ))}
            </div>

            {/* Vendor Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Vendor Statistics
                  </h2>
                  <button
                    onClick={() => handleExport('vendors')}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Vendors</span>
                    <span className="font-bold text-gray-900">{reports.vendors.total}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Active Vendors</span>
                    <span className="font-bold text-green-600">{reports.vendors.active}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Inactive Vendors</span>
                    <span className="font-bold text-gray-600">{reports.vendors.inactive}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Growth Rate</span>
                    <span className="font-bold text-blue-600">+{reports.vendors.growth}%</span>
                  </div>
                </div>
              </div>

              {/* RFQ Analytics */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    RFQ Statistics
                  </h2>
                  <button
                    onClick={() => handleExport('rfqs')}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total RFQs</span>
                    <span className="font-bold text-gray-900">{reports.rfqs.total}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Active RFQs</span>
                    <span className="font-bold text-blue-600">{reports.rfqs.active}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Completed RFQs</span>
                    <span className="font-bold text-green-600">{reports.rfqs.completed}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Cancelled RFQs</span>
                    <span className="font-bold text-red-600">{reports.rfqs.cancelled}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Analytics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Statistics
                </h2>
                <button
                  onClick={() => handleExport('users')}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{reports.users.total}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-gray-600 mb-2">Verified Users</p>
                  <p className="text-3xl font-bold text-green-600">{reports.users.verified}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-gray-600 mb-2">Unverified Users</p>
                  <p className="text-3xl font-bold text-orange-600">{reports.users.unverified}</p>
                </div>
              </div>
            </div>

            {/* Revenue Analytics (Placeholder) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Revenue Analytics
                </h2>
                <button
                  onClick={() => handleExport('revenue')}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue Tracking Coming Soon</h3>
                <p className="text-gray-600">Connect subscription and payment data to view revenue analytics</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
