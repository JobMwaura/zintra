// /pages/api/vendor-profile/get-image-url.js
// Generate fresh presigned URLs for viewing vendor profile images
// Solves problem: Presigned upload URLs expire and return 403 errors
// Solution: Store S3 key in database, generate fresh view URLs on-demand

import { generateFileAccessUrl } from '@/lib/aws-s3';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ error: 'S3 key is required' });
    }

    // Generate fresh presigned URL for viewing (valid for 7 days)
    // This is different from upload URLs - these are for downloading/viewing
    // Every page load gets a fresh URL, so old links don't cause 403 errors
    const presignedUrl = await generateFileAccessUrl(key, 7 * 24 * 60 * 60); // 7 days

    return res.status(200).json({
      success: true,
      url: presignedUrl,
      expiresIn: 7 * 24 * 60 * 60, // 7 days
    });
  } catch (error) {
    console.error('Error generating presigned download URL:', error);

    if (error.message?.includes('AWS')) {
      return res.status(500).json({
        error: 'AWS S3 not configured properly',
        details: error.message,
      });
    }

    return res.status(500).json({
      error: 'Failed to generate image URL',
      message: error.message,
    });
  }
}
