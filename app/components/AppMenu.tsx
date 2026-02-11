'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton } from '@clerk/nextjs';
import {
  Home,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Search,
  Kanban,
  Mail,
  User,
  Settings,
  Briefcase,
  Shield,
  HelpCircle,
  Sparkles,
  LogIn,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthSafe } from '@/app/hooks/useAuthSafe';
import { useIsAdmin } from '@/app/hooks/useIsAdmin';
import { SettingsModal } from './SettingsModal';
import { OnboardingTour } from './OnboardingTour';
import { startInteractiveTour } from './InteractiveOnboarding';
import { useRouter } from 'next/navigation';

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
};

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  show: boolean;
};

function Tooltip({ content, children, show }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!show) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
            {content}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const getMenuSections = (isAdmin: boolean): MenuSection[] => {
  const sections: MenuSection[] = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, href: '/dashboard' },
        { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" />, href: '/portfolio/builder' },
      ]
    },
    {
      title: 'Job Search',
      items: [
        { id: 'job-search', label: 'Find Jobs', icon: <Search className="w-5 h-5" />, href: '/jobs/discover' },
        { id: 'my-jobs', label: 'My Applications', icon: <Kanban className="w-5 h-5" />, href: '/assistant/my-jobs' },
      ]
    },
    {
      title: 'Career Tools',
      items: [
        { id: 'resume', label: 'Resumes', icon: <FileText className="w-5 h-5" />, href: '/resume-builder' },
        { id: 'cover-letter', label: 'Cover Letters', icon: <Mail className="w-5 h-5" />, href: '/cover-letters' },
        { id: 'chat', label: 'AI Coach', icon: <MessageSquare className="w-5 h-5" />, href: '/assistant/chat' },
      ]
    },
  ];
  
  // Add admin section if user is admin
  if (isAdmin) {
    sections.push({
      title: 'Admin Tools',
      items: [
        { id: 'admin-users', label: 'Users', icon: <Shield className="w-5 h-5" />, href: '/admin' },
        { id: 'admin-jobs', label: 'Jobs Pipeline', icon: <Database className="w-5 h-5" />, href: '/admin/jobs' },
        { id: 'admin-sources', label: 'Job Sources', icon: <ExternalLink className="w-5 h-5" />, href: '/admin/jobs/sources' },
      ]
    });
  }
  
  return sections;
};

type AppMenuProps = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (value: boolean) => void;
};

export function AppMenu({ isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen }: AppMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isEmbedMode, isSignedIn, isLoaded } = useAuthSafe();
  const { isAdmin } = useIsAdmin();
  const menuSections = getMenuSections(isAdmin);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    
    // Exact match for specific routes
    if (href === '/admin') {
      return pathname === '/admin';
    }
    
    if (href === '/admin/jobs') {
      return pathname === '/admin/jobs';
    }
    
    if (href === '/admin/jobs/sources') {
      return pathname === '/admin/jobs/sources';
    }
    
    // For all other routes, use startsWith
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50
        ${isCollapsed ? 'w-16' : 'w-64'}
        max-md:top-[57px]
        md:top-0
        ${isMobileMenuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-gray-200">
          {!isCollapsed ? (
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gradient-primary text-base">Applause</span>
                <span className="text-xs text-muted-foreground">Career Platform</span>
              </div>
            </Link>
          ) : (
            <Tooltip content="Applause" show={isCollapsed}>
              <Link href="/" className="flex items-center justify-center group">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
              </Link>
            </Tooltip>
          )}
        </div>

        {/* Navigation Items - Only show if user is signed in */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {isLoaded && !isSignedIn && !isEmbedMode ? (
            // Show login prompt for unauthenticated users
            <div className="flex flex-col items-center justify-center h-full px-4 text-center space-y-4">
              {!isCollapsed && (
                <>
                  <div className="w-16 h-16 rounded-full bg-gradient-primary/10 flex items-center justify-center">
                    <LogIn className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900">Sign in to continue</h3>
                    <p className="text-sm text-gray-600">
                      Access your dashboard, career tools, and AI assistant
                    </p>
                  </div>
                  <SignInButton mode="modal">
                    <button className="w-full gradient-primary text-white px-4 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all">
                      Sign In
                    </button>
                  </SignInButton>
                </>
              )}
              {isCollapsed && (
                <Tooltip content="Sign in to continue" show={isCollapsed}>
                  <SignInButton mode="modal">
                    <button className="w-10 h-10 gradient-primary text-white rounded-lg flex items-center justify-center hover:shadow-lg transition-all">
                      <LogIn className="w-5 h-5" />
                    </button>
                  </SignInButton>
                </Tooltip>
              )}
            </div>
          ) : (
            // Show menu sections for authenticated users
            menuSections.map((section, sectionIdx) => (
              <div key={section.title} className={sectionIdx > 0 ? 'mt-6' : ''}>
                {/* Section Header */}
                {!isCollapsed && (
                  <div className="px-3 mb-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
                )}
                
                {/* Section Items */}
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Tooltip key={item.id} content={item.label} show={isCollapsed}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          active
                            ? 'gradient-primary text-white shadow-lg'
                            : 'text-gray-700 hover:bg-accent/5 hover:text-accent'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                      >
                        {item.icon}
                        {!isCollapsed && (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                      </Link>
                    </Tooltip>
                  );
                })}
                
                {/* Divider between sections (except last) */}
                {!isCollapsed && sectionIdx < menuSections.length - 1 && (
                  <div className="mx-3 my-3 border-t border-gray-200"></div>
                )}
              </div>
            ))
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          {/* User Profile - Only show for authenticated users */}
          {!isEmbedMode && user && isSignedIn && (
            <Tooltip 
              content={user.firstName || user.emailAddresses[0]?.emailAddress || 'Profile'} 
              show={isCollapsed}
            >
              <div className={`flex items-center gap-3 px-3 py-2.5 ${
                isCollapsed ? 'justify-center' : ''
              }`}>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'h-8 w-8',
                      userButtonPopoverCard: 'shadow-xl',
                    },
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="Take a Tour"
                      labelIcon={<Sparkles className="h-4 w-4" />}
                      onClick={() => startInteractiveTour()}
                    />
                    <UserButton.Action
                      label="Help Center"
                      labelIcon={<HelpCircle className="h-4 w-4" />}
                      onClick={() => router.push('/help')}
                    />
                    <UserButton.Action
                      label="Settings"
                      labelIcon={<Settings className="h-4 w-4" />}
                      onClick={() => setIsSettingsOpen(true)}
                    />
                  </UserButton.MenuItems>
                </UserButton>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName || user.emailAddresses[0]?.emailAddress}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {user.emailAddresses[0]?.emailAddress}
                    </span>
                  </div>
                )}
              </div>
            </Tooltip>
          )}
          
          {/* Embed Mode Indicator */}
          {isEmbedMode && (
            <Tooltip content="Preview Mode" show={isCollapsed}>
              <div className={`flex items-center gap-3 px-3 py-2.5 ${
                isCollapsed ? 'justify-center' : ''
              }`}>
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-900">Preview Mode</span>
                    <span className="text-xs text-gray-500">Auth Disabled</span>
                  </div>
                )}
              </div>
            </Tooltip>
          )}
          
          {/* Collapse Toggle - Only show for authenticated users or in collapsed state */}
          {(isSignedIn || isEmbedMode || isCollapsed) && (
            <Tooltip content={isCollapsed ? 'Expand Menu' : 'Collapse Menu'} show={isCollapsed}>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 w-full ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <>
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Collapse</span>
                  </>
                )}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </aside>
  );
}
