import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { generateFileAccessUrl } from '@/lib/aws-s3';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/status-updates
 * Create a new vendor status update with S3 images
 * 
 * Body:
 * - vendorId (required): UUID of the vendor
 * - content (required): Text content of the update (max 2000 chars)
 * - images (optional): Array of S3 image URLs
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { vendorId, content, images = [] } = body;

    // Validate required fields
    if (!vendorId || !content) {
      return NextResponse.json(
        { message: 'vendorId and content are required' },
        { status: 400 }
      );
    }

    if (!content.trim()) {
      return NextResponse.json(
        { message: 'Content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { message: 'Content exceeds 2000 character limit' },
        { status: 400 }
      );
    }

    if (images.length > 5) {
      return NextResponse.json(
        { message: 'Maximum 5 images allowed' },
        { status: 400 }
      );
    }

    console.log('📝 Creating status update for vendor:', vendorId);
    console.log('   Content length:', content.length);
    console.log('   Images:', images.length);

    // Verify vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      console.error('❌ Vendor not found:', vendorId);
      return NextResponse.json(
        { message: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Create status update with images array
    const { data: update, error: updateError } = await supabase
      .from('vendor_status_updates')
      .insert({
        vendor_id: vendorId,
        content: content.trim(),
        images: images && images.length > 0 ? images : [], // Save images directly to array column
      })
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to create status update:', updateError);
      return NextResponse.json(
        { message: 'Failed to create status update', error: updateError.message },
        { status: 400 }
      );
    }

    console.log('✅ Status update created:', update.id);
    console.log('✅ Saved', images.length, 'images to array');

    // Return the created update with images
    return NextResponse.json(
      {
        message: 'Status update created successfully',
        update: update,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Status update creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/status-updates?vendorId=...
 * Get status updates for a vendor with fresh presigned image URLs
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { message: 'vendorId query parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching status updates for vendor:', vendorId);

    // Get status updates
    const { data: updates, error: updatesError } = await supabase
      .from('vendor_status_updates')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (updatesError) {
      console.error('❌ Failed to fetch status updates:', updatesError);
      return NextResponse.json(
        { message: 'Failed to fetch status updates', error: updatesError.message },
        { status: 400 }
      );
    }

    console.log('✅ Found', updates?.length || 0, 'status updates');

    // Generate fresh presigned URLs for all image file keys
    // AWS SigV4 presigned URLs max expiry is 7 days, but we generate fresh ones on each page load
    // This ensures images are always accessible without ever needing to "renew" in the database
    if (updates && updates.length > 0) {
      for (const update of updates) {
        if (!update.images) {
          update.images = [];
          continue;
        }

        // Generate fresh presigned GET URLs from file keys (7-day expiry is AWS max)
        const freshUrls = [];
        for (const imageKey of update.images) {
          try {
            // imageKey is stored as file key in database
            // Generate fresh 7-day presigned URLs on every fetch (AWS maximum)
            // This means users always get valid URLs, and updates never technically expire
            const freshUrl = await generateFileAccessUrl(imageKey, 7 * 24 * 60 * 60); // 7 days
            freshUrls.push(freshUrl);
            console.log('✅ Generated fresh 7-day URL for image key:', imageKey);
          } catch (err) {
            console.error('⚠️ Failed to generate URL for image key:', imageKey, err.message);
            // If URL generation fails, still include the key for debugging
            freshUrls.push(imageKey);
          }
        }
        update.images = freshUrls;
      }
    }

    return NextResponse.json(
      {
        updates: updates || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Status updates fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
