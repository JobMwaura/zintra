# Vendor Verification Document Update & Resubmission System

## Overview

This document describes how vendors can update their verification documents when business details change (tax number, business permit expiration, ownership changes, etc.).

---

## Current System Analysis

### ✅ What's Already Built

1. **`submission_number` field**: Tracks number of resubmissions
2. **`can_resubmit` function**: Checks if vendor can resubmit
3. **RLS Policy**: Vendors can update pending/more_info_needed documents
4. **Constraint**: `UNIQUE(vendor_id, status)` prevents multiple pending submissions

### ❌ What's Missing

1. **No UI for updates**: Verified vendors can't update documents
2. **No expiry tracking**: System doesn't notify vendors of expiring documents
3. **No version history**: Old documents are overwritten, not archived
4. **No update reasons**: System doesn't track why document was updated
5. **Verification loss handling**: What happens to verified badge during review?

---

## Business Scenarios

### Scenario 1: Document Expiration
**Example**: Business permit expires, vendor uploads renewed permit
- ✅ **Should happen**: Admin reviews, updates expiry date, maintains verification
- ❌ **Current system**: No way to update without losing verification

### Scenario 2: Business Information Change
**Example**: Tax number changes, ownership changes, business name changes
- ✅ **Should happen**: Vendor submits updated document, admin reviews
- ❌ **Current system**: Creates new pending submission, may conflict with unique constraint

### Scenario 3: Admin Requests Update
**Example**: Admin notices document quality issue, requests better scan
- ✅ **Should happen**: Vendor resubmits, keeps pending status
- ❌ **Current system**: Partially works with `more_info_needed` status

### Scenario 4: Preventive Update
**Example**: Vendor wants to update document before expiration
- ✅ **Should happen**: Smooth update process, no downtime
- ❌ **Current system**: No UI or workflow for this

---

## Proposed Solution: Verification Update System

### Architecture

```
vendor_verification_documents
├── Current verified document (status: 'approved')
└── Update submission (status: 'pending_update')

On approval of update:
1. Archive old document (status: 'superseded')
2. Activate new document (status: 'approved')
3. Update vendors table with new info
4. Maintain verification badge (no interruption)
```

### New Database Fields

```sql
-- Add to vendor_verification_documents table
ALTER TABLE vendor_verification_documents
  ADD COLUMN IF NOT EXISTS supersedes_document_id UUID REFERENCES vendor_verification_documents(id),
  ADD COLUMN IF NOT EXISTS superseded_by_document_id UUID REFERENCES vendor_verification_documents(id),
  ADD COLUMN IF NOT EXISTS update_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_renewal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expiry_notification_sent_at TIMESTAMPTZ;

-- New status values
-- 'pending_update' - Update submitted, under review (vendor keeps verification)
-- 'superseded' - Old document replaced by newer version
```

### Updated Status Flow

```
Initial Submission:
unverified → pending → approved/rejected

Document Update (Verified Vendor):
approved → pending_update (new submission)
         ↓ (on approval)
         approved (new) + superseded (old)

Document Renewal (Expiring):
approved → pending_update (renewal=true)
         ↓ (on approval)
         approved (new) + superseded (old)

Rejected Update:
pending_update → rejected_update
approved (old document still active)
```

---

## Implementation

### 1. Database Migration

```sql
-- File: supabase/sql/VENDOR_VERIFICATION_UPDATES.sql

-- Add new columns for document versioning and updates
ALTER TABLE public.vendor_verification_documents
  ADD COLUMN IF NOT EXISTS supersedes_document_id UUID REFERENCES public.vendor_verification_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_by_document_id UUID REFERENCES public.vendor_verification_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS update_reason TEXT,
    -- 'expiry_renewal' | 'information_change' | 'quality_improvement' | 'admin_request' | 'preventive_update'
  ADD COLUMN IF NOT EXISTS is_renewal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expiry_notification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS previous_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS update_type TEXT;
    -- 'renewal' | 'correction' | 'ownership_change' | 'regulatory_update'

-- Add index for finding superseded documents
CREATE INDEX IF NOT EXISTS idx_verification_docs_supersedes ON public.vendor_verification_documents(supersedes_document_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_superseded_by ON public.vendor_verification_documents(superseded_by_document_id);
CREATE INDEX IF NOT EXISTS idx_verification_docs_expiry ON public.vendor_verification_documents(expiry_date) WHERE status = 'approved';

-- Update constraint to allow pending_update status alongside approved
DROP INDEX IF EXISTS public.vendor_verification_documents_vendor_id_status_key;
ALTER TABLE public.vendor_verification_documents
  DROP CONSTRAINT IF EXISTS unique_vendor_pending_verification;

-- New constraint: Only one pending/pending_update per vendor
CREATE UNIQUE INDEX unique_vendor_active_submission 
  ON public.vendor_verification_documents(vendor_id)
  WHERE status IN ('pending', 'pending_update', 'more_info_needed');

-- Function to check if vendor can submit update
CREATE OR REPLACE FUNCTION public.can_vendor_update_verification(vendor_id_param UUID)
RETURNS TABLE (
  can_update BOOLEAN,
  reason TEXT,
  current_status TEXT,
  has_pending_update BOOLEAN,
  days_until_expiry INTEGER
) AS $$
DECLARE
  v_current_doc RECORD;
  v_pending_update BOOLEAN;
BEGIN
  -- Check if vendor has approved document
  SELECT * INTO v_current_doc
  FROM public.vendor_verification_documents
  WHERE vendor_id = vendor_id_param 
    AND status = 'approved'
    AND superseded_by_document_id IS NULL
  ORDER BY reviewed_at DESC
  LIMIT 1;

  -- Check if there's already a pending update
  SELECT EXISTS(
    SELECT 1 FROM public.vendor_verification_documents
    WHERE vendor_id = vendor_id_param 
      AND status IN ('pending_update', 'more_info_needed')
  ) INTO v_pending_update;

  IF v_current_doc IS NULL THEN
    -- No approved document, can't update (must do initial submission)
    RETURN QUERY SELECT 
      false,
      'No approved verification document found',
      NULL::TEXT,
      v_pending_update,
      NULL::INTEGER;
  ELSIF v_pending_update THEN
    -- Already has pending update
    RETURN QUERY SELECT 
      false,
      'Update already pending review',
      v_current_doc.status,
      true,
      EXTRACT(DAY FROM (v_current_doc.expiry_date - CURRENT_DATE))::INTEGER;
  ELSE
    -- Can submit update
    RETURN QUERY SELECT 
      true,
      'Can submit verification update',
      v_current_doc.status,
      false,
      EXTRACT(DAY FROM (v_current_doc.expiry_date - CURRENT_DATE))::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to handle document update approval
CREATE OR REPLACE FUNCTION public.approve_verification_update(
  update_document_id UUID,
  admin_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  old_document_id UUID,
  new_document_id UUID
) AS $$
DECLARE
  v_update_doc RECORD;
  v_old_doc RECORD;
BEGIN
  -- Get the update document
  SELECT * INTO v_update_doc
  FROM public.vendor_verification_documents
  WHERE id = update_document_id;

  IF v_update_doc IS NULL THEN
    RETURN QUERY SELECT false, 'Update document not found', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  IF v_update_doc.status != 'pending_update' THEN
    RETURN QUERY SELECT false, 'Document is not pending update', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Get the old approved document
  SELECT * INTO v_old_doc
  FROM public.vendor_verification_documents
  WHERE vendor_id = v_update_doc.vendor_id
    AND status = 'approved'
    AND superseded_by_document_id IS NULL
  ORDER BY reviewed_at DESC
  LIMIT 1;

  IF v_old_doc IS NULL THEN
    RETURN QUERY SELECT false, 'No existing approved document found', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Begin transaction (implicit in function)
  
  -- Update old document to superseded
  UPDATE public.vendor_verification_documents
  SET 
    status = 'superseded',
    superseded_by_document_id = update_document_id,
    updated_at = NOW()
  WHERE id = v_old_doc.id;

  -- Approve new document
  UPDATE public.vendor_verification_documents
  SET 
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by_admin_id = admin_id,
    supersedes_document_id = v_old_doc.id,
    updated_at = NOW()
  WHERE id = update_document_id;

  -- Update vendor table (verification remains active)
  UPDATE public.vendors
  SET 
    verified_at = NOW(),
    verified_by_admin_id = admin_id,
    updated_at = NOW()
  WHERE id = v_update_doc.vendor_id;

  -- Log to history
  INSERT INTO public.vendor_verification_history (
    vendor_id,
    document_id,
    action,
    status_before,
    status_after,
    performed_by_admin_id,
    notes
  ) VALUES (
    v_update_doc.vendor_id,
    update_document_id,
    'update_approved',
    'pending_update',
    'approved',
    admin_id,
    'Verification document updated successfully. Old document: ' || v_old_doc.id
  );

  RETURN QUERY SELECT true, 'Verification update approved successfully', v_old_doc.id, update_document_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get vendor's document history
CREATE OR REPLACE FUNCTION public.get_vendor_document_history(vendor_id_param UUID)
RETURNS TABLE (
  document_id UUID,
  document_type TEXT,
  submission_date TIMESTAMPTZ,
  review_date TIMESTAMPTZ,
  status TEXT,
  expiry_date DATE,
  is_current BOOLEAN,
  supersedes UUID,
  superseded_by UUID,
  update_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vvd.id,
    vvd.document_type,
    vvd.submitted_at,
    vvd.reviewed_at,
    vvd.status,
    vvd.expiry_date,
    (vvd.status = 'approved' AND vvd.superseded_by_document_id IS NULL) as is_current,
    vvd.supersedes_document_id,
    vvd.superseded_by_document_id,
    vvd.update_reason
  FROM public.vendor_verification_documents vvd
  WHERE vvd.vendor_id = vendor_id_param
  ORDER BY vvd.submitted_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for expiring documents (for notifications)
CREATE OR REPLACE VIEW public.expiring_verification_documents AS
SELECT 
  vvd.id,
  vvd.vendor_id,
  v.business_name,
  v.user_id,
  vvd.document_type,
  vvd.expiry_date,
  EXTRACT(DAY FROM (vvd.expiry_date - CURRENT_DATE))::INTEGER as days_until_expiry,
  vvd.expiry_notification_sent_at,
  CASE 
    WHEN vvd.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN vvd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN vvd.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'expiring_warning'
    ELSE 'valid'
  END as expiry_status
FROM public.vendor_verification_documents vvd
JOIN public.vendors v ON vvd.vendor_id = v.id
WHERE vvd.status = 'approved'
  AND vvd.superseded_by_document_id IS NULL
  AND vvd.expiry_date IS NOT NULL
  AND vvd.expiry_date <= CURRENT_DATE + INTERVAL '60 days'
ORDER BY vvd.expiry_date ASC;

-- Grant permissions
GRANT SELECT ON public.expiring_verification_documents TO authenticated;

COMMENT ON VIEW public.expiring_verification_documents IS 'Shows verification documents that are expired or expiring within 60 days';
```

### 2. API Route for Document Updates

```javascript
// File: app/api/vendor/update-verification-document/route.js

import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '@/lib/supabaseClient';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, is_verified')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if vendor can update
    const { data: canUpdate, error: checkError } = await supabase
      .rpc('can_vendor_update_verification', { vendor_id_param: vendor.id });

    if (checkError || !canUpdate || !canUpdate[0]?.can_update) {
      return NextResponse.json({ 
        error: canUpdate?.[0]?.reason || 'Cannot submit update at this time' 
      }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const updateReason = formData.get('updateReason');
    const updateType = formData.get('updateType'); // renewal, correction, etc.
    const documentType = formData.get('documentType');
    const registeredBusinessName = formData.get('registeredBusinessName');
    const countryOfRegistration = formData.get('countryOfRegistration');
    const businessAddress = formData.get('businessAddress');
    const registrationNumber = formData.get('registrationNumber');
    const documentNumber = formData.get('documentNumber');
    const issueDate = formData.get('issueDate');
    const expiryDate = formData.get('expiryDate');

    if (!file || !updateReason) {
      return NextResponse.json({ 
        error: 'File and update reason are required' 
      }, { status: 400 });
    }

    // Validate file
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.'
      }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File size exceeds 10MB limit'
      }, { status: 400 });
    }

    // Upload to S3
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop();
    const fileName = `vendor-verification/${vendor.id}/${timestamp}-${randomString}-update.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        vendorId: vendor.id,
        uploadedBy: user.id,
        originalName: file.name,
        uploadType: 'verification_update',
        updateReason: updateReason,
      },
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;

    // Get current approved document
    const { data: currentDoc, error: currentDocError } = await supabase
      .from('vendor_verification_documents')
      .select('id, expiry_date')
      .eq('vendor_id', vendor.id)
      .eq('status', 'approved')
      .is('superseded_by_document_id', null)
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .single();

    if (currentDocError) {
      return NextResponse.json({ 
        error: 'No existing verification found to update' 
      }, { status: 400 });
    }

    // Insert new document with pending_update status
    const { data: newDoc, error: insertError } = await supabase
      .from('vendor_verification_documents')
      .insert({
        vendor_id: vendor.id,
        document_type: documentType,
        document_url: fileUrl,
        document_file_name: file.name,
        document_number: documentNumber,
        registered_business_name: registeredBusinessName,
        registration_number: registrationNumber,
        country_of_registration: countryOfRegistration,
        business_address: businessAddress,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        status: 'pending_update',
        supersedes_document_id: currentDoc.id,
        update_reason: updateReason,
        update_type: updateType,
        is_renewal: updateType === 'renewal',
        previous_expiry_date: currentDoc.expiry_date,
        submission_number: 1,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: 'Verification update submitted successfully',
      documentId: newDoc.id,
      fileUrl: fileUrl,
      s3Key: fileName,
    });

  } catch (error) {
    console.error('Error updating verification document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit update' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if vendor can update
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const { data: canUpdate } = await supabase
      .rpc('can_vendor_update_verification', { vendor_id_param: vendor.id });

    return NextResponse.json({
      canUpdate: canUpdate?.[0]?.can_update || false,
      reason: canUpdate?.[0]?.reason,
      currentStatus: canUpdate?.[0]?.current_status,
      hasPendingUpdate: canUpdate?.[0]?.has_pending_update,
      daysUntilExpiry: canUpdate?.[0]?.days_until_expiry,
    });

  } catch (error) {
    console.error('Error checking update eligibility:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}
```

### 3. Frontend: Update Verification Component

```javascript
// File: app/vendor/dashboard/verification/update/page.js

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, FileText, AlertCircle, Clock, RefreshCw, 
  Calendar, ShieldAlert, CheckCircle 
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

      // Pre-fill form
      if (docs) {
        setFormData(prev => ({
          ...prev,
          documentType: docs.document_type,
          registeredBusinessName: docs.registered_business_name,
          registrationNumber: docs.registration_number,
          countryOfRegistration: docs.country_of_registration,
          businessAddress: docs.business_address,
          documentNumber: docs.document_number,
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
        router.push('/vendor/dashboard');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Cannot update
  if (!canUpdate?.canUpdate) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cannot Update Verification
            </h1>
            <p className="text-gray-600 mb-6">{canUpdate?.reason}</p>
            
            {canUpdate?.hasPendingUpdate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800">
                  Your update is currently under review. You'll be notified once it's processed.
                </p>
              </div>
            )}

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

  // Success screen
  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Update Submitted Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Your verification document update is under review. 
              Your verification badge will remain active during the review process.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Update form
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
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
              <ShieldAlert className={`w-5 h-5 mt-0.5 mr-3 ${
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
                    ? 'Document Expired' 
                    : `Document Expiring in ${canUpdate.daysUntilExpiry} days`
                  }
                </p>
                <p className={`text-sm ${
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
            <h3 className="font-semibold text-gray-900 mb-2">Current Document</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium">{currentDocument.document_type}</span>
              </div>
              <div>
                <span className="text-gray-600">Submitted:</span>
                <span className="ml-2 font-medium">
                  {new Date(currentDocument.submitted_at).toLocaleDateString()}
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
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="renewal">Document Renewal (Expiry date extended)</option>
              <option value="correction">Information Correction</option>
              <option value="ownership_change">Ownership Change</option>
              <option value="regulatory_update">Regulatory Update</option>
            </select>
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Explain why you're updating the document..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Examples: "Business permit renewed", "Tax number changed", "New business owner"
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="document-upload"
                required
              />
              <label htmlFor="document-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Choose file
                </span>
                <span className="text-gray-600"> or drag and drop</span>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                PDF, JPG, or PNG (max 10MB)
              </p>
              {documentFile && (
                <div className="mt-4 flex items-center justify-center text-sm text-green-600">
                  <FileCheck className="w-4 h-4 mr-2" />
                  {documentFile.name}
                </div>
              )}
            </div>
          </div>

          {/* Business Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registered Business Name *
              </label>
              <input
                type="text"
                value={formData.registeredBusinessName}
                onChange={(e) => setFormData({ ...formData, registeredBusinessName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration/Document Number
              </label>
              <input
                type="text"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date (if applicable)
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/vendor/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Document History
            </h3>
            <div className="space-y-3">
              {documentHistory.map((doc, index) => (
                <div
                  key={doc.document_id}
                  className={`border rounded-lg p-4 ${
                    doc.is_current ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className={`w-5 h-5 mr-3 ${
                        doc.is_current ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {doc.document_type}
                          {doc.is_current && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(doc.submission_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded ${
                        doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                        doc.status === 'pending_update' ? 'bg-blue-100 text-blue-800' :
                        doc.status === 'superseded' ? 'bg-gray-100 text-gray-600' :
                        doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status}
                      </span>
                      {doc.update_reason && (
                        <p className="text-xs text-gray-500 mt-1">{doc.update_reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Summary of How It Works

### **What Happens When Vendor Updates Documents?**

1. **Vendor Submits Update**:
   - Uploads new document
   - Provides update reason (renewal, correction, etc.)
   - Status: `pending_update`
   - Old document status: Still `approved`
   - **Verification badge**: ✅ Remains active

2. **During Admin Review**:
   - Admin sees update request
   - Can compare old vs new document
   - Vendor keeps verification badge
   - Business listing remains prioritized

3. **Admin Approves Update**:
   - Function `approve_verification_update()` is called
   - Old document → Status: `superseded`
   - New document → Status: `approved`
   - Vendor table updated with new verification date
   - **Verification badge**: ✅ Still active (no interruption)

4. **Admin Rejects Update**:
   - New document → Status: `rejected_update`
   - Old document → Still `approved`
   - Vendor can resubmit
   - **Verification badge**: ✅ Remains from old document

5. **Document Expiry Tracking**:
   - View `expiring_verification_documents` shows expiring docs
   - System can send email notifications at 60/30/7 days
   - Vendor dashboard shows expiry warnings

---

## Benefits

✅ **No Downtime**: Verification badge active during review  
✅ **Version History**: All documents archived with superseded status  
✅ **Audit Trail**: Complete history of changes  
✅ **Expiry Tracking**: Proactive notifications for renewals  
✅ **Flexible Updates**: Handles corrections, renewals, ownership changes  
✅ **Admin Control**: Admin approves all changes  
✅ **Clear Workflow**: Separate status for updates (`pending_update`)

---

## Next Steps

1. **Deploy SQL migration** (adds new fields and functions)
2. **Create API route** for document updates
3. **Build update UI** (vendor dashboard)
4. **Update admin dashboard** to handle `pending_update` status
5. **Add expiry notifications** (cron job or scheduled function)
6. **Test workflow** end-to-end

Would you like me to implement any of these components?
