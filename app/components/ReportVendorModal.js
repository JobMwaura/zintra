'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function ReportVendorModal({ vendorId, vendorName, onClose }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [reportType, setReportType] = useState('inappropriate_images');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [violatedImages, setViolatedImages] = useState('');
  const [severity, setSeverity] = useState('medium');

  const reportTypes = [
    { value: 'inappropriate_images', label: 'Inappropriate Images', description: 'Images that are offensive or violate platform rules' },
    { value: 'fake_business', label: 'Fake Business', description: 'Business appears to be fraudulent or fake' },
    { value: 'scam', label: 'Scam/Fraud', description: 'Suspicious or scam activity' },
    { value: 'offensive_content', label: 'Offensive Content', description: 'Content that is hateful or discriminatory' },
    { value: 'other', label: 'Other', description: 'Other policy violations' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to report a vendor');
        setLoading(false);
        return;
      }

      // Parse image URLs/IDs
      const images = violatedImages
        .split('\n')
        .map(img => img.trim())
        .filter(img => img.length > 0);

      const { error: err } = await supabase
        .from('vendor_reports')
        .insert({
          reporter_user_id: user.id,
          reported_vendor_id: vendorId,
          report_type: reportType,
          title,
          description,
          images_violated: images.length > 0 ? images : null,
          severity,
          status: 'pending'
        });

      if (err) throw err;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to submit report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Report Vendor</h2>
            <p className="text-sm text-gray-600 mt-1">Help us keep our platform safe</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted Successfully</h3>
            <p className="text-gray-600 mb-4">
              Thank you for helping keep our platform safe. Our team will review your report within 24 hours.
            </p>
            <p className="text-sm text-gray-500">Closing in 2 seconds...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* Vendor Name (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reported Vendor
              </label>
              <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 font-medium">
                {vendorName}
              </div>
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What is the issue? *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {reportTypes.map(type => (
                  <label key={type.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="reportType"
                      value={type.value}
                      checked={reportType === type.value}
                      onChange={(e) => setReportType(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{type.label}</p>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide specific details about the issue. Include what violations you observed and why you believe this vendor should be reviewed."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="5"
              />
            </div>

            {/* Violated Images (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URLs or IDs (Optional)
              </label>
              <textarea
                value={violatedImages}
                onChange={(e) => setViolatedImages(e.target.value)}
                placeholder="If reporting inappropriate images, paste the image URLs or IDs here (one per line)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
              />
              <p className="text-xs text-gray-500 mt-2">
                Provide direct links to the images you're reporting, separated by line breaks
              </p>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="low">Low - Minor issue</option>
                <option value="medium">Medium - Moderate concern</option>
                <option value="high">High - Serious violation</option>
                <option value="critical">Critical - Urgent/dangerous</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Your report will be reviewed by our moderation team within 24 hours. All reports are treated confidentially.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
