'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Check, Globe, Shield } from 'lucide-react';

export default function PublicRFQ() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    projectTitle: '',
    category: '',
    description: '',
    timeline: '',
    budgetRange: '',
    county: '',
    specificLocation: '',
    visibilityDuration: '30',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const categories = [
    'Building & Structural Materials', 'Wood & Timber Solutions', 'Roofing & Waterproofing',
    'Doors, Windows & Hardware', 'Flooring & Wall Finishes', 'Plumbing & Sanitation',
    'Electrical & Lighting', 'Kitchen & Interior Fittings', 'HVAC & Climate Solutions',
    'Painting & Surface Finishing', 'Concrete & Aggregates', 'Construction Services & Labor'
  ];

  const budgetRanges = ['Under KSh 50,000', 'KSh 50,000 - 100,000', 'KSh 100,000 - 500,000', 'KSh 500,000 - 1,000,000', 'Over KSh 1,000,000'];
  const counties = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Naivasha', 'Thika', 'Ongata Rongai', 'Meru', 'Kericho', 'Kiambu', 'Other'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.projectTitle.trim() || !formData.category || !formData.description.trim() || !formData.budgetRange || !formData.county || !formData.specificLocation.trim() || !formData.timeline) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in first');
        setLoading(false);
        return;
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(formData.visibilityDuration));

      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .insert([{
          user_id: user.id,
          buyer_id: user.id,
          title: formData.projectTitle,
          description: formData.description,
          category: formData.category,
          location: formData.specificLocation,
          county: formData.county,
          budget_range: formData.budgetRange,
          timeline: formData.timeline,
          rfq_type: 'public',
          visibility: 'public',
          status: 'open',
          expires_at: expiryDate,
          created_at: new Date(),
          published_at: new Date(),
        }])
        .select();

      if (rfqError) throw rfqError;

      if (rfqData && rfqData[0]) {
        setSuccess(true);
        setTimeout(() => router.push(`/rfq/${rfqData[0].id}`), 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create RFQ');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">RFQ Published Successfully!</h2>
          <p className="text-green-700 mb-4">Your project is now visible to all vendors in the marketplace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#ea8f1e' }}>zintra</Link>
          <div className="hidden md:flex gap-6">
            <Link href="/browse" className="text-gray-600 hover:text-gray-900">Browse Vendors</Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-8 h-8" style={{ color: '#ea8f1e' }} />
            <h1 className="text-3xl font-bold" style={{ color: '#5f6466' }}>Post Publicly</h1>
          </div>
          <p className="text-center text-gray-600 mb-8">Let all vendors in our marketplace see your project and submit competitive quotes</p>

          {/* Benefits Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3">Public RFQ Benefits:</h3>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li className="flex gap-2">
                <span className="text-lg">✓</span>
                <span>Visible to all vendors in the marketplace</span>
              </li>
              <li className="flex gap-2">
                <span className="text-lg">✓</span>
                <span>Receive competitive quotes from multiple vendors</span>
              </li>
              <li className="flex gap-2">
                <span className="text-lg">✓</span>
                <span>Automatic vendor matching based on category and location</span>
              </li>
              <li className="flex gap-2">
                <span className="text-lg">✓</span>
                <span>Compare quotes and vendor profiles side-by-side</span>
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
              <input
                type="text"
                name="projectTitle"
                placeholder="e.g., Kitchen Renovation with New Cabinets"
                value={formData.projectTitle}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Description *</label>
              <textarea
                name="description"
                placeholder="Describe your project in detail. The more details, the better quotes you'll receive."
                value={formData.description}
                onChange={handleInputChange}
                rows="8"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                <option value="">Select a category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">County *</label>
                <select
                  name="county"
                  value={formData.county}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                >
                  <option value="">Select county</option>
                  {counties.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  name="specificLocation"
                  placeholder="e.g., Westlands, Nairobi"
                  value={formData.specificLocation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range *</label>
                <select
                  name="budgetRange"
                  value={formData.budgetRange}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                >
                  <option value="">Select budget</option>
                  {budgetRanges.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeline *</label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                >
                  <option value="">Select timeline</option>
                  <option value="urgent">Urgent (Within 1 week)</option>
                  <option value="soon">Soon (1-2 weeks)</option>
                  <option value="moderate">Moderate (2-4 weeks)</option>
                  <option value="flexible">Flexible (No specific deadline)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How long should this RFQ be visible? *</label>
              <select
                name="visibilityDuration"
                value={formData.visibilityDuration}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              >
                <option value="7">1 week</option>
                <option value="14">2 weeks</option>
                <option value="30">1 month (Recommended)</option>
                <option value="60">2 months</option>
                <option value="90">3 months</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">After this period, vendors can still view your RFQ but won't receive new notifications</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-semibold">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Privacy Notice:</strong> Your project details are secure. Only vendors who submit quotes will see your contact information.
              </p>
            </div>

            <div className="flex gap-4">
              <Link href="/post-rfq" className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 text-center transition-colors">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 disabled:bg-gray-400"
                style={!loading ? { backgroundColor: '#ea8f1e' } : {}}
              >
                {loading ? 'Publishing...' : 'Publish RFQ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
