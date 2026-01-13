import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * PUT /api/portfolio/projects/[id]
 * Update an existing portfolio project
 * 
 * Body:
 * - title (optional)
 * - description (optional)
 * - categoryslug (optional)
 * - status (optional)
 * - budgetmin (optional)
 * - budgetmax (optional)
 * - timeline (optional)
 * - location (optional)
 * - completiondate (optional)
 * - isfeatured (optional)
 */
export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const body = await request.json();

    console.log('📝 PUT /api/portfolio/projects/' + projectId);
    console.log('🔍 Update data:', body);

    if (!projectId) {
      return NextResponse.json(
        { message: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('PortfolioProject')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.log('❌ Project not found:', projectId);
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    console.log('✅ Project found:', project.id);

    // Build update object - only include fields that were provided
    const updateData = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.categoryslug !== undefined) updateData.categoryslug = body.categoryslug;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.budgetmin !== undefined) updateData.budgetmin = body.budgetmin ? parseInt(body.budgetmin) : null;
    if (body.budgetmax !== undefined) updateData.budgetmax = body.budgetmax ? parseInt(body.budgetmax) : null;
    if (body.timeline !== undefined) updateData.timeline = body.timeline;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.completiondate !== undefined) updateData.completiondate = body.completiondate ? new Date(body.completiondate).toISOString() : null;
    if (body.isfeatured !== undefined) updateData.isfeatured = body.isfeatured;

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    console.log('📝 Updating project with:', updateData);

    // Update the project
    const { data: updatedProject, error: updateError } = await supabase
      .from('PortfolioProject')
      .update(updateData)
      .eq('id', projectId)
      .select();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return NextResponse.json(
        { message: 'Failed to update project: ' + updateError.message },
        { status: 500 }
      );
    }

    if (!updatedProject || updatedProject.length === 0) {
      console.log('❌ No project returned after update');
      return NextResponse.json(
        { message: 'Failed to update project' },
        { status: 500 }
      );
    }

    console.log('✅ Project updated successfully:', updatedProject[0].id);

    return NextResponse.json(
      {
        message: 'Project updated successfully',
        project: updatedProject[0],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Error updating project:', err);
    return NextResponse.json(
      { message: 'Error updating project: ' + err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portfolio/projects/:id
 * Delete a portfolio project and its images
 */
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

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
