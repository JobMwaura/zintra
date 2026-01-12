import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * DELETE /api/status-updates/comments/[commentId]
 * Delete a specific comment
 */
export async function DELETE(request, { params }) {
  try {
    const { commentId } = params;
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    if (!commentId) {
      return NextResponse.json(
        { message: 'commentId is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { message: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting comment:', commentId, 'by user:', userId);

    // Get the comment to verify ownership and get updateId
    const { data: comment, error: fetchError } = await supabase
      .from('vendor_status_update_comments')
      .select('id, user_id, update_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      console.error('❌ Comment not found:', commentId);
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }

    // Verify user ownership
    if (comment.user_id !== userId) {
      console.error('❌ User not authorized to delete this comment');
      return NextResponse.json(
        { message: 'Not authorized to delete this comment' },
        { status: 403 }
      );
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('vendor_status_update_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('❌ Failed to delete comment:', deleteError);
      return NextResponse.json(
        { message: 'Failed to delete comment', error: deleteError.message },
        { status: 400 }
      );
    }

    console.log('✅ Comment deleted:', commentId);

    // Update comments_count on the status update
    const { data: update, error: updateError } = await supabase
      .from('vendor_status_updates')
      .select('comments_count')
      .eq('id', comment.update_id)
      .single();

    if (!updateError && update) {
      const newCount = Math.max(0, (update.comments_count || 1) - 1);
      await supabase
        .from('vendor_status_updates')
        .update({ comments_count: newCount })
        .eq('id', comment.update_id);
      console.log('✅ Updated comments_count to:', newCount);
    }

    return NextResponse.json({
      message: 'Comment deleted successfully',
      updateId: comment.update_id,
    });
  } catch (error) {
    console.error('❌ Comment deletion error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/status-updates/comments/[commentId]
 * Update a comment
 */
export async function PUT(request, { params }) {
  try {
    const { commentId } = params;
    const body = await request.json();
    const { content, userId } = body;

    console.log('📝 PUT /api/status-updates/comments/:id - commentId:', commentId);

    if (!userId) {
      return NextResponse.json(
        { message: 'userId is required' },
        { status: 400 }
      );
    }

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

    if (comment.user_id !== userId) {
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
