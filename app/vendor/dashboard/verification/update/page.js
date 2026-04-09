'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, FileText, AlertCircle, Clock, RefreshCw, 
  Calendar, ShieldAlert, CheckCircle, XCircle, FileCheck,
  ArrowLeft, Info
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { VerificationBadge } from '@/app/components/VerificationBadge';

export default function UpdateVerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendorId, setVendorId] = useState(null);
  const [canUpdate, setCanUpdate] = useState(null);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [documentHistory, setDocumentHistory] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    updateReason: '',
    updateType: 'correction',
    documentType: 'business_registration',
    registeredBusinessName: '',
    registrationNumber: '',
    countryOfRegistration: '',
    businessAddress: '',
    issueDate: '',
    expiryDate: '',
    documentNumber: ''
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    checkUpdateEligibility();
    fetchDocumentHistory();
  }, []);

  const handleBackToDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get vendor profile to redirect to their vendor profile
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vendor?.id) {
        router.push(`/vendor-profile/${vendor.id}`);
      } else {
        // Fallback to browse if no vendor profile found
        router.push('/browse');
      }
    } catch (error) {
      console.error('Error navigating back:', error);
      router.push('/browse');
    }
  };

  const checkUpdateEligibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!vendor) throw new Error('Vendor not found');
      setVendorId(vendor.id);

      // Check if can update
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/vendor/update-verification-document', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const updateStatus = await response.json();
      setCanUpdate(updateStatus);

      // Get current document
      const { data: docs } = await supabase
        .from('vendor_verification_documents')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('status', 'approved')
        .is('superseded_by_document_id', null)
        .order('reviewed_at', { ascending: false })
        .limit(1)
        .single();

      setCurrentDocument(docs);

      // Pre-fill form with current document data
      if (docs) {
        setFormData(prev => ({
          ...prev,
          documentType: docs.document_type,
          registeredBusinessName: docs.registered_business_name,
          registrationNumber: docs.registration_number || '',
          countryOfRegistration: docs.country_of_registration,
          businessAddress: docs.business_address || '',
          documentNumber: docs.document_number || '',
        }));
      }

    } catch (err) {
      console.error('Error checking update eligibility:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendor) return;

      const { data: history } = await supabase
        .rpc('get_vendor_document_history', { vendor_id_param: vendor.id });

      setDocumentHistory(history || []);
    } catch (err) {
      console.error('Error fetching document history:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or image file (JPG, PNG)');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setDocumentFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (!documentFile || !formData.updateReason) {
        throw new Error('Please upload a document and provide update reason');
      }

      const { data: { session } } = await supabase.auth.getSession();
      const submitFormData = new FormData();
      submitFormData.append('file', documentFile);
      submitFormData.append('updateReason', formData.updateReason);
      submitFormData.append('updateType', formData.updateType);
      submitFormData.append('documentType', formData.documentType);
      submitFormData.append('registeredBusinessName', formData.registeredBusinessName);
      submitFormData.append('countryOfRegistration', formData.countryOfRegistration);
      submitFormData.append('businessAddress', formData.businessAddress);
      submitFormData.append('registrationNumber', formData.registrationNumber);
      submitFormData.append('documentNumber', formData.documentNumber);
      submitFormData.append('issueDate', formData.issueDate);
      submitFormData.append('expiryDate', formData.expiryDate);

      const response = await fetch('/api/vendor/update-verification-document', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: submitFormData,
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setSuccess(true);
      setTimeout(() => {
        handleBackToDashboard();
      }, 3000);

    } catch (err) {
      console.error('Error submitting update:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // Cannot update
  if (!canUpdate?.canUpdate) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-orange-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Cannot Update Verification
              </h1>
              <p className="text-gray-600 mb-6">{canUpdate?.reason}</p>
              
              {canUpdate?.hasPendingUpdate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium text-blue-900 mb-1">Update Under Review</p>
                      <p className="text-sm text-blue-800">
                        Your update is currently being reviewed by our admin team. 
                        You'll be notified once it's processed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!canUpdate?.isVerified && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                    <div className="text-left">
                      <p className="font-medium text-yellow-900 mb-1">Not Yet Verified</p>
                      <p className="text-sm text-yellow-800">
                        Complete your initial verification first before you can submit updates.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center mt-8">
                <button
                  onClick={handleBackToDashboard}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Back to Dashboard
                </button>
                {!canUpdate?.isVerified && (
                  <button
                    onClick={() => router.push('/vendor/dashboard/verification')}
                    className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                  >
                    Complete Verification
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Update Submitted Successfully!
              </h1>
              <p className="text-gray-600 mb-6">
                Your verification document update is now under review.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto mb-6">
                <div className="flex items-start text-left">
                  <VerificationBadge type="business" size="md" showLabel={false} />
                  <div className="ml-4">
                    <p className="font-medium text-green-900 mb-1">Your Badge Remains Active</p>
                    <p className="text-sm text-green-800">
                      Your verification badge will stay active during the review process. 
                      Your business will continue to appear first in search results.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-blue-800 text-sm">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Update form (continued in next part...)
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <button
            onClick={handleBackToDashboard}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Update Verification Documents
              </h1>
              <VerificationBadge type="business" size="md" />
            </div>
            <p className="text-gray-600">
              Submit updated business documents. Your verification badge will remain active during review.
            </p>
          </div>

          {/* Expiry Warning */}
          {canUpdate.daysUntilExpiry !== null && canUpdate.daysUntilExpiry < 60 && (
            <div className={`border rounded-lg p-4 mb-6 ${
              canUpdate.daysUntilExpiry < 0 ? 'bg-red-50 border-red-200' :
              canUpdate.daysUntilExpiry < 30 ? 'bg-orange-50 border-orange-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start">
                <ShieldAlert className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                  canUpdate.daysUntilExpiry < 0 ? 'text-red-600' :
                  canUpdate.daysUntilExpiry < 30 ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
                <div>
                  <p className={`font-medium ${
                    canUpdate.daysUntilExpiry < 0 ? 'text-red-900' :
                    canUpdate.daysUntilExpiry < 30 ? 'text-orange-900' :
                    'text-yellow-900'
                  }`}>
                    {canUpdate.daysUntilExpiry < 0 
                      ? '⚠️ Document Expired' 
                      : `Document Expiring in ${canUpdate.daysUntilExpiry} days`
                    }
                  </p>
                  <p className={`text-sm mt-1 ${
                    canUpdate.daysUntilExpiry < 0 ? 'text-red-700' :
                    canUpdate.daysUntilExpiry < 30 ? 'text-orange-700' :
                    'text-yellow-700'
                  }`}>
                    Please upload a renewed document to maintain your verification status.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Document Info */}
          {currentDocument && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Current Document
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium capitalize">
                    {currentDocument.document_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Submitted:</span>
                  <span className="ml-2 font-medium">
                    {new Date(currentDocument.submitted_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Business Name:</span>
                  <span className="ml-2 font-medium">
                    {currentDocument.registered_business_name}
                  </span>
                </div>
                {currentDocument.expiry_date && (
                  <div>
                    <span className="text-gray-600">Expires:</span>
                    <span className="ml-2 font-medium">
                      {new Date(currentDocument.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {currentDocument.document_number && (
                  <div>
                    <span className="text-gray-600">Document #:</span>
                    <span className="ml-2 font-medium">
                      {currentDocument.document_number}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Update Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Update Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Type *
              </label>
              <select
                value={formData.updateType}
                onChange={(e) => setFormData({ ...formData, updateType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="renewal">Document Renewal (Expiry date extended)</option>
                <option value="correction">Information Correction</option>
                <option value="ownership_change">Ownership Change</option>
                <option value="regulatory_update">Regulatory Update</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the type of update you're submitting
              </p>
            </div>

            {/* Update Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Update *
              </label>
              <textarea
                value={formData.updateReason}
                onChange={(e) => setFormData({ ...formData, updateReason: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Explain why you're updating the document..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: "Business permit renewed for another year", "Tax number changed due to restructuring", "New business owner added"
              </p>
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type *
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="business_registration">Business Registration Certificate</option>
                <option value="tax_id">Tax Identification Number (TIN)</option>
                <option value="business_license">Business Operating License</option>
                <option value="trade_license">Trade License</option>
                <option value="other">Other Official Document</option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Updated Document *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="document-upload"
                  required
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium text-lg">
                    Choose file
                  </span>
                  <span className="text-gray-600"> or drag and drop</span>
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  PDF, JPG, or PNG (max 10MB)
                </p>
                {documentFile && (
                  <div className="mt-4 inline-flex items-center justify-center text-sm text-green-600 bg-green-50 py-2 px-4 rounded-lg">
                    <FileCheck className="w-4 h-4 mr-2" />
                    {documentFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registered Business Name *
                </label>
                <input
                  type="text"
                  value={formData.registeredBusinessName}
                  onChange={(e) => setFormData({ ...formData, registeredBusinessName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country of Registration *
                </label>
                <input
                  type="text"
                  value={formData.countryOfRegistration}
                  onChange={(e) => setFormData({ ...formData, countryOfRegistration: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Number
                </label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., License #, TIN, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date {formData.updateType === 'renewal' && '*'}
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={formData.updateType === 'renewal'}
                />
                {formData.updateType === 'renewal' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Required for document renewals
                  </p>
                )}
              </div>
            </div>

            {/* Business Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Address
              </label>
              <textarea
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Full business address"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleBackToDashboard}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Submitting Update...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Submit Update
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Document History */}
          {documentHistory.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-600" />
                Document History
              </h3>
              <div className="space-y-3">
                {documentHistory.slice(0, 5).map((doc) => (
                  <div
                    key={doc.document_id}
                    className={`border rounded-lg p-4 transition-colors ${
                      doc.is_current ? 'border-green-300 bg-green-50' : 
                      doc.status === 'pending_update' ? 'border-blue-300 bg-blue-50' :
                      'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <FileText className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                          doc.is_current ? 'text-green-600' : 
                          doc.status === 'pending_update' ? 'text-blue-600' :
                          'text-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-900 capitalize">
                              {doc.document_type.replace(/_/g, ' ')}
                            </p>
                            {doc.is_current && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Current
                              </span>
                            )}
                            {doc.status === 'pending_update' && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Under Review
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Submitted: {new Date(doc.submission_date).toLocaleDateString()}
                            {doc.review_date && ` • Reviewed: ${new Date(doc.review_date).toLocaleDateString()}`}
                          </p>
                          {doc.document_file_name && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {doc.document_file_name}
                            </p>
                          )}
                          {doc.update_reason && (
                            <p className="text-sm text-gray-700 mt-2 italic">
                              "{doc.update_reason}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                          doc.status === 'pending_update' ? 'bg-blue-100 text-blue-800' :
                          doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          doc.status === 'superseded' ? 'bg-gray-100 text-gray-600' :
                          doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {documentHistory.length > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2">
                    Showing 5 of {documentHistory.length} documents
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your update will be reviewed by our admin team</li>
                  <li>• Your verification badge remains active during review</li>
                  <li>• You'll receive an email notification once reviewed</li>
                  <li>• If approved, your new document will replace the old one</li>
                  <li>• If rejected, you can resubmit with corrections</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Business Details - continued in next message due to length */}
        </div>
      </div>
    </div>
  );
}
