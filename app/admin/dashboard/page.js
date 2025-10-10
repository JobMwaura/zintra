'use client';

import {
  TrendingUp,
  AlertCircle,
  Users,
  FileText,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Vendors',
      value: '1,284',
      change: '+12.5%',
      trend: 'up',
    },
    {
      title: 'Active Projects',
      value: '432',
      change: '+8.2%',
      trend: 'up',
    },
    {
      title: 'Pending Verifications',
      value: '28',
      change: '-5.1%',
      trend: 'down',
    },
    {
      title: 'Total Revenue',
      value: 'KSh 2.4M',
      change: '+18.2%',
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Panel</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 hover:scale-[1.01] p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <h3 className="text-3xl font-bold mt-1 text-gray-900">
                  {stat.value}
                </h3>
              </div>
              <div
                className={`flex items-center ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm font-semibold">{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Panels */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 hover:scale-[1.01] p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            Recent Activity
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            What’s happening on the platform
          </p>
          <ul className="space-y-4">
            {[
              'New vendor registered — Nairobi Steel Works Ltd',
              'Vendor verification approved — Mombasa Cement Ltd',
              'New RFQ submitted — Office Building Materials',
              'Subscription upgraded — Savannah Timber → Premium',
              'Vendor reported — Quality issues with Acme Supplies',
            ].map((item, index) => (
              <li
                key={index}
                className="bg-gray-50 rounded-xl p-3 flex items-start hover:bg-gray-100 transition"
              >
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-zintra-orange" />
                <p className="text-gray-700 text-sm ml-3 leading-snug">{item}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Pending Verifications */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 hover:scale-[1.01] p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            Pending Verification Requests
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Approve or reject vendor applications
          </p>

          <ul className="space-y-4">
            {[
              { name: 'Kilimani Supplies Ltd', city: 'Nairobi' },
              { name: 'Mwananchi Timber Traders', city: 'Eldoret' },
              { name: 'Coastal Plumbing Solutions', city: 'Mombasa' },
              { name: 'Lakeside Electrical Co.', city: 'Kisumu' },
            ].map((vendor, index) => (
              <li
                key={index}
                className="flex justify-between items-center bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition"
              >
                <div>
                  <p className="text-gray-800 font-medium text-sm">
                    {vendor.name}
                  </p>
                  <p className="text-xs text-gray-500">{vendor.city}</p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-xs font-semibold text-white rounded-md bg-green-500 hover:bg-green-600">
                    Approve
                  </button>
                  <button className="px-3 py-1 text-xs font-semibold text-white rounded-md bg-red-500 hover:bg-red-600">
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
