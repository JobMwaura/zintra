'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, Filter, Eye, Ban, AlertCircle, Loader } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRFQs: 0,
    avgRFQsPerUser: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, created_at, rfq_count, buyer_reputation, is_suspended')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch RFQ counts for each user
      const { data: rfqData } = await supabase
        .from('rfqs')
        .select('user_id, id', { count: 'exact' });

      // Map RFQ counts to users
      const enrichedUsers = (usersData || []).map(user => {
        const userRFQs = rfqData?.filter(rfq => rfq.user_id === user.id) || [];
        const joinDate = new Date(user.created_at);
        const today = new Date();
        const isNewThisMonth = (today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24) <= 30;

        return {
          id: user.id,
          name: user.full_name || 'Unknown User',
          email: user.email || 'No email',
          phone: user.phone || 'No phone',
          joinedDate: joinDate.toISOString().split('T')[0],
          rfqsSubmitted: user.rfq_count || userRFQs.length || 0,
          lastActive: getLastActiveText(joinDate),
          status: user.is_suspended ? 'suspended' : 'active',
          reputation: user.buyer_reputation || 'new',
          isNewThisMonth
        };
      });

      setUsers(enrichedUsers);

      // Calculate stats
      const totalRFQs = enrichedUsers.reduce((sum, u) => sum + u.rfqsSubmitted, 0);
      const newThisMonth = enrichedUsers.filter(u => u.isNewThisMonth).length;
      const avgRFQsPerUser = enrichedUsers.length > 0 ? (totalRFQs / enrichedUsers.length).toFixed(1) : 0;

      setStats({
        totalUsers: enrichedUsers.length,
        totalRFQs,
        avgRFQsPerUser,
        newThisMonth
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getLastActiveText = (joinDate) => {
    const now = new Date();
    const diff = now.getTime() - joinDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''} ago`;
  };

  const handleSuspendUser = async (userId) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_suspended: true, suspension_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
        .eq('id', userId);

      if (error) throw error;
      
      // Refresh user list
      await fetchUsers();
    } catch (err) {
      console.error('Error suspending user:', err);
      alert('Failed to suspend user: ' + err.message);
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_suspended: false, suspension_until: null })
        .eq('id', userId);

      if (error) throw error;
      
      // Refresh user list
      await fetchUsers();
    } catch (err) {
      console.error('Error unsuspending user:', err);
      alert('Failed to unsuspend user: ' + err.message);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()))
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
        <p className="text-gray-600">{loading ? 'Loading...' : stats.totalUsers} total users on the platform</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 text-sm font-medium">Error loading users</p>
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Users</p>
          <p className="text-2xl font-bold" style={{ color: '#5f6466' }}>
            {loading ? '...' : stats.totalUsers}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total RFQs</p>
          <p className="text-2xl font-bold text-blue-600">
            {loading ? '...' : stats.totalRFQs}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Avg RFQs/User</p>
          <p className="text-2xl font-bold" style={{ color: '#ea8f1e' }}>
            {loading ? '...' : stats.avgRFQsPerUser}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">New This Month</p>
          <p className="text-2xl font-bold text-green-600">
            {loading ? '...' : stats.newThisMonth}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
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

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader className="w-6 h-6 text-orange-500 animate-spin mr-3" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            {searchTerm ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
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
                    Status
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
                      <p className="text-sm text-gray-900">{user.rfqsSubmitted} RFQ{user.rfqsSubmitted !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-gray-500">Joined {user.lastActive}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'suspended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.status === 'suspended' ? '🔒 Suspended' : '✓ Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          className="p-2 hover:bg-gray-100 rounded transition" 
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          onClick={() => user.status === 'suspended' ? handleUnsuspendUser(user.id) : handleSuspendUser(user.id)}
                          className={`p-2 rounded transition ${
                            user.status === 'suspended'
                              ? 'hover:bg-green-50'
                              : 'hover:bg-red-50'
                          }`}
                          title={user.status === 'suspended' ? 'Unsuspend User' : 'Suspend User'}
                        >
                          <Ban className={`w-4 h-4 ${
                            user.status === 'suspended'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}