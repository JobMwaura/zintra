'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { MapPin, Clock, FileText, CheckCircle } from 'lucide-react';
import VendorRFQResponseForm from '@/components/VendorRFQResponseForm';

export default function VendorRFQDetailPage() {
  const { id } = useParams();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRFQ = async () => {
      if (!id) return;
      const { data, error } = await supabase.from('rfqs').select('*').eq('id', id).maybeSingle();
      if (error) {
        console.error('Error loading RFQ:', error);
      }
      setRfq(data || null);
      setLoading(false);
    };

    fetchRFQ();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-gray-500">
        <FileText size={40} className="mx-auto mb-3 text-gray-400" />
        <p>Loading RFQ...</p>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center text-gray-500">
        <FileText size={40} className="mx-auto mb-3 text-gray-400" />
        <p>RFQ not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">
        🧾 {rfq.title}
      </h1>
      <div className="text-sm text-gray-500 mb-6">
        RFQ ID: {rfq.id} • Status: {rfq.status}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">
          Project Overview
        </h2>
        <p className="text-gray-700 mb-4">{rfq.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <MapPin size={15} /> Location: {rfq.location || rfq.county || 'N/A'}
          </p>
          <p className="flex items-center gap-2">
            <Clock size={15} /> Timeline: {rfq.timeline || 'Flexible'}
          </p>
          <p className="flex items-center gap-2">
            <FileText size={15} /> Budget: {rfq.budget_range || 'N/A'}
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle
              size={15}
              className={rfq.buyer_verified ? 'text-green-500' : 'text-gray-400'}
            />{' '}
            {rfq.buyer_verified ? 'Verified Buyer' : 'Unverified User'}
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
