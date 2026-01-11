// AWS S3 Utilities for Image Uploads
// This module provides helper functions for uploading and managing images in S3

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

// Validate AWS configuration on module load
if (!BUCKET_NAME) {
  console.warn('⚠️ AWS_S3_BUCKET environment variable not set');
}
if (!process.env.AWS_ACCESS_KEY_ID) {
  console.warn('⚠️ AWS_ACCESS_KEY_ID environment variable not set');
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️ AWS_SECRET_ACCESS_KEY environment variable not set');
}

/**
 * Generate a presigned URL for direct browser-to-S3 uploads
 * This allows browsers to upload directly without passing through your server
 *
 * @param {string} fileName - The name of the file to upload
 * @param {string} contentType - MIME type of the file (e.g., 'image/jpeg')
 * @param {object} metadata - Optional metadata to store with the file (vendor_id, etc)
 * @param {string} keyPrefix - Optional custom S3 key prefix (default: 'rfq-images/')
 * @param {boolean} skipFileNameGen - If true, use fileName as-is without adding timestamp/random (default: false)
 * @returns {object} { uploadUrl, fileUrl, key }
 */
export async function generatePresignedUploadUrl(
  fileName,
  contentType,
  metadata = {},
  keyPrefix = 'rfq-images/',
  skipFileNameGen = false
) {
  console.log('📦 generatePresignedUploadUrl called');
  console.log('  fileName:', fileName);
  console.log('  contentType:', contentType);
  console.log('  keyPrefix:', keyPrefix);
  console.log('  skipFileNameGen:', skipFileNameGen);
  
  // Validate AWS configuration
  if (!BUCKET_NAME) {
    console.error('❌ AWS_S3_BUCKET not configured');
    throw new Error('AWS_S3_BUCKET environment variable not configured');
  }
  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.error('❌ AWS_ACCESS_KEY_ID not configured');
    throw new Error('AWS_ACCESS_KEY_ID environment variable not configured');
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS_SECRET_ACCESS_KEY not configured');
    throw new Error('AWS_SECRET_ACCESS_KEY environment variable not configured');
  }

  try {
    console.log('✅ AWS config validated');
    console.log('  BUCKET:', BUCKET_NAME);
    console.log('  REGION:', process.env.AWS_REGION);
    
    // Use fileName as-is if skipFileNameGen is true, otherwise add timestamp/random
    let fileKey;
    if (skipFileNameGen) {
      fileKey = `${keyPrefix}${fileName}`;
    } else {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      fileKey = `${keyPrefix}${timestamp}-${randomString}-${fileName}`;
    }
    
    console.log('📝 Generated S3 key:', fileKey);
    
    // Create PutObject command
    console.log('🔐 Creating PutObject command...');
    const putCommand = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    };
    
    // Only add metadata if provided (non-empty object)
    if (Object.keys(metadata).length > 0) {
      putCommand.Metadata = {
        'uploaded-at': new Date().toISOString(),
        ...metadata,
      };
    }
    
    const command = new PutObjectCommand(putCommand);

    // Generate presigned URL for PUT request (upload)
    console.log('⏳ Generating upload presigned URL...');
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: SIGNED_URL_EXPIRY,
    });
    console.log('✅ Upload URL generated');

    // Generate presigned URL for GET request (download)
    console.log('⏳ Generating download presigned URL...');
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });
    const fileUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: SIGNED_URL_EXPIRY * 10, // 10 hours for downloads
    });
    console.log('✅ Download URL generated');

    console.log('🎉 Presigned URLs generated successfully');
    return {
      uploadUrl,
      fileUrl,
      key: fileKey,
      fileName,
    };
  } catch (error) {
    console.error('❌ Error generating presigned URL:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error stack:', error.stack);
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
}

/**
 * Upload a file directly from Node.js (for server-side uploads)
 * Use this when you need to upload from the server, not the browser
 *
 * @param {string} fileKey - The S3 object key
 * @param {Buffer} fileBuffer - The file contents as a Buffer
 * @param {string} contentType - MIME type of the file
 * @param {object} metadata - Optional metadata
 * @returns {object} { key, location }
 */
export async function uploadFileToS3(
  fileKey,
  fileBuffer,
  contentType,
  metadata = {}
) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        ...metadata,
      },
    });

    await s3Client.send(command);

    // Generate a presigned URL for accessing the file
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });
    const fileUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: SIGNED_URL_EXPIRY * 10,
    });

    return {
      key: fileKey,
      location: fileUrl,
      bucket: BUCKET_NAME,
    };
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Generate a presigned URL for accessing an existing file
 * Use this when you want to share a file with others
 *
 * @param {string} fileKey - The S3 object key
 * @param {number} expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns {string} Presigned URL
 */
export async function generateFileAccessUrl(fileKey, expiresIn = SIGNED_URL_EXPIRY) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating file access URL:', error);
    throw new Error('Failed to generate file access URL');
  }
}

/**
 * List all files in a specific vendor's folder
 *
 * @param {string} vendorId - The vendor ID
 * @returns {array} Array of file objects
 */
export async function listVendorFiles(vendorId) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `vendor-profiles/`,
    });

    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.error('Error listing files:', error);
    throw new Error('Failed to list files');
  }
}

/**
 * Delete a file from S3
 *
 * @param {string} fileKey - The S3 object key
 * @returns {boolean} Success status
 */
export async function deleteFileFromS3(fileKey) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Validate file before upload
 *
 * @param {File} file - File object from input
 * @param {object} options - Validation options
 * @returns {object} { valid, error }
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  } = options;

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Supported: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Generate a sanitized file name
 * Removes special characters and preserves extension
 *
 * @param {string} fileName - Original file name
 * @returns {string} Sanitized file name
 */
export function sanitizeFileName(fileName) {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase()
    .substring(0, 200);
}
