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
        // Check if this is a presigned URL (old format) or S3 key (new format)
        if (typeof key === 'string' && (key.startsWith('https://') || key.includes('X-Amz-'))) {
          // Old format: presigned URL, try to extract key and regenerate
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
            
            const extractedKey = path;
            console.log('🔄 Regenerating presigned URL from old format (extracted key):', extractedKey);
            const freshUrl = await generateFileAccessUrl(extractedKey);
            presignedUrls[key] = freshUrl;
            console.log('✅ Successfully regenerated URL from old presigned URL format');
          } catch (parseError) {
            console.warn('⚠️ Failed to extract key from old presigned URL, will use original:', parseError.message);
            // Fallback: use the key as-is (it might still work if not yet expired)
            presignedUrls[key] = key;
          }
        } else {
          // New format: S3 key, generate fresh presigned URL
          const presignedUrl = await generateFileAccessUrl(key);
          presignedUrls[key] = presignedUrl;
          console.log('✅ Generated presigned URL for S3 key:', key);
        }
      } catch (error) {
        console.error('❌ Failed to generate presigned URL for:', key, error.message);
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
