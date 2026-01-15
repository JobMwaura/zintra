'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, Settings as SettingsIcon, Mail, Bell, Shield, Database } from 'lucide-react';
import Link from 'next/link';

export default function SettingsAdmin() {
  const [settings, setSettings] = useState({
    siteName: 'Zintra Platform',
    maintenanceMode: false,
    allowNewVendors: true,
    requireEmailVerification: true,
    enableNotifications: true,
    maxUploadSize: 10,
    sessionTimeout: 30,
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      // In production, save to database
      // await supabase.from('settings').upsert(settings);
      showMessage('Settings saved successfully!', 'success');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('Failed to save settings', 'error');
    }
  };

  const stats = [
    { label: 'Maintenance Mode', value: settings.maintenanceMode ? 'ON' : 'OFF', icon: Shield, color: settings.maintenanceMode ? 'red' : 'green' },
    { label: 'New Vendors', value: settings.allowNewVendors ? 'Enabled' : 'Disabled', icon: Database, color: settings.allowNewVendors ? 'green' : 'gray' },
    { label: 'Notifications', value: settings.enableNotifications ? 'Active' : 'Inactive', icon: Bell, color: settings.enableNotifications ? 'blue' : 'gray' },
    { label: 'Email Verification', value: settings.requireEmailVerification ? 'Required' : 'Optional', icon: Mail, color: settings.requireEmailVerification ? 'orange' : 'gray' },
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
              <span className="text-gray-900 font-medium">General Settings</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Configure platform settings and preferences</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
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
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Platform Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Platform Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleInputChange('siteName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Maintenance Mode</p>
                  <p className="text-sm text-gray-600">Temporarily disable site for maintenance</p>
                </div>
                <button
                  onClick={() => handleToggle('maintenanceMode')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Allow New Vendor Registration</p>
                  <p className="text-sm text-gray-600">Enable or disable new vendor signups</p>
                </div>
                <button
                  onClick={() => handleToggle('allowNewVendors')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.allowNewVendors ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.allowNewVendors ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Email & Notifications */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email & Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Require Email Verification</p>
                  <p className="text-sm text-gray-600">Users must verify email before accessing platform</p>
                </div>
                <button
                  onClick={() => handleToggle('requireEmailVerification')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.requireEmailVerification ? 'bg-orange-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.requireEmailVerification ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Enable Notifications</p>
                  <p className="text-sm text-gray-600">Send email notifications for important events</p>
                </div>
                <button
                  onClick={() => handleToggle('enableNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    settings.enableNotifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* System Configuration */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              System Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Upload Size (MB)
                </label>
                <input
                  type="number"
                  value={settings.maxUploadSize}
                  onChange={(e) => handleInputChange('maxUploadSize', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="1"
                  max="100"
                />
                <p className="text-sm text-gray-600 mt-1">Maximum file size for uploads</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="5"
                  max="120"
                />
                <p className="text-sm text-gray-600 mt-1">User session duration before auto-logout</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {hasChanges && (
            <div className="flex items-center justify-end gap-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-600">You have unsaved changes</p>
              <button
                onClick={handleSaveSettings}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition font-medium"
              >
                Save Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
