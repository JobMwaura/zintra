// API Route: Generate presigned URL for direct S3 uploads
// POST /api/vendor/upload-image
//
// This endpoint generates a presigned URL that allows the browser to upload
// directly to S3 without the file passing through your server.
// This is more efficient and secure.

import { generatePresignedUploadUrl, validateFile, sanitizeFileName } from '@/lib/aws-s3';
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

    // Check if user owns the vendor profile (optional but recommended)
    if (vendorId) {
      const { data: vendor, error: vendorError } = await supabase
        .from('VendorProfile')
        .select('id, user_id')
        .eq('id', vendorId)
        .single();

      if (vendorError || !vendor || vendor.user_id !== userId) {
        return res.status(403).json({
          error: 'You do not have permission to upload for this vendor',
        });
      }
    }

    // Sanitize file name
    const sanitized = sanitizeFileName(fileName);

    // Generate presigned URL
    const uploadData = await generatePresignedUploadUrl(sanitized, contentType, {
      vendor_id: vendorId || 'unknown',
      user_id: userId,
      original_name: fileName,
    });

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
    return res.status(500).json({
      error: 'Failed to generate upload URL',
      message: error.message,
    });
  }
}
