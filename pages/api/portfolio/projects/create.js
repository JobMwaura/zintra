// pages/api/portfolio/projects/create.js
// Create a new portfolio project

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get session from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - missing auth token' });
    }

    const token = authHeader.substring(7);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized - invalid token' });
    }

    // Get vendor ID from user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      return res.status(403).json({ error: 'User is not a vendor' });
    }

    // Validate input
    const { title, description, category, status, project_type, materials_used, cost_estimate, timeline_months } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Project title is required' });
    }

    // Create project
    const { data: project, error: createError } = await supabase
      .from('portfolio_projects')
      .insert([
        {
          vendor_id: vendor.id,
          title: title.trim(),
          description: description || null,
          category: category || null,
          status: status || 'completed',
          project_type: project_type || null,
          materials_used: materials_used || null,
          cost_estimate: cost_estimate ? parseFloat(cost_estimate) : null,
          timeline_months: timeline_months ? parseInt(timeline_months) : null,
          is_public: true,
          is_featured: false,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating portfolio project:', createError);
      throw createError;
    }

    console.log('✅ Portfolio project created:', project.id);

    return res.status(201).json({
      project,
      message: 'Project created successfully',
    });
  } catch (err) {
    console.error('❌ Portfolio project creation error:', err);
    return res.status(500).json({ error: 'Failed to create project' });
  }
}
