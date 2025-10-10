'use client';

import { useState } from 'react';
import { Search, Filter, Eye, Ban } from 'lucide-react';

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('');

  // TODO: Replace with real data from API
  const users = [
    {
      id: 1,
      name: 'Mary Wanjiku',
      email: 'mary@email.com',
      phone: '+254 700 123 456',
      joinedDate: '2024-09-15',
      rfqsSubmitted: 3,
      lastActive: '2 hours ago',
      status: 'active',
      reputation: 'bronze'
    },
    {
      id: 2,
      name: 'John Kamau',
      email: 'john@company.com',
      phone: '+254 722 456 789',
      joinedDate: '2024-08-20',
      rfqsSubmitted: 7,
      lastActive: '1 day ago',
      status: 'active',
      reputation: 'silver'
    },
    {
      id: 3,
      name: 'Sarah Otieno',
      email: 'sarah@email.com',
      phone: '+254 733 789 012',
      joinedDate: '2024-10-01',
      rfqsSubmitted: 1,
      lastActive: '3 hours ago',
      status: 'active',
      reputation: 'new'
    }
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getReputationColor = (reputation) => {
    switch(reputation) {
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-200 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'new': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#5f6466' }}>Registered Users</h1>
        <p className="text-gray-600">{users.length} total users on the platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-2xl font-bold" style={{ color: '#5f6466' }}>{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total RFQs</p>
          <p className="text-2xl font-bold text-blue-600">11</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Avg RFQs/User</p>
          <p className="text-2xl font-bold" style={{ color: '#ea8f1e' }}>3.7</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">New This Month</p>
          <p className="text-2xl font-bold text-green-600">1</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
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
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reputation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">Joined {user.joinedDate}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-500">{user.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getReputationColor(user.reputation)}`}>
                      {user.reputation}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{user.rfqsSubmitted} RFQs</p>
                    <p className="text-xs text-gray-500">Active {user.lastActive}</p>
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