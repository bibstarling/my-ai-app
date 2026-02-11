'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Sparkles, 
  FileText, 
  Bot, 
  Briefcase, 
  Settings, 
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Target,
  Send,
  Calendar,
  Award,
  Clock,
  Users,
} from 'lucide-react';
import { HelpButton } from '@/app/components/HelpButton';
import { PageTour } from '@/app/components/PageTour';
import { getPageTour } from '@/lib/page-tours';
import { supabase } from '@/lib/supabase';

type TrackedJob = {
  id: string;
  title: string;
  company: string;
  status: string;
  applied_date: string | null;
  interview_date: string | null;
  created_at: string;
  updated_at: string;
};

type JobStats = {
  total: number;
  saved: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [showPageTour, setShowPageTour] = useState(false);
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [jobStats, setJobStats] = useState<JobStats>({
    total: 0,
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  });
  const [loadingJobs, setLoadingJobs] = useState(true);
  
  const pageTour = getPageTour('dashboard');

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;
    
    setLoadingJobs(true);
    try {
      const { data, error } = await supabase
        .from('tracked_jobs')
        .select('id, title, company, status, applied_date, interview_date, created_at, updated_at')
        .eq('clerk_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setJobs(data);
        
        // Calculate stats
        const stats: JobStats = {
          total: data.length,
          saved: data.filter(j => j.status === 'saved').length,
          applied: data.filter(j => j.status === 'applied').length,
          interview: data.filter(j => j.status === 'interview').length,
          offer: data.filter(j => j.status === 'offer').length,
          rejected: data.filter(j => j.status === 'rejected').length,
        };
        setJobStats(stats);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const quickActions = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Build Profile',
      description: '⚠️ Start here! Powers everything (Cmd+K for AI help)',
      href: '/portfolio/builder',
      color: 'bg-accent',
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: 'Find Jobs',
      description: 'Search jobs with AI-powered match scores',
      href: '/assistant/job-search',
      color: 'bg-slate',
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Generate Resume',
      description: 'Create resumes from your profile (AI-powered)',
      href: '/resume-builder',
      color: 'bg-secondary',
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: 'AI Career Coach',
      description: 'Get personalized guidance (or press Cmd+K)',
      href: '/assistant',
      color: 'bg-ocean-blue',
    },
  ];

  // Format recent activity from jobs
  const recentActivity = jobs.slice(0, 5).map(job => {
    const timeAgo = getTimeAgo(new Date(job.updated_at));
    
    if (job.status === 'interview' && job.interview_date) {
      return {
        type: 'interview',
        title: `Interview: ${job.company}`,
        description: job.title,
        time: timeAgo,
      };
    } else if (job.status === 'applied' && job.applied_date) {
      return {
        type: 'applied',
        title: `Applied to ${job.company}`,
        description: job.title,
        time: timeAgo,
      };
    } else if (job.status === 'offer') {
      return {
        type: 'offer',
        title: `Offer from ${job.company}`,
        description: job.title,
        time: timeAgo,
      };
    } else {
      return {
        type: 'saved',
        title: `Saved: ${job.company}`,
        description: job.title,
        time: timeAgo,
      };
    }
  });

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
              </h1>
              <p className="text-muted mt-1 sm:mt-2 text-sm sm:text-base">
                Track your progress and achieve your career goals
              </p>
            </div>
            <Link
              href="/settings/portfolio"
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-lg transition-all border border-gray-200 text-foreground shadow-sm whitespace-nowrap"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Job Statistics */}
        {!loadingJobs && jobStats.total > 0 && (
          <section className="mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Job Search Progress
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl border-2 border-border p-4 hover-lift">
                <div className="flex items-center justify-between mb-2">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-foreground">{jobStats.total}</p>
                <p className="text-sm text-muted">Total Tracked</p>
              </div>
              
              <div className="bg-white rounded-xl border-2 border-border p-4 hover-lift">
                <div className="flex items-center justify-between mb-2">
                  <Send className="h-8 w-8 text-accent" />
                </div>
                <p className="text-2xl font-bold text-foreground">{jobStats.applied}</p>
                <p className="text-sm text-muted">Applications</p>
              </div>
              
              <div className="bg-white rounded-xl border-2 border-border p-4 hover-lift">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-foreground">{jobStats.interview}</p>
                <p className="text-sm text-muted">Interviews</p>
              </div>
              
              <div className="bg-white rounded-xl border-2 border-border p-4 hover-lift">
                <div className="flex items-center justify-between mb-2">
                  <Award className="h-8 w-8 text-success" />
                </div>
                <p className="text-2xl font-bold text-foreground">{jobStats.offer}</p>
                <p className="text-sm text-muted">Offers</p>
              </div>
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Quick Actions */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Quick Actions
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className="group bg-white rounded-xl border-2 border-border p-4 sm:p-6 hover:border-applause-orange hover:shadow-xl transition-all hover-lift"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`p-2 sm:p-3 ${action.color} rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform shrink-0`}>
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground group-hover:text-accent transition-colors mb-1 text-sm sm:text-base">
                          {action.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0 hidden sm:block" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Getting Started */}
            <section className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    Your Career Journey
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className={`h-5 w-5 shrink-0 mt-0.5 ${jobStats.total > 0 ? 'text-success' : 'text-muted'}`} />
                      <div>
                        <p className={`text-sm font-medium text-foreground ${jobStats.total > 0 ? 'font-bold' : ''}`}>
                          Build Your Portfolio
                        </p>
                        <p className="text-xs text-muted">Showcase your best work professionally</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className={`h-5 w-5 shrink-0 mt-0.5 ${jobStats.saved > 0 ? 'text-success' : 'text-muted'}`} />
                      <div>
                        <p className={`text-sm font-medium text-foreground ${jobStats.saved > 0 ? 'font-bold' : ''}`}>
                          Find & Save Jobs
                        </p>
                        <p className="text-xs text-muted">
                          {jobStats.saved > 0 ? `${jobStats.saved} jobs saved` : 'Discover opportunities that match your skills'}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className={`h-5 w-5 shrink-0 mt-0.5 ${jobStats.applied > 0 ? 'text-success' : 'text-muted'}`} />
                      <div>
                        <p className={`text-sm font-medium text-foreground ${jobStats.applied > 0 ? 'font-bold' : ''}`}>
                          Apply to Jobs
                        </p>
                        <p className="text-xs text-muted">
                          {jobStats.applied > 0 ? `${jobStats.applied} applications sent` : 'Create tailored applications and submit'}
                        </p>
                      </div>
                    </li>
                    {jobStats.interview > 0 && (
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-foreground">Interview Stage</p>
                          <p className="text-xs text-muted">{jobStats.interview} interview{jobStats.interview !== 1 ? 's' : ''} scheduled</p>
                        </div>
                      </li>
                    )}
                    {jobStats.offer > 0 && (
                      <li className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-success">Offers Received!</p>
                          <p className="text-xs text-muted">{jobStats.offer} job offer{jobStats.offer !== 1 ? 's' : ''}</p>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Profile Status */}
            <div className="bg-white rounded-xl border-2 border-border p-4 sm:p-6 hover-lift">
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Profile Strength
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">Job Tracking</span>
                    <span className="text-xs font-medium text-muted">
                      {jobStats.total > 0 ? '✓ Active' : 'Not Started'}
                    </span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-primary transition-all duration-500" 
                      style={{ width: `${Math.min(jobStats.total * 10, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {jobStats.total === 0 
                      ? 'Start tracking jobs to boost your profile' 
                      : `${jobStats.total} job${jobStats.total !== 1 ? 's' : ''} tracked`}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">Applications</span>
                    <span className="text-xs font-medium text-muted">
                      {jobStats.applied > 0 ? `${jobStats.applied} sent` : 'None yet'}
                    </span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-success transition-all duration-500" 
                      style={{ width: `${Math.min(jobStats.applied * 20, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {jobStats.applied === 0 
                      ? 'Apply to jobs to track your progress' 
                      : 'Keep applying to increase your chances!'}
                  </p>
                </div>
                {jobStats.interview > 0 && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-bold text-foreground">Active Interviews</span>
                    </div>
                    <p className="text-xs text-muted">
                      {jobStats.interview} interview{jobStats.interview !== 1 ? 's' : ''} in progress
                    </p>
                  </div>
                )}
                {jobStats.offer > 0 && (
                  <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-success" />
                      <span className="text-sm font-bold text-success">Offers Received!</span>
                    </div>
                    <p className="text-xs text-muted">
                      {jobStats.offer} job offer{jobStats.offer !== 1 ? 's' : ''} waiting for your response
                    </p>
                  </div>
                )}
              </div>
              <Link
                href={jobStats.total === 0 ? '/assistant/job-search' : '/assistant/my-jobs'}
                className="mt-6 block w-full text-center px-4 py-3 gradient-primary text-white rounded-lg hover:opacity-90 transition-all text-sm font-bold shadow-lg hover:shadow-xl"
              >
                {jobStats.total === 0 ? 'Start Job Search' : 'Manage Applications'}
              </Link>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border-2 border-border p-6 hover-lift">
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                {loadingJobs ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  </div>
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => {
                    const getIcon = () => {
                      switch (activity.type) {
                        case 'interview':
                          return <Calendar className="h-4 w-4 text-yellow-600" />;
                        case 'applied':
                          return <Send className="h-4 w-4 text-accent" />;
                        case 'offer':
                          return <Award className="h-4 w-4 text-success" />;
                        default:
                          return <Briefcase className="h-4 w-4 text-blue-600" />;
                      }
                    };

                    const getColor = () => {
                      switch (activity.type) {
                        case 'interview': return 'bg-yellow-500/10';
                        case 'applied': return 'bg-accent/10';
                        case 'offer': return 'bg-success/10';
                        default: return 'bg-blue-500/10';
                      }
                    };

                    return (
                      <div key={index} className="flex gap-3">
                        <div className={`p-2 ${getColor()} rounded-lg h-fit`}>
                          {getIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                          <p className="text-xs text-muted mt-0.5 truncate">{activity.description}</p>
                          <p className="text-xs text-muted mt-1">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <Briefcase className="h-8 w-8 text-muted mx-auto mb-2" />
                    <p className="text-sm text-muted">No job activity yet</p>
                    <Link
                      href="/assistant/job-search"
                      className="text-xs text-accent hover:underline mt-1 inline-block"
                    >
                      Start searching for jobs
                    </Link>
                  </div>
                )}
              </div>
              {recentActivity.length > 0 && (
                <Link
                  href="/assistant/my-jobs"
                  className="mt-4 block w-full text-center px-4 py-2 border border-gray-200 text-accent rounded-lg hover:bg-accent/5 transition-all text-sm font-medium"
                >
                  View All Jobs
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Help Button */}
      <HelpButton onClick={() => setShowPageTour(true)} />

      {/* Page Tour */}
      {pageTour && (
        <PageTour
          isOpen={showPageTour}
          onClose={() => setShowPageTour(false)}
          steps={pageTour.steps}
          title={pageTour.title}
        />
      )}
    </div>
  );
}

/*const experiences = [
  {
    period: 'Mar 2024 - Present',
    title: 'Lead Product Manager',
    subtitle: 'Senior Product Manager to Lead Product Manager (Nov 2025)',
    company: 'Skillshare',
    location: 'New York, USA (Remote)',
    description: 'Promoted to Lead PM in Nov 2025. Driving company-wide AI strategy and designing multi-agent systems to connect platform data with external AI tools. Delivered 25% increase in daily engagement through personalized content discovery. Led marketplace expansion with new monetization models and creator products. Architected headless CMS infrastructure for scalable content management.',
    skills: ['AI Strategy', 'MCP', 'Community Growth', 'Marketplace', 'CMS', 'Team Leadership'],
    highlights: ['🏆 Agility Award Q1 2025 - Resourcefulness and creative problem-solving', '🔬 Curiosity Award Q2 2024 - AI innovation'],
  },
  {
    period: 'Mar 2022 - Mar 2024',
    title: 'Senior Product Manager',
    company: 'Voxy',
    location: 'New York, USA (Remote)',
    description: 'Led full rebuild of publishing platform, enabling multilingual course authoring. Introduced structured user-testing practices and continuous discovery cycles. Directed unified design system creation, cutting design-to-development time. Oversaw platform integration following acquisition.',
    skills: ['Publishing Platform', 'Design Systems', 'Continuous Discovery', 'Integration'],
    highlights: ['Impressive Performance Award Jan 2023'],
  },
  {
    period: 'May 2020 - Mar 2022',
    title: 'EdTech Product Manager',
    company: 'SENAI National Department',
    location: 'Brasília, Brazil',
    description: 'Led nationwide digital transformation initiative across 500+ schools, securing multimillion-dollar funding. Built ML-based course recommendation platform with Google and Atos. Created centralized learning resources repository and AR-based industrial machinery app.',
    skills: ['Digital Transformation', 'ML/AI', 'AR', 'Government'],
    highlights: ['Google Summit Speaker 2021'],
  },
  {
    period: 'Apr 2018 - May 2020',
    title: 'Product Manager',
    company: 'Unyleya Educacional',
    location: 'Brasília, Brazil',
    description: 'Designed custom CMS reducing course publishing from 1 week to 31 minutes, driving 200% revenue increase. Led development of streaming-inspired student platform and native mobile apps.',
    skills: ['CMS', 'Mobile Apps', 'Revenue Growth', 'UX'],
    highlights: [],
  },
];

const skillshareProjects: SkillshareProject[] = [
  // ========================================
  // SKILLSHARE (Mar 2024 - Present)
  // ========================================
  {
    id: 'ai-strategy-foundations',
    title: 'AI Strategy and Organizational Foundations',
    company: 'Skillshare',
    cardTeaser: 'Led the definition and execution of Skillshare\'s AI strategy, establishing clear principles, shared technical foundations, and prioritization frameworks that shifted AI from isolated experiments to product-driven investments.',
    outcome: 'Aligned AI strategy across organization; clear principles and priorities; shared technical foundation; faster execution velocity; durable framework for evaluating AI opportunities.',
    tags: ['AI Strategy', 'Product Vision', 'Cross-Functional Alignment', 'Systems Thinking', 'Executive Leadership', 'Strategic Planning'],
    details: [
      {
        paragraphs: [
          'I led the definition and execution of Skillshare\'s AI strategy, owning problem framing, opportunity identification, and alignment across product, engineering, data, and leadership.',
          'As AI capabilities accelerated, Skillshare faced a familiar challenge: strong conviction that AI mattered, but no clear structure for how it should be applied, governed, or prioritized across the product. Teams were experimenting in isolation, and leadership lacked a shared framework to decide where AI would create durable value versus short-term novelty.',
          'The challenge was not building AI features. It was deciding where AI belonged in the product strategy at all.',
          'This work reframed AI from a set of experiments into a coherent product capability.',
        ],
      },
      {
        heading: 'Discovery and problem framing',
        paragraphs: [
          'I led discovery across multiple dimensions: Product surfaces where AI could materially improve user outcomes; Internal workflows where AI could increase team leverage; Data readiness and technical constraints; Risks around quality, trust, and user expectations.',
          'This included synthesizing user needs, reviewing engagement and retention data, and partnering closely with engineering and data to understand what was feasible in the near and medium term.',
          'A key insight emerged: AI would only create lasting value if it was tightly coupled to Skillshare\'s learning loops. Generic AI features would not differentiate the product or improve retention.',
        ],
      },
      {
        heading: 'Strategy definition and execution',
        paragraphs: [
          'Based on discovery, I defined an AI strategy centered on: Clear principles for where AI should and should not be applied; A shared technical foundation to avoid duplicated effort; Prioritizing AI use cases tied directly to discovery, engagement, and learning outcomes.',
          'I partnered with leadership to align on focus areas and sequencing, ensuring AI investments supported long-term product strategy rather than fragmented experimentation.',
          'This work established the strategic foundation that later enabled AI-powered discovery and learning experiences.',
        ],
      },
      {
        heading: 'Measurement and impact',
        paragraphs: [
          'Success was measured through clarity and execution velocity rather than immediate feature output.',
          'Following this work: AI initiatives were aligned under a shared strategy; Teams moved faster with clearer constraints and priorities; AI work shifted from isolated experiments to product-driven investments; The organization gained a durable framework for evaluating future AI opportunities.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Product strategy and vision', 'AI opportunity framing', 'Cross-functional alignment', 'Systems thinking', 'Risk and quality considerations', 'Executive communication'] },
      { heading: 'Outcome', paragraphs: ['This work created the foundation for Skillshare\'s AI-driven roadmap, ensuring that AI investments were intentional, user-centered, and strategically aligned rather than reactive.'] },
    ],
  },
  {
    id: 'chatgpt-ai-discovery',
    title: 'ChatGPT App and AI-Native Discovery Platform',
    company: 'Skillshare',
    cardTeaser: 'Led definition and design of Skillshare’s AI-native discovery stack:public ChatGPT App, in-app conversational assistant, and shared semantic retrieval foundation.',
    outcome: 'Foundation for semantic in-app search, personalized discovery, and future AI assistants',
    tags: ['Semantic Search', 'Vector Retrieval', 'MCP', 'Conversational UX', 'Product Strategy'],
    details: [
      {
        paragraphs: [
          'I led the definition and design of Skillshare’s AI-native discovery stack as a Senior/Lead Product Manager, owning direction, alignment, and quality across user-facing products and core search infrastructure.',
          'The core problem was clear: learners increasingly start their discovery journeys inside AI tools, while Skillshare’s discovery experience was historically optimized for on-site, keyword-based search. This initiative addressed that gap by meeting users at the moment of intent and modernizing discovery foundations inside the product.',
          'The scope spans three connected components: a public ChatGPT App, a fully designed in-app conversational assistant, and a shared semantic retrieval foundation built on a vector store.',
          'On the user-facing side, I defined two complementary experiences. The first is the Skillshare ChatGPT App, currently in development, designed as an acquisition surface that guides users from open-ended learning questions to relevant classes with clear, explainable recommendations. The second is an in-app chatbot for Skillshare, fully designed but not yet built, intended to support discovery, exploration, and decision-making directly within the product. In both cases, the bar was clarity, trust, and usefulness, deliberately avoiding the common failure mode of chatbots that act as thin wrappers over search.',
          'In parallel, I partnered closely with engineering to design the semantic retrieval foundation. This included defining the vector store strategy, embedding approach, metadata schemas, and retrieval patterns. The vector store is shared infrastructure, powering conversational experiences and improving in-app class search by adding semantic relevance on top of existing keyword and filter-based discovery.',
          'These capabilities are exposed through a Model Context Protocol server, making Skillshare content AI-ready and platform-agnostic. The ChatGPT App is the first active consumer, with the in-app chatbot and semantic search improvements planned next, ensuring the investment compounds across acquisition and core product discovery.',
          'Success is evaluated through acquisition intent capture, relevance and usefulness of recommendations, downstream engagement with discovered classes, and retrieval quality at scale.',
          'This work positions Skillshare not just as a destination, but as a learning layer that operates inside AI-native environments while modernizing in-product search and discovery.',
        ],
      },
      { heading: 'Main skills used', list: ['AI & search: semantic search, vector-based retrieval, embeddings, relevance evaluation', 'Product craft: product strategy, conversational UX, discovery design, metrics definition, tradeoff analysis', 'Leadership: platform thinking, cross-functional alignment, execution judgment, quality bar ownership'] },
      { heading: 'What this enables', paragraphs: ['This foundation enables semantic in-app search, personalized discovery, and future AI assistants without rebuilding retrieval logic.'] },
    ],
  },
  {
    id: 'community-feed',
    title: 'Community Feed and Engagement Discovery',
    company: 'Skillshare',
    cardTeaser: 'Led discovery, definition, and delivery of the Community Feed (a personalized feed that centralizes learning and community activity), contributing to a 25% increase in DAU/MAU.',
    outcome: '25% increase in DAU/MAU; scalable engagement surface for future personalization and AI-driven discovery',
    tags: ['Product Strategy', 'Engagement', 'Retention', 'Feed Design', 'Behavioral Analysis'],
    details: [
      {
        paragraphs: [
          'I led the discovery, definition, and delivery of Skillshare’s Community Feed as a Senior/Lead Product Manager, owning problem framing, research, experience strategy, and success criteria end to end.',
          'The underlying issue was not the absence of community activity, but the absence of coherence. Skillshare had discussions, projects, and teacher updates spread across the product, yet members lacked a clear, consistent way to understand what was happening or how community activity connected back to learning. Engagement existed, but it was fragmented, passive, and difficult to scale.',
          'This work reframed community from a secondary feature into a core engagement and retention surface.',
        ],
      },
      {
        heading: 'Discovery and problem framing',
        paragraphs: [
          'I led a structured discovery effort to understand how community behaviors contribute to learning and retention. This included quantitative analysis across discovery, learning, and community funnels, cohort analysis by engagement depth, and qualitative review of how members interact with discussions, projects, and peer activity.',
          'Several patterns emerged. Community engagement correlated strongly with retention when it was tied to active learning contexts. Most members did not intentionally browse community surfaces; re-entry was driven by timely, relevant signals. Existing experiences emphasized posting over awareness, making it difficult for members to benefit from community activity unless they were already highly engaged.',
          'These insights directly shaped the product direction. Rather than expanding community tools, the focus shifted to surfacing relevant activity and making it easy for members to re-enter learning through community signals.',
        ],
      },
      {
        heading: 'Product definition and delivery',
        paragraphs: [
          'Based on discovery, I defined the Community Feed as a personalized, chronological feed that centralizes relevant learning and community activity.',
          'The feed surfaces: Project posts and updates; Class discussions and replies; Teacher updates; New classes from followed categories (read-only).',
          'The experience was designed primarily for awareness and re-entry, not high-friction interaction. Interactions were intentionally scoped to saving, playing, and completing content, reinforcing learning loops rather than social vanity metrics.',
          'I owned the experience principles, content rules, interaction model, and measurement approach, partnering closely with engineering and design to ensure the feed was scalable, observable, and aligned with retention goals.',
        ],
      },
      {
        heading: 'Measurement and impact',
        paragraphs: [
          'Success was evaluated through re-entry into learning from feed interactions, downstream class engagement and completion, habit formation, and retention.',
          'Following launch, the Community Feed contributed to a 25% increase in DAU/MAU, indicating stronger habit formation and more consistent engagement among exposed users.',
          'The system was built to support iteration. Clear eventing and observability allow the content mix, ordering, and rules to evolve as behavior and needs change.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Product strategy and problem framing', 'Quantitative and qualitative discovery', 'Engagement and retention modeling', 'Feed experience and interaction design', 'Metrics definition and behavioral analysis', 'Cross-functional leadership and execution judgment'] },
      { heading: 'Outcome', paragraphs: ['The Community Feed established a scalable engagement surface that reconnects members to learning through real activity rather than prompts or notifications. It also created a foundation for future personalization, ranking, and AI-driven community discovery without requiring a redesign of the core experience.'] },
    ],
  },
  {
    id: 'creator-hub-integration',
    title: 'Unified Creator Hub Integration (Classes, Digital Products, and Services)',
    company: 'Skillshare',
    cardTeaser: 'Led the discovery, definition, and delivery of the integration that transformed the acquired company\'s teacher hub into Skillshare\'s unified Creator Hub, consolidating classes, digital products, and services into a single platform.',
    outcome: 'Unified creator interface; reduced friction from system fragmentation; increased adoption of new monetization features; scalable foundation for creator-led growth.',
    tags: ['Post-Acquisition Integration', 'Platform Strategy', 'Creator UX', 'Multi-Product', 'Change Management', 'System Consolidation'],
    details: [
      {
        paragraphs: [
          'I led the discovery, definition, and delivery of the integration that transformed the acquired company\'s existing teacher hub into Skillshare\'s new unified Creator Hub, consolidating class offerings, digital products, and services into a single platform for teachers.',
          'Before this work, creators operated across fragmented systems. Classes lived in Skillshare, while digital products and services lived in the acquired platform. This fragmentation increased cognitive load for creators and limited Skillshare\'s ability to present a cohesive creator experience.',
          'The challenge was not tooling. It was unifying creator workflows across multiple product types without disrupting existing behaviors or revenue streams.',
          'This work reframed creator tooling from multiple disconnected dashboards into a single, extensible platform.',
        ],
      },
      {
        heading: 'Discovery and problem framing',
        paragraphs: [
          'I led discovery across creators, internal teams, and the acquired platform to understand how teachers managed classes, products, and services day to day, where friction existed in switching between systems, what creators valued most in the existing teacher hub, and which workflows needed to be preserved versus rethought.',
          'Key insights emerged: Creators wanted a single place to manage their business on Skillshare. Fragmentation reduced adoption of new monetization features. Trust and continuity were critical in post-acquisition transitions.',
          'The opportunity was to create a unified Creator Hub that could scale with new offerings over time.',
        ],
      },
      {
        heading: 'Product definition and delivery',
        paragraphs: [
          'Based on discovery, I led the integration of the acquired teacher hub as Skillshare\'s new Creator Hub. This included consolidating class management, digital products, and services into one interface, aligning permissions, roles, and workflows across product types, defining a scalable information architecture to support future offerings, and ensuring continuity for creators already using the acquired platform.',
          'The approach prioritized minimizing disruption while creating a foundation for expansion. I partnered closely with engineering, design, operations, and support teams to manage migration, communication, and rollout.',
        ],
      },
      {
        heading: 'Measurement and impact',
        paragraphs: [
          'Success was measured through creator adoption, workflow completion, and platform stability.',
          'Following launch, creators gained a unified interface to manage all offerings, friction from switching between systems was reduced, adoption of new monetization features increased, and Skillshare established a scalable foundation for creator-led growth.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Post-acquisition platform integration', 'Creator experience and workflow design', 'System consolidation and migration strategy', 'Change management and risk mitigation', 'Cross-functional leadership'] },
      { heading: 'Outcome', paragraphs: ['The unified Creator Hub became the foundation of Skillshare\'s creator ecosystem, enabling teachers to manage multiple product types in one place while positioning Skillshare to expand creator monetization in a coherent, scalable way.'] },
    ],
  },
  {
    id: 'digital-products-integration',
    title: 'Digital Products Store Integration (Post-Acquisition)',
    company: 'Skillshare',
    cardTeaser: 'Led the discovery, definition, and delivery of the integration that brought digital products from an acquired creator platform into Skillshare\'s digital product store, preserving creator businesses while unifying the learner experience.',
    outcome: 'Unified marketplace experience; preserved creator revenue continuity; expanded Skillshare\'s monetization surface; integrated discovery and purchase flows.',
    tags: ['Post-Acquisition Integration', 'Marketplace Strategy', 'Creator Monetization', 'Platform Integration', 'Risk Management', 'Phased Delivery'],
    details: [
      {
        paragraphs: [
          'I led the discovery, definition, and delivery of the integration that brought digital products from an acquired creator platform into Skillshare\'s digital product store, owning problem framing, experience strategy, and execution end to end.',
          'After acquiring a creator platform with an existing ecosystem of teachers selling digital products, Skillshare faced a strategic challenge. The products existed, demand existed, but they lived outside Skillshare\'s core discovery and learning surfaces.',
          'The challenge was not supply. It was how to integrate an acquired marketplace into Skillshare without fragmenting the user experience or confusing creators and learners.',
          'This work reframed digital products from an external acquisition artifact into a native Skillshare marketplace surface.',
        ],
      },
      {
        heading: 'Discovery and problem framing',
        paragraphs: [
          'I led discovery to understand: How creators were selling and managing digital products on the acquired platform; How learners discovered and purchased those products; Where workflows, pricing models, and expectations differed from Skillshare\'s subscription-first model; What needed to remain unchanged to avoid breaking existing creator businesses.',
          'Key constraints emerged: Existing creators depended on the acquired platform for income; Skillshare learners expected a cohesive discovery and checkout experience; The integration needed to preserve creator ownership while aligning with Skillshare UX and analytics standards.',
          'The opportunity was to unify demand and discovery while minimizing disruption.',
        ],
      },
      {
        heading: 'Product definition and delivery',
        paragraphs: [
          'Based on these insights, I led the integration of digital products into a Skillshare-native digital product store.',
          'This included: Defining how acquired digital products would surface within Skillshare discovery; Aligning product detail pages with Skillshare\'s design and content standards; Integrating purchase flows and entitlement logic; Establishing consistent eventing and observability across platforms.',
          'The focus was on making digital products feel native to Skillshare while maintaining continuity for existing creators.',
          'I partnered closely with engineering, design, data, and operations to ship the integration incrementally and reduce risk.',
        ],
      },
      {
        heading: 'Measurement and impact',
        paragraphs: [
          'Success was measured through creator continuity, learner adoption, and marketplace stability.',
          'Following launch: Digital products from the acquired platform became discoverable within Skillshare; Creators retained access to existing offerings while gaining exposure to Skillshare\'s audience; Learners gained a unified marketplace experience; Skillshare expanded its revenue surface without fragmenting UX.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Post-acquisition product integration', 'Marketplace and monetization strategy', 'Cross-platform experience alignment', 'Risk management and phased delivery', 'Creator and learner journey design'] },
      { heading: 'Outcome', paragraphs: ['This work successfully integrated an acquired digital products ecosystem into Skillshare, transforming an external marketplace into a cohesive, native product surface and laying the groundwork for deeper creator monetization across the platform.'] },
    ],
  },
  {
    id: 'class-cards',
    title: 'Class Cards and Discovery Surface Updates',
    company: 'Skillshare',
    cardTeaser: 'Led discovery, definition, and delivery of updates to Skillshare’s class cards:improving clarity, decision-making, and consistency across browse, search, feeds, and recommendations.',
    outcome: 'Scalable class card foundation for personalization, merchandising, and AI-powered discovery',
    tags: ['Discovery', 'Information Architecture', 'Component System', 'Merchandising UX', 'Metrics'],
    details: [
      {
        paragraphs: [
          'I led the discovery, definition, and delivery of a series of updates to Skillshare’s class cards, the most visible and frequently reused discovery component across the product. This work focused on improving clarity, decision-making, and consistency across browse, search, feeds, and recommendations.',
          'The core problem was subtle but high impact. Class cards carried an increasing amount of responsibility, discovery, quality signaling, merchandising, and engagement cues, yet the information hierarchy had evolved organically. This made it harder for members to quickly understand value, harder for the system to surface the right signals, and harder for teams to evolve discovery experiences without fragmentation.',
          'This initiative treated class cards as a product surface, not a UI detail.',
        ],
      },
      {
        heading: 'Discovery and problem framing',
        paragraphs: [
          'I led discovery across usage data, qualitative feedback, and cross-surface audits to understand how class cards were performing and where they were failing.',
          'This included analysis of browse and search behavior, review of card performance across logged-out and logged-in contexts, and audits of how cards were being reused and modified across teams.',
          'Several issues emerged. Key quality signals were inconsistently applied or missing. The hierarchy between title, creator, value signals, and metadata was unclear. Cards optimized for one surface often degraded performance on another. As a result, users had to do more cognitive work than necessary to decide whether a class was relevant.',
          'These insights led to a clear direction: standardize the class card as a flexible but opinionated component with a consistent information hierarchy and explicit rules for variation.',
        ],
      },
      {
        heading: 'Product definition and delivery',
        paragraphs: [
          'Based on discovery, I defined a set of class card updates focused on improving scannability, relevance, and reuse.',
          'The updates included: A clearer information hierarchy to support fast decision-making; Standardized quality and trust signals applied consistently across surfaces; Defined card variants for different contexts without breaking core structure; Alignment with evolving discovery and recommendation strategies.',
          'Rather than creating one-off designs per surface, the goal was to create a durable system that could scale across browse, search, feeds, and future AI-driven discovery.',
          'I owned the experience principles, prioritization, and rollout strategy, partnering closely with design and engineering to ensure the updates could be adopted incrementally without disrupting existing flows.',
        ],
      },
      {
        heading: 'Measurement and iteration',
        paragraphs: [
          'Success was evaluated through engagement with classes from card-driven surfaces, improvements in discovery funnel progression, and qualitative signals around clarity and perceived relevance.',
          'The system was designed to support iteration. Because card structure and signals were standardized, teams could test and evolve ranking, personalization, and merchandising strategies without redesigning the component each time.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Discovery and problem framing', 'Information architecture and hierarchy design', 'Discovery and merchandising UX', 'Component system thinking', 'Experimentation and metrics definition', 'Cross-functional alignment and execution judgment'] },
      { heading: 'Outcome', paragraphs: ['The class card updates improved clarity and consistency across Skillshare’s primary discovery surfaces while reducing fragmentation in how discovery components are designed and evolved. This work established the class card as a scalable foundation for future personalization, merchandising, and AI-powered discovery rather than a collection of surface-specific UI tweaks.'] },
    ],
  },
  {
    id: 'ia-taxonomy-revamp',
    title: 'Information Architecture and Taxonomy Revamp',
    company: 'Skillshare',
    cardTeaser: 'Led the discovery, definition, and delivery of a full information architecture and taxonomy revamp at Skillshare, owning problem framing, system design, and success criteria end to end.',
    outcome: 'Consistent semantic foundation for discovery; extensible taxonomy supporting new product types; unblocked personalization and AI initiatives; shared language across teams',
    tags: ['Information Architecture', 'Taxonomy', 'System Design', 'Discovery', 'Personalization', 'AI Foundations'],
    details: [
      {
        paragraphs: [
          'I led the discovery, definition, and delivery of a full information architecture and taxonomy revamp at Skillshare, owning problem framing, system design, and success criteria end to end.',
          'Skillshare\'s content ecosystem had expanded significantly over time. Classes, projects, teachers, skills, learning paths, digital products, and services were added incrementally, each introducing new metadata and classification rules. As a result, the underlying taxonomy became inconsistent, brittle, and difficult to evolve.',
          'The problem was not content volume. It was structural fragmentation.',
          'This work reframed information architecture from a background concern into a foundational product system.',
        ],
      },
      {
        heading: 'Discovery and problem framing',
        paragraphs: [
          'I led discovery to understand how taxonomy limitations were impacting multiple surfaces across the product. This included reviewing search, browse, and discovery performance, analyzing how content was classified and tagged across product types, identifying inconsistencies in skill hierarchies, categories, and metadata, and assessing how taxonomy constrained personalization and AI initiatives.',
          'Key issues emerged: Categories and skills were overloaded and inconsistently applied. The same concept appeared under multiple names across surfaces. New product types could not be cleanly integrated into existing structures. AI and personalization efforts were limited by weak semantic foundations.',
          'The opportunity was to create a clear, extensible taxonomy that could support discovery, personalization, and future AI-driven experiences.',
        ],
      },
      {
        heading: 'Product definition and delivery',
        paragraphs: [
          'Based on discovery, I led the redesign of Skillshare\'s information architecture and taxonomy system.',
          'This included defining a normalized skill and category hierarchy, establishing clear rules for tagging, ownership, and governance, separating user-facing labels from internal semantic structure, and designing taxonomy primitives that could support classes, projects, creators, and products consistently.',
          'The system was intentionally designed to be extensible to new product types, stable enough to support long-term evolution, machine-readable to enable AI-powered discovery and ranking, and usable by internal teams without creating operational overhead.',
          'I partnered closely with search, data, engineering, and design to ensure the taxonomy aligned with both user mental models and technical requirements.',
        ],
      },
      {
        heading: 'Measurement and impact',
        paragraphs: [
          'Success was measured through system adoption, consistency, and downstream enablement rather than immediate UX metrics.',
          'Following delivery, discovery and search teams gained a consistent semantic foundation, new product types could be integrated without ad-hoc classification, personalization and AI initiatives were unblocked, and internal teams aligned on shared language and structure.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Information architecture and system design', 'Taxonomy and semantic modeling', 'Search and discovery foundations', 'AI and personalization readiness', 'Cross-functional alignment', 'Long-term platform thinking'] },
      { heading: 'Outcome', paragraphs: ['The taxonomy revamp established a durable foundation for Skillshare\'s discovery, personalization, and AI roadmap. By treating information architecture as core infrastructure rather than surface UX, the platform became easier to evolve, easier to reason about, and better positioned to support intelligent, intent-aware learning experiences.'] },
    ],
  },
  {
    id: 'continuous-discovery',
    title: 'Continuous Discovery Habits Implementation and Qualitative Research System',
    company: 'Skillshare',
    cardTeaser: 'Implemented Continuous Discovery Habits framework and a centralized qualitative research system using Dovetail, unifying interviews, app reviews, and support tickets into a single source of truth.',
    outcome: 'Continuous discovery as a durable habit; shared qualitative system that compounds over time',
    tags: ['Discovery', 'Qualitative Research', 'Dovetail', 'Signal Synthesis', 'Change Management'],
    details: [
      {
        paragraphs: [
          'I led the implementation of the Continuous Discovery Habits framework across the product organization, transforming it from an abstract best practice into a repeatable, actionable operating model. In parallel, I implemented a centralized qualitative research system using Dovetail, integrating interviews, usability research, app reviews, and support tickets into a single source of truth.',
          'The core problem was not a lack of user input, but fragmentation. Signals existed everywhere, conversations, reviews, tickets, interviews, but they did not connect. Discovery existed, but it did not compound.',
        ],
      },
      {
        heading: 'Context and problem framing',
        paragraphs: [
          'Product teams regularly conducted interviews and usability studies, while customer feedback flowed continuously through app store reviews and support channels. However, these inputs lived in separate tools and formats, rarely synthesized together or reused over time.',
          'As a result: Teams re-asked questions already answered elsewhere; App reviews and support tickets were treated as reactive noise rather than discovery inputs; Qualitative insights decayed quickly and were hard to reference; Decisions leaned heavily on intuition or quantitative data alone.',
          'The goal was to operationalize discovery as a continuous, multi-source input to product strategy and delivery.',
        ],
      },
      {
        heading: 'Product definition and execution',
        paragraphs: [
          'I implemented the Continuous Discovery Habits framework as a shared operating model rather than a rigid process.',
          'This included: Establishing a consistent cadence for customer interviews; Defining lightweight standards for opportunity mapping and insight capture; Embedding discovery artifacts into existing product workflows; Coaching teams to frame problems and assumptions, not just validate solutions.',
          'The emphasis was on sustainability and signal quality, ensuring discovery could coexist with delivery work without becoming performative.',
        ],
      },
      {
        heading: 'Dovetail qualitative system implementation',
        paragraphs: [
          'To make qualitative data actionable at scale, I implemented Dovetail as shared discovery infrastructure.',
          'The system integrated: User interviews and usability studies; Android and iOS app store reviews; Zendesk support tickets.',
          'I defined a shared taxonomy and tagging model aligned to product domains and outcomes, along with templates and contribution guidelines to ensure consistency. App reviews and support tickets were treated as first-class discovery inputs, enabling teams to identify patterns, recurring pain points, and emerging issues alongside direct research.',
          'This allowed qualitative signals from different channels to reinforce each other rather than compete for attention.',
        ],
      },
      {
        heading: 'Measurement and iteration',
        paragraphs: [
          'Success was evaluated through reuse of qualitative insights across initiatives, reduced duplication of discovery work, stronger linkage between user signals and prioritization decisions, and increased confidence in early product direction.',
          'The system was intentionally iterative. Taxonomy, templates, and workflows evolved based on real usage and feedback rather than theoretical completeness.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Discovery system design and implementation', 'Qualitative research operationalization', 'Multi-source signal synthesis', 'Product coaching and change management', 'Insight-to-decision translation', 'Cross-team enablement and alignment'] },
      { heading: 'Outcome', paragraphs: ['This work embedded continuous discovery as a durable habit rather than a one-off activity. By unifying interviews, app reviews, and support tickets into a single qualitative system, the organization gained a shared understanding of user needs that compounds over time. Teams were better equipped to identify real problems, prioritize with confidence, and ground product decisions in user reality without slowing execution.'] },
    ],
  },
  
  // ========================================
  // VOXY (Mar 2022 - Mar 2024)
  // ========================================
  {
    id: 'continuous-discovery-voxy',
    title: 'Adopting Continuous Discovery at Voxy',
    company: 'Voxy',
    cardTeaser: 'Implemented the Continuous Discovery Habits framework to move product decision-making from episodic research to a continuous, evidence-driven operating model.',
    outcome: 'Stronger alignment between user needs and roadmap; less reliance on intuition; more confidence in early direction without slowing execution.',
    tags: ['Discovery Systems Design', 'Qualitative Research', 'Opportunity Framing', 'Product Coaching', 'Change Management', 'Insight-to-Decision'],
    details: [
      {
        paragraphs: [
          'I implemented the Continuous Discovery Habits framework to move product decision-making from episodic research to a continuous, evidence-driven operating model.',
          'I established a steady cadence of customer interviews, opportunity mapping, and lightweight validation loops, ensuring qualitative insights consistently informed prioritization and delivery. Discovery shifted from a one-off activity to a compounding system embedded in day-to-day product work.',
          'This work improved alignment between user needs and roadmap decisions, reduced reliance on intuition alone, and increased confidence in early product direction without slowing execution.',
        ],
      },
      { heading: 'Key skills', list: ['Discovery systems design', 'Qualitative research operations', 'Opportunity framing', 'Product coaching', 'Change management', 'Insight-to-decision translation'] },
    ],
  },
  
  // ========================================
  // SENAI (May 2020 - Mar 2022)
  // ========================================
  {
    id: 'senai-skills-gap',
    title: 'SENAI Skills GAP AI Engine',
    company: 'SENAI',
    cardTeaser: 'I led the definition and delivery of an AI-powered skills gap analysis and learning recommendation engine designed to connect labor market demand with personalized educational pathways.',
    outcome: 'New way to connect education with employability; personalized, goal-driven pathways; groundwork for scalable, AI-assisted career guidance.',
    tags: ['AI-Powered Product Design', 'Skills & Occupation Modeling', 'Recommender Systems', 'Explainable AI', 'End-to-End System Thinking'],
    details: [
      {
        paragraphs: [
          'I led the definition and delivery of an AI-powered skills gap analysis and learning recommendation engine designed to connect labor market demand with personalized educational pathways.',
          'The project addressed a structural problem in professional education: learners are often told what to study, but not why, in what order, or how it maps to real job requirements. Training programs, occupations, and competencies existed as separate systems, making it difficult to translate market needs into actionable learning journeys.',
          'This initiative positioned AI as connective tissue between occupations, skills, and education rather than as a black-box recommender.',
        ],
      },
      {
        heading: 'Context and problem framing',
        paragraphs: [
          'SENAI operates at national scale, serving learners across a wide range of technical and industrial careers. While SENAI had rich data on occupations, curricula, and certifications, this information was fragmented across systems and difficult to operationalize for individual learners.',
          'Key challenges included:',
        ],
        list: [
          'Occupational requirements defined at a high level, disconnected from concrete learning paths',
          'Learners unable to assess their current skill level relative to target roles',
          'Training recommendations based on static curricula rather than personalized gaps',
          'Difficulty adapting learning paths to different starting points, experience levels, or goals',
        ],
      },
      {
        paragraphs: [
          'The opportunity was to move from catalog-based education to gap-based education, where learning is driven by what a person needs next, not by what is available.',
        ],
      },
      {
        heading: 'Product definition and system design',
        paragraphs: [
          'I defined the Skills GAP Engine as an AI-driven system that translates occupational profiles into skill requirements, compares them against an individual\'s profile, and generates personalized learning recommendations.',
          'The system operates in three layers:',
        ],
        list: [
          'Occupation and skills modeling: Occupational roles were decomposed into structured skill and competency requirements, aligned with SENAI\'s national occupation frameworks.',
          'Gap analysis: A learner\'s current skills, education, and experience were evaluated against the target role to identify missing or underdeveloped competencies.',
          'Learning path generation: The system mapped gaps to specific educational offerings, generating prioritized learning paths rather than generic recommendations.',
        ],
      },
      {
        paragraphs: [
          'Rather than optimizing for novelty, the focus was on explainability: learners could understand why a recommendation existed and how it contributed to employability.',
        ],
      },
      {
        heading: 'AI implementation and execution',
        paragraphs: [
          'I worked hands-on in shaping how AI was applied to this problem, ensuring it augmented domain knowledge instead of replacing it.',
          'Key execution elements included:',
        ],
        list: [
          'Structured representation of occupations, skills, and learning units',
          'AI-assisted inference to identify gaps and rank learning priorities',
          'Rules and constraints layered on top of AI outputs to respect educational prerequisites and logical progression',
          'Clear output structures designed for integration into user-facing experiences',
        ],
      },
      {
        paragraphs: [
          'This approach balanced flexibility with control, allowing the system to adapt to different profiles while maintaining trust and pedagogical coherence.',
        ],
      },
      {
        heading: 'Measurement and validation',
        paragraphs: [
          'Success was evaluated through:',
        ],
        list: [
          'Accuracy and relevance of identified skill gaps',
          'Alignment between recommended learning paths and occupational outcomes',
          'Clarity and usefulness of recommendations from a learner perspective',
          'Readiness of the system to support personalization at scale',
        ],
      },
      {
        paragraphs: [
          'The engine also served as a foundation for future analytics, enabling insights into emerging skill demand and curriculum gaps.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['AI-powered product design', 'Skills and occupation modeling', 'Recommender systems and decision logic', 'Explainable AI and trust-oriented UX', 'End-to-end system thinking', 'Translating labor market data into product experiences'] },
      { heading: 'Outcome', paragraphs: ['The SENAI Skills GAP AI Engine established a new way to connect education with employability. By centering learning around concrete skill gaps rather than static programs, the system enabled more personalized, goal-driven education pathways.', 'This work laid the groundwork for scalable, AI-assisted career guidance, positioning education not as a fixed sequence of courses, but as an adaptive journey aligned with real-world outcomes.'] },
    ],
  },
  {
    id: 'escola-digital',
    title: 'National Digital Transformation and Escola Digital Program',
    company: 'SENAI',
    cardTeaser: 'Led the discovery, definition, and delivery of SENAI\'s national digital transformation program, creating Escola Digital, a flexible cohort-based learning model adopted across 500+ schools serving 3 million learners annually.',
    outcome: 'National digital-first education model; flexible year-round enrollment; sustainable hybrid learning at scale across Latin America\'s largest technical education network.',
    tags: ['Digital Transformation', 'National Scale', 'Education Platform', 'Hybrid Learning', 'Product Strategy', 'Systems Design'],
    details: [
      {
        paragraphs: [
          'I led the discovery, definition, and delivery of SENAI\'s national digital transformation program, including the creation of Escola Digital, owning problem framing, experience strategy, platform definition, and success metrics end to end.',
          'SENAI is the largest technical education network in Latin America, operating more than 500 in-person schools across Brazil and serving approximately 3 million learners per year. Its model was historically grounded in in-person instruction, with limited flexibility for learners and strong dependence on physical infrastructure.',
          'The challenge was not simply moving classes online. It was redefining what technical education at national scale could look like in a post-pandemic world.',
          'This work reframed digital learning from an emergency substitute into a core, scalable education model.',
        ],
      },
      {
        heading: 'Discovery and problem framing',
        paragraphs: [
          'I joined SENAI at the beginning of the pandemic, when leadership was asking a fundamental question: what should SENAI become in a world where in-person learning could no longer be the default?',
          'Discovery focused on three constraints: A nationwide physical school network that could not be abandoned; A massive existing repository of PBL-based educational content; Learners with highly variable schedules and access constraints.',
          'Through stakeholder interviews, operational analysis, and learner behavior review, it became clear that traditional synchronous online classes would not scale. Learners needed flexibility without losing the practical, collaborative nature of technical education.',
          'The opportunity was to design a hybrid, flexible model that preserved hands-on learning while removing rigid scheduling and geographic barriers.',
        ],
      },
      {
        heading: 'Product definition and delivery',
        paragraphs: [
          'Based on discovery, I defined and led the creation of Escola Digital, a flexible, time-boundless cohort model.',
          'Learners could enroll at any time of the year and progress asynchronously through structured content blocks. At defined moments in the journey, they joined scheduled live sessions focused on practice, discussion, and collaboration. Recordings remained available, allowing learners to adapt participation to their availability.',
          'The model integrated: Structured theoretical content; Practical exercises and assignments; Periodic live sessions for applied learning; Optional in-person sessions at SENAI schools when required.',
          'This approach preserved SENAI\'s practical DNA while enabling national scale and learner autonomy.',
          'I partnered closely with education, engineering, and operations teams to ensure the model could be deployed consistently across hundreds of schools while remaining adaptable to different technical disciplines.',
        ],
      },
      {
        heading: 'Measurement and impact',
        paragraphs: [
          'Success was measured through adoption across the school network, learner flexibility, and the ability to scale delivery without increasing operational complexity.',
          'Following launch: Escola Digital was adopted nationally across SENAI\'s school network; Learners gained year-round enrollment and flexible pacing; Schools optimized instructor and lab utilization; SENAI established a sustainable digital-first education model rather than a temporary remote solution.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Product strategy and system design', 'Large-scale platform definition', 'Education and learning experience design', 'Hybrid and cohort-based learning models', 'Cross-functional leadership at national scale', 'Ambiguous problem solving under tight constraints'] },
      { heading: 'Outcome', paragraphs: ['Escola Digital became a foundational pillar of SENAI\'s post-pandemic education strategy. The program transformed how technical education is delivered at scale, balancing flexibility, practical learning, and institutional constraints while creating a durable digital learning model for millions of learners.'] },
    ],
  },
  {
    id: 'portal-recursos-didaticos',
    title: 'Portal de Recursos Didáticos & SCORM HUB Platform',
    company: 'SENAI',
    cardTeaser: 'Led the discovery, definition, and delivery of a national educational content platform that unified 30,000+ SCORM resources, achieved 70% cost reduction, and became the first organization globally to run SCORM in Google Classroom with progress tracking.',
    outcome: 'National adoption; 70% cost reduction; first-ever SCORM integration with Google Classroom; increased content reuse and collaboration across institutions.',
    tags: ['Platform Strategy', 'Content Distribution', 'SCORM Integration', 'Cost Optimization', 'Educator Collaboration', 'Technical Innovation'],
    details: [
      {
        paragraphs: [
          'I led the discovery, definition, and delivery of the Portal de Recursos Didáticos SENAI and SCORM HUB, owning problem framing, platform strategy, experience definition, and success metrics end to end.',
          'SENAI already had a vast repository of educational content, with 30,000+ SCORM-based learning resources created using Problem-Based Learning methodology. However, this content was fragmented across systems, difficult to discover, expensive to operate, and inconsistently used by educators nationwide.',
          'The challenge was not content creation. It was distribution, reuse, and scale.',
          'This work reframed educational content from static assets into a shared, scalable national platform.',
        ],
      },
      {
        heading: 'Discovery and problem framing',
        paragraphs: [
          'Discovery focused on how teachers and institutions actually interacted with educational resources day to day. I worked closely with educators, instructional designers, and platform teams to map the full lifecycle of content creation, storage, distribution, and classroom usage.',
          'Key issues emerged: Content lived in silos and was hard to discover; Reuse was low, leading to duplicated effort nationwide; Existing LMS tools did not support consistent SCORM distribution; Cloud storage costs were growing unsustainably; Teachers lacked a shared space to collaborate and improve materials.',
          'The opportunity was to centralize content access, reduce operational friction, and turn the educator network itself into a force multiplier.',
        ],
      },
      {
        heading: 'Product definition and delivery',
        paragraphs: [
          'Based on these insights, I defined and led the development of the Portal de Recursos Didáticos, powered by SCORM HUB.',
          'The platform centralized SENAI\'s educational resources into a single, searchable repository organized around official courses and programs. Teachers could discover, reuse, adapt, and share materials rather than rebuilding content from scratch.',
          'A critical technical challenge was distribution. Google Classroom was a mandatory platform, but it did not support SCORM packages or progress tracking. I led the strategy to build an in-house SCORM cloud solution and integrate it with Google Classroom, making SENAI the first organization globally to run SCORM content inside Classroom with progress tracking.',
          'This approach: Unified distribution across LMS, TurboClass, and Google Classroom; Reduced cloud storage costs by approximately 70%; Enabled consistent tracking and reuse of learning objects; Created a foundation for nationwide content collaboration.',
          'In parallel, I helped establish a teacher community layer, enabling educators to discuss, improve, and evolve resources collaboratively.',
        ],
      },
      {
        heading: 'Measurement and impact',
        paragraphs: [
          'Success was measured through platform adoption, content reuse, operational efficiency, and cost reduction.',
          'Following launch: Nationwide adoption of the platform across SENAI schools; Significant increase in content reuse and collaboration; Reduced duplication of content creation efforts; Approximately 70% reduction in cloud storage costs; Improved consistency in learning delivery across institutions.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Platform and ecosystem design', 'Technical product strategy', 'Content distribution and lifecycle management', 'Cost optimization and operational efficiency', 'Cross-functional leadership with educators and engineers', 'Scaling collaboration systems'] },
      { heading: 'Outcome', paragraphs: ['The Portal de Recursos Didáticos and SCORM HUB became core infrastructure for SENAI\'s digital education ecosystem. The platform transformed how educational content is distributed and reused at national scale, reducing costs, increasing collaboration, and enabling consistent, high-quality learning experiences across millions of learners.'] },
    ],
  },
  {
    id: 'senai-space-ar',
    title: 'SENAI Space - Augmented Reality Learning Platform',
    company: 'SENAI',
    cardTeaser: 'Led the discovery, definition, and delivery of an augmented reality learning platform that brings hands-on technical training into learners\' physical environments, extending access to complex machinery beyond physical labs.',
    outcome: 'Classroom adoption across multiple technical programs; safer, repeatable access to complex equipment concepts; expanded practical learning beyond physical infrastructure.',
    tags: ['Augmented Reality', 'Mobile Product', 'Learning Experience Design', 'Emerging Technology', 'Technical Education', 'Cross-Platform'],
    details: [
      {
        paragraphs: [
          'I led the discovery, definition, and delivery of SENAI Space, an augmented reality learning platform designed to bring hands-on technical training into learners\' physical environments, owning problem framing, product strategy, and delivery end to end.',
          'Technical education at SENAI relies heavily on access to physical labs and heavy machinery. This creates constraints around cost, availability, safety, and scheduling, especially when learners are remote or when lab capacity is limited.',
          'The challenge was not replacing hands-on learning, but extending it beyond physical spaces.',
          'This work reframed AR from an experimental technology into a practical learning tool.',
        ],
      },
      {
        heading: 'Discovery and problem framing',
        paragraphs: [
          'Discovery focused on identifying where physical constraints most limited learning outcomes. Working closely with educators and technical teams, I analyzed which skills required repeated exposure to equipment and where learners struggled most before entering labs.',
          'Key insights emerged: Many learners needed more time to understand equipment operation before practical sessions; Physical labs were expensive and not always available when learners needed them; Safety risks limited early experimentation; Existing digital materials lacked spatial and interactive depth.',
          'The opportunity was to use AR to allow learners to explore and understand complex machinery safely and repeatedly, before and alongside in-person training.',
        ],
      },
      {
        heading: 'Product definition and delivery',
        paragraphs: [
          'Based on these insights, I defined and led the development of SENAI Space, a mobile AR application available on Android and iOS.',
          'The app allows learners to place 3D models of industrial equipment into their real environment, interact with components, view animations, and explore how machines operate. The platform includes a curated library of models across 21 technical domains, aligned with SENAI\'s curricula.',
          'The product was designed to be: Easy to use in classrooms and at home; Complementary to in-person labs, not a replacement; Accessible on standard mobile devices; Flexible for educators to integrate into lessons.',
          'I partnered with education, design, and engineering teams to ensure the experience aligned with pedagogical goals while remaining technically feasible at scale.',
        ],
      },
      {
        heading: 'Measurement and impact',
        paragraphs: [
          'Success was measured through adoption in classrooms, educator feedback, and integration into learning programs.',
          'Following launch: SENAI Space was adopted in classrooms across multiple technical programs; Educators used the app to prepare students ahead of lab sessions; Learners gained safer, repeatable access to complex equipment concepts; The app expanded SENAI\'s ability to deliver practical learning beyond physical labs.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Emerging technology product strategy', 'Augmented reality experience definition', 'Learning experience design', 'Mobile product delivery', 'Cross-functional collaboration with educators and engineers', 'Balancing innovation with practical constraints'] },
      { heading: 'Outcome', paragraphs: ['SENAI Space demonstrated how immersive technologies can meaningfully enhance technical education when grounded in real learning needs. The platform extended access to hands-on learning, reduced dependence on physical infrastructure, and created a scalable model for integrating AR into vocational education.'] },
    ],
  },
  {
    id: 'senai-virtual-bookshelf',
    title: 'Virtual Bookshelf App - National Access to Educational Content',
    company: 'SENAI',
    cardTeaser: 'Led the discovery, definition, and delivery of a mobile app providing nationwide access to 1,000+ free educational titles with offline reading, democratizing SENAI\'s educational content beyond formal programs.',
    outcome: 'Nationwide access to curated educational materials; offline reading for limited connectivity; increased visibility and reuse of SENAI content; reduced dependency on physical libraries.',
    tags: ['Mobile Product', 'Content Distribution', 'Offline-First Design', 'User-Centered Design', 'Accessibility', 'National Scale'],
    details: [
      {
        paragraphs: [
          'I led the discovery, definition, and delivery of the SENAI Virtual Bookshelf App, owning problem framing, experience strategy, and success metrics end to end.',
          'SENAI had a large catalog of high-quality educational books and reference materials, but access was fragmented and often limited to physical locations or institutional systems. Learners faced barriers to discovery, registration, and offline access, especially outside major cities or formal classroom settings.',
          'The challenge was not content availability. It was accessibility and distribution at national scale.',
          'This work reframed educational books from static institutional assets into a direct, learner-first digital product.',
        ],
      },
      {
        heading: 'Discovery and problem framing',
        paragraphs: [
          'Discovery focused on how learners accessed supporting materials outside of structured classes. Through user interviews, usage analysis, and collaboration with education teams, it became clear that learners needed: Simple, low-friction access without complex enrollment flows; The ability to read offline due to connectivity constraints; Clear organization by technical domain rather than academic structure; A mobile-first experience aligned with how learners actually study.',
          'The opportunity was to create a lightweight, accessible product that could extend SENAI\'s educational reach beyond formal programs.',
        ],
      },
      {
        heading: 'Product definition and delivery',
        paragraphs: [
          'Based on these insights, I defined and led the development of the SENAI Virtual Bookshelf App, available on Android and iOS.',
          'The app provides access to 1,000+ free educational titles, organized by technological area and optimized for discovery. Key experience decisions included: Simple sign-up using email or Google accounts; An onboarding tour to guide first-time users; Offline reading via downloads; Fast search and clear content categorization.',
          'The product was designed to work both as a standalone learning resource and as a complement to SENAI\'s broader digital education ecosystem.',
        ],
      },
      {
        heading: 'Measurement and impact',
        paragraphs: [
          'Success was measured through adoption, content access, and learner feedback.',
          'Following launch: Learners gained nationwide access to curated educational materials; Offline reading expanded reach to users with limited connectivity; The app increased the visibility and reuse of SENAI\'s educational content; The experience reduced dependency on physical libraries and institutional access.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Mobile product strategy', 'User-centered experience design', 'Content distribution at scale', 'Accessibility and inclusion considerations', 'Cross-functional delivery with education and engineering teams'] },
      { heading: 'Outcome', paragraphs: ['The Virtual Bookshelf App democratized access to SENAI\'s educational content, extending learning beyond classrooms and formal programs. It became a scalable, learner-first distribution channel that strengthened SENAI\'s digital ecosystem and reinforced its mission to provide accessible technical education nationwide.'] },
    ],
  },
  
  // ========================================
  // UNYLEYA (Apr 2018 - May 2020)
  // ========================================
  {
    id: 'imp-online',
    title: 'IMP Online Course Publishing Platform and Student Experience Modernization',
    company: 'Unyleya',
    cardTeaser: 'Led the discovery, definition, and delivery of IMP Online, a new course publishing platform and student experience that reduced publishing time from one week to 31 minutes and drove 200% revenue growth.',
    outcome: '200% revenue growth; 31-minute publishing time (from 1 week); scalable CMS and student platform foundation.',
    tags: ['Platform Strategy', 'CMS Design', 'Operational Efficiency', 'Publishing Workflows', 'Revenue Growth', 'Mobile Apps'],
    details: [
      {
        paragraphs: [
          'I led the discovery, definition, and delivery of IMP Online, Unyleya\'s new course publishing platform and student experience, owning problem framing, workflow design, experience strategy, and success metrics end to end.',
          'The core problem was not demand or content quality, but operational friction. Publishing a new course took close to one week, relying on manual steps, fragmented tools, and heavy coordination between teams. This limited how fast new content could be launched, slowed experimentation, and directly constrained revenue growth.',
          'This work reframed course publishing from a back-office operation into a primary growth lever.',
        ],
      },
      {
        heading: 'Discovery and problem framing',
        paragraphs: [
          'I led discovery to understand where time and effort were being lost across the course lifecycle. This included mapping the end-to-end publishing workflow, analyzing operational bottlenecks, and working closely with content, engineering, and business stakeholders.',
          'The main issues were clear: excessive manual handoffs, lack of ownership clarity, and tooling that was not designed for scale. As a result, creators were discouraged from launching or updating courses, and the business struggled to respond quickly to market demand.',
          'The opportunity was to remove friction at the publishing layer to unlock creator velocity and revenue.',
        ],
      },
      {
        heading: 'Product definition and delivery',
        paragraphs: [
          'Based on these insights, I defined and led the development of a custom CMS built specifically for course creation, publishing, and updates within IMP Online.',
          'The new platform consolidated fragmented workflows into a single system and reduced course publishing time from one week to 31 minutes. This enabled rapid iteration, lowered operational overhead, and made it significantly easier to launch and maintain new courses.',
          'In parallel, I led the development of a streaming-inspired student platform and native mobile apps, improving discovery, consumption, and consistency across web and mobile. This ensured that increased publishing velocity translated into a better learner experience, not just faster output.',
          'I partnered closely with design and engineering throughout delivery, balancing speed, quality, and scalability.',
        ],
      },
      {
        heading: 'Measurement and impact',
        paragraphs: [
          'Success was measured through publishing velocity, creator adoption, and business outcomes.',
          'Following launch: Course publishing time reduced from 1 week to 31 minutes; Creator velocity and experimentation increased substantially; Revenue grew by 200%; The platform scaled effectively as content volume and usage increased.',
        ],
      },
      { heading: 'Skills and capabilities applied', list: ['Product strategy and problem framing', 'Workflow and systems design', 'Operational efficiency and scalability', 'Cross-platform experience definition', 'Metrics-driven decision making', 'Cross-functional leadership and execution'] },
      { heading: 'Outcome', paragraphs: ['IMP Online removed a critical operational bottleneck and transformed course publishing into a scalable growth engine for Unyleya. By pairing internal tooling improvements with a modern student experience, the platform enabled faster launches, higher revenue, and a strong foundation for continued growth.'] },
    ],
  },
];

const approachItems = [
  {
    title: 'Scrappy Execution & Resourcefulness',
    description: 'I make the most of existing infrastructure and find creative solutions with limited resources. Instead of over-engineering, I ship lean experiments to validate ideas quickly, prioritize user value over perfection, and deliver results with whatever constraints exist.',
  },
  {
    title: 'High Agency & Bias to Action',
    description: 'I don\'t wait for perfect conditions. I handle pivots, uncertainty, and shifting priorities by staying focused on user value. Quick experiments, rapid validation, and iterative delivery over lengthy planning cycles.',
  },
  {
    title: 'AI-First Pioneer',
    description: 'Early adopter who experiments with emerging tech. From ChatGPT App to semantic search to AI-assisted classification, I push boundaries and translate AI capabilities into shipped products that drive measurable outcomes.',
  },
  {
    title: 'Cross-Functional Alignment',
    description: 'I align engineering, design, marketing, and stakeholders toward shared goals. Whether combining two tech stacks or aligning roadmaps, I navigate complexity to deliver integrated solutions that work for everyone.',
  },
];

const skills = {
  strategy: ['AI Strategy & Integrations', 'Product Vision & Roadmapping', 'Marketplace Growth', 'Go-to-Market', 'Experimentation Culture'],
  discovery: ['Continuous Discovery Habits', 'User Research & Testing', 'Opportunity Mapping', 'Problem Framing', 'Journey Mapping'],
  technical: ['Multi-Agent Systems (MCP)', 'LLM Integrations', 'Recommendation Systems', 'API Design', 'SQL', 'A/B Testing'],
  tools: ['Productboard', 'Pendo', 'Mixpanel', 'Maze', 'Builder.io', 'Figma', 'Jira', 'Tableau'],
};

const achievements = [
  {
    title: 'Keynote Speaker, Product Insights Summit',
    date: 'Oct 2025',
    description: '"Closing the Gap Between Qualitative and Quantitative Insights with AI"',
    link: '#',
  },
  {
    title: 'Interview Feature, Product Talk',
    date: 'Jun 2023',
    description: '"One Product Manager\'s Quest to Adopt Continuous Discovery"',
    link: 'https://www.producttalk.org/2023/06/bianca-starling/',
  },
  {
    title: 'Speaker, Google Government & Education Summit',
    date: 'Nov 2021',
    description: '"Revolutionizing Education with Cloud Technology"',
    link: '#',
  },
];

/*
Old content moved out 
*/
