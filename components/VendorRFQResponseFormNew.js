'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Upload, Send, Save, MessageSquare, ChevronDown, ChevronUp, 
  Plus, Trash2, Calendar, Clock, Shield, DollarSign, 
  Wrench, FileText, HelpCircle, Check, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// ============================================================================
// ACCORDION COMPONENT
// ============================================================================
const AccordionSection = ({ title, icon: Icon, isOpen, onToggle, required, complete, children }) => (
  <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
        isOpen ? 'bg-orange-50 border-b border-gray-200' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className={`w-5 h-5 ${isOpen ? 'text-orange-600' : 'text-gray-500'}`} />}
        <span className={`font-medium ${isOpen ? 'text-orange-800' : 'text-gray-700'}`}>
          {title}
        </span>
        {required && <span className="text-xs text-red-500 font-medium">Required</span>}
        {complete && !isOpen && (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" /> Complete
          </span>
        )}
      </div>
      {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
    </button>
    {isOpen && <div className="p-4 bg-white">{children}</div>}
  </div>
);

// ============================================================================
// FORM FIELD COMPONENTS
// ============================================================================
const FormField = ({ label, required, hint, children }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

const SelectField = ({ label, required, hint, value, onChange, options, placeholder }) => (
  <FormField label={label} required={required} hint={hint}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </FormField>
);

const NumberField = ({ label, required, hint, value, onChange, placeholder, prefix, min }) => (
  <FormField label={label} required={required} hint={hint}>
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{prefix}</span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        className={`w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 ${prefix ? 'pl-12' : ''}`}
      />
    </div>
  </FormField>
);

const TextField = ({ label, required, hint, value, onChange, placeholder, rows }) => (
  <FormField label={label} required={required} hint={hint}>
    {rows ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
    )}
  </FormField>
);

const DateField = ({ label, required, hint, value, onChange }) => (
  <FormField label={label} required={required} hint={hint}>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
    />
  </FormField>
);

const ToggleField = ({ label, hint, checked, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
    <div>
      <span className="font-medium text-gray-700">{label}</span>
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'left-7' : 'left-1'}`} />
    </button>
  </div>
);

const MultiSelectField = ({ label, hint, options, selected, onChange }) => (
  <FormField label={label} hint={hint}>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              if (isSelected) {
                onChange(selected.filter(v => v !== opt.value));
              } else {
                onChange([...selected, opt.value]);
              }
            }}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              isSelected 
                ? 'bg-orange-100 border-orange-300 text-orange-700' 
                : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </FormField>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function VendorRFQResponseForm({ rfqId, rfqDetails }) {
  // Form state
  const [formData, setFormData] = useState({
    // Quote Basics
    amount_total: '',
    quote_type: 'labour_materials',
    pricing_mode: 'firm',
    amount_min: '',
    amount_max: '',
    price_confidence: 'firm',
    validity_days: '14',
    
    // Cost Breakdown
    cost_breakdown_type: 'simple',
    cost_breakdown: { labour: '', materials: '', transport: '', other: '', notes: '' },
    line_items: [],
    
    // Site Visit
    site_visit_required: false,
    site_visit_pricing_type: 'free',
    site_visit_fee: '',
    site_visit_date_earliest: '',
    site_visit_date_latest: '',
    site_visit_covers: [],
    estimation_basis: 'based_on_rfq_only',
    
    // Timeline & Availability
    earliest_start_date: '',
    duration_value: '',
    duration_unit: 'days',
    team_availability: 'available_now',
    team_availability_date: '',
    working_hours_preference: 'flexible',
    
    // Materials & Standards
    materials_supplied_by: 'vendor_supplies',
    preferred_brands_specs: '',
    compliance_standards: [],
    
    // Payment & Terms
    payment_model: 'deposit_balance',
    deposit_percent: 30,
    payment_milestones: [],
    payment_inclusions: [],
    payment_exclusions: '',
    
    // Warranty & Aftercare
    warranty_offered: false,
    warranty_duration: '12_months',
    warranty_covers: [],
    
    // Attachments
    attachments: [],
  });

  // UI state
  const [openSections, setOpenSections] = useState([0]); // First section open by default
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [vendorId, setVendorId] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Toggle accordion section
  const toggleSection = (index) => {
    setOpenSections(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Update nested field (for cost_breakdown)
  const updateNestedField = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  // Load vendor profile and draft on mount
  useEffect(() => {
    loadVendorAndDraft();
  }, [rfqId]);

  const loadVendorAndDraft = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get vendor profile
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendor) {
        setVendorId(vendor.id);

        // Check for existing draft
        const { data: draft } = await supabase
          .from('rfq_quotes')
          .select('*')
          .eq('rfq_id', rfqId)
          .eq('vendor_id', vendor.id)
          .eq('status', 'draft')
          .single();

        if (draft) {
          setHasDraft(true);
          // Populate form from draft
          setFormData({
            amount_total: draft.amount_total?.toString() || '',
            quote_type: draft.quote_type || 'labour_materials',
            pricing_mode: draft.pricing_mode || 'firm',
            amount_min: draft.amount_min?.toString() || '',
            amount_max: draft.amount_max?.toString() || '',
            price_confidence: draft.price_confidence || 'firm',
            validity_days: '14', // Calculate from valid_until if needed
            cost_breakdown_type: draft.cost_breakdown_type || 'simple',
            cost_breakdown: draft.cost_breakdown_json || { labour: '', materials: '', transport: '', other: '', notes: '' },
            line_items: draft.line_items_json || [],
            site_visit_required: draft.site_visit_required || false,
            site_visit_pricing_type: draft.site_visit_pricing_type || 'free',
            site_visit_fee: draft.site_visit_fee?.toString() || '',
            site_visit_date_earliest: draft.site_visit_date_earliest || '',
            site_visit_date_latest: draft.site_visit_date_latest || '',
            site_visit_covers: draft.site_visit_covers || [],
            estimation_basis: draft.estimation_basis || 'based_on_rfq_only',
            earliest_start_date: draft.earliest_start_date || '',
            duration_value: draft.duration_value?.toString() || '',
            duration_unit: draft.duration_unit || 'days',
            team_availability: draft.team_availability || 'available_now',
            team_availability_date: draft.team_availability_date || '',
            working_hours_preference: draft.working_hours_preference || 'flexible',
            materials_supplied_by: draft.materials_supplied_by || 'vendor_supplies',
            preferred_brands_specs: draft.preferred_brands_specs || '',
            compliance_standards: draft.compliance_standards || [],
            payment_model: draft.payment_model || 'deposit_balance',
            deposit_percent: draft.deposit_percent || 30,
            payment_milestones: draft.payment_milestones || [],
            payment_inclusions: draft.payment_inclusions || [],
            payment_exclusions: draft.payment_exclusions || '',
            warranty_offered: draft.warranty_offered || false,
            warranty_duration: draft.warranty_duration || '12_months',
            warranty_covers: draft.warranty_covers || [],
            attachments: draft.attachments_json || [],
          });
          setLastSaved(new Date(draft.updated_at));
        }
      }
    } catch (err) {
      console.error('Error loading vendor/draft:', err);
    }
  };

  // Calculate valid_until date
  const getValidUntilDate = () => {
    const days = parseInt(formData.validity_days) || 14;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  // Prepare data for submission
  const prepareQuoteData = (status) => ({
    rfq_id: rfqId,
    vendor_id: vendorId,
    amount_total: parseFloat(formData.amount_total) || 0,
    quote_type: formData.quote_type,
    pricing_mode: formData.pricing_mode,
    amount_min: formData.pricing_mode === 'range' ? parseFloat(formData.amount_min) : null,
    amount_max: formData.pricing_mode === 'range' ? parseFloat(formData.amount_max) : null,
    currency: 'KES',
    price_confidence: formData.price_confidence,
    valid_until: getValidUntilDate(),
    site_visit_required: formData.site_visit_required,
    site_visit_pricing_type: formData.site_visit_required ? formData.site_visit_pricing_type : null,
    site_visit_fee: formData.site_visit_required && formData.site_visit_pricing_type !== 'free' 
      ? parseFloat(formData.site_visit_fee) : null,
    site_visit_date_earliest: formData.site_visit_required ? formData.site_visit_date_earliest : null,
    site_visit_date_latest: formData.site_visit_required ? formData.site_visit_date_latest : null,
    site_visit_covers: formData.site_visit_required ? formData.site_visit_covers : null,
    estimation_basis: !formData.site_visit_required ? formData.estimation_basis : null,
    earliest_start_date: formData.earliest_start_date,
    duration_value: parseInt(formData.duration_value) || 1,
    duration_unit: formData.duration_unit,
    team_availability: formData.team_availability,
    team_availability_date: formData.team_availability === 'scheduled' ? formData.team_availability_date : null,
    working_hours_preference: formData.working_hours_preference,
    materials_supplied_by: formData.materials_supplied_by,
    preferred_brands_specs: formData.preferred_brands_specs || null,
    compliance_standards: formData.compliance_standards.length > 0 ? formData.compliance_standards : null,
    payment_model: formData.payment_model,
    deposit_percent: formData.payment_model === 'deposit_balance' ? formData.deposit_percent : 0,
    payment_milestones: formData.payment_model === 'milestone_payments' ? formData.payment_milestones : null,
    payment_inclusions: formData.payment_inclusions.length > 0 ? formData.payment_inclusions : null,
    payment_exclusions: formData.payment_exclusions || null,
    warranty_offered: formData.warranty_offered,
    warranty_duration: formData.warranty_offered ? formData.warranty_duration : null,
    warranty_covers: formData.warranty_offered ? formData.warranty_covers : null,
    cost_breakdown_type: formData.cost_breakdown_type,
    cost_breakdown_json: formData.cost_breakdown_type === 'simple' ? formData.cost_breakdown : null,
    line_items_json: formData.cost_breakdown_type === 'line_items' ? formData.line_items : null,
    attachments_json: formData.attachments.length > 0 ? formData.attachments : null,
    status: status,
    updated_at: new Date().toISOString(),
  });

  // Validate before submission
  const validateForm = () => {
    const errors = [];
    
    if (!formData.amount_total || parseFloat(formData.amount_total) <= 0) {
      errors.push('Total quote amount is required and must be greater than 0');
    }
    
    if (formData.pricing_mode === 'range') {
      if (!formData.amount_min || !formData.amount_max) {
        errors.push('Range mode requires both minimum and maximum amounts');
      }
      if (parseFloat(formData.amount_min) >= parseFloat(formData.amount_max)) {
        errors.push('Minimum amount must be less than maximum amount');
      }
    }
    
    if (!formData.earliest_start_date) {
      errors.push('Earliest start date is required');
    }
    
    if (!formData.duration_value || parseInt(formData.duration_value) <= 0) {
      errors.push('Duration is required');
    }
    
    if (formData.site_visit_required && 
        formData.site_visit_pricing_type !== 'free' && 
        (!formData.site_visit_fee || parseFloat(formData.site_visit_fee) <= 0)) {
      errors.push('Site visit fee is required when charging');
    }
    
    return errors;
  };

  // Save draft
  const saveDraft = async () => {
    if (!vendorId) {
      setStatus({ type: 'error', message: 'Vendor profile not found' });
      return;
    }

    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const quoteData = prepareQuoteData('draft');
      
      // Check if draft exists
      const { data: existing } = await supabase
        .from('rfq_quotes')
        .select('id')
        .eq('rfq_id', rfqId)
        .eq('vendor_id', vendorId)
        .eq('status', 'draft')
        .single();

      let result;
      if (existing) {
        result = await supabase
          .from('rfq_quotes')
          .update(quoteData)
          .eq('id', existing.id);
      } else {
        result = await supabase
          .from('rfq_quotes')
          .insert(quoteData);
      }

      if (result.error) throw result.error;

      setLastSaved(new Date());
      setHasDraft(true);
      setStatus({ type: 'success', message: 'Draft saved successfully' });
    } catch (err) {
      console.error('Save draft error:', err);
      setStatus({ type: 'error', message: `Failed to save: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Submit quote
  const submitQuote = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setStatus({ type: 'error', message: errors.join('. ') });
      return;
    }

    if (!vendorId) {
      setStatus({ type: 'error', message: 'Vendor profile not found. Please complete registration first.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const quoteData = prepareQuoteData('submitted');
      
      // Check if draft exists to update, otherwise insert
      const { data: existing } = await supabase
        .from('rfq_quotes')
        .select('id')
        .eq('rfq_id', rfqId)
        .eq('vendor_id', vendorId)
        .in('status', ['draft'])
        .single();

      let result;
      if (existing) {
        result = await supabase
          .from('rfq_quotes')
          .update({ ...quoteData, submitted_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        result = await supabase
          .from('rfq_quotes')
          .insert({ ...quoteData, submitted_at: new Date().toISOString() });
      }

      if (result.error) throw result.error;

      setStatus({ type: 'success', message: '✅ Quote submitted successfully! The buyer will be notified.' });
      // Optionally redirect or disable form
    } catch (err) {
      console.error('Submit error:', err);
      setStatus({ type: 'error', message: `Failed to submit: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  // Add line item
  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { name: '', unit: 'lump_sum', qty: 1, unit_price: '', total: 0 }]
    }));
  };

  // Update line item
  const updateLineItem = (index, field, value) => {
    setFormData(prev => {
      const items = [...prev.line_items];
      items[index] = { ...items[index], [field]: value };
      // Auto-calculate total
      if (field === 'qty' || field === 'unit_price') {
        items[index].total = (parseFloat(items[index].qty) || 0) * (parseFloat(items[index].unit_price) || 0);
      }
      return { ...prev, line_items: items };
    });
  };

  // Remove line item
  const removeLineItem = (index) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }));
  };

  // Add milestone
  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      payment_milestones: [...prev.payment_milestones, { name: '', percentage: '', amount: '' }]
    }));
  };

  // Section completion check
  const isSectionComplete = (section) => {
    switch (section) {
      case 0: return !!formData.amount_total && parseFloat(formData.amount_total) > 0;
      case 1: return formData.cost_breakdown_type === 'simple' 
        ? (!!formData.cost_breakdown.labour || !!formData.cost_breakdown.materials)
        : formData.line_items.length > 0;
      case 2: return true; // Site visit is optional
      case 3: return !!formData.earliest_start_date && !!formData.duration_value;
      case 4: return true; // Materials optional
      case 5: return !!formData.payment_model;
      case 6: return true; // Warranty optional
      case 7: return true; // Attachments optional
      case 8: return true; // Questions optional
      default: return false;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="max-w-4xl mx-auto">
      {/* Status Message */}
      {status.message && (
        <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
          status.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {status.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span>{status.message}</span>
        </div>
      )}

      {/* Header with Actions */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-4 px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-800">Submit Your Quote</h2>
          {lastSaved && (
            <p className="text-xs text-gray-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving || submitting}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={submitQuote}
            disabled={saving || submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Quote'}
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SECTION 1: QUOTE BASICS */}
      {/* ================================================================ */}
      <AccordionSection
        title="Quote Basics"
        icon={DollarSign}
        isOpen={openSections.includes(0)}
        onToggle={() => toggleSection(0)}
        required
        complete={isSectionComplete(0)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField
            label="Total Quote Amount"
            required
            value={formData.amount_total}
            onChange={(v) => updateField('amount_total', v)}
            placeholder="e.g., 150000"
            prefix="KES"
            min={0}
          />
          
          <SelectField
            label="Quote Type"
            required
            value={formData.quote_type}
            onChange={(v) => updateField('quote_type', v)}
            options={[
              { value: 'labour_only', label: 'Labour Only' },
              { value: 'materials_only', label: 'Materials Only' },
              { value: 'labour_materials', label: 'Labour + Materials (Full Supply)' },
              { value: 'consultation_only', label: 'Consultation Only' },
            ]}
          />
          
          <SelectField
            label="Pricing Mode"
            required
            value={formData.pricing_mode}
            onChange={(v) => updateField('pricing_mode', v)}
            options={[
              { value: 'firm', label: 'Firm (Final Price)' },
              { value: 'estimate', label: 'Estimate (Subject to Site Visit)' },
              { value: 'range', label: 'Range (Min–Max)' },
            ]}
          />
          
          <SelectField
            label="Quote Validity"
            value={formData.validity_days}
            onChange={(v) => updateField('validity_days', v)}
            options={[
              { value: '7', label: '7 days' },
              { value: '14', label: '14 days' },
              { value: '30', label: '30 days' },
            ]}
          />
        </div>
        
        {formData.pricing_mode === 'range' && (
          <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <NumberField
              label="Minimum Amount"
              required
              value={formData.amount_min}
              onChange={(v) => updateField('amount_min', v)}
              prefix="KES"
              min={0}
            />
            <NumberField
              label="Maximum Amount"
              required
              value={formData.amount_max}
              onChange={(v) => updateField('amount_max', v)}
              prefix="KES"
              min={0}
            />
          </div>
        )}
      </AccordionSection>

      {/* ================================================================ */}
      {/* SECTION 2: COST BREAKDOWN */}
      {/* ================================================================ */}
      <AccordionSection
        title="Cost Breakdown"
        icon={FileText}
        isOpen={openSections.includes(1)}
        onToggle={() => toggleSection(1)}
        complete={isSectionComplete(1)}
      >
        {/* Toggle between simple and line items */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => updateField('cost_breakdown_type', 'simple')}
            className={`px-4 py-2 rounded-lg text-sm ${
              formData.cost_breakdown_type === 'simple'
                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            Simple Breakdown
          </button>
          <button
            type="button"
            onClick={() => updateField('cost_breakdown_type', 'line_items')}
            className={`px-4 py-2 rounded-lg text-sm ${
              formData.cost_breakdown_type === 'line_items'
                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            Detailed Line Items
          </button>
        </div>

        {formData.cost_breakdown_type === 'simple' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <NumberField
                label="Labour"
                value={formData.cost_breakdown.labour}
                onChange={(v) => updateNestedField('cost_breakdown', 'labour', v)}
                prefix="KES"
              />
              <NumberField
                label="Materials"
                value={formData.cost_breakdown.materials}
                onChange={(v) => updateNestedField('cost_breakdown', 'materials', v)}
                prefix="KES"
              />
              <NumberField
                label="Transport"
                value={formData.cost_breakdown.transport}
                onChange={(v) => updateNestedField('cost_breakdown', 'transport', v)}
                prefix="KES"
              />
              <NumberField
                label="Other"
                value={formData.cost_breakdown.other}
                onChange={(v) => updateNestedField('cost_breakdown', 'other', v)}
                prefix="KES"
              />
            </div>
            <TextField
              label="Notes / Additional Details"
              value={formData.cost_breakdown.notes}
              onChange={(v) => updateNestedField('cost_breakdown', 'notes', v)}
              placeholder="Any additional breakdown details..."
              rows={3}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2">Item</th>
                    <th className="text-left py-2 px-2">Unit</th>
                    <th className="text-left py-2 px-2 w-20">Qty</th>
                    <th className="text-left py-2 px-2 w-28">Unit Price</th>
                    <th className="text-left py-2 px-2 w-28">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.line_items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateLineItem(idx, 'name', e.target.value)}
                          placeholder="Item name"
                          className="w-full border border-gray-200 rounded p-1.5 text-sm"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={item.unit}
                          onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                          className="border border-gray-200 rounded p-1.5 text-sm"
                        >
                          <option value="lump_sum">Lump Sum</option>
                          <option value="per_sqm">Per sqm</option>
                          <option value="per_meter">Per meter</option>
                          <option value="per_point">Per point</option>
                          <option value="per_day">Per day</option>
                          <option value="per_unit">Per unit</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateLineItem(idx, 'qty', e.target.value)}
                          className="w-full border border-gray-200 rounded p-1.5 text-sm"
                          min={1}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)}
                          className="w-full border border-gray-200 rounded p-1.5 text-sm"
                          min={0}
                        />
                      </td>
                      <td className="py-2 px-2 text-gray-700 font-medium">
                        KES {(item.total || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
            >
              <Plus className="w-4 h-4" /> Add Line Item
            </button>
            
            {formData.line_items.length > 0 && (
              <div className="text-right font-medium text-gray-700">
                Line Items Total: KES {formData.line_items.reduce((sum, item) => sum + (item.total || 0), 0).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </AccordionSection>

      {/* ================================================================ */}
      {/* SECTION 3: SITE VISIT */}
      {/* ================================================================ */}
      <AccordionSection
        title="Site Visit"
        icon={Calendar}
        isOpen={openSections.includes(2)}
        onToggle={() => toggleSection(2)}
        complete={isSectionComplete(2)}
      >
        <ToggleField
          label="Do you require a site visit before confirming final price?"
          checked={formData.site_visit_required}
          onChange={(v) => updateField('site_visit_required', v)}
        />

        {formData.site_visit_required ? (
          <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <SelectField
              label="Site Visit Pricing"
              value={formData.site_visit_pricing_type}
              onChange={(v) => updateField('site_visit_pricing_type', v)}
              options={[
                { value: 'free', label: 'Free' },
                { value: 'charged_deductible', label: 'Charged (Deducted if Hired)' },
                { value: 'charged_nonrefundable', label: 'Charged (Non-refundable)' },
              ]}
            />
            
            {formData.site_visit_pricing_type !== 'free' && (
              <NumberField
                label="Site Visit Fee"
                required
                value={formData.site_visit_fee}
                onChange={(v) => updateField('site_visit_fee', v)}
                prefix="KES"
                min={0}
              />
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <DateField
                label="Available From"
                value={formData.site_visit_date_earliest}
                onChange={(v) => updateField('site_visit_date_earliest', v)}
              />
              <DateField
                label="Available Until"
                value={formData.site_visit_date_latest}
                onChange={(v) => updateField('site_visit_date_latest', v)}
              />
            </div>
            
            <MultiSelectField
              label="What Site Visit Covers"
              options={[
                { value: 'measurements', label: 'Measurements' },
                { value: 'condition_assessment', label: 'Condition Assessment' },
                { value: 'access_check', label: 'Access/Logistics Check' },
                { value: 'boq', label: 'Bill of Quantities' },
                { value: 'design_advice', label: 'Design/Technical Advice' },
              ]}
              selected={formData.site_visit_covers}
              onChange={(v) => updateField('site_visit_covers', v)}
            />
          </div>
        ) : (
          <div className="mt-4">
            <SelectField
              label="How did you estimate this quote?"
              value={formData.estimation_basis}
              onChange={(v) => updateField('estimation_basis', v)}
              options={[
                { value: 'based_on_rfq_only', label: 'Based on RFQ Details Only' },
                { value: 'based_on_drawings', label: 'Based on Drawings/Photos Provided' },
                { value: 'similar_previous_project', label: 'Based on Similar Previous Project' },
              ]}
            />
          </div>
        )}
      </AccordionSection>

      {/* ================================================================ */}
      {/* SECTION 4: TIMELINE & AVAILABILITY */}
      {/* ================================================================ */}
      <AccordionSection
        title="Timeline & Availability"
        icon={Clock}
        isOpen={openSections.includes(3)}
        onToggle={() => toggleSection(3)}
        required
        complete={isSectionComplete(3)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateField
            label="Earliest Start Date"
            required
            value={formData.earliest_start_date}
            onChange={(v) => updateField('earliest_start_date', v)}
          />
          
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Estimated Duration"
              required
              value={formData.duration_value}
              onChange={(v) => updateField('duration_value', v)}
              min={1}
            />
            <SelectField
              label="Unit"
              value={formData.duration_unit}
              onChange={(v) => updateField('duration_unit', v)}
              options={[
                { value: 'days', label: 'Days' },
                { value: 'weeks', label: 'Weeks' },
              ]}
            />
          </div>
          
          <SelectField
            label="Team Availability"
            value={formData.team_availability}
            onChange={(v) => updateField('team_availability', v)}
            options={[
              { value: 'available_now', label: 'Available Now' },
              { value: 'available_soon', label: 'Available Soon' },
              { value: 'scheduled', label: 'Scheduled (Specify Date)' },
            ]}
          />
          
          {formData.team_availability === 'scheduled' && (
            <DateField
              label="Available From Date"
              value={formData.team_availability_date}
              onChange={(v) => updateField('team_availability_date', v)}
            />
          )}
          
          <SelectField
            label="Working Hours Preference"
            value={formData.working_hours_preference}
            onChange={(v) => updateField('working_hours_preference', v)}
            options={[
              { value: 'weekdays', label: 'Weekdays Only' },
              { value: 'weekends', label: 'Weekends Only' },
              { value: 'flexible', label: 'Flexible' },
            ]}
          />
        </div>
      </AccordionSection>

      {/* ================================================================ */}
      {/* SECTION 5: MATERIALS & STANDARDS */}
      {/* ================================================================ */}
      <AccordionSection
        title="Materials & Standards"
        icon={Wrench}
        isOpen={openSections.includes(4)}
        onToggle={() => toggleSection(4)}
        complete={isSectionComplete(4)}
      >
        <SelectField
          label="Who Supplies Materials?"
          value={formData.materials_supplied_by}
          onChange={(v) => updateField('materials_supplied_by', v)}
          options={[
            { value: 'vendor_supplies', label: 'Vendor Supplies' },
            { value: 'buyer_supplies', label: 'Buyer Supplies' },
            { value: 'either', label: 'Either (Flexible)' },
          ]}
        />
        
        <TextField
          label="Preferred Brands / Specifications"
          value={formData.preferred_brands_specs}
          onChange={(v) => updateField('preferred_brands_specs', v)}
          placeholder="e.g., Simba Cement, Crown Paints, specific gauge..."
          rows={2}
        />
        
        <MultiSelectField
          label="Compliance & Standards"
          hint="Select all that apply to your work"
          options={[
            { value: 'kebs_compliant', label: 'KEBS Compliant Materials' },
            { value: 'epra_compliant', label: 'EPRA Electrical Compliance' },
            { value: 'nca_compliant', label: 'NCA Compliance' },
            { value: 'warranty_backed', label: 'Warranty-Backed Installation' },
          ]}
          selected={formData.compliance_standards}
          onChange={(v) => updateField('compliance_standards', v)}
        />
      </AccordionSection>

      {/* ================================================================ */}
      {/* SECTION 6: PAYMENT & TERMS */}
      {/* ================================================================ */}
      <AccordionSection
        title="Payment & Terms"
        icon={DollarSign}
        isOpen={openSections.includes(5)}
        onToggle={() => toggleSection(5)}
        required
        complete={isSectionComplete(5)}
      >
        <SelectField
          label="Payment Model"
          required
          value={formData.payment_model}
          onChange={(v) => updateField('payment_model', v)}
          options={[
            { value: 'deposit_balance', label: 'Deposit + Balance' },
            { value: 'milestone_payments', label: 'Milestone Payments' },
            { value: 'pay_on_delivery', label: 'Pay on Delivery (Materials)' },
            { value: 'pay_on_completion', label: 'Pay on Completion' },
          ]}
        />
        
        {formData.payment_model === 'deposit_balance' && (
          <SelectField
            label="Deposit Percentage"
            value={formData.deposit_percent}
            onChange={(v) => updateField('deposit_percent', parseInt(v))}
            options={[
              { value: 0, label: '0% (No Deposit)' },
              { value: 20, label: '20%' },
              { value: 30, label: '30%' },
              { value: 50, label: '50%' },
            ]}
          />
        )}
        
        {formData.payment_model === 'milestone_payments' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Payment Milestones</label>
            {formData.payment_milestones.map((milestone, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={milestone.name}
                  onChange={(e) => {
                    const updated = [...formData.payment_milestones];
                    updated[idx].name = e.target.value;
                    updateField('payment_milestones', updated);
                  }}
                  placeholder="Milestone name"
                  className="flex-1 border border-gray-200 rounded p-2 text-sm"
                />
                <input
                  type="number"
                  value={milestone.percentage}
                  onChange={(e) => {
                    const updated = [...formData.payment_milestones];
                    updated[idx].percentage = e.target.value;
                    updateField('payment_milestones', updated);
                  }}
                  placeholder="%"
                  className="w-20 border border-gray-200 rounded p-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateField('payment_milestones', formData.payment_milestones.filter((_, i) => i !== idx));
                  }}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addMilestone}
              className="inline-flex items-center gap-2 text-sm text-orange-600"
            >
              <Plus className="w-4 h-4" /> Add Milestone
            </button>
          </div>
        )}
        
        <MultiSelectField
          label="What's Included"
          options={[
            { value: 'labour', label: 'Labour' },
            { value: 'materials', label: 'Materials' },
            { value: 'transport', label: 'Transport/Delivery' },
            { value: 'installation', label: 'Installation' },
            { value: 'cleanup', label: 'Cleanup' },
          ]}
          selected={formData.payment_inclusions}
          onChange={(v) => updateField('payment_inclusions', v)}
        />
        
        <TextField
          label="What's NOT Included (Exclusions)"
          value={formData.payment_exclusions}
          onChange={(v) => updateField('payment_exclusions', v)}
          placeholder="e.g., permits, scaffolding, third-party inspections..."
          rows={2}
          hint="Be clear about what's excluded to avoid disputes"
        />
      </AccordionSection>

      {/* ================================================================ */}
      {/* SECTION 7: WARRANTY & AFTERCARE */}
      {/* ================================================================ */}
      <AccordionSection
        title="Warranty & Aftercare"
        icon={Shield}
        isOpen={openSections.includes(6)}
        onToggle={() => toggleSection(6)}
        complete={isSectionComplete(6)}
      >
        <ToggleField
          label="Do you offer a warranty?"
          checked={formData.warranty_offered}
          onChange={(v) => updateField('warranty_offered', v)}
        />
        
        {formData.warranty_offered && (
          <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <SelectField
              label="Warranty Duration"
              value={formData.warranty_duration}
              onChange={(v) => updateField('warranty_duration', v)}
              options={[
                { value: '1_month', label: '1 Month' },
                { value: '3_months', label: '3 Months' },
                { value: '6_months', label: '6 Months' },
                { value: '12_months', label: '12 Months' },
                { value: '24_months', label: '24 Months' },
              ]}
            />
            
            <MultiSelectField
              label="Warranty Covers"
              options={[
                { value: 'workmanship', label: 'Workmanship Defects' },
                { value: 'materials', label: 'Material Defects' },
                { value: 'structural', label: 'Structural Issues' },
                { value: 'leaks', label: 'Leaks / Water Ingress' },
                { value: 'electrical', label: 'Electrical Faults' },
              ]}
              selected={formData.warranty_covers}
              onChange={(v) => updateField('warranty_covers', v)}
            />
          </div>
        )}
      </AccordionSection>

      {/* ================================================================ */}
      {/* SECTION 8: ATTACHMENTS & PORTFOLIO */}
      {/* ================================================================ */}
      <AccordionSection
        title="Attachments & Portfolio"
        icon={Upload}
        isOpen={openSections.includes(7)}
        onToggle={() => toggleSection(7)}
        complete={isSectionComplete(7)}
      >
        <p className="text-sm text-gray-600 mb-4">
          Upload supporting documents to strengthen your quote (optional)
        </p>
        
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Drag files here or click to upload
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Quotation PDF, BOQ, Product Datasheets, Past Work Photos
            </p>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                // Handle file upload - would integrate with S3/storage
                console.log('Files selected:', e.target.files);
              }}
            />
          </div>
          
          {formData.attachments.length > 0 && (
            <div className="space-y-2">
              {formData.attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      updateField('attachments', formData.attachments.filter((_, i) => i !== idx));
                    }}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <TextField
          label="Portfolio Links (Optional)"
          value={formData.portfolio_links || ''}
          onChange={(v) => updateField('portfolio_links', v)}
          placeholder="e.g., https://yourportfolio.com, instagram.com/yourwork"
          hint="Add links to your portfolio or past work examples"
        />
      </AccordionSection>

      {/* ================================================================ */}
      {/* SECTION 9: QUESTIONS TO BUYER */}
      {/* ================================================================ */}
      <AccordionSection
        title="Questions to Buyer"
        icon={HelpCircle}
        isOpen={openSections.includes(8)}
        onToggle={() => toggleSection(8)}
        complete={isSectionComplete(8)}
      >
        <p className="text-sm text-gray-600 mb-4">
          Need more information? Ask the buyer a question (optional)
        </p>
        
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              onClick={() => {/* Would open question composer */}}
            >
              Do you have drawings/photos to share?
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              onClick={() => {/* Would open question composer */}}
            >
              Is access suitable for delivery truck?
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              onClick={() => {/* Would open question composer */}}
            >
              Any preferred brands/finishes?
            </button>
          </div>
          
          <TextField
            label="Your Question"
            value={formData.question_to_buyer || ''}
            onChange={(v) => updateField('question_to_buyer', v)}
            placeholder="Type your question here..."
            rows={3}
          />
          
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            onClick={() => {/* Would send question via messaging system */}}
          >
            <MessageSquare className="w-4 h-4" /> Send Question to Buyer
          </button>
        </div>
      </AccordionSection>

      {/* Bottom Actions (Mobile) */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 px-4 py-3 mt-6 flex gap-2 md:hidden">
        <button
          type="button"
          onClick={saveDraft}
          disabled={saving || submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={submitQuote}
          disabled={saving || submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
