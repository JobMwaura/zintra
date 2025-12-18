/**
 * API Endpoint: Get Notifications
 * 
 * GET /api/notifications
 * 
 * Fetches notifications for the authenticated user
 * Supports filtering and pagination
 * 
 * Query Parameters:
 * - limit: Number of notifications to return (default: 50)
 * - offset: Pagination offset (default: 0)
 * - type: Filter by notification type (optional)
 * - unread: Get only unread notifications (true/false, optional)
 * 
 * @returns {object} Array of notifications
 */

import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get authorization token from headers
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.replace('Bearer ', '');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const filterType = req.query.type as string;
    const unreadOnly = req.query.unread === 'true';

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filterType) {
      query = query.eq('type', filterType);
    }

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    // Apply pagination
    const { data, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: data || [],
      count: count || 0,
      limit: limit,
      offset: offset
    });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);

    return res.status(500).json({
      error: 'Failed to fetch notifications',
      details: err.message
    });
  }
}
