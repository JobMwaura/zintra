'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Check, ArrowRight, ArrowLeft, Zap, X } from 'lucide-react';

export default function WizardRFQ() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    projectTitle: '',
    description: '',
    timeline: '',
    budget_min: '',
    budget_max: '',
    county: '',
    specificLocation: '',
    materialRequirements: '',
    paymentTerms: 'upon_completion',
    deadline: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const steps = [
    { number: 1, name: 'Category' },
    { number: 2, name: 'Basics' },
    { number: 3, name: 'Details' },
    { number: 4, name: 'Budget & Timeline' },
    { number: 5, name: 'Review' }
  ];

  const categories = [
    'Building & Structural Materials',
    'Wood & Timber Solutions',
    'Roofing & Waterproofing',
    'Doors, Windows & Hardware',
    'Flooring & Wall Finishes',
    'Plumbing & Sanitation',
    'Electrical & Lighting',
    'Kitchen & Interior Fittings',
    'HVAC & Climate Solutions',
    'Painting & Surface Finishing',
    'Concrete & Aggregates',
    'Construction Services & Labor'
  ];

  const paymentTermsOptions = [
    { value: 'upfront', label: 'Upfront Payment' },
    { value: 'upon_completion', label: 'Upon Completion' },
    { value: 'partial', label: 'Partial (50/50)' },
    { value: 'monthly', label: 'Monthly Installments' },
    { value: 'flexible', label: 'Flexible/Negotiable' }
  ];

  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Naivasha', 'Thika', 'Ongata Rongai', 'Meru', 'Kericho', 'Kiambu', 'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.category) newErrors.category = 'Required';
    }
    if (currentStep === 2) {
      if (!formData.projectTitle.trim()) newErrors.projectTitle = 'Required';
      if (!formData.description.trim()) newErrors.description = 'Required';
    }
    if (currentStep === 3) {
      if (!formData.materialRequirements.trim()) newErrors.materialRequirements = 'Required';
    }
    if (currentStep === 4) {
      if (!formData.budget_min) newErrors.budget_min = 'Required';
      if (!formData.budget_max) newErrors.budget_max = 'Required';
      if (formData.budget_min && formData.budget_max && parseInt(formData.budget_min) > parseInt(formData.budget_max)) {
        newErrors.budget_min = 'Min budget must be less than max';
      }
      if (!formData.timeline) newErrors.timeline = 'Required';
      if (!formData.county) newErrors.county = 'Required';
      if (!formData.specificLocation.trim()) newErrors.specificLocation = 'Required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrors({ auth: 'Please log in first' });
        setLoading(false);
        return;
      }

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
          budget_min: parseInt(formData.budget_min) || null,
          budget_max: parseInt(formData.budget_max) || null,
          timeline: formData.timeline,
          payment_terms: formData.paymentTerms,
          deadline: formData.deadline ? new Date(formData.deadline) : null,
          rfq_type: 'matched',
          visibility: 'semi-private',
          status: 'open',
          created_at: new Date(),
          published_at: new Date(),
        }])
        .select();

      if (rfqError) throw rfqError;

      if (rfqData && rfqData[0]) {
        const rfqId = rfqData[0].id;
        setSuccess(true);
        setTimeout(() => router.push(`/rfq/${rfqId}`), 2000);
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to create RFQ' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <Check className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-purple-900 mb-2">RFQ Created Successfully!</h2>
          <p className="text-purple-700 mb-4">Our system will automatically match you with the best vendors</p>
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

          {/* Mobile Close Button */}
          <Link 
            href="/" 
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition"
            title="Back to Home"
          >
            <X className="w-6 h-6 text-gray-600" />
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#5f6466' }}>Guided Vendor Matching</h1>
          <p className="text-center text-gray-600 mb-8">We'll automatically find the best vendors for your project</p>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <Zap className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <p className="font-semibold mb-1">Auto-Matching Technology</p>
                <p>We'll automatically filter and rank vendors based on: Category Match → Location → Rating → Capacity. The top vendors will be invited to quote.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-12">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => currentStep === step.number || (validateStep() && setCurrentStep(step.number))}
                    disabled={currentStep < step.number}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-600`}
                    style={currentStep >= step.number ? { backgroundColor: '#ea8f1e', color: 'white' } : {}}
                  >
                    {currentStep > step.number ? <Check className="w-6 h-6" /> : step.number}
                  </button>
                  <span className="text-xs mt-2 font-medium text-gray-700 text-center max-w-20">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 transition-colors ${currentStep > step.number ? '' : 'bg-gray-200'}`}
                    style={currentStep > step.number ? { backgroundColor: '#ea8f1e' } : {}} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 1: What Do You Need?</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Category *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categories.map(cat => (
                      <label key={cat} className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-orange-50 transition-colors ${formData.category === cat ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}`}>
                        <input type="radio" name="category" value={cat} checked={formData.category === cat} onChange={handleInputChange} className="mr-3" />
                        <span className="text-gray-700 flex-1">{cat}</span>
                      </label>
                    ))}
                  </div>
                  {errors.category && <p className="text-red-500 text-sm mt-2">{errors.category}</p>}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 2: Project Basics</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                  <input type="text" name="projectTitle" placeholder="e.g., Kitchen Renovation" value={formData.projectTitle} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                  {errors.projectTitle && <p className="text-red-500 text-sm mt-1">{errors.projectTitle}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea name="description" placeholder="Describe what you need..." value={formData.description} onChange={handleInputChange} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 3: Specifications</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material/Service Requirements *</label>
                  <textarea name="materialRequirements" placeholder="Detail the specifications..." value={formData.materialRequirements} onChange={handleInputChange} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                  {errors.materialRequirements && <p className="text-red-500 text-sm mt-1">{errors.materialRequirements}</p>}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 4: Budget, Location & Timeline</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Budget (KSh) *</label>
                    <input type="number" name="budget_min" placeholder="e.g., 50000" value={formData.budget_min} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                    {errors.budget_min && <p className="text-red-500 text-sm mt-1">{errors.budget_min}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget (KSh) *</label>
                    <input type="number" name="budget_max" placeholder="e.g., 500000" value={formData.budget_max} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                    {errors.budget_max && <p className="text-red-500 text-sm mt-1">{errors.budget_max}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">County *</label>
                  <select name="county" value={formData.county} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900">
                    <option value="">Select county</option>
                    {counties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specific Location *</label>
                  <input type="text" name="specificLocation" placeholder="e.g., Westlands" value={formData.specificLocation} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                  {errors.specificLocation && <p className="text-red-500 text-sm mt-1">{errors.specificLocation}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timeline *</label>
                  <select name="timeline" value={formData.timeline} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900">
                    <option value="">Select timeline</option>
                    <option value="urgent">Urgent (Within 1 week)</option>
                    <option value="soon">Soon (1-2 weeks)</option>
                    <option value="moderate">Moderate (2-4 weeks)</option>
                    <option value="flexible">Flexible (No deadline)</option>
                  </select>
                  {errors.timeline && <p className="text-red-500 text-sm mt-1">{errors.timeline}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                  <select name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900">
                    {paymentTermsOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quote Deadline (Optional)</label>
                  <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                  <p className="text-xs text-gray-500 mt-1">Date when you need to receive quotes by</p>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 5: Review & Submit</h2>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg p-6">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    How Auto-Matching Works
                  </h3>
                  <ol className="space-y-2 text-sm text-purple-900">
                    <li><strong>1. Category Match:</strong> We filter vendors specializing in {formData.category}</li>
                    <li><strong>2. Location Match:</strong> We prioritize vendors in {formData.county}</li>
                    <li><strong>3. Rating Sort:</strong> Top-rated vendors appear first</li>
                    <li><strong>4. Capacity Check:</strong> We verify vendors can handle your project size</li>
                    <li><strong>5. Best Match:</strong> 5-7 best vendors invited to submit quotes</li>
                  </ol>
                  <p className="text-sm text-purple-800 mt-4 italic">The matching process is automatic and happens after you submit. You'll be notified when vendors respond.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3"><span className="text-orange-600">✓</span> Project Summary</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-gray-700">Title</dt>
                        <dd className="text-gray-600">{formData.projectTitle}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Category</dt>
                        <dd className="text-gray-600">{formData.category}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Budget</dt>
                        <dd className="text-gray-600">KSh {parseInt(formData.budget_min).toLocaleString()} - {parseInt(formData.budget_max).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Location</dt>
                        <dd className="text-gray-600">{formData.specificLocation}, {formData.county}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Timeline</dt>
                        <dd className="text-gray-600 capitalize">{formData.timeline}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3"><span className="text-orange-600">✓</span> What Happens Next</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>✓ Your RFQ is created and activated</li>
                      <li>✓ System automatically matches vendors</li>
                      <li>✓ Matching vendors invited to quote</li>
                      <li>✓ You receive quotes from interested vendors</li>
                      <li>✓ Compare and select the best option</li>
                    </ul>
                  </div>
                </div>

                {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}
              </div>
            )}

            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              
              {/* Back to Home Button - Always visible */}
              <Link 
                href="/" 
                className="flex items-center gap-2 px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Link>

              {currentStep < 5 ? (
                <button type="button" onClick={nextStep} className="ml-auto flex items-center gap-2 px-6 py-2 text-white rounded-lg hover:opacity-90" style={{ backgroundColor: '#ea8f1e' }}>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="ml-auto px-8 py-2 text-white rounded-lg hover:opacity-90 font-semibold disabled:bg-gray-400" style={!loading ? { backgroundColor: '#ea8f1e' } : {}}>
                  {loading ? 'Creating RFQ...' : 'Create RFQ & Match Vendors'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
