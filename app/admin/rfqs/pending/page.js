'use client';

import { useState } from 'react';
import { Eye, Check, X, Search, Filter, MapPin, Calendar, DollarSign, Clock, User, FileText } from 'lucide-react';

export default function PendingRFQs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const pendingRFQs = [
    {
      id: 1,
      projectTitle: 'Kitchen Renovation',
      category: 'Kitchen & Interior Fittings',
      userName: 'Mary Wanjiku',
      userEmail: 'mary@email.com',
      userPhone: '+254 700 123 456',
      description: 'Complete kitchen renovation including cabinets, countertops, and plumbing fixtures. Need modern design with quality materials. Looking for durable countertops (preferably granite or quartz), custom cabinets with soft-close hinges, and modern fixtures. Kitchen is approximately 12 sqm.',
      budgetRange: 'KSh 500,000 - 1,000,000',
      timeline: 'Medium-term (1-3 months)',
      location: 'Westlands, Nairobi',
      county: 'Nairobi',
      submittedDate: '2024-10-06',
      submittedTime: '09:30 AM',
      urgency: 'flexible',
      projectType: 'Residential',
      servicesRequired: ['Material Supply Only', 'Installation/Labor', 'Design Services'],
      siteAccessibility: 'Easy vehicle access',
      deliveryPreference: 'Vendor must arrange delivery',
      additionalNotes: 'Would prefer vendors with portfolio of previous kitchen projects. Timeline is flexible but hoping to start within 4-6 weeks.'
    },
    {
      id: 2,
      projectTitle: 'Office Partitioning',
      category: 'Building & Structural Materials',
      userName: 'John Kamau',
      userEmail: 'john@company.com',
      userPhone: '+254 722 456 789',
      description: 'Need office partitioning for 200 sqm office space. Glass and gypsum partitions required. Creating 8 private offices and 2 meeting rooms. Soundproofing is important.',
      budgetRange: 'KSh 100,000 - 500,000',
      timeline: 'Short-term (1-4 weeks)',
      location: 'CBD, Nairobi',
      county: 'Nairobi',
      submittedDate: '2024-10-06',
      submittedTime: '11:15 AM',
      urgency: 'asap',
      projectType: 'Commercial',
      servicesRequired: ['Material Supply Only', 'Installation/Labor'],
      siteAccessibility: 'Limited access',
      deliveryPreference: 'Flexible - will discuss',
      additionalNotes: 'Project needs to be completed before end of month. Building is on 5th floor.'
    }
  ];

  const handleApprove = (rfqId) => {
    console.log('Approving RFQ:', rfqId);
    alert('RFQ approved and sent to vendors!');
    setShowDetailModal(false);
  };

  const handleReject = (rfqId) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    console.log('Rejecting RFQ:', rfqId, 'Reason:', rejectReason);
    alert('RFQ rejected');
    setShowRejectModal(false);
    setShowDetailModal(false);
    setRejectReason('');
  };

  const openDetailModal = (rfq) => {
    setSelectedRFQ(rfq);
    setShowDetailModal(true);
  };

  const openRejectModal = (rfq) => {
    setSelectedRFQ(rfq);
    setShowRejectModal(true);
  };

  const filteredRFQs = pendingRFQs.filter(rfq =>
    rfq.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rfq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#535554' }}>Pending RFQs</h1>
        <p className="text-gray-600">{pendingRFQs.length} first-time user RFQs awaiting review</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Review First-Time RFQs:</strong> These are RFQs from new users submitting for the first time. Review to ensure they are genuine requests before sending to vendors.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
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
          {filteredRFQs.map((rfq) => (
            <div key={rfq.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#535554' }}>
                    {rfq.projectTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{rfq.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {rfq.urgency === 'asap' && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        URGENT
                      </span>
                    )}
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {rfq.location}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {rfq.submittedDate} at {rfq.submittedTime}
                    </span>
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
                    <p className="font-medium text-gray-900">{rfq.userName}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <DollarSign className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Budget</p>
                    <p className="font-medium text-gray-900">{rfq.budgetRange}</p>
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
                    <p className="font-medium text-gray-900">{rfq.projectType}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(rfq.id)}
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
                    {selectedRFQ.projectTitle}
                  </h2>
                  <p className="text-gray-600">{selectedRFQ.category}</p>
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
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">{selectedRFQ.userName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{selectedRFQ.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{selectedRFQ.userPhone}</p>
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
                      <p className="font-medium text-gray-900">{selectedRFQ.budgetRange}</p>
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
                      <p className="font-medium text-gray-900">{selectedRFQ.location}, {selectedRFQ.county}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" style={{ color: '#ca8637' }} />
                    <div>
                      <p className="text-gray-500">Project Type</p>
                      <p className="font-medium text-gray-900">{selectedRFQ.projectType}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-500 text-sm mb-2">Description</p>
                  <p className="text-gray-900">{selectedRFQ.description}</p>
                </div>
              </div>

              {/* Services Required */}
              {selectedRFQ.servicesRequired.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3" style={{ color: '#535554' }}>Services Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRFQ.servicesRequired.map((service, index) => (
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
                onClick={() => handleApprove(selectedRFQ.id)}
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
              Are you sure you want to reject <strong>{selectedRFQ.projectTitle}</strong>?
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
                onClick={() => handleReject(selectedRFQ.id)}
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