/**
 * POST /api/vendor-profile/regenerate-image-urls
 * Regenerate presigned URLs for vendor profile images (logo, cover, etc)
 * Handles both old format (full presigned URLs) and new format (S3 keys)
 */

import { generateFileAccessUrl } from '@/lib/aws-s3';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls)) {
      return res.status(400).json({
        error: 'imageUrls must be an array'
      });
    }

    console.log('🔄 Regenerating presigned URLs for', imageUrls.length, 'vendor profile images');

    // Regenerate fresh presigned URLs
    const regeneratedUrls = {};

    for (const url of imageUrls) {
      if (!url) continue;

      try {
        // Check if this is a presigned URL (old format) or S3 key (new format)
        if (typeof url === 'string' && (url.startsWith('https://') || url.includes('X-Amz-'))) {
          // Old format: presigned URL, try to extract key and regenerate
          try {
            const urlObj = new URL(url);
            let path = urlObj.pathname.replace(/^\//, ''); // Remove leading slash

            // If path starts with bucket name, remove it
            if (path.includes('/')) {
              const parts = path.split('/');
              if (parts[0] === process.env.AWS_S3_BUCKET) {
                path = parts.slice(1).join('/');
              }
            }

            const extractedKey = path;
            console.log('🔄 Regenerating vendor image from old presigned URL format');
            const freshUrl = await generateFileAccessUrl(extractedKey);
            regeneratedUrls[url] = freshUrl;
            console.log('✅ Successfully regenerated vendor image URL from old format');
          } catch (parseError) {
            console.warn('⚠️ Failed to extract key from old vendor image URL, keeping original:', parseError.message);
            // Fallback: keep original
            regeneratedUrls[url] = url;
          }
        } else {
          // New format: S3 key, generate fresh presigned URL
          const freshUrl = await generateFileAccessUrl(url);
          regeneratedUrls[url] = freshUrl;
          console.log('✅ Generated fresh URL for vendor image S3 key');
        }
      } catch (error) {
        console.error('❌ Failed to regenerate vendor image URL:', error.message);
        // Fallback: return original URL
        regeneratedUrls[url] = url;
      }
    }

    return res.status(200).json({
      regeneratedUrls,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error regenerating vendor profile image URLs:', error);
    return res.status(500).json({
      error: 'Failed to regenerate URLs',
      message: error.message,
    });
  }
}
