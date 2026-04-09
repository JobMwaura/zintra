// API Route: /api/messages/upload-image
// Upload images for admin-vendor messages to AWS S3
// Images are uploaded directly from browser to S3 using presigned URLs

import { NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/aws-s3';

export async function POST(request) {
  try {
    console.log('📤 Message image upload request received');

    // Parse request body
    const body = await request.json();
    const { fileName, contentType } = body;

    // Validate required fields
    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      );
    }

    if (!contentType) {
      return NextResponse.json(
        { error: 'contentType is required' },
        { status: 400 }
      );
    }

    // Validate content type is an image
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    console.log('📝 Upload details:', { fileName, contentType });

    // Generate presigned URL for S3 upload
    // Using 'message-images/' prefix to organize files
    const { uploadUrl, fileUrl, key } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      {}, // No metadata needed for message images
      'message-images/', // S3 key prefix
      false // Generate unique filename with timestamp
    );

    console.log('✅ Presigned URL generated');
    console.log('  Upload URL:', uploadUrl.substring(0, 100) + '...');
    console.log('  File URL:', fileUrl);
    console.log('  S3 Key:', key);

    // Return the presigned URL to the client
    return NextResponse.json({
      success: true,
      uploadUrl,
      fileUrl,
      key,
    });

  } catch (error) {
    console.error('❌ Message image upload error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate upload URL',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint to verify API is working
export async function GET() {
  return NextResponse.json({
    message: 'Message image upload API',
    methods: ['POST'],
    usage: {
      endpoint: '/api/messages/upload-image',
      method: 'POST',
      body: {
        fileName: 'example.jpg',
        contentType: 'image/jpeg'
      },
      response: {
        uploadUrl: 'Presigned S3 upload URL',
        fileUrl: 'Public URL to access uploaded file',
        key: 'S3 object key'
      }
    }
  });
}
