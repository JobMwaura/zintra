import { generatePresignedUploadUrl, validateFile, sanitizeFileName } from '@/lib/aws-s3';
import { createClient } from '@/lib/supabase/client';

/**
 * API Endpoint: POST /api/vendor-messages/upload-file
 * 
 * Generates presigned URLs for vendor message file uploads to AWS S3
 * Used for:
 * - Admin attachments to vendor messages
 * - Vendor replies with file attachments
 * 
 * The client uses the returned URL to upload files directly to S3.
 * 
 * Request body:
 *   - fileName: string (original file name)
 *   - fileType: string (MIME type)
 *   - fileSize: number (file size in bytes)
 *   - vendorId: string (vendor ID for organization)
 *   - conversationId: string (optional, admin/user ID for context)
 * 
 * Response:
 *   - uploadUrl: string (presigned PUT URL for S3)
 *   - fileUrl: string (public URL to access the file)
 *   - key: string (S3 object key)
 *   - fileName: string (sanitized file name)
 *   - expiresIn: number (seconds until URL expires)
 * 
 * Error responses:
 *   - 401: User not authenticated
 *   - 400: Invalid file or missing parameters
 *   - 500: Server error
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileType, fileSize, vendorId, conversationId } = req.body;

    // Validate required fields
    if (!fileName || !fileType || !fileSize || !vendorId) {
      return res.status(400).json({
        error: 'Missing required fields: fileName, fileType, fileSize, vendorId',
      });
    }

    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.substring('Bearer '.length);

    // Create Supabase client for server-side auth
    const supabase = createClient();
    
    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const userId = user.id;

    // Validate file (check type and size)
    const validationError = validateFile(fileType, fileSize, {
      // Allow common document and image types for message attachments
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
      ],
      maxSize: 50 * 1024 * 1024, // 50MB max for message attachments
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Sanitize filename
    const sanitizedFileName = sanitizeFileName(fileName);

    // Create S3 path for vendor message attachments
    // Format: vendor-messages/{vendorId}/{conversationId or userId}/{timestamp}-{random}-{filename}
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const nameWithMeta = `${timestamp}-${random}-${sanitizedFileName}`;
    
    const conversationFolder = conversationId || userId;
    const s3Path = `vendor-messages/${vendorId}/${conversationFolder}/${nameWithMeta}`;

    // Generate presigned URL for upload
    const { uploadUrl, fileUrl } = await generatePresignedUploadUrl(s3Path, {
      ContentType: fileType,
      Metadata: {
        'user-id': userId,
        'vendor-id': vendorId,
        'conversation-id': conversationFolder,
        'original-name': sanitizedFileName,
        'uploaded-by': userId,
        'upload-timestamp': new Date().toISOString(),
        'type': 'vendor-message-attachment',
      },
    });

    console.log(`✅ Generated presigned URL for vendor message file upload: ${s3Path}`);

    // Return presigned URL and file info to client
    return res.status(200).json({
      success: true,
      uploadUrl,
      fileUrl,
      key: s3Path,
      fileName: sanitizedFileName,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error('❌ Vendor message file upload error:', error);

    // Check if it's an AWS configuration error
    if (error.message?.includes('AWS') || error.message?.includes('S3')) {
      return res.status(500).json({
        error: 'AWS S3 configuration error. Please contact support.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    return res.status(500).json({
      error: 'Failed to generate upload URL',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
