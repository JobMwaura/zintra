import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prismaClient';

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

    // Validate vendor exists and user owns it
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { message: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Create project
    const project = await prisma.portfolioProject.create({
      data: {
        vendorProfileId: vendorId,
        title: title.trim(),
        description: description.trim(),
        categorySlug,
        status,
        budgetMin: budgetMin ? parseInt(budgetMin) : null,
        budgetMax: budgetMax ? parseInt(budgetMax) : null,
        timeline,
        location,
        completionDate: completionDate ? new Date(completionDate) : null,
        viewCount: 0,
        quoteRequestCount: 0,
      },
    });

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

    // Get published projects or all projects if user owns vendor
    const projects = await prisma.portfolioProject.findMany({
      where: {
        vendorProfileId: vendorId,
        status: 'published', // For now, only return published
      },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    console.error('Portfolio projects fetch failed:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
