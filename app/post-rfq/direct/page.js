'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Check, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import LocationSelector from '@/components/LocationSelector';

export default function DirectRFQ() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    projectTitle: '',
    category: '',
    description: '',
    timeline: '',
    budget_min: '',
    budget_max: '',
    projectType: '',
    urgency: 'flexible',
    materialRequirements: '',
    dimensions: { length: '', width: '', height: '' },
    ecoFriendly: false,
    budgetFriendly: false,
    premiumQuality: false,
    additionalSpecs: '',
    servicesRequired: [],
    county: '',
    location: '',
    locationDetails: '',
    siteAccessibility: 'easy',
    multiStory: false,
    requiresEquipment: false,
    deliveryPreference: 'pickup',
    paymentTerms: 'upon_completion',
    deadline: '',
  });

  const [selectedVendors, setSelectedVendors] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const steps = [
    { number: 1, name: 'Project Basics' },
    { number: 2, name: 'Specifications' },
    { number: 3, name: 'Location' },
    { number: 4, name: 'Select Vendors' },
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

  const projectTypes = [
    { value: 'residential', label: 'Residential', desc: 'Home, apartment, or personal property' },
    { value: 'commercial', label: 'Commercial', desc: 'Office, retail, or business space' },
    { value: 'industrial', label: 'Industrial', desc: 'Factory, warehouse, or production facility' },
    { value: 'institutional', label: 'Institutional', desc: 'School, hospital, or government building' }
  ];

  const services = [
    'Material Supply Only',
    'Installation/Labor',
    'Delivery',
    'Design Services',
    'Maintenance/Warranty',
    'Consultation'
  ];

  const paymentTermsOptions = [
    { value: 'upfront', label: 'Upfront Payment' },
    { value: 'upon_completion', label: 'Upon Completion' },
    { value: 'partial', label: 'Partial (50/50)' },
    { value: 'monthly', label: 'Monthly Installments' },
    { value: 'flexible', label: 'Flexible/Negotiable' }
  ];

  useEffect(() => {
    const fetchVendors = async () => {
      const { data } = await supabase.from('vendors').select('id, company_name, location, category');
      if (data) setVendors(data);
    };
    fetchVendors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({ ...formData, [parent]: { ...formData[parent], [child]: value } });
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const toggleService = (service) => {
    setFormData({
      ...formData,
      servicesRequired: formData.servicesRequired.includes(service)
        ? formData.servicesRequired.filter(s => s !== service)
        : [...formData.servicesRequired, service]
    });
  };

  const handleVendorSelect = (vendorId) => {
    setSelectedVendors(prev => prev.includes(vendorId) ? prev.filter(id => id !== vendorId) : [...prev, vendorId]);
  };

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.projectTitle.trim()) newErrors.projectTitle = 'Required';
      if (!formData.category) newErrors.category = 'Required';
      if (!formData.description.trim()) newErrors.description = 'Required';
      if (!formData.projectType) newErrors.projectType = 'Required';
      if (!formData.budget_min) newErrors.budget_min = 'Required';
      if (!formData.budget_max) newErrors.budget_max = 'Required';
      if (formData.budget_min && formData.budget_max && parseInt(formData.budget_min) > parseInt(formData.budget_max)) {
        newErrors.budget_min = 'Min budget must be less than max';
      }
      if (!formData.timeline) newErrors.timeline = 'Required';
    }
    if (currentStep === 2) {
      if (!formData.materialRequirements.trim()) newErrors.materialRequirements = 'Required';
      if (formData.servicesRequired.length === 0) newErrors.servicesRequired = 'Select at least one';
    }
    if (currentStep === 3) {
      if (!formData.county) newErrors.county = 'Required';
      if (!formData.location.trim()) newErrors.location = 'Required';
    }
    if (currentStep === 4) {
      if (selectedVendors.length === 0) newErrors.selectedVendors = 'Select at least one vendor';
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
          location: formData.location,
          county: formData.county,
          budget_min: parseInt(formData.budget_min) || null,
          budget_max: parseInt(formData.budget_max) || null,
          timeline: formData.timeline,
          project_type: formData.projectType,
          payment_terms: formData.paymentTerms,
          deadline: formData.deadline ? new Date(formData.deadline) : null,
          rfq_type: 'direct',
          visibility: 'private',
          status: 'open',
          created_at: new Date(),
          published_at: new Date(),
        }])
        .select();

      if (rfqError) throw rfqError;

      if (rfqData && rfqData[0]) {
        const rfqId = rfqData[0].id;

        if (selectedVendors.length > 0) {
          const { error: recipientError } = await supabase
            .from('rfq_recipients')
            .insert(selectedVendors.map(vendorId => ({ rfq_id: rfqId, vendor_id: vendorId, recipient_type: 'direct' })));
          if (recipientError) throw recipientError;
        }

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">RFQ Sent Successfully!</h2>
          <p className="text-green-700 mb-4">Your RFQ has been sent to {selectedVendors.length} vendor(s)</p>
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
          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#5f6466' }}>Send Direct RFQ</h1>
          <p className="text-center text-gray-600 mb-8">Select specific vendors and send them your project request directly</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Direct RFQ Benefits</p>
                <p>Send your project details directly to specific vendors you've chosen. You control who receives your request.</p>
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
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 1: Project Basics</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                  <input type="text" name="projectTitle" placeholder="e.g., Kitchen Renovation" value={formData.projectTitle} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                  {errors.projectTitle && <p className="text-red-500 text-sm mt-1">{errors.projectTitle}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900">
                    <option value="">Select a category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea name="description" placeholder="Describe your project..." value={formData.description} onChange={handleInputChange} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Project Type *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {projectTypes.map(type => (
                      <label key={type.value} className="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="projectType" value={type.value} checked={formData.projectType === type.value} onChange={handleInputChange} className="mt-1 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{type.label}</p>
                          <p className="text-sm text-gray-600">{type.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.projectType && <p className="text-red-500 text-sm mt-1">{errors.projectType}</p>}
                </div>

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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Desired Quote Deadline</label>
                  <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                  <p className="text-xs text-gray-500 mt-1">Date when you need to receive quotes by</p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 2: Specifications</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Material/Service Requirements *</label>
                  <textarea name="materialRequirements" placeholder="Detail the requirements..." value={formData.materialRequirements} onChange={handleInputChange} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                  {errors.materialRequirements && <p className="text-red-500 text-sm mt-1">{errors.materialRequirements}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Dimensions (Optional)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" name="dimensions.length" placeholder="Length (m)" value={formData.dimensions.length} onChange={handleInputChange} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                    <input type="text" name="dimensions.width" placeholder="Width (m)" value={formData.dimensions.width} onChange={handleInputChange} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                    <input type="text" name="dimensions.height" placeholder="Height (m)" value={formData.dimensions.height} onChange={handleInputChange} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Quality Preferences</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" name="ecoFriendly" checked={formData.ecoFriendly} onChange={handleInputChange} className="mr-2" />
                      <span className="text-gray-700">Eco-friendly/Sustainable</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" name="budgetFriendly" checked={formData.budgetFriendly} onChange={handleInputChange} className="mr-2" />
                      <span className="text-gray-700">Budget-friendly</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" name="premiumQuality" checked={formData.premiumQuality} onChange={handleInputChange} className="mr-2" />
                      <span className="text-gray-700">Premium Quality</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Services Required *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map(service => (
                      <label key={service} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={formData.servicesRequired.includes(service)} onChange={() => toggleService(service)} className="mr-3" />
                        <span className="text-gray-700">{service}</span>
                      </label>
                    ))}
                  </div>
                  {errors.servicesRequired && <p className="text-red-500 text-sm mt-1">{errors.servicesRequired}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details</label>
                  <textarea name="additionalSpecs" placeholder="Any other specifications?" value={formData.additionalSpecs} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 3: Location & Site Details</h2>
                
                <LocationSelector
                  county={formData.county}
                  town={formData.location}
                  onCountyChange={(e) => {
                    setFormData({ ...formData, county: e.target.value });
                    setErrors({ ...errors, county: '' });
                  }}
                  onTownChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    setErrors({ ...errors, location: '' });
                  }}
                  required={true}
                  errorMessage={errors.county || errors.location}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Details</label>
                  <textarea name="locationDetails" placeholder="Site access, parking, etc." value={formData.locationDetails} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site Accessibility</label>
                  <select name="siteAccessibility" value={formData.siteAccessibility} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900">
                    <option value="easy">Easy Access</option>
                    <option value="moderate">Moderate Access</option>
                    <option value="difficult">Difficult Access</option>
                  </select>
                </div>

                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" name="multiStory" checked={formData.multiStory} onChange={handleInputChange} className="mr-3" />
                  <span className="text-gray-700">Multi-story building (special equipment)</span>
                </label>

                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" name="requiresEquipment" checked={formData.requiresEquipment} onChange={handleInputChange} className="mr-3" />
                  <span className="text-gray-700">Requires special equipment/machinery</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Preference</label>
                  <select name="deliveryPreference" value={formData.deliveryPreference} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900">
                    <option value="pickup">I will pick up</option>
                    <option value="delivery">Vendor should deliver</option>
                    <option value="quote">Quote delivery in RFQ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                  <select name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900">
                    {paymentTermsOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 4: Select Vendors</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 text-sm"><strong>Choose vendors</strong> to send this RFQ to directly.</p>
                </div>

                <input type="text" placeholder="Search vendors..." value={vendorSearch} onChange={(e) => setVendorSearch(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />

                {vendors.length === 0 ? (
                  <div className="text-center py-8 bg-blue-50 rounded-lg">
                    <p className="text-blue-700 font-semibold">No vendors available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vendors.filter(v => vendorSearch === '' || v.company_name?.toLowerCase().includes(vendorSearch.toLowerCase()) || v.location?.toLowerCase().includes(vendorSearch.toLowerCase())).map(vendor => (
                      <label key={vendor.id} className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg hover:bg-orange-50 cursor-pointer">
                        <input type="checkbox" checked={selectedVendors.includes(vendor.id)} onChange={() => handleVendorSelect(vendor.id)} className="mt-1 w-4 h-4" />
                        <div>
                          <p className="font-semibold text-gray-900">{vendor.company_name}</p>
                          <p className="text-sm text-gray-600">{vendor.location}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {errors.selectedVendors && <p className="text-red-500 text-sm">{errors.selectedVendors}</p>}
                {selectedVendors.length > 0 && <div className="p-3 bg-green-50 border border-green-200 rounded-lg"><p className="text-green-700 font-semibold">{selectedVendors.length} vendor(s) selected</p></div>}
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 5: Review Your RFQ</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3"><span className="text-orange-600">✓</span> Project Details</h3>
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
                        <dd className="text-gray-600">{formData.location}, {formData.county}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3"><span className="text-orange-600">✓</span> Recipients</h3>
                    <p className="text-sm text-gray-600 mb-3"><strong>{selectedVendors.length}</strong> vendor(s) will receive this RFQ</p>
                    <ul className="space-y-1 text-sm">
                      {vendors.filter(v => selectedVendors.includes(v.id)).map(v => <li key={v.id} className="text-gray-600">• {v.company_name}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-900 text-sm"><strong>Ready to send?</strong> Vendors will be notified and can submit quotes directly to you.</p>
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
              {currentStep < 5 ? (
                <button type="button" onClick={nextStep} className="ml-auto flex items-center gap-2 px-6 py-2 text-white rounded-lg hover:opacity-90" style={{ backgroundColor: '#ea8f1e' }}>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="ml-auto px-8 py-2 text-white rounded-lg hover:opacity-90 font-semibold disabled:bg-gray-400" style={!loading ? { backgroundColor: '#ea8f1e' } : {}}>
                  {loading ? 'Sending...' : 'Send RFQ'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
