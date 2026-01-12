import { NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

/**
 * POST /api/status-updates/delete-images
 * Delete S3 images when a status update is deleted
 * 
 * Body:
 * - updateId (required): UUID of the update being deleted
 * - imageKeys (required): Array of S3 file keys to delete
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { updateId, imageKeys = [] } = body;

    if (!updateId || !imageKeys || imageKeys.length === 0) {
      return NextResponse.json(
        { message: 'updateId and imageKeys are required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting', imageKeys.length, 'S3 images for update:', updateId);

    // Delete each image from S3
    const deleteResults = [];
    for (const imageKey of imageKeys) {
      try {
        console.log('   Deleting:', imageKey.substring(0, 60) + '...');
        const command = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: imageKey,
        });

        await s3Client.send(command);
        deleteResults.push({ key: imageKey, success: true });
        console.log('   ✅ Deleted:', imageKey.substring(0, 60) + '...');
      } catch (err) {
        console.error('   ❌ Failed to delete:', imageKey, err.message);
        deleteResults.push({ key: imageKey, success: false, error: err.message });
      }
    }

    const successCount = deleteResults.filter(r => r.success).length;
    const failureCount = deleteResults.filter(r => !r.success).length;

    console.log(`✅ Deleted ${successCount}/${imageKeys.length} S3 images`);
    if (failureCount > 0) {
      console.log(`⚠️ Failed to delete ${failureCount} images`);
    }

    return NextResponse.json(
      {
        message: `Deleted ${successCount} images${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        deletedCount: successCount,
        failedCount: failureCount,
        results: deleteResults,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Delete images error:', error);
    return NextResponse.json(
      { message: 'Failed to delete images', error: error.message },
      { status: 500 }
    );
  }
}
