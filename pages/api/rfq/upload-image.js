import { generatePresignedUploadUrl, validateFile, sanitizeFileName } from '@/lib/aws-s3';
import { supabase } from '@/lib/supabaseClient';

/**
 * API Endpoint: POST /api/rfq/upload-image
 * 
 * Generates a presigned URL for RFQ image uploads to AWS S3
 * The client uses this URL to upload the image directly to S3
 * 
 * Request body:
 *   - fileName: string (original file name)
 *   - fileType: string (MIME type)
 *   - fileSize: number (file size in bytes)
 * 
 * Response:
 *   - uploadUrl: string (presigned PUT URL for S3)
 *   - fileUrl: string (public URL to access the file)
 *   - key: string (S3 object key)
 * 
 * Error responses:
 *   - 401: User not authenticated
 *   - 400: Invalid file or missing parameters
 *   - 500: Server error
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Get file info from request
    const { fileName, fileType, fileSize } = req.body;

    // Validate required fields
    if (!fileName || !fileType || !fileSize) {
      return res.status(400).json({ error: 'Missing required fields: fileName, fileType, fileSize' });
    }

    // Validate file
    const validation = validateFile({ size: fileSize, type: fileType });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Sanitize file name
    const sanitizedFileName = sanitizeFileName(fileName);

    // Generate presigned URL
    const { uploadUrl, fileUrl, key } = await generatePresignedUploadUrl(
      sanitizedFileName,
      fileType,
      {
        user_id: user.id,
        content_type: 'rfq-reference-image',
        uploaded_by: user.email,
      }
    );

    // Return presigned URL to client
    return res.status(200).json({
      uploadUrl,
      fileUrl,
      key,
      message: 'Presigned URL generated successfully',
    });
  } catch (error) {
    console.error('RFQ upload-image error:', error);
    return res.status(500).json({
      error: 'Failed to generate upload URL',
      details: error.message,
    });
  }
}
