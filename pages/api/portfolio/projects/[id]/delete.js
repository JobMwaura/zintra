// pages/api/portfolio/projects/[id]/delete.js
// Delete a portfolio project

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
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

    // Delete project (cascades delete media and saves)
    const { error: deleteError } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error deleting portfolio project:', deleteError);
      throw deleteError;
    }

    console.log('✅ Portfolio project deleted:', id);

    return res.status(200).json({
      message: 'Project deleted successfully',
    });
  } catch (err) {
    console.error('❌ Portfolio project delete error:', err);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
}
