import { generatePresignedUploadUrl, validateFile, sanitizeFileName } from '@/lib/aws-s3';
import { supabase } from '@/lib/supabaseClient';

/**
 * API Endpoint: POST /api/rfq/upload-file
 * 
 * Generates presigned URLs for RFQ file uploads (documents, images, etc.) to AWS S3
 * Used for:
 * - RFQ creation attachments (direct RFQ, wizard modal)
 * - Vendor response documents (quotes, BOQ, datasheets, portfolio)
 * - Form field file uploads
 * 
 * The client uses the returned URL to upload files directly to S3.
 * 
 * Request body:
 *   - fileName: string (original file name)
 *   - fileType: string (MIME type)
 *   - fileSize: number (file size in bytes)
 *   - uploadType: string (optional) - 'rfq-attachment', 'vendor-response', 'form-field'
 * 
 * Response:
 *   - uploadUrl: string (presigned PUT URL for S3)
 *   - fileUrl: string (public URL to access the file)
 *   - key: string (S3 object key)
 *   - fileName: string (sanitized file name)
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
    const { fileName, fileType, fileSize, uploadType = 'rfq-attachment' } = req.body;

    // Validate required fields
    if (!fileName || !fileType || !fileSize) {
      return res.status(400).json({
        error: 'Missing required fields: fileName, fileType, fileSize',
      });
    }

    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.substring('Bearer '.length);

    // Verify user is authenticated with Supabase
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    const userId = userData.user.id;

    // Validate file (check type and size)
    const validationError = validateFile(fileType, fileSize, {
      // Allow common document and image types for RFQ uploads
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
        'text/plain',
        'application/zip',
        'application/x-zip-compressed',
      ],
      maxSize: 50 * 1024 * 1024, // 50MB max for documents
    });

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Sanitize filename
    const sanitizedFileName = sanitizeFileName(fileName);

    // Determine S3 path based on upload type
    let s3Path;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const nameWithMeta = `${timestamp}-${random}-${sanitizedFileName}`;

    switch (uploadType) {
      case 'vendor-response':
        s3Path = `rfq-responses/${userId}/${nameWithMeta}`;
        break;
      case 'form-field':
        s3Path = `rfq-forms/${userId}/${nameWithMeta}`;
        break;
      case 'rfq-attachment':
      default:
        s3Path = `rfq-attachments/${userId}/${nameWithMeta}`;
        break;
    }

    // Generate presigned URL for upload
    const { uploadUrl, fileUrl } = await generatePresignedUploadUrl(s3Path, {
      ContentType: fileType,
      Metadata: {
        'user-id': userId,
        'upload-type': uploadType,
        'original-name': sanitizedFileName,
        'uploaded-by': userId,
        'upload-timestamp': new Date().toISOString(),
      },
    });

    console.log(`✅ Generated presigned URL for RFQ file upload: ${s3Path}`);

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
    console.error('❌ RFQ file upload error:', error);

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
