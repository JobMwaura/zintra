// pages/api/portfolio/projects/list.js
// Get portfolio projects for a vendor

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { vendorId } = req.query;

    if (!vendorId) {
      return res.status(400).json({ error: 'vendorId is required' });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Fetch projects for vendor
    const { data: projects, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_public', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching projects:', error);
      throw error;
    }

    console.log('✅ Fetched', projects?.length || 0, 'portfolio projects for vendor:', vendorId);

    // Fetch media for each project
    const projectsWithMedia = await Promise.all(
      (projects || []).map(async (project) => {
        const { data: media } = await supabase
          .from('portfolio_media')
          .select('*')
          .eq('project_id', project.id)
          .order('display_order', { ascending: true });

        return {
          ...project,
          media: media || [],
        };
      })
    );

    return res.status(200).json({
      projects: projectsWithMedia,
      total: projectsWithMedia.length,
    });
  } catch (err) {
    console.error('❌ Portfolio projects list error:', err);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
}
