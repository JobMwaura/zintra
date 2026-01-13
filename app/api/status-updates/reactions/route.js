import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/status-updates/reactions?updateId=...
 * Fetch all reactions for a status update
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const updateId = searchParams.get('updateId');

    console.log('📥 GET reactions - updateId:', updateId);

    if (!updateId) {
      return NextResponse.json(
        { message: 'updateId query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch reactions grouped by emoji
    const { data: reactions, error: reactionsError } = await supabase
      .from('vendor_status_update_reactions')
      .select('emoji, user_id')
      .eq('update_id', updateId);

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
          users: [],
        };
      }
      reactionCounts[reaction.emoji].count++;
      reactionCounts[reaction.emoji].users.push(reaction.user_id);
    });

    const reactionArray = Object.values(reactionCounts);

    console.log('✅ Fetched', reactionArray.length, 'reaction types for update:', updateId);

    return NextResponse.json({
      reactions: reactionArray,
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
 * POST /api/status-updates/reactions
 * Add or remove a reaction on a status update
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { updateId, emoji, userId } = body;

    console.log('📝 Incoming reaction POST:', { updateId, emoji, userId });

    if (!updateId || !emoji || !userId) {
      return NextResponse.json(
        { message: 'updateId, emoji, and userId are required' },
        { status: 400 }
      );
    }

    // Check if reaction already exists
    const { data: existingReaction, error: checkError } = await supabase
      .from('vendor_status_update_reactions')
      .select('id')
      .eq('update_id', updateId)
      .eq('emoji', emoji)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking reaction:', checkError);
      return NextResponse.json(
        { message: 'Failed to check reaction', error: checkError.message },
        { status: 400 }
      );
    }

    if (existingReaction) {
      // Delete reaction (toggle off)
      const { error: deleteError } = await supabase
        .from('vendor_status_update_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (deleteError) {
        console.error('❌ Failed to delete reaction:', deleteError);
        return NextResponse.json(
          { message: 'Failed to remove reaction', error: deleteError.message },
          { status: 400 }
        );
      }

      console.log('✅ Reaction removed:', emoji);

      return NextResponse.json({
        message: 'Reaction removed',
        action: 'removed',
      });
    } else {
      // Create reaction
      const { data: newReaction, error: insertError } = await supabase
        .from('vendor_status_update_reactions')
        .insert({
          update_id: updateId,
          emoji: emoji,
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to create reaction:', insertError);
        return NextResponse.json(
          { message: 'Failed to add reaction', error: insertError.message },
          { status: 400 }
        );
      }

      console.log('✅ Reaction added:', emoji);

      return NextResponse.json({
        message: 'Reaction added successfully',
        action: 'added',
        reaction: newReaction,
      });
    }
  } catch (error) {
    console.error('❌ Reaction creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
