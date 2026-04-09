'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/portfolio/views
 * Track a project view (unique per user per day)
 * 
 * Body:
 * - projectId (required): Project UUID
 * - userId (optional): User UUID (for authenticated users)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId, userId } = body;

    if (!projectId) {
      return NextResponse.json(
        { message: 'projectId is required' },
        { status: 400 }
      );
    }

    // Get client IP for anonymous users
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request.headers.get('user-agent') || '';

    console.log(`📊 Recording view for project ${projectId} by user ${userId || ipAddress}`);

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('PortfolioProject')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.log('❌ Project not found:', projectId);
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if view already tracked today for this user/IP
    const today = new Date().toISOString().split('T')[0];
    const { data: existingView } = await supabase
      .from('portfolio_project_views')
      .select('id')
      .eq('project_id', projectId)
      .gte('viewed_at', today + 'T00:00:00')
      .lt('viewed_at', today + 'T23:59:59')
      .eq(userId ? 'user_id' : 'ip_address', userId || ipAddress)
      .single();

    if (existingView) {
      console.log(`ℹ️  View already tracked today for this user/IP`);
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    // Insert view record
    const { error: viewError } = await supabase
      .from('portfolio_project_views')
      .insert({
        project_id: projectId,
        user_id: userId || null,
        ip_address: userId ? null : ipAddress,
        user_agent: userAgent,
      });

    if (viewError) {
      console.error('❌ View insertion error:', viewError);
      // Don't fail the request, just log it
    } else {
      console.log(`✅ View recorded for project ${projectId}`);
    }

    return NextResponse.json(
      { success: true },
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
 * GET /api/portfolio/views?projectId=...
 * Get statistics for a project (unique view count, save count, view breakdown)
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

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('PortfolioProject')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.log('❌ Project not found:', projectId);
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    // Count unique views (authenticated users counted once per day, anonymous by IP once per day)
    const { data: viewsData, error: viewsError } = await supabase
      .from('portfolio_project_views')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (viewsError) {
      console.error('❌ View count query error:', viewsError);
      // Continue with 0
    }

    // Get breakdown by user vs anonymous
    const { data: userViews, error: userViewsError } = await supabase
      .from('portfolio_project_views')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .not('user_id', 'is', null);

    const { data: anonViews, error: anonViewsError } = await supabase
      .from('portfolio_project_views')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .is('user_id', null);

    // Get save count for this project
    const { count: saveCount, error: saveError } = await supabase
      .from('vendor_profile_saved_projects')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (saveError) {
      console.error('❌ Save count query error:', saveError);
      // Continue with 0
    }

    const totalViews = viewsData?.length || 0;
    const authenticatedViews = userViews?.length || 0;
    const anonymousViews = anonViews?.length || 0;

    console.log(`✅ Stats: ${totalViews} views (${authenticatedViews} auth, ${anonymousViews} anon), ${saveCount || 0} saves`);
    
    return NextResponse.json(
      {
        projectId: project.id,
        viewCount: totalViews,
        viewBreakdown: {
          authenticated: authenticatedViews,
          anonymous: anonymousViews,
        },
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
