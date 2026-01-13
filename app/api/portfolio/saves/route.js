'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/portfolio/saves
 * Toggle save/wishlist status for a portfolio project
 * 
 * Body:
 * - projectId (required): Project UUID to save
 * - action (required): 'save' or 'unsave'
 * 
 * Headers:
 * - Authorization: Bearer {user_token}
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId, action } = body;

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`📌 ${action === 'save' ? 'Saving' : 'Unsaving'} project ${projectId} for user ${user.id}`);

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

    if (action === 'save') {
      // Try to insert (will fail if already saved, which is fine)
      const { error: insertError } = await supabase
        .from('vendor_profile_saved_projects')
        .insert({
          user_id: user.id,
          project_id: projectId,
        });

      // Ignore unique constraint errors (already saved)
      if (insertError && !insertError.message.includes('unique')) {
        console.error('❌ Save error:', insertError);
        return NextResponse.json(
          { message: 'Failed to save project: ' + insertError.message },
          { status: 500 }
        );
      }

      console.log('✅ Project saved');
      return NextResponse.json(
        { message: 'Project saved', saved: true },
        { status: 200 }
      );
    } else if (action === 'unsave') {
      // Delete the save
      const { error: deleteError } = await supabase
        .from('vendor_profile_saved_projects')
        .delete()
        .eq('user_id', user.id)
        .eq('project_id', projectId);

      if (deleteError) {
        console.error('❌ Unsave error:', deleteError);
        return NextResponse.json(
          { message: 'Failed to unsave project: ' + deleteError.message },
          { status: 500 }
        );
      }

      console.log('✅ Project unsaved');
      return NextResponse.json(
        { message: 'Project unsaved', saved: false },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: 'Invalid action. Use "save" or "unsave"' },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('❌ Error toggling project save:', err);
    return NextResponse.json(
      { message: 'Error toggling project save: ' + err.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portfolio/saves?projectId=...
 * Check if user has saved a project
 * 
 * Headers:
 * - Authorization: Bearer {user_token}
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

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      // Not logged in - return false
      return NextResponse.json(
        { saved: false },
        { status: 200 }
      );
    }

    const token = authHeader.substring(7);

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      // Invalid token - return false
      return NextResponse.json(
        { saved: false },
        { status: 200 }
      );
    }

    // Check if user has saved this project
    const { data: savedProject, error: saveError } = await supabase
      .from('vendor_profile_saved_projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .maybeSingle();

    if (saveError) {
      console.error('❌ Query error:', saveError);
      return NextResponse.json(
        { saved: false },
        { status: 200 }
      );
    }

    console.log(`✅ Check save status for ${projectId}: ${!!savedProject}`);
    return NextResponse.json(
      { saved: !!savedProject },
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Error checking save status:', err);
    return NextResponse.json(
      { saved: false },
      { status: 200 }
    );
  }
}
