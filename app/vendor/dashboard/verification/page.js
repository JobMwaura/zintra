'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, FileText, CheckCircle, XCircle, AlertCircle, 
  Shield, Award, ChevronRight, Clock, FileCheck 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { VerificationBadge, VerificationStatusCard } from '@/app/components/VerificationBadge';

export default function VendorVerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendorId, setVendorId] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get vendor profile
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (vendorError) throw vendorError;
      setVendorId(vendor.id);

      // Get verification status
      const { data: status, error: statusError } = await supabase
        .rpc('get_vendor_verification_status', { vendor_id_param: vendor.id });

      if (!statusError && status && status.length > 0) {
        setVerificationStatus(status[0]);
      }

      // Pre-fill form with vendor data
      setFormData(prev => ({
        ...prev,
        registeredBusinessName: vendor.business_name || '',
        businessAddress: vendor.location || ''
      }));

    } catch (err) {
      console.error('Error fetching verification status:', err);
      setError('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or image file (JPG, PNG)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setDocumentFile(file);
      setError('');
    }
  };

  const uploadDocument = async () => {
    if (!documentFile) return null;

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', documentFile);
      formData.append('vendorId', vendorId);

      // Upload to S3 via API route
      const response = await fetch('/api/vendor/upload-verification-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      // Simulate progress for better UX (since fetch doesn't support upload progress natively)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await response.json();
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      return result.fileUrl;
    } catch (err) {
      console.error('Error uploading document to S3:', err);
      throw new Error(err.message || 'Failed to upload document');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validate required fields
      if (!documentFile) {
        setError('Please upload a document');
        setSubmitting(false);
        return;
      }

      if (!formData.registeredBusinessName || !formData.countryOfRegistration) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      // Upload document
      const documentUrl = await uploadDocument();

      // Submit verification request
      const { data, error: submitError } = await supabase
        .from('vendor_verification_documents')
        .insert([{
          vendor_id: vendorId,
          document_type: formData.documentType,
          document_url: documentUrl,
          document_file_name: documentFile.name,
          document_number: formData.documentNumber,
          registered_business_name: formData.registeredBusinessName,
          registration_number: formData.registrationNumber,
          country_of_registration: formData.countryOfRegistration,
          business_address: formData.businessAddress,
          issue_date: formData.issueDate || null,
          expiry_date: formData.expiryDate || null,
          status: 'pending'
        }]);

      if (submitError) throw submitError;

      // Success - redirect to status page
      setCurrentStep(3);
      setTimeout(() => {
        router.push('/vendor/dashboard');
      }, 3000);

    } catch (err) {
      console.error('Error submitting verification:', err);
      setError(err.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show status if already verified or pending
  if (verificationStatus?.is_verified) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <VerificationBadge type="business" size="xl" showLabel={false} />
            <h1 className="text-3xl font-bold text-gray-900 mt-4">You're Verified!</h1>
            <p className="text-gray-600 mt-2">Your business has been successfully verified</p>
          </div>

          <VerificationStatusCard 
            isVerified={true}
            verificationStatus={verificationStatus.status}
            verifiedAt={verificationStatus.verified_at}
          />

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/vendor/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus?.pending_submission) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-blue-600 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">Verification Pending</h1>
            <p className="text-gray-600 mt-2">Your documents are being reviewed by our team</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Review Timeline</h3>
            <p className="text-gray-600 text-sm mb-4">
              Our team typically reviews submissions within 1-3 business days. 
              You'll receive an email notification once the review is complete.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-700">Documents submitted</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                <span className="text-sm text-gray-700">Under review</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                <span className="text-sm text-gray-400">Verification complete</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/vendor/dashboard')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show submission form
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-t-lg">
          <div className="flex items-center gap-4">
            <Shield className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold">Get Verified</h1>
              <p className="text-blue-100 mt-1">Stand out with a verified badge</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Award className="w-6 h-6 mb-2" />
              <p className="text-sm font-semibold">3x More Trust</p>
              <p className="text-xs text-blue-100 mt-1">Buyers prefer verified vendors</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <ChevronRight className="w-6 h-6 mb-2" />
              <p className="text-sm font-semibold">Priority Listing</p>
              <p className="text-xs text-blue-100 mt-1">Appear first in search results</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <FileCheck className="w-6 h-6 mb-2" />
              <p className="text-sm font-semibold">Free Forever</p>
              <p className="text-xs text-blue-100 mt-1">No verification fees</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Document Type */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Choose Document Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { value: 'business_registration', label: 'Business Registration', icon: FileText },
                { value: 'tax_id', label: 'Tax ID / VAT Number', icon: FileText },
                { value: 'business_license', label: 'Business License', icon: FileText },
                { value: 'trade_license', label: 'Trade License', icon: FileText },
              ].map(({ value, label, icon: Icon }) => (
                <label
                  key={value}
                  className={`
                    flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition
                    ${formData.documentType === value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="documentType"
                    value={value}
                    checked={formData.documentType === value}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="text-blue-600"
                  />
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Step 2: Upload Document */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Upload Document</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="document"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="document" className="cursor-pointer">
                {documentFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{documentFile.name}</p>
                      <p className="text-sm text-gray-500">{(documentFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">Click to upload document</p>
                    <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG (max 10MB)</p>
                  </>
                )}
              </label>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1 text-center">{uploadProgress.toFixed(0)}% uploaded</p>
              </div>
            )}
          </div>

          {/* Step 3: Business Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 3: Business Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registered Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.registeredBusinessName}
                  onChange={(e) => setFormData({ ...formData, registeredBusinessName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter official business name"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter registration number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country of Registration *
                </label>
                <select
                  required
                  value={formData.countryOfRegistration}
                  onChange={(e) => setFormData({ ...formData, countryOfRegistration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select country</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Uganda">Uganda</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Rwanda">Rwanda</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Number
                </label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Certificate/License number"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <textarea
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="Enter business address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !documentFile}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Submit for Verification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
