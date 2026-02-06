import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceRole } from '@/lib/supabase-server';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * POST /api/portfolio/sync-main-page
 * Sync admin portfolio data to portfolio-data.ts file
 * Only accessible by admin users
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceRole();

    // Check if user is super admin
    const { data: user } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('clerk_id', userId)
      .single();

    const isSuperAdmin = user?.is_super_admin || false;

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only super admin users can sync to main page' },
        { status: 403 }
      );
    }

    // Get admin's portfolio data
    const { data: portfolio } = await supabase
      .from('user_portfolios')
      .select('portfolio_data')
      .eq('clerk_id', userId)
      .single();

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    const portfolioData = portfolio.portfolio_data;

    // Convert JSON to TypeScript format
    const tsContent = `// Auto-generated from admin portfolio
// Last updated: ${new Date().toISOString()}

export interface PortfolioProject {
  id: string;
  title: string;
  company: string;
  cardTeaser: string;
  outcome: string;
  tags: string[];
  details: {
    heading?: string;
    paragraphs: string[];
    list?: string[];
  }[];
}

export interface PortfolioData {
  fullName: string;
  title: string;
  tagline: string;
  email: string;
  location: string;
  linkedinUrl: string;
  githubUrl?: string;
  websiteUrl?: string;
  about?: string;
  experiences: any[];
  projects: PortfolioProject[];
  skills: Record<string, string[]>;
  education: any[];
  certifications?: any[];
  achievements?: string[];
  articles?: any[];
}

export const portfolioData: PortfolioData = ${JSON.stringify(portfolioData, null, 2)};

export default portfolioData;
`;

    // Write to file (only in development/server environment)
    try {
      const filePath = join(process.cwd(), 'lib', 'portfolio-data.ts');
      writeFileSync(filePath, tsContent, 'utf-8');
      
      return NextResponse.json({
        success: true,
        message: 'Portfolio data synced to main page successfully',
      });
    } catch (fileError) {
      console.error('Error writing portfolio-data.ts:', fileError);
      return NextResponse.json(
        { error: 'Failed to write portfolio file. This may be expected in production.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST /api/portfolio/sync-main-page error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
