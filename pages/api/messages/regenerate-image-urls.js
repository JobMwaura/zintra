/**
 * POST /api/messages/regenerate-image-urls
 * Regenerate presigned URLs for message attachment images
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

    console.log('🔄 Regenerating presigned URLs for', imageUrls.length, 'message images');

    // Regenerate fresh presigned URLs
    const regeneratedUrls = {};

    for (const url of imageUrls) {
      if (!url) continue;

      try {
        // Check if this is a presigned URL (old format) or S3 key (new format)
        if (typeof url === 'string' && url.includes('amazonaws.com')) {
          // It's an S3 URL (either presigned or direct), try to extract key and regenerate
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

            // Decode URI component (handle %20 for spaces, etc)
            const extractedKey = decodeURIComponent(path);
            console.log('🔄 Regenerating from S3 URL (extracted key):', extractedKey.substring(0, 50));
            const freshUrl = await generateFileAccessUrl(extractedKey);
            regeneratedUrls[url] = freshUrl;
            console.log('✅ Successfully regenerated URL from S3 URL');
          } catch (parseError) {
            console.warn('⚠️ Failed to extract key from S3 URL, keeping original:', parseError.message);
            // Fallback: keep original
            regeneratedUrls[url] = url;
          }
        } else if (typeof url === 'string' && !url.startsWith('http')) {
          // It's an S3 key (relative path), generate fresh presigned URL
          try {
            console.log('🔄 Regenerating from S3 key');
            const freshUrl = await generateFileAccessUrl(url);
            regeneratedUrls[url] = freshUrl;
            console.log('✅ Generated fresh URL for S3 key');
          } catch (error) {
            console.error('❌ Failed to generate URL for S3 key:', error.message);
            regeneratedUrls[url] = url; // Fallback to original
          }
        } else {
          // Unknown format, keep original
          console.warn('⚠️ Unknown URL format:', url.substring(0, 50));
          regeneratedUrls[url] = url;
        }
      } catch (error) {
        console.error('❌ Failed to regenerate URL:', error.message);
        // Fallback: return original URL
        regeneratedUrls[url] = url;
      }
    }

    return res.status(200).json({
      regeneratedUrls,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error regenerating message image URLs:', error);
    return res.status(500).json({
      error: 'Failed to regenerate URLs',
      message: error.message,
    });
  }
}
