'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Edit2, Trash2, Shield, Ban, CheckCircle, AlertCircle, X, Loader, Mail, Lock } from 'lucide-react';

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    role: 'admin',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    fetchCurrentUserRole();
    fetchAdmins();
  }, []);

  const fetchCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setCurrentUserRole(adminData?.role);
    } catch (err) {
      console.error('Error fetching current user role:', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all admins with user information
      const { data: adminsData, error: adminsError } = await supabase
        .from('admin_users')
        .select(`
          id,
          user_id,
          role,
          status,
          created_at,
          updated_at,
          notes
        `)
        .order('created_at', { ascending: false });

      if (adminsError) throw adminsError;

      // Fetch user details for each admin
      const enrichedAdmins = await Promise.all(
        (adminsData || []).map(async (admin) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(admin.user_id);
          return {
            ...admin,
            email: user?.email || 'Unknown',
            lastSignIn: user?.last_sign_in_at
          };
        })
      );

      setAdmins(enrichedAdmins);
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (adminId) => {
    try {
      const { data: logs, error: logsError } = await supabase
        .from('admin_action_logs')
        .select('*')
        .eq('target_admin_id', adminId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      setAuditLogs(logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.role) {
      setError('Email and role are required');
      return;
    }

    try {
      setLoading(true);
      setMessage('Adding admin...');

      // First, get the user by email
      const { data: { user: existingUser } } = await supabase.auth.admin.getUserByEmail(formData.email);

      let userId;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new auth user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: Math.random().toString(36).slice(-12), // Temporary password
          email_confirm: true
        });

        if (createError) throw createError;
        userId = newUser.user?.id;
      }

      // Add to admin_users table
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          user_id: userId,
          role: formData.role,
          status: formData.status,
          notes: formData.notes,
          is_admin: true
        });

      if (adminError) throw adminError;

      setMessage('Admin added successfully!');
      setFormData({ email: '', role: 'admin', status: 'active', notes: '' });
      setShowAddModal(false);
      await fetchAdmins();
    } catch (err) {
      console.error('Error adding admin:', err);
      setError(err.message || 'Failed to add admin');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();

    if (!selectedAdmin) return;

    try {
      setLoading(true);
      setMessage('Updating admin...');

      const { error } = await supabase
        .from('admin_users')
        .update({
          role: formData.role,
          status: formData.status,
          notes: formData.notes
        })
        .eq('id', selectedAdmin.id);

      if (error) throw error;

      setMessage('Admin updated successfully!');
      setShowEditModal(false);
      await fetchAdmins();
    } catch (err) {
      console.error('Error updating admin:', err);
      setError(err.message || 'Failed to update admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to remove this admin? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      setMessage('Admin removed successfully!');
      await fetchAdmins();
    } catch (err) {
      console.error('Error deleting admin:', err);
      setError(err.message || 'Failed to delete admin');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      email: admin.email,
      role: admin.role,
      status: admin.status,
      notes: admin.notes || ''
    });
    setShowEditModal(true);
  };

  const handleViewLogs = async (admin) => {
    setSelectedAdmin(admin);
    await fetchAuditLogs(admin.id);
    setShowLogsModal(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'moderator': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isSuperAdmin = currentUserRole === 'super_admin';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#5f6466' }}>Admin Management</h1>
          <p className="text-gray-600">Manage administrators and their roles</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => {
              setFormData({ email: '', role: 'admin', status: 'active', notes: '' });
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Admin
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {message && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 text-sm">{message}</p>
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader className="w-6 h-6 text-orange-500 animate-spin mr-3" />
            <p className="text-gray-600">Loading admins...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No admins found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{admin.email}</p>
                      <p className="text-xs text-gray-500">{admin.notes || 'No notes'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(admin.role)}`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {admin.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(admin.status)}`}>
                        {admin.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {admin.status === 'suspended' && <Ban className="w-3 h-3 mr-1" />}
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{new Date(admin.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">Updated {new Date(admin.updated_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewLogs(admin)}
                          className="p-2 hover:bg-blue-50 rounded transition"
                          title="View Logs"
                        >
                          <Mail className="w-4 h-4 text-blue-600" />
                        </button>
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => handleEditClick(admin)}
                              className="p-2 hover:bg-gray-100 rounded transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="p-2 hover:bg-red-50 rounded transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add New Admin</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="admin">Admin (Vendor & RFQ Management)</option>
                  <option value="moderator">Moderator (Content Review)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Optional notes about this admin..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Admin</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showLogsModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Admin Activity Logs - {selectedAdmin.email}</h2>
              <button onClick={() => setShowLogsModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No activity logs</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{log.action_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    {log.reason && <p className="text-sm text-gray-600">Reason: {log.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
