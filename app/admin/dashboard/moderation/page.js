'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, AlertTriangle, Eye, CheckCircle, XCircle, MessageSquare, ImageOff, Trash2, Clock } from 'lucide-react';

export default function ModerationDashboard() {
  const supabase = createClient();
  const [reports, setReports] = useState([]);
  const [violations, setViolations] = useState([]);
  const [suspensions, setSuspensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  // Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);

  // Selected items for moderation
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [selectedSuspension, setSelectedSuspension] = useState(null);

  // Form data
  const [reportAction, setReportAction] = useState('image_disabled');
  const [actionNotes, setActionNotes] = useState('');
  const [violationReason, setViolationReason] = useState('inappropriate');
  const [suspensionType, setSuspensionType] = useState('temporary');
  const [suspensionDays, setSuspensionDays] = useState(30);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [appealDecision, setAppealDecision] = useState('denied');
  const [appealNotes, setAppealNotes] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'violations' | 'suspensions' | 'appeals'
  const [filterStatus, setFilterStatus] = useState('pending');

  useEffect(() => {
    fetchCurrentUserRole();
  }, []);

  useEffect(() => {
    if (currentUserRole) {
      if (activeTab === 'reports') fetchReports();
      if (activeTab === 'violations') fetchViolations();
      if (activeTab === 'suspensions') fetchSuspensions();
    }
  }, [activeTab, filterStatus, currentUserRole]);

  const fetchCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (adminData?.role === 'super_admin' || adminData?.role === 'admin') {
        setCurrentUserRole(adminData.role);
      } else {
        setError('Only admins can access moderation panel');
      }
    } catch (err) {
      setError('Failed to verify admin role: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      let query = supabase
        .from('vendor_reports')
        .select(`
          id,
          title,
          description,
          report_type,
          status,
          severity,
          created_at,
          reporter_user_id,
          reported_vendor_id,
          admin_notes,
          action_taken,
          reviewed_by_admin_id,
          vendors:reported_vendor_id(id, business_name, logo_url)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setReports(data || []);
    } catch (err) {
      setError('Failed to fetch reports: ' + err.message);
    }
  };

  const fetchViolations = async () => {
    try {
      const { data, error: err } = await supabase
        .from('vendor_image_violations')
        .select(`
          id,
          vendor_id,
          image_url,
          violation_reason,
          action_status,
          created_at,
          admin_reason,
          vendors:vendor_id(id, business_name, logo_url)
        `)
        .order('created_at', { ascending: false })
        .eq('action_status', filterStatus !== 'all' ? filterStatus : undefined);

      if (err) throw err;
      setViolations(data || []);
    } catch (err) {
      setError('Failed to fetch violations: ' + err.message);
    }
  };

  const fetchSuspensions = async () => {
    try {
      const { data, error: err } = await supabase
        .from('vendor_suspensions')
        .select(`
          id,
          vendor_id,
          suspension_reason,
          suspension_type,
          suspension_end_date,
          suspended_at,
          appeal_submitted,
          unsuspended_at,
          vendors:vendor_id(id, business_name, logo_url, user_id)
        `)
        .order('suspended_at', { ascending: false });

      if (err) throw err;
      setSuspensions(data || []);
    } catch (err) {
      setError('Failed to fetch suspensions: ' + err.message);
    }
  };

  const handleReviewReport = async (e) => {
    e.preventDefault();
    if (!selectedReport || !currentUserRole) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Determine action_taken based on reportAction selection
      let actionTaken = 'none';
      if (reportAction === 'image_disabled') actionTaken = 'image_disabled';
      if (reportAction === 'image_deleted') actionTaken = 'images_deleted';
      if (reportAction === 'suspend') actionTaken = 'vendor_suspended';

      const { error: err } = await supabase
        .from('vendor_reports')
        .update({
          status: 'action_taken',
          reviewed_by_admin_id: adminData.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: actionNotes,
          action_taken: actionTaken
        })
        .eq('id', selectedReport.id);

      if (err) throw err;

      // If image action, create violation records
      if (reportAction !== 'suspend' && selectedReport.images_violated) {
        for (const imageId of selectedReport.images_violated) {
          await supabase
            .from('vendor_image_violations')
            .insert({
              vendor_id: selectedReport.reported_vendor_id,
              image_id: imageId,
              image_url: imageId,
              violation_reason: reportAction === 'image_disabled' ? 'disabled' : 'deleted',
              action_status: reportAction === 'image_disabled' ? 'disabled' : 'deleted',
              action_by_admin_id: adminData.id,
              admin_reason: actionNotes || 'Image violates platform terms and conditions'
            });
        }
      }

      // If suspension action
      if (reportAction === 'suspend') {
        await supabase
          .from('vendor_suspensions')
          .insert({
            vendor_id: selectedReport.reported_vendor_id,
            suspension_reason: actionNotes || 'Inappropriate images in profile',
            suspended_by_admin_id: adminData.id,
            suspension_type: 'temporary',
            suspension_duration_days: 30,
            suspension_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

        // Send email notification
        await sendSuspensionEmail(selectedReport.reported_vendor_id, actionNotes);
      }

      setMessage(`Report ${reportAction} action completed successfully`);
      setShowReportModal(false);
      setSelectedReport(null);
      setActionNotes('');
      setReportAction('image_disabled');
      fetchReports();
    } catch (err) {
      setError('Failed to process report: ' + err.message);
    }
  };

  const handleDisableImage = async (e) => {
    e.preventDefault();
    if (!selectedViolation || !currentUserRole) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { error: err } = await supabase
        .from('vendor_image_violations')
        .update({
          action_status: 'disabled',
          disabled_at: new Date().toISOString(),
          action_by_admin_id: adminData.id,
          admin_reason: actionNotes
        })
        .eq('id', selectedViolation.id);

      if (err) throw err;

      setMessage('Image disabled successfully');
      setShowViolationModal(false);
      setSelectedViolation(null);
      setActionNotes('');
      fetchViolations();
    } catch (err) {
      setError('Failed to disable image: ' + err.message);
    }
  };

  const handleDeleteImage = async (e) => {
    e.preventDefault();
    if (!selectedViolation || !currentUserRole) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { error: err } = await supabase
        .from('vendor_image_violations')
        .update({
          action_status: 'deleted',
          deleted_at: new Date().toISOString(),
          action_by_admin_id: adminData.id,
          admin_reason: actionNotes
        })
        .eq('id', selectedViolation.id);

      if (err) throw err;

      setMessage('Image deleted successfully');
      setShowViolationModal(false);
      setSelectedViolation(null);
      setActionNotes('');
      fetchViolations();
    } catch (err) {
      setError('Failed to delete image: ' + err.message);
    }
  };

  const handleSuspendVendor = async (e) => {
    e.preventDefault();
    if (!selectedVendor || !currentUserRole) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const suspensionEndDate = suspensionType === 'temporary'
        ? new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: err } = await supabase
        .from('vendor_suspensions')
        .insert({
          vendor_id: selectedVendor.id,
          suspension_reason: suspensionReason,
          suspended_by_admin_id: adminData.id,
          suspension_type: suspensionType,
          suspension_duration_days: suspensionType === 'temporary' ? suspensionDays : null,
          suspension_end_date: suspensionEndDate
        });

      if (err) throw err;

      // Send suspension email
      await sendSuspensionEmail(selectedVendor.id, suspensionReason);

      setMessage(`Vendor suspended successfully. Email notification sent.`);
      setShowSuspensionModal(false);
      setSelectedVendor(null);
      setSuspensionReason('');
      setSuspensionType('temporary');
      setSuspensionDays(30);
      fetchSuspensions();
    } catch (err) {
      setError('Failed to suspend vendor: ' + err.message);
    }
  };

  const handleUnsuspendVendor = async (suspensionId) => {
    if (!confirm('Are you sure you want to unsuspend this vendor?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { error: err } = await supabase
        .from('vendor_suspensions')
        .update({
          unsuspended_at: new Date().toISOString(),
          unsuspended_by_admin_id: adminData.id,
          unsuspension_reason: 'Unsuspended by admin'
        })
        .eq('id', suspensionId);

      if (err) throw err;

      setMessage('Vendor unsuspended successfully');
      fetchSuspensions();
    } catch (err) {
      setError('Failed to unsuspend vendor: ' + err.message);
    }
  };

  const sendSuspensionEmail = async (vendorId, reason) => {
    try {
      const response = await fetch('/api/admin/send-suspension-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, reason })
      });
      if (!response.ok) throw new Error('Failed to send email');
    } catch (err) {
      console.error('Email sending failed:', err);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'action_taken': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8 text-center">Loading moderation panel...</div>;
  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-lg">{error}</div>;
  if (!currentUserRole) return <div className="p-8 text-center">Not authorized to access this page</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Moderation Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage vendor reports, image violations, and suspensions</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{message}</div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            {[
              { id: 'reports', label: 'Vendor Reports', count: reports.length },
              { id: 'violations', label: 'Image Violations', count: violations.length },
              { id: 'suspensions', label: 'Suspensions', count: suspensions.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} <span className="ml-2 bg-gray-200 text-gray-700 rounded-full px-2 py-1 text-xs">{tab.count}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            {activeTab === 'reports' && (
              <>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="action_taken">Action Taken</option>
                <option value="dismissed">Dismissed</option>
              </>
            )}
            {activeTab === 'violations' && (
              <>
                <option value="pending">Pending</option>
                <option value="disabled">Disabled</option>
                <option value="deleted">Deleted</option>
              </>
            )}
          </select>
        </div>

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="grid gap-4">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-white rounded-lg">
                No reports found
              </div>
            ) : (
              reports.map(report => (
                <div key={report.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:border-purple-300 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex gap-3 items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                          {report.severity.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{report.description}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <div>Report Type: <span className="font-medium">{report.report_type}</span></div>
                        <div>Vendor: <span className="font-medium">{report.vendors?.business_name || 'Unknown'}</span></div>
                        <div>Date: <span className="font-medium">{new Date(report.created_at).toLocaleDateString()}</span></div>
                      </div>
                    </div>
                    {report.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowReportModal(true);
                        }}
                        className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        Review & Take Action
                      </button>
                    )}
                  </div>
                  {report.admin_notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded border-l-4 border-purple-600">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Admin Notes:</p>
                      <p className="text-sm text-gray-600">{report.admin_notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Violations Tab */}
        {activeTab === 'violations' && (
          <div className="grid gap-4">
            {violations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-white rounded-lg">
                No violations found
              </div>
            ) : (
              violations.map(violation => (
                <div key={violation.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:border-purple-300 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex gap-3 items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {violation.vendors?.business_name || 'Unknown Vendor'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(violation.action_status)}`}>
                          {violation.action_status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        Violation: <span className="font-medium">{violation.violation_reason}</span>
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <div>Date: <span className="font-medium">{new Date(violation.created_at).toLocaleDateString()}</span></div>
                        <div>Status: <span className="font-medium">{violation.action_status}</span></div>
                      </div>
                    </div>
                    {violation.action_status === 'pending' && (
                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedViolation(violation);
                            setReportAction('disable');
                            setShowViolationModal(true);
                          }}
                          className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" /> Disable
                        </button>
                        <button
                          onClick={() => {
                            setSelectedViolation(violation);
                            setReportAction('delete');
                            setShowViolationModal(true);
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Suspensions Tab */}
        {activeTab === 'suspensions' && (
          <div className="grid gap-4">
            {suspensions.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-white rounded-lg">
                No suspensions found
              </div>
            ) : (
              suspensions.map(suspension => (
                <div key={suspension.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:border-purple-300 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex gap-3 items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {suspension.vendors?.business_name || 'Unknown Vendor'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          suspension.unsuspended_at 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {suspension.unsuspended_at ? 'UNSUSPENDED' : 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{suspension.suspension_reason}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <div>Type: <span className="font-medium capitalize">{suspension.suspension_type}</span></div>
                        <div>Suspended: <span className="font-medium">{new Date(suspension.suspended_at).toLocaleDateString()}</span></div>
                        {suspension.suspension_end_date && (
                          <div>Ends: <span className="font-medium">{new Date(suspension.suspension_end_date).toLocaleDateString()}</span></div>
                        )}
                        {suspension.appeal_submitted && (
                          <div className="text-orange-600 flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" /> Appeal Pending
                          </div>
                        )}
                      </div>
                    </div>
                    {!suspension.unsuspended_at && (
                      <button
                        onClick={() => handleUnsuspendVendor(suspension.id)}
                        className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Unsuspend
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Report Review Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Review Report</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Report Details:</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedReport.title}</h3>
                  <p className="text-gray-700 text-sm mb-3">{selectedReport.description}</p>
                  <p className="text-xs text-gray-600">
                    Type: <span className="font-medium">{selectedReport.report_type}</span> | 
                    Severity: <span className="font-medium">{selectedReport.severity}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleReviewReport} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action to Take
                  </label>
                  <select
                    value={reportAction}
                    onChange={(e) => setReportAction(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="image_disabled">Disable Images</option>
                    <option value="image_deleted">Delete Images</option>
                    <option value="suspend">Suspend Vendor Account</option>
                    <option value="dismiss">Dismiss Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Explain the action taken and reason..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows="4"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReportModal(false);
                      setSelectedReport(null);
                      setActionNotes('');
                      setReportAction('image_disabled');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Take Action
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Violation Modal */}
      {showViolationModal && selectedViolation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {reportAction === 'disable' ? 'Disable Image' : 'Delete Image'}
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <img 
                  src={selectedViolation.image_url} 
                  alt="Violation"
                  className="w-full max-h-48 object-cover rounded-lg mb-4"
                />
                <p className="text-sm text-gray-600">
                  Reason: <span className="font-medium">{selectedViolation.violation_reason}</span>
                </p>
              </div>

              <form onSubmit={reportAction === 'disable' ? handleDisableImage : handleDeleteImage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for {reportAction === 'disable' ? 'Disabling' : 'Deletion'}
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Explain why this image is being disabled/deleted..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    rows="4"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowViolationModal(false);
                      setSelectedViolation(null);
                      setActionNotes('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 text-white rounded-lg ${
                      reportAction === 'disable'
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {reportAction === 'disable' ? 'Disable Image' : 'Delete Image'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
