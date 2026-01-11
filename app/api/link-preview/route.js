import { NextResponse } from 'next/server';

/**
 * GET /api/link-preview?url=...
 * Fetch OpenGraph metadata from a URL for link preview
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ message: 'url parameter is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ message: 'Invalid URL' }, { status: 400 });
    }

    console.log('🔗 Fetching link preview for:', url);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 5000,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Extract OpenGraph meta tags
    const ogRegex = /<meta\s+property="og:(\w+)"\s+content="([^"]*)"/gi;
    const titleRegex = /<meta\s+property="og:title"\s+content="([^"]*)"/i;
    const descriptionRegex = /<meta\s+property="og:description"\s+content="([^"]*)"/i;
    const imageRegex = /<meta\s+property="og:image"\s+content="([^"]*)"/i;

    const title = titleRegex.exec(html)?.[1] || new URL(url).hostname;
    const description = descriptionRegex.exec(html)?.[1] || '';
    const image = imageRegex.exec(html)?.[1] || null;

    console.log('✅ Extracted link preview:', { title, image: !!image });

    return NextResponse.json(
      {
        title,
        description,
        image,
        url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Link preview error:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch link preview',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
