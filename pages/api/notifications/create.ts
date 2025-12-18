/**
 * API Endpoint: Create Notification
 * 
 * POST /api/notifications/create
 * 
 * Creates a new notification in the database
 * Used by backend services to notify users of events
 * 
 * @param {string} userId - User ID to notify
 * @param {string} type - Notification type (quote_received, etc.)
 * @param {string} title - Notification title
 * @param {string} body - Notification message body (optional)
 * @param {object} metadata - Extra data (rfq_id, vendor_id, etc.)
 * 
 * @returns {object} Created notification object
 */

import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate request body
  const { userId, type, title, body, metadata } = req.body;

  if (!userId || !type || !title) {
    return res.status(400).json({
      error: 'Missing required fields: userId, type, title'
    });
  }

  // Initialize Supabase client with service role (for server-side operations)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Insert notification into database
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type: type,
        title: title,
        body: body || null,
        metadata: metadata || {}
      }])
      .select()
      .single();

    // Handle database errors
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Return created notification
    return res.status(201).json({
      success: true,
      data: data,
      message: 'Notification created successfully'
    });
  } catch (err: any) {
    console.error('Error creating notification:', err);

    return res.status(500).json({
      error: 'Failed to create notification',
      details: err.message
    });
  }
}
