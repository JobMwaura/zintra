'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, ArrowRight, CheckCircle, Check } from 'lucide-react';

export default function WizardRFQ() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Category
    category: '',
    
    // Step 2: Project Details
    title: '',
    description: '',
    
    // Step 3: Requirements
    location: '',
    county: '',
    budget_range: '',
    
    // Step 4: Timeline & Materials
    timeline: '',
    materials_required: '',
    
    // Step 5: Review (summary)
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.category !== '';
      case 2:
        return formData.title !== '' && formData.description !== '';
      case 3:
        return formData.location !== '' && formData.budget_range !== '';
      case 4:
        return formData.timeline !== '';
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid() && step < 5) {
      setStep(step + 1);
      setError(null);
    } else if (!isStepValid()) {
      setError('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in first');
        setLoading(false);
        return;
      }

      // Create RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .insert([{
          user_id: user.id,
          buyer_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          county: formData.county,
          budget_range: formData.budget_range,
          timeline: formData.timeline,
          materials_required: formData.materials_required,
          rfq_type: 'wizard',
          visibility: 'private',
          status: 'open',
          created_at: new Date(),
          published_at: new Date(),
        }])
        .select();

      if (rfqError) throw rfqError;

      if (rfqData && rfqData[0]) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/rfq/${rfqData[0].id}`);
        }, 2000);
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
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">RFQ Created Successfully!</h2>
          <p className="text-green-700 mb-4">We're finding the best vendors for your project...</p>
          <p className="text-green-600 text-sm">Redirecting to your RFQ details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">RFQ Wizard</h1>
          </div>
          <p className="text-gray-600">Step {step} of 5: {
            step === 1 ? 'Select Category' :
            step === 2 ? 'Project Details' :
            step === 3 ? 'Location & Budget' :
            step === 4 ? 'Timeline & Materials' :
            'Review & Submit'
          }</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div key={stepNum} className="flex-1">
                <div className={`h-2 rounded-full transition-colors ${
                  stepNum < step ? 'bg-green-600' :
                  stepNum === step ? 'bg-orange-600' :
                  'bg-gray-200'
                }`} />
                <p className="text-xs text-gray-600 mt-1 text-center">Step {stepNum}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          
          {/* Step 1: Category */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">What category best describes your project?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Kitchen & Interior Fittings',
                  'Electrical & Lighting',
                  'Plumbing & Sanitation',
                  'Building & Structural Materials',
                  'Roofing & Waterproofing',
                  'Flooring & Wall Finishes',
                  'HVAC & Ventilation',
                  'Painting & Decoration',
                ].map(cat => (
                  <label
                    key={cat}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.category === cat
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={formData.category === cat}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <span className="font-semibold text-gray-900">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Project Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Tell us about your project</h2>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Kitchen Renovation with New Cabinets"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your project in detail. Include dimensions, materials, timeline preferences, etc."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          )}

          {/* Step 3: Location & Budget */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Where and what's your budget?</h2>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Westlands, Nairobi"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">County</label>
                <input
                  type="text"
                  name="county"
                  value={formData.county}
                  onChange={handleInputChange}
                  placeholder="e.g., Nairobi"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Range *</label>
                <input
                  type="text"
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleInputChange}
                  placeholder="e.g., KSh 500,000 - 1,000,000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          )}

          {/* Step 4: Timeline & Materials */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Timeline and materials</h2>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Timeline *</label>
                <input
                  type="text"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  placeholder="e.g., 6 weeks, Urgent, ASAP"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Materials Required (Optional)</label>
                <textarea
                  name="materials_required"
                  value={formData.materials_required}
                  onChange={handleInputChange}
                  placeholder="List any specific materials or brands you require..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review your RFQ</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Category</p>
                    <p className="text-lg text-gray-900 font-semibold">{formData.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Budget</p>
                    <p className="text-lg text-gray-900 font-semibold">{formData.budget_range}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
                    <p className="text-lg text-gray-900 font-semibold">{formData.location}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Timeline</p>
                    <p className="text-lg text-gray-900 font-semibold">{formData.timeline}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Project Title</p>
                  <p className="text-gray-900">{formData.title}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Project Description</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{formData.description}</p>
                </div>

                {formData.materials_required && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Materials Required</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{formData.materials_required}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900 font-semibold">Ready to submit?</p>
                <p className="text-blue-700 text-sm mt-2">We'll match your project with qualified vendors and send them your RFQ automatically.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
              <p className="text-red-700 font-semibold">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
            )}

            {step < 5 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 5 && (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Creating RFQ...' : 'Create RFQ'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
