import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/status-updates/comments?updateId=...
 * Fetch all comments for a status update
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const updateId = searchParams.get('updateId');

    if (!updateId) {
      return NextResponse.json(
        { message: 'updateId query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch comments with user info
    const { data: comments, error: commentsError } = await supabase
      .from('vendor_status_update_comments')
      .select(`
        id,
        content,
        user_id,
        created_at
      `)
      .eq('update_id', updateId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (commentsError) {
      console.error('❌ Failed to fetch comments:', commentsError);
      return NextResponse.json(
        { message: 'Failed to fetch comments', error: commentsError.message },
        { status: 400 }
      );
    }

    console.log('✅ Fetched', comments?.length || 0, 'comments for update:', updateId);

    return NextResponse.json({
      comments: comments || [],
      count: comments?.length || 0,
    });
  } catch (error) {
    console.error('❌ Comments fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/status-updates/comments
 * Create a new comment on a status update
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { updateId, content } = body;

    console.log('📝 Incoming POST request:', { updateId, contentLength: content?.length });

    if (!updateId || !content) {
      return NextResponse.json(
        { message: 'updateId and content are required' },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { message: 'Comment cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { message: 'Comment must be less than 500 characters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('💬 Creating comment for update:', updateId);
    console.log('   By user:', user.id);
    console.log('   Content length:', content.length);

    // Insert comment
    const { data: comment, error: commentError } = await supabase
      .from('vendor_status_update_comments')
      .insert({
        update_id: updateId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (commentError) {
      console.error('❌ Failed to create comment:', commentError);
      return NextResponse.json(
        { message: 'Failed to create comment', error: commentError.message },
        { status: 400 }
      );
    }

    console.log('✅ Comment created:', comment.id);

    // Update comments_count on the status update
    const { data: update, error: updateError } = await supabase
      .from('vendor_status_updates')
      .select('comments_count')
      .eq('id', updateId)
      .single();

    if (!updateError && update) {
      const newCount = (update.comments_count || 0) + 1;
      await supabase
        .from('vendor_status_updates')
        .update({ comments_count: newCount })
        .eq('id', updateId);
      console.log('✅ Updated comments_count to:', newCount);
    }

    // Return comment with user info
    const { data: commentWithUser } = await supabase
      .from('vendor_status_update_comments')
      .select(`
        id,
        content,
        user_id,
        created_at
      `)
      .eq('id', comment.id)
      .single();

    return NextResponse.json({
      message: 'Comment created successfully',
      comment: commentWithUser,
    });
  } catch (error) {
    console.error('❌ Comment creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
