/**
 * ============================================================================
 * AWS S3 PRESIGNED URL GENERATOR
 * ============================================================================
 * API endpoint to generate presigned URLs for direct S3 uploads
 * 
 * POST /api/aws/upload-url
 * 
 * Request Body:
 * {
 *   fileName: string,      // e.g., "1234567890_abc123_photo.jpg"
 *   fileType: string,      // e.g., "image/jpeg"
 *   folder: string         // e.g., "user-messages" or "vendor-messages"
 * }
 * 
 * Response (Success):
 * {
 *   uploadUrl: string,     // Presigned URL to PUT file to
 *   fileUrl: string        // Public URL to access the file
 * }
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';

// Lazy load AWS SDK only when needed
let s3Client: any = null;
let getSignedUrl: any = null;

async function initializeS3() {
  if (s3Client && getSignedUrl) return;
  
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl: getSignedUrlFn } = await import('@aws-sdk/s3-request-presigner');
  
  getSignedUrl = getSignedUrlFn;
  
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate environment variables first
    const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    const awsBucket = process.env.AWS_BUCKET_NAME;
    const awsRegion = process.env.AWS_REGION || 'us-east-1';

    console.log('[AWS Upload URL] Environment check:', {
      hasAccessKey: !!awsAccessKey,
      hasSecretKey: !!awsSecretKey,
      hasBucket: !!awsBucket,
      region: awsRegion,
    });

    if (!awsAccessKey || !awsSecretKey || !awsBucket) {
      console.error('[AWS Upload URL] Missing AWS credentials:', {
        AWS_ACCESS_KEY_ID: !!awsAccessKey,
        AWS_SECRET_ACCESS_KEY: !!awsSecretKey,
        AWS_BUCKET_NAME: !!awsBucket,
      });
      return NextResponse.json(
        { 
          error: 'AWS S3 not configured. Please set AWS environment variables.',
          missing: {
            AWS_ACCESS_KEY_ID: !awsAccessKey,
            AWS_SECRET_ACCESS_KEY: !awsSecretKey,
            AWS_BUCKET_NAME: !awsBucket,
          }
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fileName, fileType, folder } = body;

    console.log('[AWS Upload URL] Request received:', { fileName, fileType, folder });

    // Validate required fields
    if (!fileName || !fileType || !folder) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, fileType, folder' },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    if (!allowedMimeTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate folder (security: prevent path traversal)
    const validFolders = ['user-messages', 'vendor-messages'];
    if (!validFolders.includes(folder)) {
      return NextResponse.json(
        { error: 'Invalid folder' },
        { status: 400 }
      );
    }

    // Initialize S3
    await initializeS3();

    // Construct S3 key (file path in bucket)
    const s3Key = `${folder}/${fileName}`;

    console.log('[AWS Upload URL] Generating presigned URL:', {
      bucket: awsBucket,
      key: s3Key,
      contentType: fileType,
    });

    // Import PutObjectCommand
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    // Generate presigned upload URL (valid for 15 minutes)
    const uploadCommand = new PutObjectCommand({
      Bucket: awsBucket,
      Key: s3Key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, uploadCommand, {
      expiresIn: 15 * 60, // 15 minutes
    });

    // Construct public file URL
    const fileUrl = `https://${awsBucket}.s3.${awsRegion}.amazonaws.com/${s3Key}`;

    console.log('[AWS Upload URL] Success:', {
      uploadUrl: uploadUrl.substring(0, 50) + '...',
      fileUrl,
    });

    return NextResponse.json(
      {
        uploadUrl,
        fileUrl,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[AWS Upload URL] Error:', error);
    console.error('[AWS Upload URL] Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to generate upload URL',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
