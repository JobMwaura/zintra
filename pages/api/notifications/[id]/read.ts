/**
 * API Endpoint: Mark Notification as Read
 * 
 * PATCH /api/notifications/[id]/read
 * 
 * Marks a single notification as read
 * Only the notification owner can mark their own notifications
 * 
 * @param {string} id - Notification ID from URL
 * 
 * @returns {object} Updated notification object
 */

import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow PATCH requests
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid notification ID' });
  }

  // Get authorization token
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
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Update notification (with ownership check)
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        error: 'Notification not found or unauthorized'
      });
    }

    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);

    return res.status(500).json({
      error: 'Failed to update notification',
      details: err.message
    });
  }
}
