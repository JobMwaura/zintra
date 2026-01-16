// /pages/api/vendor-profile/upload-image.js
// Presigned URL generation for vendor profile image uploads to AWS S3
// Handles: profile images, logos, avatars for vendor profiles

import { generatePresignedUploadUrl } from '@/lib/aws-s3';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user from Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user from token
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id;
    const { fileName, contentType, vendorId } = req.body;

    // Validate required fields
    if (!fileName || !contentType) {
      return res.status(400).json({
        error: 'fileName and contentType are required',
      });
    }

    // Validate file extension
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
      });
    }

    // Check if user owns the vendor profile
    if (vendorId) {
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id, user_id')
        .eq('id', vendorId)
        .single();

      if (vendorError || !vendor || vendor.user_id !== userId) {
        return res.status(403).json({
          error: 'You do not have permission to upload for this vendor',
        });
      }
    }

    // Generate presigned URL for vendor profile image
    // Path structure: vendor-profiles/{vendor_id}/profile-images/{timestamp}-{randomId}-{original}
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileExt = fileName.split('.').pop();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-');
    const finalFileName = `${timestamp}-${randomId}-${sanitizedName}`;

    const uploadData = await generatePresignedUploadUrl(
      `vendor-profiles/${vendorId}/profile-images/${finalFileName}`,
      contentType,
      {
        vendor_id: vendorId,
        user_id: userId,
        upload_type: 'vendor-profile',
        original_name: fileName,
        uploaded_by: userId,
      },
      '' // Empty prefix - we already have full path in fileName
    );

    // Return presigned URL and file info
    return res.status(200).json({
      success: true,
      uploadUrl: uploadData.uploadUrl,
      fileUrl: uploadData.fileUrl,
      key: uploadData.key,
      fileName: uploadData.fileName,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);

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
