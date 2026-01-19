import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '@/lib/supabaseClient';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    // Get the current user and verify admin status
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get the S3 key from request body
    const { s3Key, documentId } = await request.json();

    if (!s3Key && !documentId) {
      return NextResponse.json({ error: 'S3 key or document ID required' }, { status: 400 });
    }

    let s3KeyToUse = s3Key;

    // If documentId provided, fetch the S3 key from database
    if (documentId && !s3Key) {
      const { data: doc, error: docError } = await supabase
        .from('vendor_verification_documents')
        .select('s3_key')
        .eq('id', documentId)
        .single();

      if (docError || !doc || !doc.s3_key) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      s3KeyToUse = doc.s3_key;
    }

    // Generate presigned URL for the document (valid for 1 hour)
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3KeyToUse,
    });

    const presignedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 }); // 1 hour

    return NextResponse.json({
      success: true,
      presignedUrl: presignedUrl,
      expiresIn: 3600, // 1 hour
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate document URL' },
      { status: 500 }
    );
  }
}
