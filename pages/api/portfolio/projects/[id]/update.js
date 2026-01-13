// pages/api/portfolio/projects/[id]/update.js
// Update a portfolio project

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

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

    // Verify ownership
    const { data: project, error: fetchError } = await supabase
      .from('portfolio_projects')
      .select('vendor_id')
      .eq('id', id)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check vendor ownership
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', project.vendor_id)
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      return res.status(403).json({ error: 'Unauthorized - not project owner' });
    }

    // Prepare update data
    const updateData = {};
    const { title, description, category, status, project_type, materials_used, cost_estimate, timeline_months, is_featured } = req.body;

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (project_type !== undefined) updateData.project_type = project_type;
    if (materials_used !== undefined) updateData.materials_used = materials_used;
    if (cost_estimate !== undefined) updateData.cost_estimate = cost_estimate ? parseFloat(cost_estimate) : null;
    if (timeline_months !== undefined) updateData.timeline_months = timeline_months ? parseInt(timeline_months) : null;
    if (is_featured !== undefined) updateData.is_featured = is_featured;

    // Update project
    const { data: updatedProject, error: updateError } = await supabase
      .from('portfolio_projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating portfolio project:', updateError);
      throw updateError;
    }

    console.log('✅ Portfolio project updated:', id);

    return res.status(200).json({
      project: updatedProject,
      message: 'Project updated successfully',
    });
  } catch (err) {
    console.error('❌ Portfolio project update error:', err);
    return res.status(500).json({ error: 'Failed to update project' });
  }
}
