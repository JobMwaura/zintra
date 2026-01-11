// /pages/api/debug/test-aws-presigned-url.js
// Test endpoint to debug presigned URL generation

import { generatePresignedUploadUrl } from '@/lib/aws-s3';

export default async function handler(req, res) {
  // Only allow GET requests for testing
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Testing AWS presigned URL generation...');
    
    // Log environment variables (first 10 chars for security)
    const awsConfig = {
      AWS_REGION: process.env.AWS_REGION ? '✅ Set' : '❌ Missing',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID 
        ? `✅ Set (${process.env.AWS_ACCESS_KEY_ID.substring(0, 10)}...)`
        : '❌ Missing',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET ? `✅ ${process.env.AWS_S3_BUCKET}` : '❌ Missing',
    };

    console.log('AWS Configuration:', awsConfig);

    // Try to generate a presigned URL
    const testFileName = `test-${Date.now()}.jpg`;
    const testResult = await generatePresignedUploadUrl(testFileName, 'image/jpeg', {
      'test': 'true',
      'timestamp': new Date().toISOString(),
    });

    console.log('✅ Presigned URL generated successfully');

    return res.status(200).json({
      success: true,
      message: 'AWS presigned URL generation is working!',
      awsConfig,
      testResult: {
        key: testResult.key,
        fileName: testResult.fileName,
        uploadUrl: testResult.uploadUrl.substring(0, 50) + '...',
        fileUrl: testResult.fileUrl.substring(0, 50) + '...',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ AWS Test Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to generate presigned URL',
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: {
        AWS_REGION: process.env.AWS_REGION ? '✅ Set' : '❌ Missing',
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
        AWS_S3_BUCKET: process.env.AWS_S3_BUCKET ? '✅ Set' : '❌ Missing',
      },
      timestamp: new Date().toISOString(),
    });
  }
}
