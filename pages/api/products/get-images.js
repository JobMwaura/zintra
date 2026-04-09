// /pages/api/products/get-images.js
// Regenerate presigned URLs for product images
// This ensures product images always load with valid credentials
// Handles both old format (full presigned URLs) and new format (S3 keys)

import { generateFileAccessUrl } from '@/lib/aws-s3';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageKeys } = req.body;

    if (!imageKeys || !Array.isArray(imageKeys)) {
      return res.status(400).json({ error: 'imageKeys must be an array' });
    }

    // Generate fresh presigned URLs for all image keys
    // Handles both formats: S3 keys and old presigned URLs
    const presignedUrls = {};
    
    for (const key of imageKeys) {
      if (!key) continue;
      
      try {
        // Check if this is a presigned URL (old format), direct S3 URL, or S3 key (new format)
        if (typeof key === 'string' && key.includes('amazonaws.com')) {
          // It's an S3 URL (either presigned or direct), try to extract key and regenerate
          try {
            const urlObj = new URL(key);
            let path = urlObj.pathname.replace(/^\//, ''); // Remove leading slash
            
            // If path starts with bucket name, remove it
            if (path.includes('/')) {
              const parts = path.split('/');
              if (parts[0] === process.env.AWS_S3_BUCKET) {
                path = parts.slice(1).join('/');
              }
            }
            
            // Decode URI component (handle %20 for spaces, etc)
            const extractedKey = decodeURIComponent(path);
            console.log('🔄 Regenerating presigned URL from S3 URL (extracted key):', extractedKey.substring(0, 50));
            const freshUrl = await generateFileAccessUrl(extractedKey);
            presignedUrls[key] = freshUrl;
            console.log('✅ Successfully regenerated URL from S3 URL');
          } catch (parseError) {
            console.warn('⚠️ Failed to extract key from S3 URL, using original:', parseError.message);
            presignedUrls[key] = key;
          }
        } else if (typeof key === 'string' && !key.startsWith('http')) {
          // It's an S3 key (relative path), generate fresh presigned URL
          const presignedUrl = await generateFileAccessUrl(key);
          presignedUrls[key] = presignedUrl;
          console.log('✅ Generated presigned URL for S3 key:', key.substring(0, 50));
        } else {
          // Unknown format or already a presigned URL, keep as-is
          console.warn('⚠️ Unknown URL format, keeping original:', key.substring(0, 50));
          presignedUrls[key] = key;
        }
      } catch (error) {
        console.error('❌ Failed to generate presigned URL for:', key.substring(0, 50), error.message);
        presignedUrls[key] = null; // Return null for failed URLs
      }
    }

    return res.status(200).json({
      presignedUrls,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating presigned URLs:', error);
    return res.status(500).json({
      error: 'Failed to generate presigned URLs',
      message: error.message,
    });
  }
}
