'use client';

import { useEffect, useState } from 'react';
import { Eye, Check, X, Search, Filter, MapPin, Calendar, Building2, User, Mail, Phone, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function PendingVendors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPendingVendors();
  }, []);

  const fetchPendingVendors = async () => {
    try {
      setLoading(true);
      setMessage('');
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) {
        setMessage(`Error: ${error.message}`);
        setLoading(false);
        return;
      }
      setPendingVendors(data || []);
      setLoading(false);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  const updateVendorStatus = async (vendorId, status) => {
    const payload = { status };
    if (status === 'rejected' && rejectReason.trim()) {
      payload.rejection_reason = rejectReason.trim();
    }
    const { error } = await supabase.from('vendors').update(payload).eq('id', vendorId);
    if (error) {
      setMessage(`Error updating vendor: ${error.message}`);
      return false;
    }
    fetchPendingVendors();
    return true;
  };

  const handleApprove = async (vendorId) => {
    await updateVendorStatus(vendorId, 'active');
    setShowDetailModal(false);
  };

  const handleReject = async (vendorId) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    await updateVendorStatus(vendorId, 'rejected');
    setShowRejectModal(false);
    setShowDetailModal(false);
    setRejectReason('');
  };

  const openDetailModal = (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailModal(true);
  };

  const openRejectModal = (vendor) => {
    setSelectedVendor(vendor);
    setShowRejectModal(true);
  };

  const filteredVendors = pendingVendors.filter(vendor =>
    (vendor.company_name || vendor.businessName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanColor = (plan) => {
    switch(plan) {
      case 'Premium': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Standard': return 'bg-green-50 text-green-700 border-green-200';
      case 'Basic': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#535554' }}>Pending Vendors</h1>
        <p className="text-gray-600">{pendingVendors.length} vendors awaiting approval</p>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded border text-sm" style={{ borderColor: '#f97316', color: '#c2410c', background: '#fff7ed' }}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow mb-6">
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

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading pending vendors...</div>
          ) : filteredVendors.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No pending vendors found.</div>
          ) : (
          filteredVendors.map((vendor) => (
            <div key={vendor.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold" style={{ color: '#535554' }}>
                      {vendor.company_name || vendor.businessName}
                    </h3>
                    <span className={`px-3 py-1 border rounded-full text-xs font-medium ${getPlanColor(vendor.subscriptionPlan || vendor.plan || 'Standard')}`}>
                      {vendor.subscriptionPlan || vendor.plan || 'Standard'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{vendor.category}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {vendor.location}{vendor.county ? `, ${vendor.county}` : ''}
                    </span>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs flex items-center border border-purple-200">
                      <Calendar className="w-3 h-3 mr-1" />
                      Submitted {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">{vendor.bio || vendor.description}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div className="flex items-start">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Contact Person</p>
                    <p className="font-medium text-gray-900">{vendor.contactPerson || vendor.contact_person}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Email</p>
                    <p className="font-medium text-gray-900 truncate">{vendor.email}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Phone</p>
                    <p className="font-medium text-gray-900">{vendor.phone}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Registration</p>
                    <p className="font-medium text-gray-900">{vendor.businessRegistration || vendor.registration || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>Portfolio: {vendor.portfolioImages || vendor.portfolio_images || 0} images</span>
                <span className="text-gray-400">•</span>
                <span>Documents: {vendor.documents || 0} files</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(vendor.id)}
                  className="flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium transition-colors"
                  style={{ backgroundColor: '#10b981' }}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => openRejectModal(vendor)}
                  className="flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium transition-colors"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  <X className="w-5 h-5 mr-2" />
                  Reject
                </button>
                <button 
                  onClick={() => openDetailModal(vendor)}
                  className="flex items-center px-4 py-2 border-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  style={{ borderColor: '#ca8637', color: '#ca8637' }}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  View Full Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: '#535554' }}>
                    {selectedVendor.businessName}
                  </h2>
                  <p className="text-gray-600">{selectedVendor.category}</p>
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
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3" style={{ color: '#535554' }}>Business Information</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Registration Number</p>
                    <p className="font-medium text-gray-900">{selectedVendor.businessRegistration}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Years in Business</p>
                    <p className="font-medium text-gray-900">{selectedVendor.yearsInBusiness} years</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Subscription Plan</p>
                    <span className={`inline-block px-3 py-1 border rounded-full text-xs font-medium ${getPlanColor(selectedVendor.subscriptionPlan)}`}>
                      {selectedVendor.subscriptionPlan}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3" style={{ color: '#535554' }}>Contact Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-2" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="text-gray-500">Contact Person</p>
                      <p className="font-medium text-gray-900">{selectedVendor.contactPerson}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-2" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{selectedVendor.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-2" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{selectedVendor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{selectedVendor.location}, {selectedVendor.county}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3" style={{ color: '#535554' }}>About Business</h3>
                <p className="text-gray-700">{selectedVendor.bio}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3" style={{ color: '#535554' }}>Services Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVendor.services.map((service, index) => (
                    <span key={index} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#ca863720', color: '#ca8637' }}>
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Portfolio & Documents</p>
                <p className="text-sm text-blue-800">{selectedVendor.portfolioImages} portfolio images and {selectedVendor.documents} business documents submitted</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => handleApprove(selectedVendor.id)}
                className="flex-1 flex items-center justify-center px-4 py-3 text-white rounded-lg hover:opacity-90 font-medium"
                style={{ backgroundColor: '#10b981' }}
              >
                <Check className="w-5 h-5 mr-2" />
                Approve Vendor
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openRejectModal(selectedVendor);
                }}
                className="flex-1 flex items-center justify-center px-4 py-3 text-white rounded-lg hover:opacity-90 font-medium"
                style={{ backgroundColor: '#ef4444' }}
              >
                <X className="w-5 h-5 mr-2" />
                Reject Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#535554' }}>
              Reject Vendor
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject <strong>{selectedVendor.businessName}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason for Rejection*</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows="4"
                placeholder="Provide a clear reason that will be sent to the vendor..."
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
                onClick={() => handleReject(selectedVendor.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Reject Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
