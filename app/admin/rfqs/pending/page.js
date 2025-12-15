'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Eye, Check, X, Search, Filter, MapPin, Calendar, DollarSign, Clock, User, FileText, AlertTriangle, Shield } from 'lucide-react';

const pendingStatuses = ['pending', 'needs_verification', 'needs_review', 'needs_fix'];

export default function PendingRFQs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRFQs();
  }, []);

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      setMessage('');
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .in('status', pendingStatuses)
        .order('created_at', { ascending: false });
      if (error) {
        setMessage(`Error loading RFQs: ${error.message}`);
      } else {
        setRfqs(data || []);
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const notifyVendors = async (rfq) => {
    const category = rfq.category || rfq.auto_category;
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, user_id, county, category, rating, verified, status, rfqs_completed, response_time')
      .eq('status', 'active')
      .eq('category', category);

    const matching = (vendors || [])
      .filter((v) => {
        const countyOk = !rfq.county || (v.county || '').toLowerCase() === rfq.county.toLowerCase();
        const qualityOk = (v.rating || 0) >= 3.5 && (v.verified || false);
        return countyOk && qualityOk;
      })
      .sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        const responseDiff = (a.response_time || 9999) - (b.response_time || 9999);
        if (responseDiff !== 0) return responseDiff;
        return (b.rfqs_completed || 0) - (a.rfqs_completed || 0);
      })
      .slice(0, 8);

    if (matching.length === 0) return;

    await supabase.from('rfq_requests').insert(
      matching.map((v) => ({
        rfq_id: rfq.id,
        vendor_id: v.user_id || v.id,
        status: 'pending',
      }))
    );

    try {
      await supabase.from('notifications').insert(
        matching.map((v) => ({
          user_id: v.user_id || v.id,
          type: 'rfq_match',
          title: `New RFQ: ${rfq.title}`,
          body: `${category} • ${rfq.county || rfq.location || 'Location provided'}`,
          metadata: { rfq_id: rfq.id, budget: rfq.budget_range },
        }))
      );
    } catch (e) {
      console.warn('Notifications insert skipped', e.message);
    }
  };

  const handleApprove = async (rfq) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'open', published_at: new Date().toISOString(), validation_status: 'validated' })
        .eq('id', rfq.id);
      if (error) throw error;
      await notifyVendors(rfq);
      setMessage('RFQ approved and vendors notified.');
      fetchRFQs();
      setShowDetailModal(false);
    } catch (err) {
      setMessage(`Error approving RFQ: ${err.message}`);
    }
  };

  const handleReject = async (rfq) => {
    if (!rejectReason.trim()) {
      setMessage('Please provide a reason for rejection');
      return;
    }
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'rejected', rejection_reason: rejectReason, validation_status: 'rejected' })
        .eq('id', rfq.id);
      if (error) throw error;
      setMessage('RFQ rejected.');
      fetchRFQs();
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectReason('');
    } catch (err) {
      setMessage(`Error rejecting RFQ: ${err.message}`);
    }
  };

  const openDetailModal = (rfq) => {
    setSelectedRFQ(rfq);
    setShowDetailModal(true);
  };

  const openRejectModal = (rfq) => {
    setSelectedRFQ(rfq);
    setShowRejectModal(true);
  };

  const filteredRFQs = useMemo(() => {
    return rfqs.filter((rfq) =>
      (rfq.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rfq.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rfqs, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#535554' }}>Pending RFQs</h1>
          <p className="text-gray-600">{filteredRFQs.length} RFQs awaiting review</p>
        </div>
        <Link href="/admin/dashboard" className="text-sm text-orange-700 hover:text-orange-800">← Dashboard</Link>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded border text-sm" style={{ borderColor: '#f97316', color: '#c2410c', background: '#fff7ed' }}>
          {message}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Review First-Time RFQs:</strong> Auto-validated RFQs are listed here if they need human eyes (new users, risky budgets, or spam risk). Approve to publish and auto-notify vendors.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 mb-6">
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

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading RFQs...</div>
          ) : filteredRFQs.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No RFQs awaiting approval.</div>
          ) : filteredRFQs.map((rfq) => (
            <div key={rfq.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#535554' }}>
                    {rfq.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{rfq.category || rfq.auto_category}</p>
                  <div className="flex flex-wrap gap-2">
                    {rfq.urgency === 'asap' && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        URGENT
                      </span>
                    )}
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {rfq.location || rfq.county}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {rfq.created_at ? new Date(rfq.created_at).toLocaleString() : 'N/A'}
                    </span>
                    {rfq.spam_score > 30 && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Spam risk {rfq.spam_score}
                      </span>
                    )}
                    {rfq.validation_status === 'validated' && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Auto-validated
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 line-clamp-2">{rfq.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div className="flex items-start">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Submitted By</p>
                    <p className="font-medium text-gray-900">{rfq.buyer_name || rfq.buyer_id || 'User'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <DollarSign className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Budget</p>
                    <p className="font-medium text-gray-900">{rfq.budget_range}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Timeline</p>
                    <p className="font-medium text-gray-900">{rfq.timeline}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Type</p>
                    <p className="font-medium text-gray-900">{rfq.project_type || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(rfq)}
                  className="flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium transition-colors"
                  style={{ backgroundColor: '#10b981' }}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Approve & Send
                </button>
                <button
                  onClick={() => openRejectModal(rfq)}
                  className="flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium transition-colors"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  <X className="w-5 h-5 mr-2" />
                  Reject
                </button>
                <button 
                  onClick={() => openDetailModal(rfq)}
                  className="flex items-center px-4 py-2 border-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  style={{ borderColor: '#ca8637', color: '#ca8637' }}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  View Full Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Detail Modal */}
      {showDetailModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#535554' }}>
                    {selectedRFQ.title}
                  </h2>
                  <p className="text-gray-600">{selectedRFQ.category || selectedRFQ.auto_category}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Submitter Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3" style={{ color: '#535554' }}>Submitted By</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Buyer</p>
                    <p className="font-medium text-gray-900">{selectedRFQ.buyer_name || selectedRFQ.buyer_id || 'User'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{selectedRFQ.user_email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{selectedRFQ.user_phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3" style={{ color: '#535554' }}>Project Details</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="text-gray-500">Budget Range</p>
                      <p className="font-medium text-gray-900">{selectedRFQ.budget_range}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="text-gray-500">Timeline</p>
                      <p className="font-medium text-gray-900">{selectedRFQ.timeline}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{selectedRFQ.location || selectedRFQ.county}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="text-gray-500">Project Type</p>
                      <p className="font-medium text-gray-900">{selectedRFQ.project_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-500 text-sm mb-2">Description</p>
                  <p className="text-gray-900">{selectedRFQ.description}</p>
                </div>
              </div>

              {/* Services Required */}
              {(selectedRFQ.servicesRequired || selectedRFQ.services_required || []).length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3" style={{ color: '#535554' }}>Services Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRFQ.servicesRequired || selectedRFQ.services_required || []).map((service, index) => (
                      <span key={index} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#ca863720', color: '#ca8637' }}>
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Site Information */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3" style={{ color: '#535554' }}>Site Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Site Accessibility</p>
                    <p className="font-medium text-gray-900">{selectedRFQ.siteAccessibility}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Delivery Preference</p>
                    <p className="font-medium text-gray-900">{selectedRFQ.deliveryPreference}</p>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              {selectedRFQ.additionalNotes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Additional Notes</p>
                  <p className="text-sm text-blue-800">{selectedRFQ.additionalNotes}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => handleApprove(selectedRFQ)}
                className="flex-1 flex items-center justify-center px-4 py-3 text-white rounded-lg hover:opacity-90 font-medium"
                style={{ backgroundColor: '#10b981' }}
              >
                <Check className="w-5 h-5 mr-2" />
                Approve & Send to Vendors
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openRejectModal(selectedRFQ);
                }}
                className="flex-1 flex items-center justify-center px-4 py-3 text-white rounded-lg hover:opacity-90 font-medium"
                style={{ backgroundColor: '#ef4444' }}
              >
                <X className="w-5 h-5 mr-2" />
                Reject RFQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#535554' }}>
              Reject RFQ
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject <strong>{selectedRFQ.title}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason for Rejection*</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="4"
                placeholder="Provide a clear reason that will be sent to the user..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedRFQ)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Reject RFQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
