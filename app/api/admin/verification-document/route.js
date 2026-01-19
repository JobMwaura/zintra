import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from '@/lib/supabaseClient';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function GET(request) {
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

    // Get document ID from query params
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Fetch the document from database to get S3 key
    const { data: document, error: docError } = await supabase
      .from('vendor_verification_documents')
      .select('document_url')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Extract S3 key from document_url
    // The URL is like: https://bucket.s3.region.amazonaws.com/vendor-verification/uuid/filename.jpg
    // We need to extract: vendor-verification/uuid/filename.jpg
    const s3Url = document.document_url;
    let s3Key;

    if (s3Url.includes('.amazonaws.com/')) {
      s3Key = s3Url.split('.amazonaws.com/')[1];
    } else {
      // If it's already a presigned URL or in a different format, try to extract the key
      return NextResponse.json({ error: 'Invalid document URL format' }, { status: 400 });
    }

    if (!s3Key) {
      return NextResponse.json({ error: 'Could not extract S3 key' }, { status: 400 });
    }

    // Get the object from S3
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
    });

    const s3Response = await s3Client.send(getObjectCommand);

    // Convert the stream to buffer
    const chunks = [];
    for await (const chunk of s3Response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return the file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': s3Response.ContentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${s3Key.split('/').pop()}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error serving document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to serve document' },
      { status: 500 }
    );
  }
}
