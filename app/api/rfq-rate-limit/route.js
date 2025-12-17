// app/api/rfq-rate-limit/route.js
// ============================================================================
// SERVER-SIDE RFQ RATE LIMITING
// ============================================================================
// Purpose: Check if user has exceeded daily RFQ limit (2 per day)
// Replaces: localStorage-based client-side limit (which users could bypass)
// Security: Verified on server, not user-controlled
// ============================================================================

import { createClient } from '@supabase/supabase-js';

let supabase = null;

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  try {
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Rate limiting service not configured' }),
        { status: 503 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400 }
      );
    }

    // Get current time and 24 hours ago
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Query RFQs created by this user in the last 24 hours
    const { data: recentRFQs, error: queryError } = await supabase
      .from('rfqs')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .lte('created_at', now.toISOString());

    if (queryError) {
      console.error('Database error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to check rate limit' }),
        { status: 500 }
      );
    }

    const count = recentRFQs?.length || 0;
    const dailyLimit = 2;
    const remaining = Math.max(0, dailyLimit - count);
    const isLimited = count >= dailyLimit;

    return new Response(
      JSON.stringify({
        count,
        dailyLimit,
        remaining,
        isLimited,
        resetTime: twentyFourHoursAgo.getTime() + 24 * 60 * 60 * 1000, // Unix timestamp when limit resets
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Rate limit check error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

// GET endpoint to check without requiring body
export async function GET(request) {
  try {
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Rate limiting service not configured' }),
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400 }
      );
    }

    // Get current time and 24 hours ago
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Query RFQs created by this user in the last 24 hours
    const { data: recentRFQs, error: queryError } = await supabase
      .from('rfqs')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .lte('created_at', now.toISOString());

    if (queryError) {
      console.error('Database error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Failed to check rate limit' }),
        { status: 500 }
      );
    }

    const count = recentRFQs?.length || 0;
    const dailyLimit = 2;
    const remaining = Math.max(0, dailyLimit - count);
    const isLimited = count >= dailyLimit;

    return new Response(
      JSON.stringify({
        count,
        dailyLimit,
        remaining,
        isLimited,
        resetTime: twentyFourHoursAgo.getTime() + 24 * 60 * 60 * 1000, // Unix timestamp when limit resets
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Rate limit check error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}
