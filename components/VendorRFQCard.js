import Link from 'next/link';
import { FileText, MapPin, CheckCircle, Clock } from 'lucide-react';

export default function VendorRFQCard({ rfq }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all bg-white">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-lg font-semibold text-gray-800">{rfq.title}</h2>
        <span
          className={`px-3 py-1 text-xs rounded-full ${
            rfq.status === 'Pending'
              ? 'bg-yellow-100 text-yellow-700'
              : rfq.status === 'Responded'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {rfq.status}
        </span>
      </div>

      <p className="text-gray-600 mb-2">{rfq.description}</p>

      <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <MapPin size={14} /> {rfq.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={14} /> {rfq.date}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {rfq.buyerVerified ? (
            <span className="text-green-600 flex items-center gap-1 text-sm">
              <CheckCircle size={14} /> Verified Buyer
            </span>
          ) : (
            <span className="text-gray-400 flex items-center gap-1 text-sm">
              <CheckCircle size={14} /> Unverified User
            </span>
          )}
        </div>

        <Link
          href={`/dashboard/vendor/rfq/${rfq.id}`}
          className="text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1"
        >
          <FileText size={14} /> View Details
        </Link>
      </div>
    </div>
  );
}