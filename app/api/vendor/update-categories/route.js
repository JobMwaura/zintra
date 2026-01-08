/**
 * API Route: PUT /api/vendor/update-categories
 * 
 * Updates a vendor's primary and secondary service categories
 * 
 * Request body:
 * {
 *   vendorId: string (required)
 *   primaryCategorySlug: string (required, e.g., "architectural_design")
 *   secondaryCategories: string[] (optional, array of category slugs)
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   data: { id, primaryCategorySlug, secondaryCategories, updatedAt }
 *   error: string (if error)
 * }
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { CANONICAL_CATEGORIES } from '@/lib/categories/canonicalCategories';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Validate category slug against canonical categories
 * @param {string} slug - Category slug to validate
 * @returns {boolean} True if valid
 */
function isValidCategorySlug(slug) {
  return CANONICAL_CATEGORIES.some((cat) => cat.slug === slug);
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { vendorId, primaryCategorySlug, secondaryCategories = [] } = body;

    // Validate required fields
    if (!vendorId || !primaryCategorySlug) {
      return NextResponse.json(
        { error: 'vendorId and primaryCategorySlug are required' },
        { status: 400 }
      );
    }

    // Validate category slugs
    if (!isValidCategorySlug(primaryCategorySlug)) {
      return NextResponse.json(
        { error: `Invalid primary category slug: ${primaryCategorySlug}` },
        { status: 400 }
      );
    }

    // Filter secondary categories to only include valid canonical categories
    // This handles migration from old category slugs to canonical ones
    const validSecondaryCategories = Array.isArray(secondaryCategories)
      ? secondaryCategories.filter((slug) => isValidCategorySlug(slug))
      : [];

    // Prevent primary category from being in secondary
    const filteredSecondary = validSecondaryCategories.filter(
      (s) => s !== primaryCategorySlug
    );

    // Update vendor profile in Supabase
    const { data, error } = await supabase
      .from('vendors')
      .update({
        primary_category_slug: primaryCategorySlug,
        secondary_categories: filteredSecondary.length > 0 ? filteredSecondary : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId)
      .select('id, primary_category_slug, secondary_categories, updated_at');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update categories' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: data[0].id,
          primaryCategorySlug: data[0].primary_category_slug,
          secondaryCategories: data[0].secondary_categories || [],
          updatedAt: data[0].updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating vendor categories:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
