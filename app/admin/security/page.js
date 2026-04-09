'use client';

import { useEffect, useState } from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle, AlertCircle, ArrowLeft, Loader, Eye, Ban, Key } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [securityData, setSecurityData] = useState({
    failedLogins: [],
    activeSessions: [],
    suspiciousActivity: [],
  });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      // Placeholder: In production, fetch from security_audit_logs table
      // For now, use mock data
      setSecurityData({
        failedLogins: [],
        activeSessions: [],
        suspiciousActivity: [],
      });
    } catch (error) {
      console.error('Error fetching security data:', error);
      showMessage('Error loading security data', 'error');
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

  const stats = [
    { label: 'Failed Logins (24h)', value: '0', icon: AlertTriangle, color: 'red' },
    { label: 'Active Sessions', value: '0', icon: Eye, color: 'green' },
    { label: 'Blocked IPs', value: '0', icon: Ban, color: 'orange' },
    { label: 'Security Score', value: '100%', icon: Shield, color: 'blue' },
  ];

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
              <span className="text-gray-900 font-medium">Security Settings</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor and manage platform security</p>
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
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`bg-${stat.color}-100 p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Loader className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading security data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Security Features Coming Soon */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
              <div className="text-center py-12">
                <Shield className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Advanced Security Features</h2>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Complete security monitoring and management system coming soon. This will include:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-600">Enable 2FA for all admin users</p>
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Failed Login Monitoring</h3>
                        <p className="text-sm text-gray-600">Track and block suspicious login attempts</p>
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Ban className="w-5 h-5 text-red-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">IP Whitelist/Blacklist</h3>
                        <p className="text-sm text-gray-600">Control access by IP address</p>
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Eye className="w-5 h-5 text-green-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Session Management</h3>
                        <p className="text-sm text-gray-600">View and terminate active sessions</p>
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-purple-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Security Audit Logs</h3>
                        <p className="text-sm text-gray-600">Comprehensive activity logging</p>
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Key className="w-5 h-5 text-indigo-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">API Key Management</h3>
                        <p className="text-sm text-gray-600">Secure API access control</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Security Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Current Security Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Database RLS Policies</p>
                      <p className="text-sm text-gray-600">Row-level security is enabled</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Supabase Authentication</p>
                      <p className="text-sm text-gray-600">Secure auth system in place</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">SSL/TLS Encryption</p>
                      <p className="text-sm text-gray-600">All connections are encrypted</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">AWS S3 Security</p>
                      <p className="text-sm text-gray-600">Secure file storage configured</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Recommended Security Enhancements
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Enable two-factor authentication for all admin users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Set up automated security audit log reviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Configure IP whitelisting for admin access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Implement session timeout policies</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
