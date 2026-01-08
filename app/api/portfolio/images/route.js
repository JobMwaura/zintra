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
    const { data: project, error: projectError } = await supabase
      .from('PortfolioProject')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('❌ Project not found:', projectId, projectError);
      
      // If table doesn't exist, return helpful message
      if (projectError?.message?.includes('relation') || projectError?.message?.includes('does not exist')) {
        return NextResponse.json(
          { message: 'Portfolio feature is being set up. Please run the database migration: npx prisma migrate deploy' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Create image
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
        return NextResponse.json(
          { message: 'Portfolio feature is being set up. Please run the database migration: npx prisma migrate deploy' },
          { status: 503 }
        );
      }
      
      throw imageError;
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
