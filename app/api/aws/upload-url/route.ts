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
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate environment variables
    if (!process.env.AWS_BUCKET_NAME) {
      console.error('AWS_BUCKET_NAME not configured');
      return NextResponse.json(
        { error: 'AWS S3 not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fileName, fileType, folder } = body;

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

    // Construct S3 key (file path in bucket)
    const s3Key = `${folder}/${fileName}`;

    console.log('📤 Generating presigned URL for S3:', {
      bucket: process.env.AWS_BUCKET_NAME,
      key: s3Key,
      contentType: fileType,
    });

    // Generate presigned upload URL (valid for 15 minutes)
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, uploadCommand, {
      expiresIn: 15 * 60, // 15 minutes
    });

    // Construct public file URL
    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${
      process.env.AWS_REGION || 'us-east-1'
    }.amazonaws.com/${s3Key}`;

    console.log('✅ Presigned URL generated:', {
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
  } catch (error) {
    console.error('❌ Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
