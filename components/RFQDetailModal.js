'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X, MapPin, DollarSign, Calendar, Clock, Tag, Eye, Building2,
  CheckCircle, User, LogIn, Shield, ExternalLink, MessageSquare
} from 'lucide-react';

/**
 * RFQDetailModal — Shows full RFQ details in a popup overlay.
 * Used on homepage featured RFQs and post-rfq marketplace.
 * 
 * Props:
 * - rfq: The RFQ object
 * - isOpen: Whether modal is visible
 * - onClose: Close handler
 * - user: Current auth user (null if not logged in)
 * - isVendor: Whether user has a vendor profile
 * - vendorProfile: Vendor profile object (if isVendor)
 * - quoteCount: Number of quotes for this RFQ
 */
export default function RFQDetailModal({
  rfq,
  isOpen,
  onClose,
  user = null,
  isVendor = false,
  vendorProfile = null,
  quoteCount = 0,
}) {
  const router = useRouter();

  if (!isOpen || !rfq) return null;

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDaysLeft = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    return Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft(rfq.deadline);

  const handleQuoteClick = () => {
    if (!user) {
      // Store redirect so login brings them back
      sessionStorage.setItem('redirectAfterLogin', `/rfq/${rfq.id}`);
      router.push('/login');
    } else if (!isVendor) {
      router.push('/vendor-registration');
    } else {
      // Navigate to full RFQ page with quote form
      router.push(`/rfq/${rfq.id}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-gray-100 rounded-full p-2 shadow-sm transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Status Banner */}
        <div className={`px-6 py-3 rounded-t-2xl flex items-center justify-between ${
          rfq.status === 'submitted' || rfq.status === 'open' || rfq.status === 'approved' || rfq.status === 'active'
            ? 'bg-green-50 border-b border-green-100'
            : 'bg-gray-50 border-b border-gray-100'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              rfq.status === 'submitted' || rfq.status === 'open' || rfq.status === 'approved' || rfq.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              🟢 Open for Quotes
            </span>
            {rfq.type && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {rfq.type === 'public' ? 'Public RFQ' : rfq.type === 'wizard' ? 'Matched RFQ' : rfq.type}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Eye size={12} />
            <span>Posted {formatDate(rfq.created_at)}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Title & Category */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 pr-8">
            {rfq.title}
          </h2>

          {rfq.category_slug && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Tag size={14} />
              <span className="capitalize">{rfq.category_slug.replace(/-/g, ' ')}</span>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
              {rfq.description || 'No description provided.'}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                <p className="text-sm font-medium text-gray-800">
                  {rfq.location || rfq.county || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Budget</p>
                <p className="text-sm font-medium text-gray-800">
                  {rfq.budget_min && rfq.budget_max
                    ? `${formatCurrency(rfq.budget_min)} - ${formatCurrency(rfq.budget_max)}`
                    : rfq.budget_range || 'Flexible'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Timeline</p>
                <p className="text-sm font-medium text-gray-800">
                  {rfq.timeline || 'Flexible'}
                </p>
              </div>
            </div>

            {daysLeft !== null && (
              <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Deadline</p>
                  <p className={`text-sm font-medium ${daysLeft <= 3 ? 'text-red-600' : 'text-gray-800'}`}>
                    {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
              <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Quotes</p>
                <p className="text-sm font-medium text-gray-800">
                  {quoteCount} received
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
              <Eye className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Posted</p>
                <p className="text-sm font-medium text-gray-800">
                  {formatDate(rfq.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Fields (if available) */}
          {(rfq.specifications || rfq.requirements || rfq.special_requirements) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Additional Requirements</h3>
              <p className="text-sm text-blue-700 whitespace-pre-wrap">
                {rfq.specifications || rfq.requirements || rfq.special_requirements}
              </p>
            </div>
          )}

          {/* Action Section */}
          <div className="border-t border-gray-200 pt-6 mt-2">
            {!user ? (
              /* NOT LOGGED IN */
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800 mb-1">
                      Interested in quoting this project?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Sign in as a vendor to submit your quote. New here? Create a free vendor profile.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => {
                          sessionStorage.setItem('redirectAfterLogin', `/rfq/${rfq.id}`);
                          router.push('/login');
                          onClose();
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign In as Vendor
                      </button>
                      <button
                        onClick={() => {
                          router.push('/vendor-registration');
                          onClose();
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 px-5 py-2.5 rounded-lg font-medium border border-orange-200 hover:bg-orange-50 transition-colors text-sm"
                      >
                        <User className="w-4 h-4" />
                        Register as Vendor
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : !isVendor ? (
              /* LOGGED IN BUT NOT A VENDOR */
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800 mb-1">
                      Want to quote this project?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      You&apos;re logged in as a buyer. To submit quotes, create a vendor profile — it&apos;s free!
                    </p>
                    <button
                      onClick={() => {
                        router.push('/vendor-registration');
                        onClose();
                      }}
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Building2 className="w-4 h-4" />
                      Create Vendor Profile
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* LOGGED IN AS VENDOR */
              <div className="space-y-3">
                <div className="bg-green-50 rounded-lg border border-green-200 p-3 flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Logged in as <strong>{vendorProfile?.company_name || 'Vendor'}</strong></span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleQuoteClick}
                    className="flex-1 inline-flex items-center justify-center gap-2 text-white px-5 py-3 rounded-lg font-semibold hover:opacity-90 transition-all text-sm"
                    style={{ backgroundColor: '#ca8637' }}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Submit a Quote
                  </button>
                  <Link
                    href={`/rfq/${rfq.id}`}
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-5 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Full Page View
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
