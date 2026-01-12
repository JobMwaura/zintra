import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/status-updates/comments/[commentId]
 * Delete a specific comment
 */
export async function DELETE(request, { params }) {
  try {
    const { commentId } = params;

    if (!commentId) {
      return NextResponse.json(
        { message: 'commentId is required' },
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
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('🗑️ Deleting comment:', commentId);

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

    // Check if user owns this comment
    if (comment.user_id !== user.id) {
      console.error('❌ Unauthorized: User', user.id, 'tried to delete comment by', comment.user_id);
      return NextResponse.json(
        { message: 'You can only delete your own comments' },
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
