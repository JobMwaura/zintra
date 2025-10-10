'use client';

import { useState } from 'react';
import { Search, Filter, Eye, RotateCcw } from 'lucide-react';

export default function RejectedVendors() {
  const [searchTerm, setSearchTerm] = useState('');

  // TODO: Replace with real data from API
  const rejectedVendors = [
    {
      id: 1,
      businessName: 'ABC Trading Co',
      category: 'Building & Structural Materials',
      county: 'Nairobi',
      contactPerson: 'James Mwangi',
      email: 'james@abctrading.com',
      rejectedDate: '2024-10-01',
      rejectedBy: 'Admin User',
      reason: 'Incomplete business registration documents. Missing certificate of incorporation.',
      subscriptionPlan: 'Basic'
    },
    {
      id: 2,
      businessName: 'QuickFix Plumbers',
      category: 'Plumbing & Sanitation',
      county: 'Kisumu',
      contactPerson: 'Sarah Otieno',
      email: 'info@quickfix.com',
      rejectedDate: '2024-09-28',
      rejectedBy: 'Admin User',
      reason: 'Portfolio images are of poor quality and do not demonstrate professional work.',
      subscriptionPlan: 'Standard'
    },
    {
      id: 3,
      businessName: 'Budget Electricals',
      category: 'Electrical & Lighting',
      county: 'Mombasa',
      contactPerson: 'David Kimani',
      email: 'david@budgetelectricals.com',
      rejectedDate: '2024-09-25',
      rejectedBy: 'Admin User',
      reason: 'Business registration number could not be verified. Suspected fraudulent application.',
      subscriptionPlan: 'Premium'
    }
  ];

  const filteredVendors = rejectedVendors.filter(vendor =>
    vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReactivate = (vendorId) => {
    // TODO: Call API to reactivate vendor for review
    if (confirm('Are you sure you want to allow this vendor to reapply?')) {
      console.log('Reactivating vendor:', vendorId);
      alert('Vendor has been notified and can now resubmit their application.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#5f6466' }}>Rejected Vendors</h1>
        <p className="text-gray-600">{rejectedVendors.length} rejected vendor applications</p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search rejected vendors..."
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
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1" style={{ color: '#5f6466' }}>
                    {vendor.businessName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{vendor.category}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      Rejected
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                      {vendor.county}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {vendor.subscriptionPlan}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Contact Person</p>
                  <p className="font-medium text-gray-900">{vendor.contactPerson}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{vendor.email}</p>
                </div>
                <div>
                  <p className="text-gray-600">Rejected Date</p>
                  <p className="font-medium text-gray-900">{vendor.rejectedDate}</p>
                </div>
                <div>
                  <p className="text-gray-600">Rejected By</p>
                  <p className="font-medium text-gray-900">{vendor.rejectedBy}</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-800">{vendor.reason}</p>
              </div>

              <div className="flex gap-3">
                <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                  <Eye className="w-5 h-5 mr-2" />
                  View Full Application
                </button>
                <button
                  onClick={() => handleReactivate(vendor.id)}
                  className="flex items-center px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Allow Reapplication
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}