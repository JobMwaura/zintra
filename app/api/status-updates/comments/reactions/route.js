import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/status-updates/comments/reactions?commentId=...
 * Fetch all reactions for a comment
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    console.log('📥 GET reactions - commentId:', commentId);

    if (!commentId) {
      return NextResponse.json(
        { message: 'commentId query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch reactions grouped by emoji
    const { data: reactions, error: reactionsError } = await supabase
      .from('vendor_status_update_comment_reactions')
      .select('emoji, user_id')
      .eq('comment_id', commentId);

    if (reactionsError) {
      console.error('❌ Failed to fetch reactions:', reactionsError);
      return NextResponse.json(
        { message: 'Failed to fetch reactions', error: reactionsError.message },
        { status: 400 }
      );
    }

    // Group reactions by emoji and count
    const reactionCounts = {};
    const userReactions = {}; // Track which emojis current user reacted with

    reactions?.forEach(reaction => {
      if (!reactionCounts[reaction.emoji]) {
        reactionCounts[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: []
        };
      }
      reactionCounts[reaction.emoji].count++;
      reactionCounts[reaction.emoji].users.push(reaction.user_id);
    });

    console.log('✅ Fetched reactions:', Object.keys(reactionCounts).length, 'unique emojis');

    return NextResponse.json({
      reactions: Object.values(reactionCounts),
      total: reactions?.length || 0,
    });
  } catch (error) {
    console.error('❌ Reactions fetch error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/status-updates/comments/reactions
 * Add a reaction to a comment
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { commentId, emoji, userId } = body;

    console.log('📝 Adding reaction - commentId:', commentId, 'emoji:', emoji, 'userId:', userId);

    if (!commentId || !emoji) {
      return NextResponse.json(
        { message: 'commentId and emoji are required' },
        { status: 400 }
      );
    }

    // Validate emoji (basic check - should be a single emoji character)
    if (emoji.length > 2) {
      return NextResponse.json(
        { message: 'Invalid emoji' },
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
    let currentUserId = userId; // Use passed userId if provided
    
    if (!currentUserId) {
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

      currentUserId = user.id;
    }

    console.log('💬 Creating reaction by user:', currentUserId);

    // Check if user already reacted with this emoji
    const { data: existingReaction, error: checkError } = await supabase
      .from('vendor_status_update_comment_reactions')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', currentUserId)
      .eq('emoji', emoji)
      .single();

    if (existingReaction) {
      // Already reacted, delete it (toggle off)
      const { error: deleteError } = await supabase
        .from('vendor_status_update_comment_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) {
        console.error('❌ Failed to delete reaction:', deleteError);
        return NextResponse.json(
          { message: 'Failed to remove reaction', error: deleteError.message },
          { status: 400 }
        );
      }

      console.log('✅ Reaction removed');
      return NextResponse.json({
        message: 'Reaction removed',
        action: 'removed',
      });
    }

    // Add new reaction
    const { data: reaction, error: reactionError } = await supabase
      .from('vendor_status_update_comment_reactions')
      .insert({
        comment_id: commentId,
        user_id: currentUserId,
        emoji: emoji,
      })
      .select()
      .single();

    if (reactionError) {
      console.error('❌ Failed to create reaction:', reactionError);
      return NextResponse.json(
        { message: 'Failed to add reaction', error: reactionError.message },
        { status: 400 }
      );
    }

    console.log('✅ Reaction created:', reaction.id);

    return NextResponse.json({
      message: 'Reaction added successfully',
      action: 'added',
      reaction,
    });
  } catch (error) {
    console.error('❌ Reaction creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
