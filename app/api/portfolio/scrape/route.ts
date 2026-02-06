import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { scrapeUrl, analyzeScrapedContent, isValidUrl } from '@/lib/url-scraper';

/**
 * POST /api/portfolio/scrape
 * Scrape a URL and extract content for portfolio
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, portfolioId } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Portfolio ID is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRole();

    // Verify portfolio ownership
    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('id, clerk_id')
      .eq('id', portfolioId)
      .eq('clerk_id', userId)
      .maybeSingle();

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // Create pending link record
    const { data: linkRecord, error: insertError } = await supabase
      .from('portfolio_links')
      .insert({
        portfolio_id: portfolioId,
        url: url,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating link record:', insertError);
      return NextResponse.json(
        { error: 'Failed to create link record' },
        { status: 500 }
      );
    }

    // Scrape URL in background
    try {
      const scrapedData = await scrapeUrl(url);
      
      // Analyze scraped content with AI
      const analysis = await analyzeScrapedContent(url, scrapedData);
      
      // Update link record with scraped data
      const { error: updateError } = await supabase
        .from('portfolio_links')
        .update({
          title: scrapedData.title,
          scraped_content: scrapedData.content,
          metadata: {
            ...scrapedData.metadata,
            description: scrapedData.description,
            aiAnalysis: analysis,
          },
          status: 'scraped',
        })
        .eq('id', linkRecord.id);

      if (updateError) {
        console.error('Error updating link with scraped data:', updateError);
      }

      return NextResponse.json({
        success: true,
        link: {
          id: linkRecord.id,
          url: url,
          title: scrapedData.title,
          description: scrapedData.description,
          content: scrapedData.content.substring(0, 500) + '...', // Preview only
          metadata: scrapedData.metadata,
          aiAnalysis: analysis,
          status: 'scraped',
        },
      });
    } catch (scrapeError) {
      console.error('Error scraping URL:', scrapeError);
      
      // Update link status to failed
      await supabase
        .from('portfolio_links')
        .update({
          status: 'failed',
          metadata: {
            error: scrapeError instanceof Error ? scrapeError.message : 'Unknown error',
          },
        })
        .eq('id', linkRecord.id);

      return NextResponse.json({
        success: false,
        error: 'Failed to scrape URL. You can still manually add information about this link.',
        linkId: linkRecord.id,
      });
    }
  } catch (error) {
    console.error('POST /api/portfolio/scrape error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portfolio/scrape?id=xyz
 * Delete a scraped link
 */
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('id');

    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRole();

    // Verify ownership through portfolio
    const { data: link } = await supabase
      .from('portfolio_links')
      .select('id, portfolio_id, user_portfolios!inner(clerk_id)')
      .eq('id', linkId)
      .maybeSingle();

    if (!link || (link as any).user_portfolios.clerk_id !== userId) {
      return NextResponse.json(
        { error: 'Link not found or access denied' },
        { status: 404 }
      );
    }

    // Delete link
    const { error: deleteError } = await supabase
      .from('portfolio_links')
      .delete()
      .eq('id', linkId);

    if (deleteError) {
      console.error('Error deleting link:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/portfolio/scrape error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
