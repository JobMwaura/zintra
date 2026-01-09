'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/portfolio/projects
 * Create a new portfolio project
 * 
 * Body:
 * - vendorId (required): UUID of vendor
 * - title (required): Project title
 * - categorySlug (required): Service category slug
 * - description (required): Project description
 * - status (required): 'draft' or 'published'
 * - budgetMin (optional): Minimum budget in KES
 * - budgetMax (optional): Maximum budget in KES
 * - timeline (optional): Project timeline description
 * - location (optional): Project location
 * - completionDate (optional): Date project was completed
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      vendorId,
      title,
      categorySlug,
      description,
      status = 'published',
      budgetMin = null,
      budgetMax = null,
      timeline = null,
      location = null,
      completionDate = null,
    } = body;

    // Validate required fields
    if (!vendorId || !title || !categorySlug || !description) {
      return NextResponse.json(
        { message: 'Missing required fields: vendorId, title, categorySlug, description' },
        { status: 400 }
      );
    }

    // Verify vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { message: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Create project
    const projectId = randomUUID();
    const now = new Date().toISOString();
    const { data: project, error: projectError } = await supabase
      .from('PortfolioProject')
      .insert({
        id: projectId,
        vendorProfileId: vendorId,
        title: title.trim(),
        description: description.trim(),
        categorySlug,
        status,
        budgetMin: budgetMin ? parseInt(budgetMin) : null,
        budgetMax: budgetMax ? parseInt(budgetMax) : null,
        timeline,
        location,
        completionDate: completionDate ? new Date(completionDate).toISOString() : null,
        viewCount: 0,
        quoteRequestCount: 0,
        updatedAt: now,
      })
      .select()
      .single();

    if (projectError) {
      console.error('❌ Project creation error:', projectError);
      
      // If table doesn't exist, give helpful message
      if (projectError.message?.includes('relation') || projectError.message?.includes('does not exist')) {
        return NextResponse.json(
          { message: 'Portfolio feature is being set up. Please run the database migration: npx prisma migrate deploy' },
          { status: 503 }
        );
      }
      
      throw projectError;
    }

    console.log('✅ Project created:', project.id);
    return NextResponse.json(
      { 
        message: 'Project created successfully',
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Portfolio project creation failed:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portfolio/projects?vendorId=...
 * Get portfolio projects for a vendor
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

    console.log('🔍 Fetching portfolio projects for vendor:', vendorId);

    // Get published projects for vendor
    // Note: Table is quoted because it's a Prisma convention, but Supabase may not have this table yet
    const { data: projects, error: projectsError } = await supabase
      .from('PortfolioProject')
      .select('*, PortfolioProjectImage(*)')
      .eq('vendorProfileId', vendorId)
      .eq('status', 'published')
      .order('createdAt', { ascending: false });

    if (projectsError) {
      console.error('❌ Portfolio projects fetch error:', projectsError);
      
      // If table doesn't exist, return empty array (migration not deployed yet)
      if (projectsError.message?.includes('relation') || projectsError.message?.includes('does not exist')) {
        console.log('⚠️ PortfolioProject table does not exist yet. Returning empty array.');
        return NextResponse.json({ projects: [] }, { status: 200 });
      }
      
      throw projectsError;
    }

    console.log('✅ Found', projects?.length || 0, 'portfolio projects');
    return NextResponse.json({ projects: projects || [] }, { status: 200 });
  } catch (error) {
    console.error('❌ Portfolio projects fetch failed:', error);
    // Return empty array instead of 500 error while table is being created
    return NextResponse.json(
      { projects: [], message: 'Portfolio feature is being set up' },
      { status: 200 }
    );
  }
}
