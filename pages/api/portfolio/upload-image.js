// /pages/api/portfolio/upload-image.js
// Presigned URL generation for portfolio image uploads to AWS S3

import { generatePresignedUploadUrl } from '@/lib/aws-s3';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No authorization header');
      return res.status(401).json({ error: 'Unauthorized - missing auth token' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Create Supabase client with the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Auth error or no user:', authError);
      return res.status(401).json({ error: 'Unauthorized - invalid token' });
    }
    
    console.log('✅ User authenticated:', user.id);

    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'Missing fileName or contentType' });
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      });
    }

    // Generate presigned URL for portfolio images with correct S3 path
    console.log('🔄 Generating presigned URL for portfolio image...');
    console.log('User ID:', user.id);
    console.log('File name:', fileName);
    console.log('Content type:', contentType);
    console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
    console.log('AWS_REGION:', process.env.AWS_REGION);
    
    const uploadResult = await generatePresignedUploadUrl(
      fileName,
      contentType,
      {
        'vendor-id': user.id,
        'upload-type': 'portfolio-image',
        'uploaded-by': user.email,
      },
      `vendor-profiles/portfolio/${user.id}/`
    );
    
    console.log('✅ Presigned URL generated successfully');

    return res.status(200).json({
      uploadUrl: uploadResult.uploadUrl,
      fileUrl: uploadResult.fileUrl,
      key: uploadResult.key,
      fileName: uploadResult.fileName,
    });
  } catch (error) {
    console.error('Portfolio image upload error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);

    // Check if it's an AWS configuration error
    if (error.message?.includes('AWS')) {
      return res.status(500).json({
        error: 'AWS S3 not configured properly. Please contact support.',
        details: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to generate upload URL',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
