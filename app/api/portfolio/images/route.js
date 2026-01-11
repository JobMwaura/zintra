'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/portfolio/images
 * Create a portfolio project image
 * 
 * Body:
 * - projectId (required): UUID of portfolio project
 * - imageUrl (required): URL of uploaded image
 * - imageType (required): 'before', 'during', or 'after'
 * - caption (optional): Image caption
 * - displayOrder (required): Order to display image (0-based)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      projectId,
      imageUrl,
      imageType,
      caption = null,
      displayOrder = 0,
    } = body;

    // Validate required fields
    if (!projectId || !imageUrl || !imageType) {
      return NextResponse.json(
        { message: 'Missing required fields: projectId, imageUrl, imageType' },
        { status: 400 }
      );
    }

    // Validate imageType
    const validTypes = ['before', 'during', 'after'];
    if (!validTypes.includes(imageType)) {
      return NextResponse.json(
        { message: `Invalid imageType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify project exists
    console.log('🔍 Checking if project exists:', projectId);
    const { data: project, error: projectError } = await supabase
      .from('PortfolioProject')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('❌ Error fetching project:', projectError);
      
      // If table doesn't exist, return helpful message
      if (projectError?.message?.includes('relation') || projectError?.message?.includes('does not exist')) {
        console.error('❌ PortfolioProject table not found');
        return NextResponse.json(
          { message: 'Portfolio tables not set up. Run database migration.', error: projectError.message },
          { status: 503 }
        );
      }
      
      // Project not found but table exists
      console.log('⚠️ Project not found (but table exists):', projectId);
      return NextResponse.json(
        { message: 'Project not found', error: projectError.message },
        { status: 404 }
      );
    }

    if (!project) {
      console.log('⚠️ Project not found:', projectId);
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    console.log('✅ Project found:', project.id);

    // Create image
    console.log('📝 Creating image for project:', projectId);
    const { data: image, error: imageError } = await supabase
      .from('PortfolioProjectImage')
      .insert({
        portfolioProjectId: projectId,
        imageUrl,
        imageType,
        caption,
        displayOrder,
      })
      .select()
      .single();

    if (imageError) {
      console.error('❌ Image creation error:', imageError);
      
      // If table doesn't exist, return helpful message
      if (imageError.message?.includes('relation') || imageError.message?.includes('does not exist')) {
        console.error('❌ PortfolioProjectImage table not found');
        return NextResponse.json(
          { message: 'Portfolio tables not set up', error: imageError.message },
          { status: 503 }
        );
      }
      
      // Other errors (constraint violations, etc)
      return NextResponse.json(
        { message: 'Failed to create image', error: imageError.message },
        { status: 400 }
      );
    }

    if (!image) {
      console.error('❌ Image creation returned no data');
      return NextResponse.json(
        { message: 'Image creation failed - no data returned' },
        { status: 500 }
      );
    }

    console.log('✅ Portfolio image created:', image.id);
    return NextResponse.json(
      {
        message: 'Image created successfully',
        image,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Portfolio image creation failed:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
