'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/portfolio/views
 * Track a project view (increment view count)
 * 
 * Body:
 * - projectId (required): Project UUID
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { message: 'projectId is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Recording view for project ${projectId}`);

    // Get current view count
    const { data: project, error: fetchError } = await supabase
      .from('PortfolioProject')
      .select('viewcount')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      console.log('❌ Project not found:', projectId);
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Increment view count
    const newViewCount = (project.viewcount || 0) + 1;
    const { error: updateError } = await supabase
      .from('PortfolioProject')
      .update({ viewcount: newViewCount })
      .eq('id', projectId);

    if (updateError) {
      console.error('❌ View count update error:', updateError);
      return NextResponse.json(
        { message: 'Failed to record view' },
        { status: 500 }
      );
    }

    console.log(`✅ View recorded. New count: ${newViewCount}`);
    return NextResponse.json(
      { viewCount: newViewCount },
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Error recording view:', err);
    return NextResponse.json(
      { message: 'Error recording view' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portfolio/stats?projectId=...
 * Get statistics for a project (view count, save count)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { message: 'projectId is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching stats for project ${projectId}`);

    // Get project stats
    const { data: project, error: projectError } = await supabase
      .from('PortfolioProject')
      .select('viewcount, id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.log('❌ Project not found:', projectId);
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Get save count for this project
    const { count: saveCount, error: saveError } = await supabase
      .from('vendor_profile_saved_projects')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (saveError) {
      console.error('❌ Save count query error:', saveError);
      // Continue with just view count
    }

    console.log(`✅ Stats: ${project.viewcount} views, ${saveCount || 0} saves`);
    return NextResponse.json(
      {
        projectId: project.id,
        viewCount: project.viewcount || 0,
        saveCount: saveCount || 0,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Error fetching stats:', err);
    return NextResponse.json(
      { message: 'Error fetching stats' },
      { status: 500 }
    );
  }
}
