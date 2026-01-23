// /pages/api/products/get-images.js
// Regenerate presigned URLs for product images
// This ensures product images always load with valid credentials

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
    const presignedUrls = {};
    
    for (const key of imageKeys) {
      if (!key) continue;
      
      try {
        const presignedUrl = await generateFileAccessUrl(key);
        presignedUrls[key] = presignedUrl;
        console.log('✅ Generated presigned URL for:', key);
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
