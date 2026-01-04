import { NextRequest, NextResponse } from 'next/server';
import { getAllTemplateMetadata } from '@/lib/rfqTemplates';

/**
 * GET /api/rfq-templates/metadata
 * 
 * Returns lightweight metadata for all 20 RFQ templates
 * Used to populate dropdown lists, category selection UI
 * 
 * Response: { templates: [{slug, label, stepCount, description}, ...] }
 */
export async function GET(request: NextRequest) {
  try {
    const metadata = await getAllTemplateMetadata();
    
    return NextResponse.json(
      {
        success: true,
        data: metadata,
        count: metadata.length,
        message: `Retrieved metadata for ${metadata.length} templates`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching template metadata:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch template metadata'
      },
      { status: 500 }
    );
  }
}
