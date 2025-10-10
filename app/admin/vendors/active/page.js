'use client';

import { useState } from 'react';
import { Search, Filter, Eye, Ban, TrendingUp } from 'lucide-react';

export default function ActiveVendors() {
  const [searchTerm, setSearchTerm] = useState('');

  // TODO: Replace with real data from API
  const activeVendors = [
    {
      id: 1,
      businessName: 'Mwanainchi Electricians',
      category: 'Electrical & Lighting',
      county: 'Mombasa',
      subscriptionPlan: 'Premium',
      rating: 4.9,
      reviewCount: 89,
      rfqsReceived: 45,
      rfqsResponded: 42,
      responseRate: '93%',
      joinedDate: '2024-08-15',
      lastActive: '2 hours ago',
      status: 'active'
    },
    {
      id: 2,
      businessName: 'Prime Construction Materials',
      category: 'Building & Structural Materials',
      county: 'Nairobi',
      subscriptionPlan: 'Diamond',
      rating: 4.7,
      reviewCount: 124,
      rfqsReceived: 89,
      rfqsResponded: 85,
      responseRate: '96%',
      joinedDate: '2024-07-01',
      lastActive: '1 day ago',
      status: 'active'
    },
    {
      id: 3,
      businessName: 'Roof Masters Kenya',
      category: 'Roofing & Waterproofing',
      county: 'Kisumu',
      subscriptionPlan: 'Standard',
      rating: 4.8,
      reviewCount: 67,
      rfqsReceived: 34,
      rfqsResponded: 32,
      responseRate: '94%',
      joinedDate: '2024-06-10',
      lastActive: '5 hours ago',
      status: 'active'
    },
    {
      id: 4,
      businessName: 'Elite Plumbing Solutions',
      category: 'Plumbing & Sanitation',
      county: 'Nakuru',
      subscriptionPlan: 'Basic',
      rating: 4.6,
      reviewCount: 45,
      rfqsReceived: 28,
      rfqsResponded: 25,
      responseRate: '89%',
      joinedDate: '2024-09-01',
      lastActive: '3 days ago',
      status: 'active'
    }
  ];

  const filteredVendors = activeVendors.filter(vendor =>
    vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanColor = (plan) => {
    switch(plan) {
      case 'Diamond': return 'bg-purple-100 text-purple-800';
      case 'Premium': return 'bg-blue-100 text-blue-800';
      case 'Standard': return 'bg-green-100 text-green-800';
      case 'Basic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#5f6466' }}>Active Vendors</h1>
        <p className="text-gray-600">{activeVendors.length} approved and active vendors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Active</p>
          <p className="text-2xl font-bold" style={{ color: '#5f6466' }}>{activeVendors.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Avg Response Rate</p>
          <p className="text-2xl font-bold text-green-600">93%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
          <p className="text-2xl font-bold" style={{ color: '#ea8f1e' }}>4.8 ⭐</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total RFQs</p>
          <p className="text-2xl font-bold" style={{ color: '#5f6466' }}>196</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5 mr-2" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{vendor.businessName}</p>
                      <p className="text-sm text-gray-600">{vendor.category}</p>
                      <p className="text-xs text-gray-500">{vendor.county}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanColor(vendor.subscriptionPlan)}`}>
                      {vendor.subscriptionPlan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{vendor.rfqsResponded}/{vendor.rfqsReceived} RFQs</p>
                      <p className="text-gray-600">Response: {vendor.responseRate}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">⭐</span>
                      <span className="font-medium">{vendor.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({vendor.reviewCount})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{vendor.lastActive}</p>
                    <p className="text-xs text-gray-500">Joined {vendor.joinedDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded" title="View Profile">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded" title="Suspend">
                        <Ban className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}