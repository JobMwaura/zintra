'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    const { data: project, error: projectError } = await supabase
      .from('PortfolioProject')
      .insert({
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
      })
      .select()
      .single();

    if (projectError) {
      throw projectError;
    }

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

    // Get published projects for vendor
    const { data: projects, error: projectsError } = await supabase
      .from('PortfolioProject')
      .select('*, PortfolioProjectImage(*)')
      .eq('vendorProfileId', vendorId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (projectsError) {
      throw projectsError;
    }

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Portfolio projects fetch failed:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
