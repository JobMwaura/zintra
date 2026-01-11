// /pages/api/status-updates/upload-image.js
// Presigned URL generation for status update image uploads to AWS S3

import { generatePresignedUrl } from '@/lib/aws-s3';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({
        error: 'fileName and contentType are required',
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed',
      });
    }

    console.log('🎯 Generating presigned URL for status update image:', fileName);

    // Use status-updates prefix for S3 path organization
    const keyPrefix = 'vendor-profiles/status-updates/';

    // Generate presigned URL
    const presignedUrl = await generatePresignedUrl(
      fileName,
      contentType,
      {}, // No metadata to avoid signature mismatches
      keyPrefix,
      true // skipFileNameGen - use the filename as-is from client
    );

    console.log('✅ Generated presigned URL for status update image');

    return res.status(200).json({
      presignedUrl,
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
    });
  } catch (error) {
    console.error('❌ Failed to generate presigned URL:', error);
    return res.status(500).json({
      error: 'Failed to generate presigned URL',
      message: error.message,
    });
  }
}
