/* 
  ============================================================================
  RFQ SUBMIT FLOW - CODE TEMPLATES & EXAMPLES
  ============================================================================
  
  This file contains reusable code snippets for implementing the complete
  RFQ submit flow (frontend + backend).
  
  Use these as templates for your actual implementation.
*/

// ============================================================================
// BACKEND: Check Eligibility Endpoint
// ============================================================================

// File: /app/api/rfq/check-eligibility/route.js

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, rfq_type } = body;

    // 1. Auth check
    if (!user_id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // 2. Verification check
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone_verified, email_verified')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.phone_verified || !user.email_verified) {
      return NextResponse.json({
        eligible: false,
        reason: 'Must verify phone and email',
        phone_verified: user.phone_verified,
        email_verified: user.email_verified
      }, { status: 200 });
    }

    // 3. Count RFQs this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const { count: rfqCount, error: countError } = await supabase
      .from('rfqs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('status', 'submitted')
      .gte('created_at', thisMonth.toISOString());

    if (countError) {
      console.error('[CHECK-ELIGIBILITY] Count error:', countError);
      return NextResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    }

    // 4. Determine eligibility
    const FREE_RFQ_LIMIT = 3;
    const EXTRA_RFQ_COST = 300; // KES

    const remaining_free = Math.max(0, FREE_RFQ_LIMIT - (rfqCount || 0));
    const requires_payment = remaining_free === 0;

    return NextResponse.json({
      eligible: true,
      remaining_free,
      requires_payment,
      amount: requires_payment ? EXTRA_RFQ_COST : 0,
      message: remaining_free > 0
        ? `You have ${remaining_free} free RFQs remaining this month`
        : 'You have used your free RFQs. Each additional RFQ costs KES 300.'
    }, { status: 200 });

  } catch (err) {
    console.error('[CHECK-ELIGIBILITY] Error:', err);
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// FRONTEND: Form Validation Hook
// ============================================================================

// File: /hooks/useRFQFormValidation.js

export function useRFQFormValidation() {
  function validateRFQForm(formData, rfqType, categoryFields) {
    const errors = [];

    // Common required fields
    if (!formData.projectTitle || formData.projectTitle.trim() === '') {
      errors.push('Project title is required');
    }
    if (!formData.projectSummary || formData.projectSummary.trim() === '') {
      errors.push('Project summary is required');
    }
    if (!formData.selectedCategory) {
      errors.push('Category is required');
    }
    if (!formData.county) {
      errors.push('County is required');
    }
    if (!formData.town || formData.town.trim() === '') {
      errors.push('Town is required');
    }
    if (!formData.budgetMin || !formData.budgetMax) {
      errors.push('Budget range is required');
    }
    if (formData.budgetMin && formData.budgetMax && formData.budgetMin > formData.budgetMax) {
      errors.push('Minimum budget cannot exceed maximum budget');
    }

    // Type-specific validation
    if (rfqType === 'direct') {
      if (!formData.selectedVendors || formData.selectedVendors.length === 0) {
        errors.push('Select at least one vendor');
      }
    }

    if (rfqType === 'public') {
      if (!formData.visibilityScope) {
        errors.push('Select visibility scope (county or nationwide)');
      }
    }

    // Category-specific template fields
    if (categoryFields && Array.isArray(categoryFields)) {
      for (const field of categoryFields) {
        if (field.required) {
          const fieldValue = formData.templateFields?.[field.name];
          if (!fieldValue || fieldValue.trim?.() === '') {
            errors.push(`${field.label} is required`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  return { validateRFQForm };
}

// ============================================================================
// FRONTEND: RFQ Submit Handler (Main Flow)
// ============================================================================

// File: /components/RFQModal/useRFQSubmit.js

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/router'; // or 'next/navigation' for App Router
import { useCallback, useState } from 'react';

export function useRFQSubmit() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Main submission handler
  const handleSubmit = useCallback(async (formData, rfqType) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Show auth modal (handle externally)
        throw new Error('Please sign in to continue');
      }

      // Step 2: Verification
      const { data: userData } = await supabase
        .from('users')
        .select('phone_verified, email_verified')
        .eq('id', user.id)
        .single();

      if (!userData?.phone_verified || !userData?.email_verified) {
        throw new Error('Please verify your email and phone to continue');
      }

      // Step 3: Eligibility check
      const eligResponse = await fetch('/api/rfq/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          rfq_type: rfqType
        })
      });

      const eligibility = await eligResponse.json();

      if (!eligibility.eligible) {
        throw new Error(eligibility.reason || 'You are not eligible to submit RFQs');
      }

      // Step 3.5: Handle payment if needed
      if (eligibility.requires_payment) {
        // Show payment modal (handle externally)
        throw new Error('Payment required. Please complete payment to continue.');
      }

      // Step 4: Final submit
      const createResponse = await fetch('/api/rfq/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfqType,
          categorySlug: formData.selectedCategory,
          jobTypeSlug: formData.selectedJobType,
          templateFields: formData.templateFields,
          sharedFields: {
            projectTitle: formData.projectTitle,
            projectSummary: formData.projectSummary,
            county: formData.county,
            town: formData.town,
            budgetMin: formData.budgetMin,
            budgetMax: formData.budgetMax,
            directions: formData.directions,
            desiredStartDate: formData.desiredStartDate
          },
          selectedVendors: formData.selectedVendors || [],
          userId: user.id,
          visibilityScope: formData.visibilityScope
        })
      });

      const result = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(result.error || 'Failed to create RFQ');
      }

      // Success!
      clearDraft();
      showSuccessToast('RFQ submitted successfully! ✅');
      router.push(`/rfq/${result.rfqId}`);

    } catch (err) {
      setError(err.message);
      showErrorToast(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  const clearDraft = () => {
    localStorage.removeItem('rfq_form_draft');
  };

  return { handleSubmit, isSubmitting, error };
}

// ============================================================================
// FRONTEND: Verification Modal Component
// ============================================================================

// File: /components/modals/VerificationModal.jsx

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function VerificationModal({
  isOpen,
  onClose,
  onSuccess,
  phoneVerified,
  emailVerified
}) {
  const [step, setStep] = useState('email'); // 'email' | 'phone' | 'complete'
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleEmailVerification = async () => {
    setLoading(true);
    try {
      // Send OTP to email
      const response = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      // Show OTP input
      const otpInput = prompt('Enter OTP sent to your email:');
      if (!otpInput) return;

      // Verify OTP
      const verifyResponse = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpInput })
      });

      if (!verifyResponse.ok) {
        throw new Error('Invalid OTP');
      }

      // Move to phone verification
      setStep('phone');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerification = async () => {
    setLoading(true);
    try {
      // Send OTP to phone
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      // Show OTP input
      const otpInput = prompt('Enter OTP sent to your phone:');
      if (!otpInput) return;

      // Verify OTP
      const verifyResponse = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpInput })
      });

      if (!verifyResponse.ok) {
        throw new Error('Invalid OTP');
      }

      // All verified!
      setStep('complete');
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Verify Your Account</h2>
        <div className="progress-bar">
          <div className={`step ${step === 'email' || step === 'phone' || step === 'complete' ? 'active' : ''}`}>
            Email
          </div>
          <div className={`step ${step === 'phone' || step === 'complete' ? 'active' : ''}`}>
            Phone
          </div>
          <div className={`step ${step === 'complete' ? 'active' : ''}`}>
            Complete
          </div>
        </div>

        {step === 'email' && !emailVerified && (
          <div>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            <button onClick={handleEmailVerification} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 'phone' && !phoneVerified && (
          <div>
            <label>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone (254...)"
            />
            <button onClick={handlePhoneVerification} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className="success-message">
            ✅ Account verified! You can now submit RFQs.
          </div>
        )}

        <button onClick={onClose} className="secondary">
          {step === 'complete' ? 'Continue' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// FRONTEND: Draft Management
// ============================================================================

// File: /hooks/useDraft.js

export function useDraft(storageKey = 'rfq_form_draft') {
  const saveDraft = (formData) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(storageKey);
      return draft ? JSON.parse(draft) : null;
    } catch (err) {
      console.error('Failed to load draft:', err);
      return null;
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.error('Failed to clear draft:', err);
    }
  };

  return { saveDraft, loadDraft, clearDraft };
}

// ============================================================================
// BACKEND: Vendor Matching (Wizard RFQ)
// ============================================================================

// File: /lib/vendorMatching.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function autoMatchVendors(rfqId, categorySlug, county) {
  try {
    // Query vendors by category
    const { data: candidates, error } = await supabase
      .from('vendors')
      .select('id, primary_category, secondary_categories, rating, verified_docs, response_rate, county, subscription_active')
      .or(
        `primary_category.eq.${categorySlug},` +
        `secondary_categories.contains.[${categorySlug}]`
      )
      .eq('subscription_active', true)
      .order('rating', { ascending: false })
      .order('response_rate', { ascending: false })
      .limit(5); // Top 5-10 vendors

    if (error) {
      console.error('[AUTO-MATCH] Query error:', error);
      return [];
    }

    // Filter by county if provided
    let matched = candidates || [];
    if (county) {
      matched = matched.filter(v => v.county === county);
    }

    // Create recipient records
    const recipientRecords = matched.map(vendor => ({
      rfq_id: rfqId,
      vendor_id: vendor.id,
      recipient_type: 'wizard',
      status: 'sent'
    }));

    // Insert recipients
    const { error: insertError } = await supabase
      .from('rfq_recipients')
      .insert(recipientRecords);

    if (insertError) {
      console.error('[AUTO-MATCH] Insert error:', insertError);
    }

    return matched;
  } catch (err) {
    console.error('[AUTO-MATCH] Error:', err);
    return [];
  }
}

export async function getTopVendorsForCategory(categorySlug, county, limit = 20) {
  try {
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('id, name, primary_category, secondary_categories, rating, verified_docs, subscription_active, avatar_url')
      .or(
        `primary_category.eq.${categorySlug},` +
        `secondary_categories.contains.[${categorySlug}]`
      )
      .eq('subscription_active', true)
      .order('rating', { ascending: false })
      .order('verified_docs', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[TOP-VENDORS] Query error:', error);
      return [];
    }

    return vendors || [];
  } catch (err) {
    console.error('[TOP-VENDORS] Error:', err);
    return [];
  }
}

// ============================================================================
// BACKEND: Input Sanitization
// ============================================================================

// File: /lib/sanitize.js

import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags and scripts
  const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  
  // Remove extra whitespace
  return cleaned.trim();
}

export function sanitizeObject(obj) {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// ============================================================================
// FRONTEND: RFQ Detail Page Data Fetching
// ============================================================================

// File: /pages/rfq/[id].jsx (or /app/rfq/[id]/page.jsx)

import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function RFQDetailPage({ rfqId }) {
  const [rfq, setRfq] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRFQData();
  }, [rfqId]);

  const fetchRFQData = async () => {
    try {
      // Fetch RFQ details
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfqId)
        .single();

      if (rfqError) throw rfqError;
      setRfq(rfqData);

      // Fetch recipients with vendor details
      const { data: recipientData, error: recipientError } = await supabase
        .from('rfq_recipients')
        .select(`
          id,
          vendor_id,
          recipient_type,
          status,
          vendors (
            id,
            name,
            rating,
            avatar_url,
            primary_category
          )
        `)
        .eq('rfq_id', rfqId);

      if (recipientError) throw recipientError;
      setRecipients(recipientData || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!rfq) return <div>RFQ not found</div>;

  return (
    <div className="rfq-detail">
      <h1>{rfq.title}</h1>
      <p>{rfq.description}</p>
      
      <div className="info-grid">
        <div>Category: {rfq.category}</div>
        <div>Location: {rfq.location}, {rfq.county}</div>
        <div>Budget: {rfq.budget_estimate}</div>
        <div>Status: {rfq.status}</div>
      </div>

      <div className="status-tracker">
        <h3>Status Tracker</h3>
        <div className="timeline">
          <div className="step completed">Sent to {recipients.length} vendors ✅</div>
          <div className="step">Viewed by vendors</div>
          <div className="step">Quotes received</div>
        </div>
      </div>

      <div className="recipients-section">
        <h3>Vendors Sent To</h3>
        {recipients.map(recipient => (
          <div key={recipient.id} className="vendor-card">
            <img src={recipient.vendors.avatar_url} alt={recipient.vendors.name} />
            <div>
              <h4>{recipient.vendors.name}</h4>
              <p>Rating: {recipient.vendors.rating} ⭐</p>
              <p>Status: {recipient.status}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        <button>Close RFQ</button>
        <button>Extend Deadline</button>
        <button>Send to More Vendors</button>
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  return {
    props: {
      rfqId: params.id
    }
  };
}

// ============================================================================
// END OF TEMPLATES
// ============================================================================
