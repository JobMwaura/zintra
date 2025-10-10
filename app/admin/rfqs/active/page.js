'use client';

import { useState } from 'react';
import { Search, Filter, Eye } from 'lucide-react';

export default function ActiveRFQs() {
  const [searchTerm, setSearchTerm] = useState('');

  // TODO: Replace with real data from API
  const activeRFQs = [
    {
      id: 1,
      projectTitle: 'Bathroom Renovation',
      category: 'Plumbing & Sanitation',
      userName: 'Sarah Otieno',
      location: 'Kilimani, Nairobi',
      budgetRange: 'KSh 100,000 - 500,000',
      postedDate: '2024-10-03',
      status: 'active',
      quotesReceived: 3,
      vendorsMatched: 5
    },
    {
      id: 2,
      projectTitle: 'Office Electrical Wiring',
      category: 'Electrical & Lighting',
      userName: 'David Kimani',
      location: 'Westlands, Nairobi',
      budgetRange: 'KSh 50,000 - 100,000',
      postedDate: '2024-10-04',
      status: 'active',
      quotesReceived: 5,
      vendorsMatched: 7
    },
    {
      id: 3,
      projectTitle: 'Roofing Installation',
      category: 'Roofing & Waterproofing',
      userName: 'Jane Muthoni',
      location: 'Karen, Nairobi',
      budgetRange: 'Over KSh 1,000,000',
      postedDate: '2024-10-02',
      status: 'active',
      quotesReceived: 4,
      vendorsMatched: 6
    }
  ];

  const filteredRFQs = activeRFQs.filter(rfq =>
    rfq.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rfq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#5f6466' }}>Active RFQs</h1>
        <p className="text-gray-600">{activeRFQs.length} approved RFQs currently active</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Active</p>
          <p className="text-2xl font-bold" style={{ color: '#5f6466' }}>{activeRFQs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Quotes</p>
          <p className="text-2xl font-bold text-green-600">12</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Avg Response Rate</p>
          <p className="text-2xl font-bold" style={{ color: '#ea8f1e' }}>68%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search RFQs..."
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
                  RFQ Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRFQs.map((rfq) => (
                <tr key={rfq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{rfq.projectTitle}</p>
                      <p className="text-sm text-gray-600">{rfq.category}</p>
                      <p className="text-xs text-gray-500">{rfq.location}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{rfq.budgetRange}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{rfq.postedDate}</p>
                    <p className="text-xs text-gray-500">By {rfq.userName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{rfq.quotesReceived} quotes</p>
                      <p className="text-gray-600">{rfq.vendorsMatched} vendors matched</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-gray-100 rounded" title="View Details">
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
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