import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '@/lib/supabaseClient';

// Initialize S3 Client (shared with other uploads)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * POST /api/vendor/update-verification-document
 * Submit an update to existing verification document
 * 
 * Used when:
 * - Business permit expires and needs renewal
 * - Tax number changes
 * - Business ownership changes
 * - Information corrections needed
 * 
 * Benefits:
 * - Verification badge remains active during review
 * - Complete version history maintained
 * - Old document archived, not deleted
 */
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
      .select('id, business_name, is_verified')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if vendor can update
    const { data: canUpdate, error: checkError } = await supabase
      .rpc('can_vendor_update_verification', { vendor_id_param: vendor.id });

    if (checkError) {
      console.error('Error checking update eligibility:', checkError);
      return NextResponse.json({ 
        error: 'Failed to check update eligibility' 
      }, { status: 500 });
    }

    if (!canUpdate || !canUpdate[0]?.can_update) {
      return NextResponse.json({ 
        error: canUpdate?.[0]?.reason || 'Cannot submit update at this time',
        reason: canUpdate?.[0]?.reason,
        hasPendingUpdate: canUpdate?.[0]?.has_pending_update
      }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const updateReason = formData.get('updateReason');
    const updateType = formData.get('updateType'); // renewal, correction, ownership_change, regulatory_update
    const documentType = formData.get('documentType');
    const registeredBusinessName = formData.get('registeredBusinessName');
    const countryOfRegistration = formData.get('countryOfRegistration');
    const businessAddress = formData.get('businessAddress');
    const registrationNumber = formData.get('registrationNumber');
    const documentNumber = formData.get('documentNumber');
    const issueDate = formData.get('issueDate');
    const expiryDate = formData.get('expiryDate');

    // Validate required fields
    if (!file || !updateReason || !updateType) {
      return NextResponse.json({ 
        error: 'File, update reason, and update type are required' 
      }, { status: 400 });
    }

    if (!registeredBusinessName || !countryOfRegistration) {
      return NextResponse.json({ 
        error: 'Business name and country are required' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.'
      }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File size exceeds 10MB limit'
      }, { status: 400 });
    }

    // Upload to S3 (same bucket as initial verification)
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
        updateTypeValue: updateType,
      },
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;

    // Get current approved document
    const { data: currentDoc, error: currentDocError } = await supabase
      .from('vendor_verification_documents')
      .select('id, expiry_date, document_type')
      .eq('vendor_id', vendor.id)
      .eq('status', 'approved')
      .is('superseded_by_document_id', null)
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .single();

    if (currentDocError || !currentDoc) {
      console.error('No existing verification found:', currentDocError);
      return NextResponse.json({ 
        error: 'No existing verification found to update. Please complete initial verification first.' 
      }, { status: 400 });
    }

    // Insert new document with pending_update status
    const { data: newDoc, error: insertError } = await supabase
      .from('vendor_verification_documents')
      .insert({
        vendor_id: vendor.id,
        document_type: documentType || currentDoc.document_type,
        document_url: fileUrl,
        document_file_name: file.name,
        document_number: documentNumber || null,
        registered_business_name: registeredBusinessName,
        registration_number: registrationNumber || null,
        country_of_registration: countryOfRegistration,
        business_address: businessAddress || null,
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

    if (insertError) {
      console.error('Error inserting update document:', insertError);
      throw insertError;
    }

    // Log to history
    await supabase
      .from('vendor_verification_history')
      .insert({
        vendor_id: vendor.id,
        document_id: newDoc.id,
        action: 'resubmitted',
        status_after: 'pending_update',
        notes: `Document update submitted. Reason: ${updateReason}. Type: ${updateType}`
      });

    return NextResponse.json({
      success: true,
      message: 'Verification update submitted successfully. Your verification badge will remain active during review.',
      documentId: newDoc.id,
      fileUrl: fileUrl,
      s3Key: fileName,
      status: 'pending_update',
      currentDocumentRemains: true,
    });

  } catch (error) {
    console.error('Error updating verification document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit update' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendor/update-verification-document
 * Check if vendor can update their verification documents
 * 
 * Returns:
 * - canUpdate: boolean
 * - reason: string explaining why/why not
 * - currentStatus: current document status
 * - hasPendingUpdate: whether update already submitted
 * - daysUntilExpiry: days until document expires (null if no expiry)
 */
export async function GET(request) {
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
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, is_verified')
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if can update
    const { data: canUpdate, error: checkError } = await supabase
      .rpc('can_vendor_update_verification', { vendor_id_param: vendor.id });

    if (checkError) {
      console.error('Error checking update eligibility:', checkError);
      return NextResponse.json(
        { error: 'Failed to check eligibility' },
        { status: 500 }
      );
    }

    const result = canUpdate?.[0] || {};

    return NextResponse.json({
      canUpdate: result.can_update || false,
      reason: result.reason || 'Unknown',
      currentStatus: result.current_status,
      hasPendingUpdate: result.has_pending_update || false,
      daysUntilExpiry: result.days_until_expiry,
      currentDocumentId: result.current_document_id,
      isVerified: vendor.is_verified,
    });

  } catch (error) {
    console.error('Error checking update eligibility:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}
