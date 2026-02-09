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
    description: 'Let me give you a quick tour! Pro tip: You can press Cmd+K (or Ctrl+K) from anywhere to ask AI for help with anything. Now, let\'s walk through each feature!',
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
    id: 'profile-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/portfolio/builder"]',
    title: 'Profile (Start Here!)',
    description: '⚠️ Build your profile FIRST - it\'s required and powers everything! Chat with AI to build it for you, upload your resume for instant extraction, or scrape LinkedIn/GitHub. This single profile feeds your resumes, cover letters, and job matching.',
    icon: <Briefcase className="w-8 h-8 text-[#e07a5f]" />,
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'find-jobs-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/assistant/job-search"]',
    title: 'Find Jobs',
    description: 'Search for jobs across multiple platforms. Get AI-powered match scores based on YOUR profile. You can also ask the global AI (Cmd+K) to search for you: "Find remote React jobs"',
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
    id: 'resume-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/resume-builder"]',
    title: 'Resumes',
    description: 'Create job-specific resumes in seconds! Powered by YOUR profile (build it first!). AI automatically selects the most relevant experience from your profile and optimizes for ATS. Export as PDF or HTML.',
    icon: <FileText className="w-8 h-8 text-[#3b82f6]" />,
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'cover-letter-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/cover-letters"]',
    title: 'Cover Letters',
    description: 'Generate compelling, job-specific cover letters powered by YOUR profile! Just provide the job description and AI writes a personalized letter highlighting your most relevant achievements from your profile.',
    icon: <Mail className="w-8 h-8 text-[#10b981]" />,
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'ai-coach-nav',
    page: '/dashboard',
    targetSelector: 'a[href="/assistant/chat"]',
    title: 'AI Coach',
    description: 'Your 24/7 personal career advisor! The AI knows your background from your profile. Pro tip: Press Cmd+K (Ctrl+K) from ANYWHERE to access AI instantly - ask it to search jobs, generate resumes, or give career advice!',
    icon: <MessageSquare className="w-8 h-8 text-[#e07a5f]" />,
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'complete',
    page: '/dashboard',
    targetSelector: null,
    title: 'You\'re All Set!',
    description: 'You now know what each menu item does! Pro tip: Build your profile FIRST (it powers everything), then find jobs and generate tailored resumes and cover letters. Remember: Press Cmd+K (Ctrl+K) anytime for AI help! Happy job hunting!',
    icon: <Check className="w-8 h-8 text-[#10b981]" />,
    position: 'center',
  },
];

// Simplified steps for modal-based tour (fallback)
export const simpleOnboardingSteps = [
  {
    id: 'welcome',
    title: '👏 Welcome to Applause!',
    description: 'Your AI-powered career platform. Press Cmd+K (Ctrl+K) from anywhere to ask AI for help!',
    page: '/dashboard',
  },
  {
    id: 'profile',
    title: '👤 Build Your Profile First',
    description: '⚠️ Required! Your profile powers everything. Chat with AI, upload your resume, or paste URLs. This feeds resumes, cover letters, and job matching.',
    page: '/portfolio/builder',
  },
  {
    id: 'find-jobs',
    title: '🔍 Find Your Dream Job',
    description: 'Search jobs from multiple sources, get AI-powered match scores based on YOUR profile, and track applications.',
    page: '/assistant/job-search',
  },
  {
    id: 'resume',
    title: '📄 Smart Resume Builder',
    description: 'Generate job-specific resumes automatically from YOUR profile. AI picks the most relevant experience for each job!',
    page: '/resume-builder',
  },
  {
    id: 'cover-letter',
    title: '✉️ Cover Letter Generator',
    description: 'Generate compelling, job-specific cover letters from YOUR profile that highlight your most relevant achievements.',
    page: '/cover-letters',
  },
  {
    id: 'ai-coach',
    title: '🤖 AI Everywhere',
    description: 'Press Cmd+K (Ctrl+K) anywhere to ask AI for help. Search jobs, generate resumes, get career advice, and more!',
    page: '/assistant/chat',
  },
];
