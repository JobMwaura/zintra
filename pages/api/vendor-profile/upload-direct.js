// /pages/api/vendor-profile/upload-direct.js
// Server-side upload - bypasses CORS by uploading through the server

import { generatePresignedUploadUrl, uploadFileToS3 } from '@/lib/aws-s3';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

// Disable Next.js body parsing so we can handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB max
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Get authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user from token
    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id;
    const vendorId = Array.isArray(fields.vendorId) ? fields.vendorId[0] : fields.vendorId;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file || !vendorId) {
      return res.status(400).json({ error: 'File and vendorId are required' });
    }

    // Check if user owns the vendor profile
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, user_id')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor || vendor.user_id !== userId) {
      return res.status(403).json({
        error: 'You do not have permission to upload for this vendor',
      });
    }

    // Generate S3 path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileExt = file.originalFilename.split('.').pop();
    const fileName = `${timestamp}-${randomId}-${file.originalFilename}`;
    const s3Key = `vendor-profiles/${vendorId}/profile-images/${fileName}`;

    // Read file from disk
    const fileBuffer = fs.readFileSync(file.filepath);

    // Upload directly to S3 from server
    const uploadResult = await uploadFileToS3(
      s3Key,
      fileBuffer,
      file.mimetype,
      {
        vendor_id: vendorId,
        user_id: userId,
        upload_type: 'vendor-profile',
        original_name: file.originalFilename,
      }
    );

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    // Return success
    return res.status(200).json({
      success: true,
      fileUrl: uploadResult.location,
      key: uploadResult.key,
      fileName,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
