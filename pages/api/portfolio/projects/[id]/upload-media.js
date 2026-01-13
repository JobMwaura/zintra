// pages/api/portfolio/projects/[id]/upload-media.js
// Get presigned URL for portfolio project media upload

import { generatePresignedUploadUrl } from '@/lib/aws-s3';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id: projectId } = req.query;

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

    // Verify project ownership
    const { data: project } = await supabase
      .from('portfolio_projects')
      .select('vendor_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', project.vendor_id)
      .eq('user_id', user.id)
      .single();

    if (!vendor) {
      return res.status(403).json({ error: 'Unauthorized - not project owner' });
    }

    // Validate file type
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'fileName and contentType are required' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: 'File type not allowed' });
    }

    // Generate presigned URL for portfolio media
    const s3Path = `vendor-profiles/portfolio/${user.id}/`;
    const { uploadUrl, fileUrl, key } = await generatePresignedUploadUrl({
      fileName,
      contentType,
      s3Path,
    });

    if (!uploadUrl || !fileUrl) {
      throw new Error('Failed to generate presigned URL');
    }

    console.log('✅ Presigned URL generated for portfolio media upload');

    return res.status(200).json({
      uploadUrl,
      fileUrl,
      key,
      fileName,
    });
  } catch (err) {
    console.error('❌ Portfolio media upload error:', err);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}
