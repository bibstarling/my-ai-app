import {
  Briefcase,
  FileText,
  Mail,
  Search,
  MessageSquare,
  Kanban,
  Upload,
  Globe,
  Sparkles,
  Zap,
  Target,
  Layout,
} from 'lucide-react';
import { TourStep } from '@/app/components/PageTour';

export const pageTours: Record<string, { title: string; steps: TourStep[] }> = {
  'portfolio-builder': {
    title: 'Portfolio Builder Tour',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Portfolio Builder',
        description: 'Build your professional portfolio by chatting with AI. Upload files, paste URLs, or just tell us about your work!',
        icon: <Briefcase className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'Chat naturally with AI about your experience',
          'Upload resumes, certificates, or project screenshots',
          'Paste URLs to LinkedIn, GitHub, or your projects',
          'See live preview as you build',
        ],
      },
      {
        id: 'chat',
        title: 'Chat with AI',
        description: 'Use the chat interface to tell AI about your work. It will structure your content professionally.',
        icon: <MessageSquare className="w-12 h-12 text-[#3b82f6]" />,
        tips: [
          'Describe your projects and achievements',
          'Mention technologies and skills you\'ve used',
          'Talk about your work experience and education',
          'AI will organize everything beautifully',
        ],
      },
      {
        id: 'upload',
        title: 'Upload Files',
        description: 'Upload your resume, certificates, or project images. AI will extract relevant information automatically.',
        icon: <Upload className="w-12 h-12 text-[#10b981]" />,
        tips: [
          'Drag and drop files or click to upload',
          'Supports PDFs, images, and documents',
          'AI extracts text and analyzes content',
          'Paste screenshots with Ctrl+V',
        ],
      },
      {
        id: 'preview',
        title: 'Live Preview',
        description: 'Watch your portfolio come to life in real-time as you add content. See exactly how it will look to visitors.',
        icon: <Layout className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'Preview updates automatically',
          'See mobile and desktop views',
          'All sections are customizable',
          'Content syncs across all your documents',
        ],
      },
      {
        id: 'publish',
        title: 'Publish Your Portfolio',
        description: 'Once you\'re happy with your portfolio, publish it and get your custom URL to share with employers!',
        icon: <Globe className="w-12 h-12 text-[#3b82f6]" />,
        tips: [
          'Get your custom URL: /user/username',
          'Set portfolio to public or private',
          'Share your link on LinkedIn and resumes',
          'Update anytime - changes are instant',
        ],
      },
    ],
  },

  'resume-builder': {
    title: 'Resume Builder Tour',
    steps: [
      {
        id: 'welcome',
        title: 'Smart Resume Generation',
        description: 'Create job-specific resumes automatically from your portfolio. AI picks the most relevant experience for each job!',
        icon: <FileText className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'Portfolio-powered generation',
          'AI selects relevant content',
          'Job-specific optimization',
          'Multiple versions supported',
        ],
      },
      {
        id: 'create',
        title: 'Create Your Resume',
        description: 'Click "New Resume" to generate from your portfolio or create a custom one from scratch.',
        icon: <Sparkles className="w-12 h-12 text-[#3b82f6]" />,
        tips: [
          'Generate from portfolio in seconds',
          'Or create custom resume manually',
          'Add job description for tailoring',
          'AI optimizes for the role',
        ],
      },
      {
        id: 'adapt',
        title: 'Adapt to Jobs',
        description: 'Tailor your resume for specific job postings. AI adjusts content to highlight relevant experience.',
        icon: <Target className="w-12 h-12 text-[#10b981]" />,
        tips: [
          'Paste job description for analysis',
          'AI selects matching experience',
          'Emphasizes relevant skills',
          'Optimizes keywords for ATS',
        ],
      },
      {
        id: 'edit',
        title: 'Edit & Customize',
        description: 'Fine-tune any section. Drag to reorder, edit content, or remove sections you don\'t need.',
        icon: <Layout className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'Drag and drop to reorder sections',
          'Edit any content inline',
          'Add or remove sections',
          'Customize section titles',
        ],
      },
      {
        id: 'export',
        title: 'Export & Share',
        description: 'Export your resume as PDF or include a link to your portfolio for a complete application package.',
        icon: <FileText className="w-12 h-12 text-[#3b82f6]" />,
        tips: [
          'Export as ATS-friendly PDF',
          'Include portfolio link option',
          'Print-optimized formatting',
          'Download and share instantly',
        ],
      },
    ],
  },

  'cover-letters': {
    title: 'Cover Letter Generator Tour',
    steps: [
      {
        id: 'welcome',
        title: 'AI Cover Letter Writer',
        description: 'Generate compelling, job-specific cover letters that highlight your most relevant achievements.',
        icon: <Mail className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'AI-powered writing',
          'Job-specific content',
          'Professional structure',
          'Fully customizable',
        ],
      },
      {
        id: 'generate',
        title: 'Generate Cover Letter',
        description: 'Add the job description and AI will write a personalized cover letter highlighting your relevant experience.',
        icon: <Sparkles className="w-12 h-12 text-[#3b82f6]" />,
        tips: [
          'Paste job posting or description',
          'AI matches your experience to requirements',
          'Generates compelling opening',
          'Includes strong closing statement',
        ],
      },
      {
        id: 'customize',
        title: 'Customize Content',
        description: 'Edit any section to add personal touches. Change the tone, add specific examples, or adjust the structure.',
        icon: <Layout className="w-12 h-12 text-[#10b981]" />,
        tips: [
          'Edit any paragraph',
          'Add recipient details',
          'Adjust tone and style',
          'Include specific examples',
        ],
      },
      {
        id: 'export',
        title: 'Export & Send',
        description: 'Export as PDF or copy the formatted text to paste in your application.',
        icon: <Mail className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'Export as professional PDF',
          'Copy formatted text',
          'Print-ready layout',
          'Save multiple versions',
        ],
      },
    ],
  },

  'job-search': {
    title: 'Job Search Tour',
    steps: [
      {
        id: 'welcome',
        title: 'Find Your Dream Job',
        description: 'Search jobs from multiple sources, get match scores, and track your applications all in one place.',
        icon: <Search className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'Multi-source job aggregation',
          'Skills-based matching',
          'Match percentage scoring',
          'Application tracking',
        ],
      },
      {
        id: 'search',
        title: 'Search Jobs',
        description: 'Enter keywords, select location, and filter by remote work. We\'ll search multiple job boards for you.',
        icon: <Search className="w-12 h-12 text-[#3b82f6]" />,
        tips: [
          'Search by keywords or job title',
          'Filter by location and remote work',
          'Results from multiple sources',
          'Real-time job listings',
        ],
      },
      {
        id: 'match',
        title: 'Match Scores',
        description: 'Each job shows a match percentage based on your skills and experience from your portfolio.',
        icon: <Target className="w-12 h-12 text-[#10b981]" />,
        tips: [
          'Match % based on your profile',
          'See skills gap analysis',
          'Highlights matching requirements',
          'Sort by best matches',
        ],
      },
      {
        id: 'track',
        title: 'Track Applications',
        description: 'Save interesting jobs and track your application status. Generate tailored resumes right from the job listing.',
        icon: <Kanban className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'Save jobs to apply later',
          'Track application status',
          'Generate tailored resume',
          'Add notes and deadlines',
        ],
      },
    ],
  },

  'my-jobs': {
    title: 'My Applications Tour',
    steps: [
      {
        id: 'welcome',
        title: 'Application Tracker',
        description: 'Manage all your job applications in one place. Track status, deadlines, and follow-ups.',
        icon: <Kanban className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'See all applications at a glance',
          'Track application status',
          'Set reminders for follow-ups',
          'View application history',
        ],
      },
      {
        id: 'status',
        title: 'Update Status',
        description: 'Keep track of where each application stands: saved, applied, interviewing, or offered.',
        icon: <Target className="w-12 h-12 text-[#3b82f6]" />,
        tips: [
          'Update status as you progress',
          'Add interview dates',
          'Track follow-up actions',
          'Record feedback and notes',
        ],
      },
      {
        id: 'documents',
        title: 'View Documents',
        description: 'Access the resume and cover letter you used for each application. Download or regenerate anytime.',
        icon: <FileText className="w-12 h-12 text-[#10b981]" />,
        tips: [
          'View application documents',
          'Download PDFs anytime',
          'See which version you sent',
          'Regenerate if needed',
        ],
      },
    ],
  },

  'ai-coach': {
    title: 'AI Career Coach Tour',
    steps: [
      {
        id: 'welcome',
        title: 'Your Personal AI Coach',
        description: 'Get personalized career advice, interview prep, and job search help whenever you need it.',
        icon: <MessageSquare className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'Available 24/7',
          'Personalized advice',
          'Context-aware responses',
          'Knows your background',
        ],
      },
      {
        id: 'ask',
        title: 'Ask Anything',
        description: 'Ask about career strategies, interview questions, resume feedback, or job search tactics.',
        icon: <Sparkles className="w-12 h-12 text-[#3b82f6]" />,
        tips: [
          'Career coaching and advice',
          'Interview preparation',
          'Resume and cover letter feedback',
          'Job search strategies',
        ],
      },
      {
        id: 'context',
        title: 'Context-Aware',
        description: 'The AI knows your background from your portfolio, so advice is personalized to your experience and goals.',
        icon: <Zap className="w-12 h-12 text-[#10b981]" />,
        tips: [
          'Understands your experience',
          'Tailored to your goals',
          'References your skills',
          'Personalized recommendations',
        ],
      },
    ],
  },

  'dashboard': {
    title: 'Dashboard Tour',
    steps: [
      {
        id: 'welcome',
        title: 'Your Career Hub',
        description: 'Get an overview of your job search progress, recent applications, and quick access to all tools.',
        icon: <Layout className="w-12 h-12 text-[#e07a5f]" />,
        tips: [
          'Overview of all activities',
          'Quick stats and metrics',
          'Recent applications',
          'Quick action buttons',
        ],
      },
      {
        id: 'stats',
        title: 'Track Your Progress',
        description: 'See how many jobs you\'ve saved, applications sent, and interviews scheduled at a glance.',
        icon: <Target className="w-12 h-12 text-[#3b82f6]" />,
        tips: [
          'Application statistics',
          'Response rates',
          'Interview success rate',
          'Time tracking',
        ],
      },
      {
        id: 'actions',
        title: 'Quick Actions',
        description: 'Jump directly to common tasks: create resume, search jobs, or chat with your AI coach.',
        icon: <Zap className="w-12 h-12 text-[#10b981]" />,
        tips: [
          'One-click access to tools',
          'Create documents quickly',
          'Search and apply to jobs',
          'Get AI assistance',
        ],
      },
    ],
  },
};

// Helper function to get tour for a page
export function getPageTour(pageId: string) {
  return pageTours[pageId] || null;
}
