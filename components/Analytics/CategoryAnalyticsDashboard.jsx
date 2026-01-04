'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, FileText, MessageSquare, Loader } from 'lucide-react';

/**
 * Category Analytics Dashboard
 * 
 * Displays:
 * - RFQ breakdown by category
 * - Vendor distribution by category  
 * - Response rates by category
 * - Trends and insights
 * 
 * Phase 3 Feature 3: Category analytics
 */

export default function CategoryAnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics/categories?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading analytics: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, categories, topCategories, vendorDistribution } = data;

  // Prepare chart data
  const chartData = (categories || []).slice(0, 10).map(cat => ({
    name: cat.category || 'Other',
    RFQs: cat.rfqCount,
    Vendors: cat.vendorCount,
    Responses: cat.responseCount,
    responseRate: parseFloat(cat.avgResponseRate)
  }));

  const pieData = topCategories?.map(cat => ({
    name: cat.category || 'Other',
    value: cat.rfqCount
  })) || [];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Category Analytics</h2>
          <p className="text-gray-600 mt-1">Understand category popularity and vendor distribution</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {['7', '30', '90', '365'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7' ? '7 days' : range === '30' ? '30 days' : range === '90' ? '90 days' : '1 year'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard
          icon={FileText}
          label="Total RFQs"
          value={summary?.totalRFQs || 0}
          color="blue"
        />
        <SummaryCard
          icon={Users}
          label="Total Vendors"
          value={summary?.totalVendors || 0}
          color="purple"
        />
        <SummaryCard
          icon={MessageSquare}
          label="Total Responses"
          value={summary?.totalResponses || 0}
          color="pink"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Active Categories"
          value={summary?.activeCategories || 0}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RFQs by Category - Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">RFQs by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="RFQs" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution - Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vendor Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendors vs RFQs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Distribution by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Vendors" fill="#8b5cf6" />
              <Bar dataKey="RFQs" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Rates */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Rates by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
              <Line type="monotone" dataKey="responseRate" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Details Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">RFQs</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Vendors</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Responses</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Response Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories?.slice(0, 10).map((cat, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {cat.category || 'Other'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {cat.rfqCount}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {cat.vendorCount}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {cat.responseCount}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                      parseFloat(cat.avgResponseRate) >= 0.5
                        ? 'bg-green-100 text-green-800'
                        : parseFloat(cat.avgResponseRate) >= 0.25
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(parseFloat(cat.avgResponseRate) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Insights</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          {topCategories && topCategories.length > 0 && (
            <li>
              📈 <strong>{topCategories[0].category}</strong> is the most popular category with {topCategories[0].rfqCount} RFQs in the last {data.timeRange} days
            </li>
          )}
          <li>
            👥 You have <strong>{summary?.totalVendors}</strong> vendors across <strong>{summary?.activeCategories}</strong> categories
          </li>
          <li>
            💬 Average response rate across all categories is <strong>{
              categories && categories.length > 0
                ? ((categories.reduce((sum, cat) => sum + parseFloat(cat.avgResponseRate), 0) / categories.length) * 100).toFixed(1)
                : 0
            }%</strong>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Summary Card Component
 */
function SummaryCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    pink: 'bg-pink-50 text-pink-600',
    green: 'bg-green-50 text-green-600'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
