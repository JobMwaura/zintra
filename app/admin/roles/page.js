'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Shield, KeyRound, ArrowLeft, CheckCircle, AlertCircle, Loader, Users } from 'lucide-react';
import Link from 'next/link';

export default function RolesAdmin() {
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const roles = [
    {
      name: 'super_admin',
      label: 'Super Admin',
      description: 'Full system access - can manage all admins and settings',
      permissions: ['All Permissions', 'Manage Admins', 'System Settings', 'Security Controls'],
      color: 'purple'
    },
    {
      name: 'admin',
      label: 'Admin',
      description: 'Standard admin access - can manage vendors, RFQs, and content',
      permissions: ['Manage Vendors', 'Manage RFQs', 'Manage Content', 'View Reports'],
      color: 'blue'
    },
    {
      name: 'moderator',
      label: 'Moderator',
      description: 'Limited access - can review and moderate content only',
      permissions: ['Review Content', 'Moderate Reviews', 'View Vendors', 'Basic Reports'],
      color: 'green'
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminUsers(adminData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('Error loading admin users', 'error');
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

  const handleChangeRole = async (adminId, currentRole, newRole) => {
    if (currentRole === newRole) return;
    
    if (!confirm(`Are you sure you want to change this admin's role to ${newRole}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ role: newRole })
        .eq('id', adminId);

      if (error) throw error;
      showMessage('Admin role updated successfully!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      showMessage(error.message || 'Failed to update role', 'error');
    }
  };

  const stats = {
    superAdmins: adminUsers.filter(a => a.role === 'super_admin').length,
    admins: adminUsers.filter(a => a.role === 'admin').length,
    moderators: adminUsers.filter(a => a.role === 'moderator').length,
    total: adminUsers.length,
  };

  const getRoleColor = (role) => {
    const roleData = roles.find(r => r.name === role);
    return roleData?.color || 'gray';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Link href="/admin/dashboard" className="hover:text-gray-900">Admin</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Roles & Permissions</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-sm text-gray-600 mt-1">Manage admin roles and access levels</p>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Super Admins</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.superAdmins}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <KeyRound className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Admins</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.admins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Moderators</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.moderators}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Admins</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Definitions */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Role Definitions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.name} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-3 bg-${role.color}-100 text-${role.color}-800`}>
                  <Shield className="w-4 h-4" />
                  {role.label}
                </div>
                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Permissions</p>
                  <ul className="space-y-1">
                    {role.permissions.map((perm, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Users Table */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Users ({adminUsers.length})</h2>
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Loader className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading admin users...</p>
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No admin users yet</h3>
              <p className="text-gray-600">Admin users will appear here</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Current Role
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Change Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminUsers.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{admin.full_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          admin.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-800'
                            : admin.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {admin.role?.replace('_', ' ').toUpperCase() || 'ADMIN'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          admin.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {admin.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={admin.role || 'admin'}
                            onChange={(e) => handleChangeRole(admin.id, admin.role, e.target.value)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderator</option>
                          </select>
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
    </div>
  );
}
