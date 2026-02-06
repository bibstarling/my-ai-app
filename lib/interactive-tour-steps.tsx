import {
  LayoutDashboard,
  Search,
  Kanban,
  Briefcase,
  FileText,
  Mail,
  MessageSquare,
  Sparkles,
  Check,
} from 'lucide-react';

export type InteractiveTourStep = {
  id: string;
  page: string; // URL path
  targetSelector: string | null; // CSS selector for element to highlight, null for modal
  title: string;
  description: string;
  icon: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  waitForElement?: boolean; // Wait for element to be available
  action?: 'navigate' | 'none'; // Action before showing step
};

export const interactiveOnboardingSteps: InteractiveTourStep[] = [
  {
    id: 'welcome',
    page: '/dashboard',
    targetSelector: null,
    title: 'Welcome to Applause',
    description: 'Let me give you a quick tour of the menu. I\'ll walk you through each feature so you know exactly what you can do here!',
    icon: <Sparkles className="w-8 h-8 text-[#e07a5f]" />,
    position: 'center',
    action: 'navigate',
  },
  {
    id: 'dashboard-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/dashboard"]',
    title: 'Dashboard',
    description: 'Your home base! See quick stats, recent activity, and access all features. Quick action cards let you jump straight into common tasks.',
    icon: <LayoutDashboard className="w-8 h-8 text-[#e07a5f]" />,
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'find-jobs-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/assistant/job-search"]',
    title: 'Find Jobs',
    description: 'Start here! Search for jobs across multiple platforms. We aggregate listings from various sources and show you match scores based on your profile. Filter by location, remote work, and more.',
    icon: <Search className="w-8 h-8 text-[#3b82f6]" />,
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'my-apps-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/assistant/my-jobs"]',
    title: 'My Applications',
    description: 'Track all your job applications in one place! Organize them by status (Saved, Applied, Interviewing, Offered). Add notes, deadlines, and access all your application documents.',
    icon: <Kanban className="w-8 h-8 text-[#10b981]" />,
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'profile-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/portfolio/builder"]',
    title: 'Profile',
    description: 'Your single source of truth! Build your professional profile here using AI chat, file uploads, or URL scraping. Everything else (resumes, cover letters) is generated from this profile. You can edit using Chat mode, Markdown, or Manual editor.',
    icon: <Briefcase className="w-8 h-8 text-[#e07a5f]" />,
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'resume-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/resume-builder"]',
    title: 'Resumes',
    description: 'Create job-specific resumes in seconds! Generate from your profile or adapt existing ones for different jobs. AI automatically selects the most relevant experience and optimizes keywords for ATS systems. Export as PDF or HTML.',
    icon: <FileText className="w-8 h-8 text-[#3b82f6]" />,
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'cover-letter-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/cover-letters"]',
    title: 'Cover Letters',
    description: 'Generate compelling, job-specific cover letters! Just provide the job description and AI writes a personalized letter highlighting your most relevant achievements. Fully customizable with professional structure.',
    icon: <Mail className="w-8 h-8 text-[#10b981]" />,
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'ai-coach-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/assistant/chat"]',
    title: 'AI Coach',
    description: 'Your 24/7 personal career advisor! Ask about interview preparation, resume feedback, career strategies, salary negotiation, or job search tactics. The AI knows your background from your profile and gives personalized advice.',
    icon: <MessageSquare className="w-8 h-8 text-[#e07a5f]" />,
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'complete',
    page: '/dashboard',
    targetSelector: null,
    title: 'You\'re All Set!',
    description: 'You now know what each menu item does! Pro tip: Start by finding jobs, then build your profile so you can generate tailored resumes and cover letters. Every page also has a ? button for detailed help. Happy job hunting!',
    icon: <Check className="w-8 h-8 text-[#10b981]" />,
    position: 'center',
  },
];

// Simplified steps for modal-based tour (fallback)
export const simpleOnboardingSteps = [
  {
    id: 'welcome',
    title: '👏 Welcome to Applause!',
    description: 'Your AI-powered career platform that makes job searching feel like a celebration!',
    page: '/dashboard',
  },
  {
    id: 'find-jobs',
    title: '🔍 Find Your Dream Job',
    description: 'Search jobs from multiple sources, get match scores based on your profile, and track your applications.',
    page: '/assistant/job-search',
  },
  {
    id: 'profile',
    title: '👤 Build Your Profile',
    description: 'Your single source of truth! Chat with AI, upload your resume, or paste URLs to build your professional profile.',
    page: '/portfolio/builder',
  },
  {
    id: 'resume',
    title: '📄 Smart Resume Builder',
    description: 'Generate job-specific resumes automatically from your profile. AI picks the most relevant experience for each job!',
    page: '/resume-builder',
  },
  {
    id: 'cover-letter',
    title: '✉️ Cover Letter Generator',
    description: 'Generate compelling, job-specific cover letters that highlight your most relevant achievements.',
    page: '/cover-letters',
  },
  {
    id: 'ai-coach',
    title: '🤖 Your AI Career Coach',
    description: 'Get personalized career advice, interview prep, and job search help whenever you need it.',
    page: '/assistant/chat',
  },
];
