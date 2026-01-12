import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * PUT /api/status-updates/comments/[commentId]
 * Update a comment
 */
export async function PUT(request, { params }) {
  try {
    const { commentId } = params;
    const body = await request.json();
    const { content } = body;

    console.log('📝 PUT /api/status-updates/comments/:id - commentId:', commentId);

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { message: 'Comment content cannot be empty' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { message: 'Comment must be less than 500 characters' },
        { status: 400 }
      );
    }

    let supabase;
    try {
      supabase = await createClient();
    } catch (clientError) {
      console.error('❌ Failed to create Supabase client:', clientError);
      return NextResponse.json(
        { message: 'Failed to initialize database', error: clientError.message },
        { status: 500 }
      );
    }

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

    // Verify user owns the comment
    const { data: comment, error: fetchError } = await supabase
      .from('vendor_status_update_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      console.error('❌ Comment not found:', fetchError);
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }

    if (comment.user_id !== user.id) {
      console.error('❌ User not authorized to edit this comment');
      return NextResponse.json(
        { message: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Update comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('vendor_status_update_comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update comment:', updateError);
      return NextResponse.json(
        { message: 'Failed to update comment', error: updateError.message },
        { status: 400 }
      );
    }

    console.log('✅ Comment updated:', commentId);

    return NextResponse.json({
      message: 'Comment updated successfully',
      comment: updatedComment,
    });
  } catch (error) {
    console.error('❌ Comment update error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
