'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Clock, FileText, CheckCircle, MessageSquare } from 'lucide-react';
import VendorRFQResponseForm from '@/components/VendorRFQResponseForm';

export default function VendorRFQDetailPage() {
  const { id } = useParams();
  const [rfq, setRfq] = useState(null);

  useEffect(() => {
    // Mock data (you’ll connect Supabase later)
    const mockRFQs = [
      {
        id: '1',
        title: 'Office Renovation',
        description: 'Full office interior redesign and wiring upgrade.',
        budget: 'KSh 800K - 1.2M',
        location: 'Nairobi',
        date: '2025-10-12',
        buyerVerified: true,
        status: 'Pending',
      },
      {
        id: '2',
        title: 'Roof Repairs',
        description: 'Roof replacement and waterproofing for a residential unit.',
        budget: 'KSh 400K - 600K',
        location: 'Kisumu',
        date: '2025-10-10',
        buyerVerified: false,
        status: 'Responded',
      },
    ];

    const selected = mockRFQs.find((item) => item.id === id);
    setRfq(selected);
  }, [id]);

  if (!rfq) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-gray-500">
        <FileText size={40} className="mx-auto mb-3 text-gray-400" />
        <p>RFQ not found or still loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">
        🧾 {rfq.title}
      </h1>
      <div className="text-sm text-gray-500 mb-6">
        RFQ ID: {id} • Status: {rfq.status}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Project Overview
        </h2>
        <p className="text-gray-700 mb-4">{rfq.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <MapPin size={15} /> Location: {rfq.location}
          </p>
          <p className="flex items-center gap-2">
            <Clock size={15} /> Date: {rfq.date}
          </p>
          <p className="flex items-center gap-2">
            <FileText size={15} /> Budget: {rfq.budget}
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle
              size={15}
              className={rfq.buyerVerified ? 'text-green-500' : 'text-gray-400'}
            />{' '}
            {rfq.buyerVerified ? 'Verified Buyer' : 'Unverified User'}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Respond to this RFQ
        </h2>
        <VendorRFQResponseForm rfqId={id} />
      </div>
    </div>
  );
}