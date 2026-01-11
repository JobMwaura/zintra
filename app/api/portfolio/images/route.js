'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

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
    const supabase = getSupabaseClient();
    
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
    console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('🔍 Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    
    const { data: project, error: projectError } = await supabase
      .from('PortfolioProject')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('❌ Error fetching project:', projectError);
      console.error('Error code:', projectError.code);
      console.error('Error message:', projectError.message);
      console.error('Full error:', JSON.stringify(projectError, null, 2));
      console.error('Error details:', {
        status: projectError.status,
        statusText: projectError.statusText,
        details: projectError.details,
        hint: projectError.hint,
      });
      
      // Check for RLS-related errors
      if (projectError?.message?.includes('Row Level Security') || 
          projectError?.message?.includes('permission denied') ||
          projectError?.code === 'PGRST301' ||
          projectError?.message?.includes('relation')) {
        console.error('❌ RLS or permission error on PortfolioProject table');
        return NextResponse.json(
          { 
            message: 'PortfolioProject table access denied. RLS policy needs to be configured.',
            error: projectError.message, 
            code: projectError.code,
            action: 'Run SQL to create RLS policy: CREATE POLICY "Allow all operations" ON "PortfolioProject" FOR ALL USING (true) WITH CHECK (true);'
          },
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
    console.log('  imageUrl:', imageUrl);
    console.log('  imageType:', imageType);
    console.log('  caption:', caption);
    console.log('  displayOrder:', displayOrder);
    
    const insertData = {
      portfolioprojectid: projectId,
      imageurl: imageUrl,
      imagetype: imageType,
      caption,
      displayorder: displayOrder,
    };
    
    console.log('📋 Insert data:', JSON.stringify(insertData));
    
    const { data: image, error: imageError } = await supabase
      .from('PortfolioProjectImage')
      .insert(insertData)
      .select()
      .single();

    if (imageError) {
      console.error('❌ Image creation error:', imageError);
      console.error('Error code:', imageError.code);
      console.error('Error message:', imageError.message);
      console.error('Full error:', JSON.stringify(imageError, null, 2));
      
      // Check for RLS-related errors
      if (imageError?.message?.includes('Row Level Security') || 
          imageError?.message?.includes('permission denied') ||
          imageError?.code === 'PGRST301' ||
          imageError?.message?.includes('relation')) {
        console.error('❌ RLS or permission error on PortfolioProjectImage table');
        return NextResponse.json(
          { 
            message: 'PortfolioProjectImage table access denied. RLS policy needs to be configured.',
            error: imageError.message, 
            code: imageError.code,
            action: 'Run SQL to create RLS policy: CREATE POLICY "Allow all operations" ON "PortfolioProjectImage" FOR ALL USING (true) WITH CHECK (true);'
          },
          { status: 503 }
        );
      }
      
      // Other errors (constraint violations, etc)
      console.error('Returning 400 error:', imageError.message);
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
    console.error('❌ Portfolio image creation failed:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error.message,
        errorType: error.constructor.name,
        errorDetails: error.toString(),
      },
      { status: 500 }
    );
  }
}
