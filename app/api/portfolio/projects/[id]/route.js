import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * DELETE /api/portfolio/projects/:id
 * Delete a portfolio project and its images
 */
export async function DELETE(request, { params }) {
  try {
    const { id: projectId } = params;

    if (!projectId) {
      return NextResponse.json(
        { message: 'Project ID is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting portfolio project:', projectId);

    // First, get all images for this project to clean up S3
    const { data: images, error: imagesError } = await supabase
      .from('PortfolioProjectImage')
      .select('*')
      .eq('portfolioprojectid', projectId);

    if (imagesError) {
      console.error('❌ Error fetching images for deletion:', imagesError);
      // Continue with deletion anyway
    } else if (images && images.length > 0) {
      console.log(`📸 Found ${images.length} images to clean up`);
      
      // TODO: Delete images from S3
      // For now we'll just delete from database
      // In production, you'd want to use AWS SDK to delete from S3
      
      // Delete image records from database
      for (const image of images) {
        const { error: deleteError } = await supabase
          .from('PortfolioProjectImage')
          .delete()
          .eq('id', image.id);

        if (deleteError) {
          console.error('❌ Error deleting image record:', deleteError);
        }
      }
      console.log('✅ Image records deleted from database');
    }

    // Delete the project
    const { error: deleteError } = await supabase
      .from('PortfolioProject')
      .delete()
      .eq('id', projectId);

    if (deleteError) {
      console.error('❌ Error deleting project:', deleteError);
      return NextResponse.json(
        { message: 'Failed to delete project', error: deleteError.message },
        { status: 400 }
      );
    }

    console.log('✅ Project deleted successfully:', projectId);
    return NextResponse.json(
      { message: 'Project deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Delete project error:', error);
    return NextResponse.json(
      { message: 'Failed to delete project', error: error.message },
      { status: 500 }
    );
  }
}
