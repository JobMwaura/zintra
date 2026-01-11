import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

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

    // Create status update (without images array - they go in separate table)
    const { data: update, error: updateError } = await supabase
      .from('vendor_status_updates')
      .insert({
        vendor_id: vendorId,
        content: content.trim(),
        images: null, // Images will be stored in StatusUpdateImage table
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

    // Save images to separate table
    if (images.length > 0) {
      const imageRecords = images.map((imageUrl, index) => ({
        id: randomUUID(),
        statusupdateid: update.id,
        imageurl: imageUrl,
        imagetype: 'status',
        displayorder: index,
      }));

      const { error: imagesError } = await supabase
        .from('statusupdateimage')
        .insert(imageRecords);

      if (imagesError) {
        console.error('❌ Error saving image metadata:', imagesError);
        // Continue anyway - update is created but images metadata not saved
      } else {
        console.log('✅ Saved', images.length, 'image records');
      }
    }

    // Fetch the update with images
    const { data: updateWithImages, error: fetchError } = await supabase
      .from('vendor_status_updates')
      .select('*')
      .eq('id', update.id)
      .single();

    if (!fetchError && updateWithImages) {
      // Fetch images for this update
      const { data: updateImages } = await supabase
        .from('statusupdateimage')
        .select('*')
        .eq('statusupdateid', update.id)
        .order('displayorder', { ascending: true });

      updateWithImages.images = updateImages?.map(img => ({
        id: img.id,
        imageUrl: img.imageurl,
        imageType: img.imagetype,
        caption: img.caption,
        displayOrder: img.displayorder,
        uploadedAt: img.uploadedat,
      })) || [];

      return NextResponse.json(
        {
          message: 'Status update created successfully',
          update: updateWithImages,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        message: 'Status update created successfully',
        update,
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
 * Get status updates for a vendor with images
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

    // Fetch images for all updates
    if (updates && updates.length > 0) {
      const updateIds = updates.map(u => u.id);
      const { data: allImages } = await supabase
        .from('statusupdateimage')
        .select('*')
        .in('statusupdateid', updateIds)
        .order('displayorder', { ascending: true });

      // Transform images to camelCase
      const transformedImages = allImages?.map(img => ({
        id: img.id,
        statusUpdateId: img.statusupdateid,
        imageUrl: img.imageurl,
        imageType: img.imagetype,
        caption: img.caption,
        displayOrder: img.displayorder,
        uploadedAt: img.uploadedat,
      })) || [];

      // Attach images to updates
      const imagesByUpdateId = {};
      transformedImages.forEach(img => {
        if (!imagesByUpdateId[img.statusUpdateId]) {
          imagesByUpdateId[img.statusUpdateId] = [];
        }
        imagesByUpdateId[img.statusUpdateId].push(img);
      });

      updates.forEach(update => {
        update.images = imagesByUpdateId[update.id] || [];
      });
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
