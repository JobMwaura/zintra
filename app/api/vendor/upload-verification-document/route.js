import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '@/lib/supabaseClient';

// Initialize S3 Client (shared with portfolio images and business updates)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get vendor ID
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file');
    const vendorId = formData.get('vendorId');

    // Validate vendor ID matches
    if (vendorId !== vendor.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique file name with consistent pattern
    // Using same structure as portfolio images and business updates
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `vendor-verification/${vendorId}/${timestamp}-${randomString}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3 (same bucket as portfolio images and business updates)
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET, // Same env var as portfolio/business updates
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        vendorId: vendorId,
        uploadedBy: user.id,
        originalName: file.name,
        uploadType: 'verification_document',
      },
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Generate a presigned URL for viewing the document (valid for 7 days)
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 604800 }); // 7 days

    // Return success with presigned URL and S3 key
    return NextResponse.json({
      success: true,
      fileUrl: presignedUrl, // Presigned URL that will work
      s3Key: fileName, // Store S3 key for generating presigned URLs later
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

  } catch (error) {
    console.error('Error uploading verification document to S3:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// GET endpoint to check upload status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify vendor ownership
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get existing verification documents
    const { data: documents, error: docsError } = await supabase
      .from('vendor_verification_documents')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('submitted_at', { ascending: false });

    if (docsError) throw docsError;

    return NextResponse.json({
      success: true,
      documents: documents || [],
    });

  } catch (error) {
    console.error('Error fetching verification documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
