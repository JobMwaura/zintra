import { NextRequest, NextResponse } from 'next/server';
import { getRFQTemplate, templateExists } from '@/lib/rfqTemplates';
import { isValidCategorySlug } from '@/lib/categories';

export interface RouteParams {
  params: {
    slug: string;
  };
}

/**
 * GET /api/rfq-templates/[slug]
 * 
 * Returns a single RFQ template for a specific category
 * Validates that the slug is a valid canonical category
 * 
 * Path params:
 *   - slug: category slug (e.g., "architectural_design")
 * 
 * Response: { template: {categorySlug, steps[], fields[], ...} }
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = params;

    // Validate slug is a valid category
    if (!isValidCategorySlug(slug)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid category slug: "${slug}"`,
          availableSlugs: 'Use GET /api/rfq-templates/metadata to see all available templates'
        },
        { status: 400 }
      );
    }

    // Check if template exists
    if (!templateExists(slug)) {
      return NextResponse.json(
        {
          success: false,
          error: `Template not found for category: "${slug}"`
        },
        { status: 404 }
      );
    }

    // Load and validate template
    const template = await getRFQTemplate(slug);

    return NextResponse.json(
      {
        success: true,
        data: template,
        message: `Retrieved RFQ template for category: ${template.categoryLabel}`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching RFQ template:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch RFQ template'
      },
      { status: 500 }
    );
  }
}
