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
    console.log('📦 POST /api/portfolio/projects - Received body:', body);
    
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

    console.log('🔍 Parsed fields:');
    console.log('  vendorId:', vendorId, typeof vendorId);
    console.log('  title:', title, typeof title);
    console.log('  categorySlug:', categorySlug, typeof categorySlug);
    console.log('  description:', description, typeof description);

    // Validate required fields
    if (!vendorId || !title || !categorySlug || !description) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        {
          message: 'Missing required fields: vendorId, title, categorySlug, description',
          received: { vendorId, title, categorySlug, description },
        },
        { status: 400 }
      );
    }

    // Verify vendor exists in vendors table
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      console.log('❌ Vendor not found in vendors table:', vendorId);
      return NextResponse.json(
        { message: 'Vendor not found' },
        { status: 404 }
      );
    }

    console.log('✅ Vendor found in vendors table:', vendor.id);

    // Create project using raw SQL to avoid foreign key constraint issues
    const projectId = randomUUID();
    const now = new Date().toISOString();
    
    try {
      console.log('📝 Creating portfolio project with SQL...');
      const { data: projects, error: projectError } = await supabase
        .rpc('create_portfolio_project', {
          p_id: projectId,
          p_vendor_id: vendorId,
          p_title: title.trim(),
          p_description: description.trim(),
          p_category_slug: categorySlug,
          p_status: status,
          p_budget_min: budgetMin ? parseInt(budgetMin) : null,
          p_budget_max: budgetMax ? parseInt(budgetMax) : null,
          p_timeline: timeline || null,
          p_location: location || null,
          p_completion_date: completionDate ? new Date(completionDate).toISOString() : null,
        });

      if (projectError) {
        console.error('❌ RPC error:', projectError);
        // If RPC doesn't exist, fall back to direct insert
        console.log('📝 RPC not found, trying direct insert...');
        
        const { data: directProject, error: directError } = await supabase
          .from('PortfolioProject')
          .insert({
            id: projectId,
            vendorprofileid: vendorId,
            title: title.trim(),
            description: description.trim(),
            categoryslug: categorySlug,
            status,
            budgetmin: budgetMin ? parseInt(budgetMin) : null,
            budgetmax: budgetMax ? parseInt(budgetMax) : null,
            timeline,
            location,
            completiondate: completionDate ? new Date(completionDate).toISOString() : null,
          })
          .select();

        if (directError) {
          console.error('❌ Direct insert error:', directError);
          return NextResponse.json(
            { message: 'Failed to create project', error: directError.message },
            { status: 400 }
          );
        }

        const project = directProject && directProject.length > 0 ? directProject[0] : null;
        console.log('✅ Project created (direct insert):', project?.id);
        return NextResponse.json(
          { 
            message: 'Project created successfully',
            project,
          },
          { status: 201 }
        );
      }

      console.log('✅ Project created via RPC:', projectId);
      return NextResponse.json(
        { 
          message: 'Project created successfully',
          project: { id: projectId },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('❌ Error creating project:', error);
      return NextResponse.json(
        { message: 'Failed to create project', error: error.message },
        { status: 500 }
      );
    }
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
    // Use lowercase column names (Supabase stores them as lowercase)
    const { data: projects, error: projectsError } = await supabase
      .from('PortfolioProject')
      .select('*')
      .eq('vendorprofileid', vendorId)
      .eq('status', 'published')
      .order('createdat', { ascending: false });

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

    // Fetch images for each project
    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id);
      const { data: images, error: imagesError } = await supabase
        .from('PortfolioProjectImage')
        .select('*')
        .in('portfolioprojectid', projectIds)
        .order('displayorder', { ascending: true });

      if (imagesError) {
        console.error('❌ Error fetching portfolio images:', imagesError);
        // Continue without images
      } else {
        // Transform images to camelCase for frontend consistency
        const transformedImages = images?.map(img => ({
          id: img.id,
          portfolioProjectId: img.portfolioprojectid,
          imageUrl: img.imageurl,
          imageType: img.imagetype,
          caption: img.caption,
          displayOrder: img.displayorder,
          uploadedAt: img.uploadedat,
        })) || [];

        // Attach images to projects
        const imagesByProjectId = {};
        transformedImages.forEach(img => {
          if (!imagesByProjectId[img.portfolioProjectId]) {
            imagesByProjectId[img.portfolioProjectId] = [];
          }
          imagesByProjectId[img.portfolioProjectId].push(img);
        });

        projects.forEach(project => {
          project.images = imagesByProjectId[project.id] || [];
        });
      }

      // Transform projects to camelCase for frontend consistency
      projects = projects?.map(project => ({
        id: project.id,
        vendorProfileId: project.vendorprofileid,
        title: project.title,
        categorySlug: project.categoryslug,
        description: project.description,
        status: project.status,
        budgetMin: project.budgetmin,
        budgetMax: project.budgetmax,
        timeline: project.timeline,
        location: project.location,
        completionDate: project.completiondate,
        createdAt: project.createdat,
        updatedAt: project.updatedat,
        images: project.images || [],
      })) || [];
    }

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
